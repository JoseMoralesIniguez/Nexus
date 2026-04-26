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

        $token = $data->token;
        $guardId = $data->guard_id;

        $accesoPermitido = false;
        $razon = "Código inválido o inexistente";
        $tipoUsuario = "Desconocido";

        // 1. Verificar si es una visita temporal
        $queryVisita = "SELECT v.valid_from, v.valid_until, r.address 
                        FROM visits v JOIN residents r ON v.resident_id = r.id
                        WHERE v.access_token = :token AND v.status = 1";
        $stmtV = $this->db->prepare($queryVisita);
        $stmtV->bindParam(":token", $token);
        $stmtV->execute();

        if ($stmtV->rowCount() > 0) {
            $visita = $stmtV->fetch(PDO::FETCH_ASSOC);
            $tipoUsuario = "Visita";
            $ahora = date('Y-m-d H:i:s');
            
            if ($ahora >= $visita['valid_from'] && $ahora <= $visita['valid_until']) {
                $accesoPermitido = true;
                $razon = "Visita válida. Dirigirse a: " . $visita['address'];
            } else {
                $razon = "Visita fuera de horario de vigencia.";
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
            echo json_encode(["status" => "ACCESO PERMITIDO", "reason" => $razon, "type" => $tipoUsuario]);
        } else {
            http_response_code(403);
            echo json_encode(["status" => "ACCESO DENEGADO", "reason" => $razon, "type" => $tipoUsuario]);
        }
    }
}
?>
