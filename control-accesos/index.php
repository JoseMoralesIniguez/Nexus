<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config/Database.php';

// Inicializar la conexión una sola vez en toda la aplicación
$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["message" => "Error crítico: No hay conexión a la base de datos."]);
    exit();
}

// Enrutador muy simple para el MVP
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = explode('/', $uri);

// Normalmente: $uri[1] = 'control-accesos', $uri[2] = 'api', $uri[3] = endpoint
// Se busca el segmento "api" dinámicamente para evitar fallos por subcarpetas
$apiIndex = array_search('api', $uri);

if ($apiIndex === false || !isset($uri[$apiIndex + 1])) {
    http_response_code(404);
    echo json_encode(["message" => "Endpoint no encontrado."]);
    exit();
}

$endpoint = $uri[$apiIndex + 1];
$action = isset($uri[$apiIndex + 2]) ? $uri[$apiIndex + 2] : '';

// Extraer JSON payload
$data = json_decode(file_get_contents("php://input"));

switch($endpoint) {
    case 'auth':
        require_once 'controllers/UserController.php';
        $controller = new UserController($db); // Inyección de dependencia
        
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'login') {
            $controller->login($data);
        } else {
            http_response_code(405);
            echo json_encode(["message" => "Método no permitido"]);
        }
        break;

    case 'guard':
        require_once 'controllers/AccessLogController.php';
        $controller = new AccessLogController($db);
        
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'scan') {
            $controller->scan($data);
        } else {
            http_response_code(405);
            echo json_encode(["message" => "Método no permitido"]);
        }
        break;

    case 'resident':
        if ($action === 'visits') {
            require_once 'controllers/VisitController.php';
            $controller = new VisitController($db);
            $residentId = isset($_GET['resident_id']) ? $_GET['resident_id'] : null;

            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $controller->create($data, $residentId);
            } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
                $visitId = isset($_GET['visit_id']) ? $_GET['visit_id'] : null;
                $controller->cancel($visitId, $residentId);
            } else {
                http_response_code(405);
                echo json_encode(["message" => "Método no permitido"]);
            }
            
        } elseif ($action === 'profile') {
            require_once 'controllers/ResidentController.php';
            $controller = new ResidentController($db);
            $residentId = isset($_GET['resident_id']) ? $_GET['resident_id'] : null;
            
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $controller->getProfile($residentId);
            } else {
                http_response_code(405);
                echo json_encode(["message" => "Método no permitido"]);
            }
        }
        break;

    default:
        http_response_code(404);
        echo json_encode(["message" => "Ruta no encontrada."]);
        break;
}
?>
