import mysql from "mysql2/promise";
export const pool = mysql.createPool({
  host: process.env.DB_HOST || "mysql",
  port: process.env.DB_PORT ? +process.env.DB_PORT : 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "fitcam",
  waitForConnections: true,
  connectionLimit: 10
});
