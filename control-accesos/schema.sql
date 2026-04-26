CREATE DATABASE IF NOT EXISTS control_accesos;
USE control_accesos;

-- Tabla de Roles (Administrador, Guardia, Residente)
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    status TINYINT DEFAULT 1 COMMENT '1: Activo, 0: Inactivo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar roles base por defecto
INSERT INTO roles (name, description) VALUES 
('Administrador', 'Acceso total al sistema'),
('Guardia', 'Visualiza listas y valida accesos en caseta'),
('Residente', 'Cliente del fraccionamiento, gestiona sus visitas');

-- Tabla de Usuarios
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    status TINYINT DEFAULT 1 COMMENT '1: Activo, 0: Inactivo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Residentes (Detalles específicos de los clientes)
CREATE TABLE residents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    address VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    access_token VARCHAR(100) UNIQUE COMMENT 'UUID para el código de barras permanente',
    status TINYINT DEFAULT 1 COMMENT '1: Activo, 0: Inactivo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Pagos
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    resident_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    valid_until_date DATE NOT NULL COMMENT 'Fecha límite de la cobertura del pago',
    status TINYINT DEFAULT 1 COMMENT '1: Activo, 0: Pago Anulado/Cancelado',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Visitas
CREATE TABLE visits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    resident_id INT NOT NULL,
    visitor_name VARCHAR(100) NOT NULL,
    valid_from DATETIME NOT NULL COMMENT 'Inicio de vigencia',
    valid_until DATETIME NOT NULL COMMENT 'Fin de vigencia',
    access_token VARCHAR(100) UNIQUE COMMENT 'UUID para el código de barras de la visita',
    status TINYINT DEFAULT 1 COMMENT '1: Activo, 0: Cancelado por el residente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Bitácora de Accesos
CREATE TABLE access_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    scanned_token VARCHAR(100) NOT NULL,
    type ENUM('Residente', 'Visita', 'Desconocido') NOT NULL,
    result ENUM('PERMITIDO', 'DENEGADO') NOT NULL,
    reason VARCHAR(255) COMMENT 'Razón del bloqueo o éxito',
    guard_id INT NOT NULL COMMENT 'Usuario con rol Guardia que escaneó el código',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guard_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
