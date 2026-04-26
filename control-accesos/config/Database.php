<?php
date_default_timezone_set('America/Mexico_City');

class Database {
    private $host = 'localhost';
    private $db_name = 'control_accesos';
    private $username = 'root';
    private $password = '';
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4", $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            http_response_code(500);
            echo json_encode(["message" => "Error interno: Falla en base de datos."]);
            exit();
        }
        return $this->conn;
    }
}
?>
