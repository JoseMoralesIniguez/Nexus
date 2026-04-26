<?php
class Role {
    private $conn;
    private $table_name = "roles";

    // Propiedades
    public $id;
    public $name;
    public $description;
    public $status;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Obtener todos los roles activos
    public function readActive() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE status = 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }
}
?>
