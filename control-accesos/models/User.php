<?php
class User {
    private $conn;
    private $table_name = "users";

    // Propiedades
    public $id;
    public $role_id;
    public $name;
    public $email;
    public $password_hash;
    public $status;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Buscar usuario por email (para login)
    public function emailExists() {
        $query = "SELECT id, name, password_hash, role_id, status 
                  FROM " . $this->table_name . " 
                  WHERE email = ? AND status = 1 LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->email);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->id = $row['id'];
            $this->name = $row['name'];
            $this->password_hash = $row['password_hash'];
            $this->role_id = $row['role_id'];
            $this->status = $row['status'];
            return true;
        }
        return false;
    }
}
?>
