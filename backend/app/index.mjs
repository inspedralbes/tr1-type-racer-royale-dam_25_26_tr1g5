import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.mjs"; // <-- IMPORTANT: existeix aquest fitxer?

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// Ping
app.get("/", (_req, res) => res.send("Servidor Docker OK!"));

// Muntar rutes d'autenticació
app.use("/api/auth", authRoutes);

// Endpoint de debug per veure rutes registrades
app.get("/__routes", (_req, res) => {
  const list = [];
  app._router.stack.forEach((m) => {
    if (m.route) {
      list.push(`${Object.keys(m.route.methods).join(",").toUpperCase()} ${m.route.path}`);
    } else if (m.name === "router" && m.handle.stack) {
      m.handle.stack.forEach((h) => {
        if (h.route) {
          list.push(`${Object.keys(h.route.methods).join(",").toUpperCase()} /api/auth${h.route.path}`);
        }
      });
    }
  });
  res.json(list);
});

// (Opcional) Alias perquè també funcioni /register
app.post("/register", (req, res, next) => {
  req.url = "/api/auth/register";
  next();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API escoltant al port ${PORT}`));
