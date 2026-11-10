import { db } from "hatchable";
export const access = "admin";
export const methods = ["GET","POST"];
export default async function(req,res){
 if(req.method==="GET"){
  const patientId=String(req.query?.patient_id||"");
  const {rows}=await db.query("SELECT id,patient_id,encounter_id,assessed_at,laterality,risk_level,clinical_impression,status FROM podiatry_assessments WHERE ($1='' OR patient_id::text=$1) ORDER BY assessed_at DESC LIMIT 200",[patientId]);
  return res.json({assessments:rows});
 }
 const b=req.body||{};
 if(!b.patient_id)return res.status(400).json({error:"Selecciona un paciente."});
 const {rows}=await db.query("INSERT INTO podiatry_assessments(patient_id,encounter_id,professional_id,reason_for_visit,laterality,skin_findings,nail_findings,interdigital_findings,vascular_findings,neurological_findings,biomechanical_findings,footwear_findings,lesion_or_wound_findings,pain_scale,risk_level,clinical_impression,plan_and_recommendations) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb,$12::jsonb,$13::jsonb,$14,$15,$16,$17) RETURNING id,patient_id,assessed_at,status",[b.patient_id,b.encounter_id||null,b.professional_id||null,b.reason_for_visit||null,b.laterality||null,JSON.stringify(b.skin_findings||{}),JSON.stringify(b.nail_findings||{}),JSON.stringify(b.interdigital_findings||{}),JSON.stringify(b.vascular_findings||{}),JSON.stringify(b.neurological_findings||{}),JSON.stringify(b.biomechanical_findings||{}),JSON.stringify(b.footwear_findings||{}),JSON.stringify(b.lesion_or_wound_findings||{}),b.pain_scale??null,b.risk_level||null,b.clinical_impression||null,b.plan_and_recommendations||null]);
 return res.status(201).json({assessment:rows[0]});
}