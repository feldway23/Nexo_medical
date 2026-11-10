import { db } from "hatchable";
export const access = "admin";
export const methods = ["GET","POST"];
export default async function(req,res){
 if(req.method==="GET"){
  const {rows}=await db.query("SELECT id,reporting_version,period_start,period_end,status,ministry_cuv,submitted_at,created_at FROM rips_batches ORDER BY created_at DESC LIMIT 100");
  return res.json({batches:rows});
 }
 const b=req.body||{};
 if(!b.reporting_version||!b.payload)return res.status(400).json({error:"Indica la versión técnica RIPS y el contenido del lote."});
 const {rows}=await db.query("INSERT INTO rips_batches(reporting_version,period_start,period_end,payload,status) VALUES($1,$2,$3,$4::jsonb,'draft') RETURNING id,reporting_version,status,created_at",[b.reporting_version,b.period_start||null,b.period_end||null,JSON.stringify(b.payload)]);
 return res.status(201).json({batch:rows[0],message:"Borrador almacenado. Aún no se ha transmitido al Ministerio."});
}