import { db } from "hatchable";
export const access = "admin";
export default async function(req,res) {
 if (req.method === "GET") {
  const { rows }=await db.query("SELECT a.*, c.name AS client_name FROM activities a LEFT JOIN clients c ON c.id=a.client_id ORDER BY CASE WHEN a.status='pending' THEN 0 ELSE 1 END, a.due_at ASC NULLS LAST LIMIT 300");
  return res.json(rows);
 }
 if (req.method === "POST") {
  const b=req.body||{};
  if (!String(b.title||"").trim()) return res.status(400).json({error:"La actividad necesita un título"});
  const { rows }=await db.query("INSERT INTO activities (title,client_id,opportunity_id,kind,due_at,notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",[String(b.title).trim(),b.client_id||null,b.opportunity_id||null,b.kind||"task",b.due_at||null,b.notes||null]);
  return res.status(201).json(rows[0]);
 }
 if (req.method === "PATCH") {
  const b=req.body||{};
  if (!b.id) return res.status(400).json({error:"Falta el identificador"});
  const { rows }=await db.query("UPDATE activities SET status=$1 WHERE id=$2 RETURNING *",[b.status==="done"?"done":"pending",b.id]);
  return res.json(rows[0]||null);
 }
 return res.status(405).json({error:"Método no permitido"});
}