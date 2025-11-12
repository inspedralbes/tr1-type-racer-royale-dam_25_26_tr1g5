import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.mjs";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { nom, mail, password } = req.body || {};
    if (!nom || !mail || !password) {
      return res.status(400).json({ error: "Falten camps (nom, mail, password)" });
    }

    const [exists] = await pool.query("SELECT id FROM users WHERE mail = ? LIMIT 1", [mail]);
    if (exists.length) return res.status(409).json({ error: "Aquest correu ja existeix" });

    const hash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS || 12));
    await pool.query("INSERT INTO users (nom, mail, password) VALUES (?,?,?)", [nom, mail, hash]);

    return res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Error de registre" });
  }
});

export default router;
