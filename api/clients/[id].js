import { db } from "hatchable";
export const access = "admin";
export default async function(req,res) {
 const id=req.params.id;
 if (req.method === "PATCH") {
  const b=req.body||{};
  const { rows }=await db.query("UPDATE clients SET name=COALESCE($1,name), company=COALESCE($2,company), email=COALESCE($3,email), phone=COALESCE($4,phone), status=COALESCE($5,status), source=COALESCE($6,source), notes=COALESCE($7,notes), updated_at=now() WHERE id=$8 RETURNING *",[b.name??null,b.company??null,b.email??null,b.phone??null,b.status??null,b.source??null,b.notes??null,id]);
  return rows[0]?res.json(rows[0]):res.status(404).json({error:"Cliente no encontrado"});
 }
 if (req.method === "DELETE") {
  await db.query("DELETE FROM clients WHERE id=$1",[id]);
  return res.json({ok:true});
 }
 return res.status(405).json({error:"Método no permitido"});
}