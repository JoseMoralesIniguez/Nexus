<?php
require_once __DIR__ . '/../models/User.php';

class UserController {
    private $db;
    private $user;

    public function __construct($db) {
        $this->db = $db;
        $this->user = new User($this->db);
    }

    public function login($data) {
        if (!empty($data->email) && !empty($data->password)) {
            $this->user->email = $data->email;
            
            // Verifica que el email exista
            if ($this->user->emailExists() && password_verify($data->password, $this->user->password_hash)) {
                
                // Generar un token JWT simple (simulado con base64 para este MVP sin librerías externas)
                $token = base64_encode(json_encode([
                    "id" => $this->user->id,
                    "role_id" => $this->user->role_id,
                    "name" => $this->user->name
                ]));

                http_response_code(200);
                echo json_encode([
                    "message" => "Login exitoso.",
                    "token" => $token,
                    "user" => [
                        "id" => $this->user->id,
                        "name" => $this->user->name,
                        "role_id" => $this->user->role_id
                    ]
                ]);
            } else {
                http_response_code(401);
                echo json_encode(["message" => "Credenciales inválidas o cuenta suspendida."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Datos incompletos. Faltan email o contraseña."]);
        }
    }
}
?>
