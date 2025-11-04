import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

const {
  PORT = 3000, DB_HOST='mysql', DB_PORT=3306, DB_USER='root', DB_PASSWORD='root', DB_NAME='fitcam', BCRYPT_ROUNDS=12
} = process.env;

const db = await mysql.createPool({
  host: DB_HOST, port: Number(DB_PORT), user: DB_USER, password: DB_PASSWORD, database: DB_NAME, connectionLimit: 10
});

const app = express();
app.use(cors({ origin: ['http://localhost:8080','http://localhost:5173','http://127.0.0.1:5173'] }));
app.use(express.json());

app.get('/health', async (_req, res) => {
  try { await db.query('SELECT 1'); res.json({ ok: true }); }
  catch { res.status(500).json({ ok: false }); }
});

app.post('/register', async (req, res) => {
  const { nom, mail, password } = req.body || {};
  if (!nom || !mail || !password) return res.status(400).json({ msg: 'Falten camps' });
  try {
    const [dup] = await db.execute('SELECT id FROM users WHERE mail=?', [mail]);
    if (dup.length) return res.status(409).json({ msg: 'Correu en ús' });
    const hash = await bcrypt.hash(password, Number(BCRYPT_ROUNDS));
    await db.execute('INSERT INTO users (nom, mail, password) VALUES (?,?,?)', [nom, mail, hash]);
    res.sendStatus(201);
  } catch (e) { console.error('[REGISTER ERROR]', e); res.sendStatus(500); }
});

app.listen(Number(PORT), () => console.log(`API escoltant a :${PORT}`));
