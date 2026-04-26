<?php
class Visit {
    private $conn;
    private $table_name = "visits";

    // Propiedades
    public $id;
    public $resident_id;
    public $visitor_name;
    public $valid_from;
    public $valid_until;
    public $access_token;
    public $status;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Crear visita
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET resident_id=:resident_id, visitor_name=:visitor_name, 
                      valid_from=:valid_from, valid_until=:valid_until, access_token=:access_token";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":resident_id", $this->resident_id);
        $stmt->bindParam(":visitor_name", $this->visitor_name);
        $stmt->bindParam(":valid_from", $this->valid_from);
        $stmt->bindParam(":valid_until", $this->valid_until);
        $stmt->bindParam(":access_token", $this->access_token);

        return $stmt->execute();
    }

    // Soft delete (cancelar)
    public function delete() {
        $query = "UPDATE " . $this->table_name . " SET status = 0 WHERE id = :id AND resident_id = :resident_id";
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":resident_id", $this->resident_id);
        
        return $stmt->execute();
    }
}
?>
