<?php
require_once __DIR__ . '/../models/Payment.php';

class PaymentController {
    private $db;
    private $payment;

    public function __construct($db) {
        $this->db = $db;
        $this->payment = new Payment($this->db);
    }

    public function checkStatus($residentId) {
        $isUpToDate = $this->payment->isResidentUpToDate($residentId);
        
        http_response_code(200);
        echo json_encode([
            "resident_id" => $residentId,
            "status" => $isUpToDate ? "Al corriente" : "Vencido"
        ]);
    }
}
?>
