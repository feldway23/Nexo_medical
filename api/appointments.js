import { db } from "hatchable";
export const access = "admin";
export const methods = ["GET"];
export default async function(req,res){
 const {rows}=await db.query("SELECT a.id,a.patient_id,a.professional_id,a.starts_at,a.ends_at,a.status,a.appointment_type,concat_ws(' ',p.first_name,p.middle_name,p.last_name,p.second_last_name) AS patient_name,pr.full_name AS professional_name FROM appointments a JOIN patients p ON p.id=a.patient_id LEFT JOIN professionals pr ON pr.id=a.professional_id WHERE a.starts_at >= now() - interval '1 day' ORDER BY a.starts_at ASC LIMIT 200");
 return res.json({appointments:rows});
}