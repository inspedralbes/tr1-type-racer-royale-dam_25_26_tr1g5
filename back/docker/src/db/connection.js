// Importem el connector mysql2
const mysql = require("mysql2/promise");

async function crearTaules() {
    const connection = await mysql.createConnection({
        host: "127.0.0.1",
        port: 3306,
        user: "root",
        password: "root",
        database: "fitcam",
    });

    // Important per FK i charset
    await connection.execute(`SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.execute(`SET time_zone = '+01:00';`);

    const createUsers = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nom VARCHAR(100) NOT NULL,
      password VARCHAR(255) NOT NULL,
      mail VARCHAR(150) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;

    const createExercicis = `
    CREATE TABLE IF NOT EXISTS exercicis (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nom_exercici VARCHAR(120) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;

    const createResultats = `
    CREATE TABLE IF NOT EXISTS resultats (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      exercici_id INT NOT NULL,
      rep_exercici INT NOT NULL DEFAULT 0,
      percentatge_tecnica DECIMAL(5,2) NOT NULL DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_resultats_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_resultats_exercici
        FOREIGN KEY (exercici_id) REFERENCES exercicis(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      INDEX ix_resultats_user (user_id),
      INDEX ix_resultats_exercici (exercici_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;

    const createRanking = `
    CREATE TABLE IF NOT EXISTS ranking (
      id INT AUTO_INCREMENT PRIMARY KEY,
      -- opcionalment pots afegir exercici_id i/o data si vols ranking per exercici o per dia
      exercici_id INT NULL,
      top1 INT NULL,
      top2 INT NULL,
      top3 INT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_ranking_exercici
        FOREIGN KEY (exercici_id) REFERENCES exercicis(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_ranking_top1
        FOREIGN KEY (top1) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_ranking_top2
        FOREIGN KEY (top2) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_ranking_top3
        FOREIGN KEY (top3) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
      INDEX ix_ranking_exercici (exercici_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;

    const insertExercicis = `INSERT INTO exercicis (nom_exercici) VALUES
('Press de banca'),('Sentadilla amb barra'),('Pes mort'),('Press militar'),
('Remo amb barra'),('Curl de bíceps amb barra'),('Extensió de tríceps en polea'),('Elevacions laterals');`;

    try {
        await connection.execute(createUsers);
        await connection.execute(createExercicis);
        await connection.execute(createResultats);
        await connection.execute(createRanking);
        await connection.execute(insertExercicis);
        console.log("✓ Taules creades/actualitzades correctament");
    } catch (error) {
        console.error("❌ Error creant les taules:", error.message);
    } finally {
        await connection.end();
    }
}

crearTaules();
