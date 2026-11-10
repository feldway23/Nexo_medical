import { db } from "hatchable";
export const access = "admin";
export const methods = ["GET","POST"];
export default async function(req,res){
 if(req.method==="GET"){const {rows}=await db.query("SELECT id,document_type,document_number,first_name,middle_name,last_name,second_last_name,birth_date,phone,email,status,created_at FROM patients ORDER BY created_at DESC LIMIT 300");return res.json({patients:rows});}
 const b=req.body||{},required=["first_name","last_name","document_type","document_number"];
 if(required.some(k=>typeof b[k]!=="string"||!b[k].trim()))return res.status(400).json({error:"Completa nombres, apellidos y documento."});
 if(b.consent_data_processing!==true)return res.status(400).json({error:"Se requiere autorización de tratamiento de datos."});
 const {rows}=await db.query("INSERT INTO patients(document_type,document_number,first_name,middle_name,last_name,second_last_name,birth_date,phone,email,status,consent_data_processing,consent_date) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,now()) RETURNING id,first_name,last_name,status,created_at",[b.document_type.trim(),b.document_number.trim(),b.first_name.trim(),b.middle_name||null,b.last_name.trim(),b.second_last_name||null,b.birth_date||null,b.phone||null,b.email||null,b.status||"active"]);
 await db.query("INSERT INTO audit_logs(actor_user_id,action,resource_type,resource_id,details) VALUES($1,'create','patient',$2,$3::jsonb)",[String(req.member?.id||"project-admin"),rows[0].id,JSON.stringify({source:"patients-form"})]);
 return res.status(201).json({patient:rows[0]});
}