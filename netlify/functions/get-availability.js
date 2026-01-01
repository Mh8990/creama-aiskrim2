const { Client } = require("pg");

exports.handler = async () => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: "DATABASE_URL not set" }) };
  }

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const r = await client.query("SELECT availability FROM site_availability WHERE id = 1 LIMIT 1");
    const availability = (r.rows && r.rows[0] && r.rows[0].availability) ? r.rows[0].availability : {};
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, availability }) };
  } catch (e) {
    console.error("get-availability db_error:", e);
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: "db_error" }) };
  } finally {
    try { await client.end(); } catch {}
  }
};
