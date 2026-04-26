<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, DELETE");

require_once '../../config/Database.php';
require_once '../../controllers/VisitController.php';

$database = new Database();
$db = $database->getConnection();

$controller = new VisitController($db);
$residentId = isset($_GET['resident_id']) ? $_GET['resident_id'] : null;

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $filter = isset($_GET['filter']) ? $_GET['filter'] : 'active';
    $controller->getVisits($residentId, $filter);
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    $controller->create($data, $residentId);
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $visitId = isset($_GET['visit_id']) ? $_GET['visit_id'] : null;
    $controller->cancel($visitId, $residentId);
} else {
    http_response_code(405);
    echo json_encode(["message" => "Método no permitido."]);
}
?>
