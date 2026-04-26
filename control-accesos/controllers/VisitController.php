<?php
require_once __DIR__ . '/../models/Visit.php';

class VisitController {
    private $db;
    private $visit;

    public function __construct($db) {
        $this->db = $db;
        $this->visit = new Visit($this->db);
    }

    public function create($data, $residentId) {
        $this->visit->resident_id = $residentId;
        $this->visit->visitor_name = $data->visitor_name;
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
