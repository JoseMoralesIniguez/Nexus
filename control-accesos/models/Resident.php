<?php
class Resident {
    private $conn;
    private $table_name = "residents";

    // Propiedades
    public $id;
    public $user_id;
    public $address;
    public $phone;
    public $access_token;
    public $status;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Obtener información del residente junto con su usuario
    public function getProfile() {
        $query = "SELECT r.id, r.address, r.phone, r.access_token, u.name, u.email 
                  FROM " . $this->table_name . " r
                  JOIN users u ON r.user_id = u.id
                  WHERE r.id = ? AND r.status = 1";
                  
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->execute();
        
        return $stmt;
    }
}
?>
