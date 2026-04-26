<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

require_once '../../config/Database.php';
require_once '../../controllers/AccessLogController.php';

$database = new Database();
$db = $database->getConnection();

$controller = new AccessLogController($db);
$data = json_decode(file_get_contents("php://input"));

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $controller->scan($data);
} else {
    http_response_code(405);
    echo json_encode(["message" => "Método no permitido."]);
}
?>
