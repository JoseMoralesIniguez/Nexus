<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

require_once '../../config/Database.php';
require_once '../../controllers/PaymentController.php';

$database = new Database();
$db = $database->getConnection();

$controller = new PaymentController($db);
$residentId = isset($_GET['resident_id']) ? $_GET['resident_id'] : null;

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $controller->checkStatus($residentId);
} else {
    http_response_code(405);
    echo json_encode(["message" => "Método no permitido."]);
}
?>
