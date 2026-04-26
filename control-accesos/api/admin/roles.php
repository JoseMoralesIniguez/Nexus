<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

require_once '../../config/Database.php';
require_once '../../controllers/RoleController.php';

$database = new Database();
$db = $database->getConnection();

$controller = new RoleController($db);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $controller->index();
} else {
    http_response_code(405);
    echo json_encode(["message" => "Método no permitido."]);
}
?>
