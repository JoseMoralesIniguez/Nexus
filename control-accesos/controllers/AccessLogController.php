<?php
require_once __DIR__ . '/../models/AccessLog.php';

class AccessLogController {
    private $db;
    private $log;

    public function __construct($db) {
        $this->db = $db;
        $this->log = new AccessLog($this->db);
    }

    // El endpoint principal del sistema para que los Guardias validen accesos
    public function scan($data) {
        if(empty($data->token) || empty($data->guard_id)) {
            http_response_code(400);
            echo json_encode(["message" => "Faltan datos (token o guard_id)."]);
            return;
        }

        $token = trim($data->token);
        $guardId = $data->guard_id;

        $accesoPermitido = false;
        $razon = "Código inválido o inexistente. <br><small class='text-muted'>Leído: " . htmlspecialchars($token) . "</small>";
        $tipoUsuario = "Desconocido";
        $accionRealizada = "ENTRADA";

        // 1. Verificar si es una visita temporal
        $queryVisita = "SELECT v.id, v.valid_from, v.valid_until, v.status, v.is_inside, v.is_single_use, r.address 
                        FROM visits v JOIN residents r ON v.resident_id = r.id
                        WHERE v.access_token = :token AND (v.status = 1 OR v.is_inside = 1)";
        $stmtV = $this->db->prepare($queryVisita);
        $stmtV->bindParam(":token", $token);
        $stmtV->execute();

        if ($stmtV->rowCount() > 0) {
            $visita = $stmtV->fetch(PDO::FETCH_ASSOC);
            $tipoUsuario = "Visita";
            $ahora = date('Y-m-d H:i:s');
            $visitId = $visita['id'];
            
            if ($visita['is_inside'] == 0) {
                // INTENTO DE ENTRADA
                if ($ahora >= $visita['valid_from'] && $ahora <= $visita['valid_until']) {
                    $accesoPermitido = true;
                    $accionRealizada = "ENTRADA";
                    $razon = "Dirigirse a " . $visita['address'];
                    
                    // Marcar como adentro
                    $updateQ = "UPDATE visits SET is_inside = 1 WHERE id = :id";
                    $uStmt = $this->db->prepare($updateQ);
                    $uStmt->bindParam(":id", $visitId);
                    $uStmt->execute();
                } else {
                    $razon = "ENTRADA DENEGADA: Fuera de horario de vigencia.<br><small class='text-muted'>Hora del servidor: $ahora<br>Vigencia del pase: {$visita['valid_from']} a {$visita['valid_until']}</small>";
                }
            } else {
                // INTENTO DE SALIDA
                $accesoPermitido = true;
                $accionRealizada = "SALIDA";
                $razon = "¡Buen viaje!";
                
                // Marcar como afuera. Si es de un solo uso, invalidarlo (status = 0)
                $nuevoStatus = $visita['is_single_use'] == 1 ? 0 : 1; 
                
                if ($nuevoStatus == 0) {
                    $razon .= "<br><strong class='text-danger'>Este fue un pase de UN SOLO USO. Ya no podrá volver a acceder.</strong>";
                }
                
                $updateQ = "UPDATE visits SET is_inside = 0, status = :st WHERE id = :id";
                $uStmt = $this->db->prepare($updateQ);
                $uStmt->bindParam(":id", $visitId);
                $uStmt->bindParam(":st", $nuevoStatus);
                $uStmt->execute();
            }
        } else {
            // 2. Si no es visita, verificar si es Residente y validar su pago dinámicamente
            $queryRes = "SELECT r.address, 
                         (SELECT valid_until_date FROM payments p WHERE p.resident_id = r.id AND p.status = 1 ORDER BY valid_until_date DESC LIMIT 1) as valid_until
                         FROM residents r WHERE r.access_token = :token AND r.status = 1";
            $stmtR = $this->db->prepare($queryRes);
            $stmtR->bindParam(":token", $token);
            $stmtR->execute();

            if ($stmtR->rowCount() > 0) {
                $residente = $stmtR->fetch(PDO::FETCH_ASSOC);
                $tipoUsuario = "Residente";
                $fechaHoy = date('Y-m-d');
                
                if (!empty($residente['valid_until']) && $residente['valid_until'] >= $fechaHoy) {
                    $accesoPermitido = true;
                    $razon = "Residente al corriente. Acceso autorizado.";
                } else {
                    $razon = "Residente con pago vencido. Favor de pasar a administración.";
                }
            }
        }

        // 3. Registrar el suceso en la bitácora utilizando el Modelo
        $this->log->scanned_token = $token;
        $this->log->type = $tipoUsuario;
        $this->log->result = $accesoPermitido ? 'PERMITIDO' : 'DENEGADO';
        $this->log->reason = $razon;
        $this->log->guard_id = $guardId;
        $this->log->create();

        // 4. Devolver la respuesta
        if ($accesoPermitido) {
            http_response_code(200);
            echo json_encode(["status" => "ACCESO PERMITIDO", "reason" => $razon, "type" => $tipoUsuario, "action" => $accionRealizada]);
        } else {
            http_response_code(403);
            echo json_encode(["status" => "ACCESO DENEGADO", "reason" => $razon, "type" => $tipoUsuario, "action" => $accionRealizada]);
        }
    }
}
?>
