import { db } from "hatchable";
export const access = "admin";
export const methods = ["GET","POST"];
const json = value => JSON.stringify(value ?? {});
const text = value => value == null ? null : String(value).trim() || null;
export default async function(req,res){
 if(req.method==="GET"){
  const patientId=String(req.query?.patient_id||"");
  const {rows}=await db.query(
   "SELECT h.*,h.personal_history->>'notes' AS personal_history_text,h.systems_review->>'notes' AS systems_review_text,h.skin_exam->>'notes' AS skin_exam_text,h.nail_exam->>'notes' AS nail_exam_text,h.interdigital_exam->>'notes' AS interdigital_exam_text,h.vascular_exam->>'notes' AS vascular_exam_text,h.neurological_exam->>'notes' AS neurological_exam_text,h.biomechanical_exam->>'notes' AS biomechanical_exam_text,h.footwear_exam->>'notes' AS footwear_exam_text,h.wounds_exam->>'notes' AS wounds_exam_text,p.document_type,p.document_number,p.birth_date,p.phone,p.first_name,p.middle_name,p.last_name,p.second_last_name FROM podiatry_clinical_histories h JOIN patients p ON p.id=h.patient_id WHERE ($1='' OR h.patient_id::text=$1) ORDER BY h.attended_at DESC LIMIT 200",
   [patientId]
  );
  return res.json({histories:rows});
 }
 const b=req.body||{};
 if(!b.patient_id||!b.attended_date) return res.status(400).json({error:"Selecciona el paciente y la fecha de atención."});
 const pain=b.pain_scale===""||b.pain_scale==null?null:Number(b.pain_scale);
 if(pain!==null&&(!Number.isInteger(pain)||pain<0||pain>10)) return res.status(400).json({error:"La escala de dolor debe estar entre 0 y 10."});
 const attendedAt=b.attended_date+"T"+(b.entry_time||"12:00")+":00-05:00";
 const diagnoses=(b.diagnoses_text||"").split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean).map(code=>({code,description:""}));
 const procedures=b.procedure_name?[{name:b.procedure_name,internal_code:b.procedure_code||null}]:[];
 const {rows}=await db.query(
  "INSERT INTO podiatry_clinical_histories(patient_id,attended_at,attended_date,encounter_type,reason_for_consultation,current_illness,personal_history,family_history,medication_history,allergy_history,systems_review,pain_scale,laterality,skin_exam,nail_exam,interdigital_exam,vascular_exam,neurological_exam,biomechanical_exam,footwear_exam,wounds_exam,functional_exam,clinical_analysis,diagnoses,procedures,treatment_plan,recommendations,referrals,follow_up,consent_record,status,site_name,entry_time,exit_time,procedure_responsible,received_by,procedure_name,procedure_code,conclusions_plan,administrative_notes,diagnoses_text) VALUES($1,$2::timestamptz,$3::date,$4,$5,$6,$7::jsonb,$8,$9,$10,$11::jsonb,$12,$13,$14::jsonb,$15::jsonb,$16::jsonb,$17::jsonb,$18::jsonb,$19::jsonb,$20::jsonb,$21::jsonb,$22,$23,$24::jsonb,$25::jsonb,$26,$27,$28,$29,$30::jsonb,'draft',$31,$32::time,$33::time,$34,$35,$36,$37,$38,$39,$40) RETURNING *",
  [b.patient_id,attendedAt,b.attended_date,b.encounter_type||"quiropodia",text(b.reason_for_consultation),text(b.current_illness),json({notes:text(b.personal_history_text)}),text(b.family_history),text(b.medication_history),text(b.allergy_history),json({notes:text(b.systems_review_text)}),pain,text(b.laterality),json({notes:text(b.skin_exam_text)}),json({notes:text(b.nail_exam_text)}),json({notes:text(b.interdigital_exam_text)}),json({notes:text(b.vascular_exam_text)}),json({notes:text(b.neurological_exam_text)}),json({notes:text(b.biomechanical_exam_text)}),json({notes:text(b.footwear_exam_text)}),json({notes:text(b.wounds_exam_text)}),text(b.functional_exam),text(b.clinical_analysis),JSON.stringify(diagnoses),JSON.stringify(procedures),text(b.treatment_plan),text(b.recommendations),text(b.referrals),text(b.follow_up),json({source:"clinical_form",consent_status:"not_recorded"}),text(b.site_name),text(b.entry_time),text(b.exit_time),text(b.procedure_responsible),text(b.received_by),text(b.procedure_name),text(b.procedure_code),text(b.conclusions_plan),text(b.administrative_notes),text(b.diagnoses_text)]
 );
 await db.query("INSERT INTO audit_logs(action,resource_type,resource_id,details) VALUES('create','podiatry_clinical_history',$1,$2::jsonb)",[rows[0].id,JSON.stringify({patient_id:b.patient_id,status:"draft",source:"clinical_form"})]);
 return res.status(201).json({history:rows[0]});
}