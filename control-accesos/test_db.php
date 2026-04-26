<?php require_once "config/Database.php"; $db = new Database(); $conn = $db->getConnection(); if($conn) echo "OK"; else echo "FAIL";
