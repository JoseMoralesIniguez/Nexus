<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

require_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$token = isset($_GET['token']) ? $_GET['token'] : null;

if (!$token) {
    http_response_code(400);
    echo json_encode(["message" => "Token no proporcionado."]);
    exit();
}

// Consulta segura para obtener los datos del pase y del residente anfitrión
$query = "SELECT v.visitor_name, v.valid_from, v.valid_until, v.status, v.access_token, 
                 r.address, u.name as resident_name 
          FROM visits v 
          JOIN residents r ON v.resident_id = r.id 
          JOIN users u ON r.user_id = u.id
          WHERE v.access_token = :token LIMIT 1";

$stmt = $db->prepare($query);
$stmt->bindParam(':token', $token);
$stmt->execute();

if ($stmt->rowCount() > 0) {
    $visit = $stmt->fetch(PDO::FETCH_ASSOC);
    http_response_code(200);
    echo json_encode($visit);
} else {
    http_response_code(404);
    echo json_encode(["message" => "Pase no encontrado o inválido."]);
}
?>
