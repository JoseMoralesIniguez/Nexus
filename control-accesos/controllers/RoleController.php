<?php
require_once __DIR__ . '/../models/Role.php';

class RoleController {
    private $db;
    private $role;

    public function __construct($db) {
        $this->db = $db;
        $this->role = new Role($this->db);
    }

    public function index() {
        $stmt = $this->role->readActive();
        $num = $stmt->rowCount();

        if ($num > 0) {
            $roles_arr = array();
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                array_push($roles_arr, $row);
            }
            http_response_code(200);
            echo json_encode($roles_arr);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "No se encontraron roles activos."]);
        }
    }
}
?>
