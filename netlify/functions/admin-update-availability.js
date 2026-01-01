import { Client } from "pg";
import jwt from "jsonwebtoken";

export default async (req) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (req.method !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ ok: false, error: "method_not_allowed" }),
    };
  }

  const DATABASE_URL = process.env.DATABASE_URL;
  const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET;

  if (!DATABASE_URL || !ADMIN_TOKEN_SECRET) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: "env_not_set" }),
    };
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ ok: false, error: "missing_token" }),
    };
  }

  try {
    jwt.verify(token, ADMIN_TOKEN_SECRET);
  } catch {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ ok: false, error: "invalid_token" }),
    };
  }

  let body = {};
  try {
    body = JSON.parse(req.body || "{}");
  } catch {}

  if (!body.availability || typeof body.availability !== "object") {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ ok: false, error: "invalid_data" }),
    };
  }

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query(
      "UPDATE site_availability SET availability=$1::jsonb, updated_at=now() WHERE id=1",
      [JSON.stringify(body.availability)]
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true }),
    };
  } catch {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: "db_error" }),
    };
  } finally {
    try {
      await client.end();
    } catch {}
  }
};
