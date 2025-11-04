import express from 'express';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

const db = await mysql.createPool({
  host: '127.0.0.1',   // o el service name del teu docker-compose
  port: 3306,
  user: 'root',
  password: 'root',
  database: 'fitcam',
  connectionLimit: 10
});

const app = express();
app.use(express.json());        // per llegir JSON del body

app.post('/register', async (req, res) => {
  const { nom, mail, password } = req.body || {};
  if (!nom || !mail || !password) return res.sendStatus(400);

  try {
    // comprovar correu duplicat
    const [dup] = await db.execute('SELECT id FROM users WHERE mail=?', [mail]);
    if (dup.length) return res.status(409).json({ msg: 'Correu en ús' });

    // xifrar contrasenya i inserir
    const hash = await bcrypt.hash(password, 12);
    await db.execute(
      'INSERT INTO users (nom, mail, password) VALUES (?,?,?)',
      [nom, mail, hash]
    );
    res.sendStatus(201);          // ok
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

app.listen(3000, () => console.log('API escoltant a :3000'));
