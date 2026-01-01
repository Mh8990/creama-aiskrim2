const jwt = require("jsonwebtoken");

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: "method_not_allowed" }) };

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET;

  if (!ADMIN_PASSWORD || !ADMIN_TOKEN_SECRET) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: "env_not_set" }) };
  }

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch {}

  if ((body.password || "") !== ADMIN_PASSWORD) {
    return { statusCode: 401, headers, body: JSON.stringify({ ok: false, error: "invalid_password" }) };
  }

  const token = jwt.sign({ role: "admin" }, ADMIN_TOKEN_SECRET, { expiresIn: "12h" });
  return { statusCode: 200, headers, body: JSON.stringify({ ok: true, token }) };
};
