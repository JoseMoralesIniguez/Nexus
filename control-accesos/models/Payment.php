<?php
class Payment {
    private $conn;
    private $table_name = "payments";

    // Propiedades
    public $id;
    public $resident_id;
    public $amount;
    public $payment_date;
    public $valid_until_date;
    public $status;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Verificar si el residente está al corriente
    public function isResidentUpToDate($residentId) {
        $query = "SELECT valid_until_date 
                  FROM " . $this->table_name . " 
                  WHERE resident_id = ? AND status = 1 
                  ORDER BY valid_until_date DESC LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $residentId);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $hoy = date('Y-m-d');
            return $row['valid_until_date'] >= $hoy;
        }
        return false;
    }
}
?>
