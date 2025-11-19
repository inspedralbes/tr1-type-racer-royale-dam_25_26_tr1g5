-- Desactivamos chequeo de claves foráneas temporalmente para poder recrear tablas
SET FOREIGN_KEY_CHECKS = 0;

-- 1. TABLA DE USUARIOS
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom_usuari VARCHAR(100) NOT NULL UNIQUE,
  contrasenya VARCHAR(255) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. TABLA DE EJERCICIOS
CREATE TABLE IF NOT EXISTS exercicis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom_exercici VARCHAR(150) NOT NULL UNIQUE,
  gif VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. TABLA DE RESULTADOS (Actualizada para FitCam)
-- Borramos la tabla anterior para asegurar que se crea con las columnas nuevas
DROP TABLE IF EXISTS resultats;

CREATE TABLE resultats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  exercici_id INT NOT NULL,
  
  -- CAMPOS NUEVOS PARA LA GAMIFICACIÓN Y RÁNQUING:
  tecnica DECIMAL(5,2) NOT NULL DEFAULT 0.00,   -- Porcentaje de precisión (0-100)
  repeticions INT NOT NULL DEFAULT 0,           -- Cantidad total
  series INT NOT NULL DEFAULT 0,                -- Cantidad de series (PRIORITARIO para ganar)
  temps_segons INT NOT NULL DEFAULT 0,          -- Tiempo en segundos
  session_grup_id VARCHAR(50) NULL,             -- Código de la sala (ej: "839201") para agrupar jugadores

  -- CAMPOS LEGACY (Mantenidos por compatibilidad):
  pes_levantat DECIMAL(5,2) DEFAULT 0.00,       -- Por defecto 0 si no se usa peso extra
  data_resultat DATE DEFAULT (CURRENT_DATE),    -- Se pone la fecha de hoy automáticamente
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Relaciones
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (exercici_id) REFERENCES exercicis(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. TABLA DE SESIONES (Para mantener el login)
CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Reactivamos chequeo de claves foráneas
SET FOREIGN_KEY_CHECKS = 1;