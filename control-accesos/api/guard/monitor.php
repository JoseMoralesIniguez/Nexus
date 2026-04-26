<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$query = "SELECT v.id, v.visitor_name, v.valid_from, v.valid_until, v.status, v.is_inside, r.address 
          FROM visits v 
          JOIN residents r ON v.resident_id = r.id 
          WHERE v.status = 1 OR v.is_inside = 1
          ORDER BY v.valid_from DESC";

$stmt = $db->prepare($query);
$stmt->execute();
$visits = $stmt->fetchAll(PDO::FETCH_ASSOC);

http_response_code(200);
echo json_encode($visits);
?>
