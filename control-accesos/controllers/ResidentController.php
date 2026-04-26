<?php
require_once __DIR__ . '/../models/Resident.php';

class ResidentController {
    private $db;
    private $resident;

    public function __construct($db) {
        $this->db = $db;
        $this->resident = new Resident($this->db);
    }

    public function getProfile($residentId) {
        $this->resident->id = $residentId;
        $stmt = $this->resident->getProfile();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            http_response_code(200);
            echo json_encode($row);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Residente no encontrado o inactivo."]);
        }
    }
}
?>
