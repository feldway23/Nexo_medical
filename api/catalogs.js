import { db } from "hatchable";
export const access = "admin";
export const methods = ["GET"];
export default async function(req,res){
 const system=String(req.query?.system||"").toUpperCase();
 if(system && !["CIE10","CUPS","CIIU","RIPS"].includes(system))return res.status(400).json({error:"Catálogo no reconocido."});
 const {rows}=await db.query("SELECT c.system_code,c.version_label,c.source_name,c.source_reference,c.effective_from,c.effective_to,c.is_current,e.code,e.display,e.category,e.active,e.valid_from,e.valid_to FROM coding_catalogs c LEFT JOIN coding_entries e ON e.catalog_id=c.id WHERE ($1='' OR c.system_code=$1) ORDER BY c.system_code,c.is_current DESC,e.code LIMIT 1000",[system]);
 return res.json({catalogs:rows});
}