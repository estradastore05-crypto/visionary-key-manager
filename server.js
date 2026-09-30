const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "CHANGE-ME-BEFORE-DEPLOY";
const DB = path.join(__dirname, "keys.json");

function loadKeys() {
  try {
    return JSON.parse(fs.readFileSync(DB, "utf8"));
  } catch {
    return [];
  }
}

function saveKeys(keys) {
  fs.writeFileSync(DB, JSON.stringify(keys, null, 2));
}

function makeKey() {
  return crypto.randomBytes(12).toString("base64url");
}

function auth(req, res, next) {
  if (req.headers.authorization !== `Bearer ${ADMIN_TOKEN}`) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
}

app.get("/", (req, res) => {
  res.type("html").send(`
    <h1>VISIONARY KEY MANAGER</h1>
    <p>API online.</p>
    <p>Use <code>POST /api/validate</code> to validate a key.</p>
  `);
});

app.post("/api/validate", (req, res) => {
  const key = String(req.body?.key || "");
  const keys = loadKeys();
  const item = keys.find(k => k.key === key);

  if (!item) return res.json({ valid: false, status: "invalid" });
  if (item.status === "paused") return res.json({ valid: false, status: "paused" });
  if (item.status === "revoked") return res.json({ valid: false, status: "revoked" });

  if (Date.now() >= new Date(item.expiresAt).getTime()) {
    item.status = "expired";
    saveKeys(keys);
    return res.json({ valid: false, status: "expired" });
  }

  return res.json({
    valid: true,
    status: "active",
    expiresAt: item.expiresAt
  });
});

app.get("/api/keys", auth, (req, res) => {
  res.json(loadKeys());
});

app.post("/api/keys", auth, (req, res) => {
  const days = Math.max(1, Math.min(3650, Number(req.body?.days || 30)));
  const now = new Date();
  const expiresAt = new Date(now.getTime() + days * 86400000);

  const keys = loadKeys();
  const item = {
    key: makeKey(),
    status: "active",
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  };

  keys.push(item);
  saveKeys(keys);
  res.json(item);
});

app.post("/api/keys/:key/pause", auth, (req, res) => {
  const keys = loadKeys();
  const item = keys.find(k => k.key === req.params.key);
  if (!item) return res.status(404).json({ error: "not_found" });

  item.status = "paused";
  saveKeys(keys);
  res.json(item);
});

app.post("/api/keys/:key/resume", auth, (req, res) => {
  const keys = loadKeys();
  const item = keys.find(k => k.key === req.params.key);
  if (!item) return res.status(404).json({ error: "not_found" });

  if (Date.now() >= new Date(item.expiresAt).getTime()) {
    item.status = "expired";
  } else {
    item.status = "active";
  }

  saveKeys(keys);
  res.json(item);
});

app.delete("/api/keys/:key", auth, (req, res) => {
  const keys = loadKeys();
  const index = keys.findIndex(k => k.key === req.params.key);
  if (index === -1) return res.status(404).json({ error: "not_found" });

  const [removed] = keys.splice(index, 1);
  saveKeys(keys);
  res.json({ ok: true, removed });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`VISIONARY Key Manager running on port ${PORT}`);
});
