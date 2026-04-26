<?php
require_once __DIR__ . '/../models/Visit.php';

class VisitController {
    private $db;
    private $visit;

    public function __construct($db) {
        $this->db = $db;
        $this->visit = new Visit($this->db);
    }

    public function getVisits($residentId, $filter = 'active') {
        $statusCondition = $filter === 'active' ? "AND status = 1" : "";
        $query = "SELECT id, visitor_name, valid_from, valid_until, status, access_token 
                  FROM visits 
                  WHERE resident_id = :resident_id $statusCondition 
                  ORDER BY valid_from DESC";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':resident_id', $residentId);
        $stmt->execute();
        
        $visits = $stmt->fetchAll(PDO::FETCH_ASSOC);
        http_response_code(200);
        echo json_encode($visits);
    }

    public function create($data, $residentId) {
        if (empty($data->valid_from) || empty($data->visitor_name)) {
            http_response_code(400);
            echo json_encode(["message" => "Faltan datos obligatorios."]);
            return;
        }

        $fromTimestamp = strtotime($data->valid_from);
        
        if (empty($data->valid_until)) {
            $untilTimestamp = $fromTimestamp + 1800; // Sumar 30 mins (1800 segundos)
            $data->valid_until = date('Y-m-d H:i:s', $untilTimestamp);
        } else {
            $untilTimestamp = strtotime($data->valid_until);
        }

        if ($untilTimestamp - $fromTimestamp < 1800) {
            http_response_code(400);
            echo json_encode(["message" => "La vigencia del pase debe ser de al menos 30 minutos."]);
            return;
        }

        $this->visit->resident_id = $residentId;
        $this->visit->visitor_name = $data->visitor_name;
        $this->visit->is_single_use = isset($data->is_single_use) ? $data->is_single_use : 1;
        $this->visit->valid_from = $data->valid_from;
        $this->visit->valid_until = $data->valid_until;
        
        // Generar UUIDv4 de forma nativa para el access_token de la visita
        $this->visit->access_token = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );

        if ($this->visit->create()) {
            http_response_code(201);
            echo json_encode([
                "message" => "Visita creada exitosamente.", 
                "access_token" => $this->visit->access_token
            ]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Error interno. No se pudo crear la visita."]);
        }
    }

    public function cancel($visitId, $residentId) {
        $this->visit->id = $visitId;
        $this->visit->resident_id = $residentId;
        
        if ($this->visit->delete()) {
            http_response_code(200);
            echo json_encode(["message" => "Visita cancelada/anulada exitosamente."]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Error interno. No se pudo cancelar la visita."]);
        }
    }
}
?>
