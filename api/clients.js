import { db } from "hatchable";
export const access = "admin";
export default async function(req,res) {
 if (req.method === "GET") {
  const q = String(req.query.q || "").trim();
  const status = String(req.query.status || "").trim();
  const { rows } = await db.query(
   "SELECT * FROM clients WHERE ($1 = '' OR name ILIKE '%' || $1 || '%' OR company ILIKE '%' || $1 || '%' OR email ILIKE '%' || $1 || '%') AND ($2 = '' OR status = $2) ORDER BY created_at DESC LIMIT 300",
   [q,status]
  );
  return res.json(rows);
 }
 if (req.method === "POST") {
  const b = req.body || {};
  if (!String(b.name || "").trim()) return res.status(400).json({error:"El nombre del cliente es obligatorio"});
  const { rows } = await db.query(
   "INSERT INTO clients (name,company,email,phone,status,source,notes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",
   [String(b.name).trim(),b.company||null,b.email||null,b.phone||null,b.status||"lead",b.source||null,b.notes||null]
  );
  return res.status(201).json(rows[0]);
 }
 return res.status(405).json({error:"Método no permitido"});
}