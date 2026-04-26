<?php
class AccessLog {
    private $conn;
    private $table_name = "access_logs";

    // Propiedades
    public $id;
    public $scanned_token;
    public $type;
    public $result;
    public $reason;
    public $guard_id;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Guardar registro (Log)
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET scanned_token=:scanned_token, type=:type, result=:result, 
                      reason=:reason, guard_id=:guard_id";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":scanned_token", $this->scanned_token);
        $stmt->bindParam(":type", $this->type);
        $stmt->bindParam(":result", $this->result);
        $stmt->bindParam(":reason", $this->reason);
        $stmt->bindParam(":guard_id", $this->guard_id);

        return $stmt->execute();
    }
}
?>
