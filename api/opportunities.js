import { db } from "hatchable";
export const access = "admin";
export default async function(req,res) {
 if (req.method === "GET") {
  const { rows } = await db.query("SELECT o.*, c.name AS client_name FROM opportunities o LEFT JOIN clients c ON c.id=o.client_id ORDER BY o.created_at DESC LIMIT 300");
  return res.json(rows);
 }
 if (req.method === "POST") {
  const b=req.body||{};
  if (!String(b.title||"").trim()) return res.status(400).json({error:"El nombre de la oportunidad es obligatorio"});
  const { rows }=await db.query("INSERT INTO opportunities (title,client_id,value,stage,expected_close,owner,notes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",[String(b.title).trim(),b.client_id||null,Number(b.value)||0,b.stage||"new",b.expected_close||null,b.owner||null,b.notes||null]);
  return res.status(201).json(rows[0]);
 }
 return res.status(405).json({error:"Método no permitido"});
}