import { db } from "hatchable";
export const access = "admin";
export const methods = ["GET","POST"];
export default async function(req,res){
 if(req.method==="GET"){
  const [organizations,sites,professionals,services]=await Promise.all([
   db.query("SELECT * FROM provider_organizations ORDER BY created_at DESC"),
   db.query("SELECT s.*,o.legal_name FROM provider_sites s JOIN provider_organizations o ON o.id=s.organization_id ORDER BY s.created_at DESC"),
   db.query("SELECT op.*,p.full_name,p.profession,p.license_number FROM organization_professionals op JOIN professionals p ON p.id=op.professional_id ORDER BY p.full_name"),
   db.query("SELECT v.*,s.name AS site_name FROM provider_site_services v JOIN provider_sites s ON s.id=v.site_id ORDER BY v.created_at DESC")
  ]);
  return res.json({organizations:organizations.rows,sites:sites.rows,professionals:professionals.rows,services:services.rows});
 }
 const b=req.body||{};
 if(b.action==="create_organization"){
  if(!b.legal_name)return res.status(400).json({error:"La razón social o nombre del profesional es obligatorio."});
  const {rows}=await db.query("INSERT INTO provider_organizations(legal_name,trade_name,provider_kind,legal_type,document_type,document_number,dv,email,phone,department_code,municipality_code,address,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'setup') RETURNING *",[b.legal_name,b.trade_name||null,b.provider_kind||"independent",b.legal_type||"natural_person",b.document_type||null,b.document_number||null,b.dv||null,b.email||null,b.phone||null,b.department_code||null,b.municipality_code||null,b.address||null]);
  await db.query("INSERT INTO audit_logs(action,resource_type,resource_id,details) VALUES('create','provider_organization',$1,$2::jsonb)",[rows[0].id,JSON.stringify({provider_kind:rows[0].provider_kind})]);
  return res.status(201).json({organization:rows[0]});
 }
 if(b.action==="create_site"){
  if(!b.organization_id||!b.name)return res.status(400).json({error:"Selecciona el prestador e indica el nombre de la sede."});
  const {rows}=await db.query("INSERT INTO provider_sites(organization_id,name,site_code,address,department_code,municipality_code,phone,modality) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",[b.organization_id,b.name,b.site_code||null,b.address||null,b.department_code||null,b.municipality_code||null,b.phone||null,b.modality||"intramural"]);
  await db.query("INSERT INTO audit_logs(action,resource_type,resource_id,details) VALUES('create','provider_site',$1,$2::jsonb)",[rows[0].id,JSON.stringify({organization_id:b.organization_id})]);
  return res.status(201).json({site:rows[0]});
 }
 if(b.action==="create_service"){
  if(!b.organization_id||!b.site_id||!b.service_name)return res.status(400).json({error:"Prestador, sede y nombre del servicio son obligatorios."});
  const {rows}=await db.query("INSERT INTO provider_site_services(organization_id,site_id,service_name,internal_code,service_group,complexity,modality,installed_capacity) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",[b.organization_id,b.site_id,b.service_name,b.internal_code||null,b.service_group||null,b.complexity||null,b.modality||null,b.installed_capacity?Number(b.installed_capacity):null]);
  await db.query("INSERT INTO audit_logs(action,resource_type,resource_id,details) VALUES('create','provider_site_service',$1,$2::jsonb)",[rows[0].id,JSON.stringify({site_id:b.site_id})]);
  return res.status(201).json({service:rows[0]});
 }
 if(b.action==="link_professional"){
  if(!b.organization_id||!b.professional_id)return res.status(400).json({error:"Prestador y profesional son obligatorios."});
  const {rows}=await db.query("INSERT INTO organization_professionals(organization_id,professional_id,role,registration_type,registration_number,credential_verified) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(organization_id,professional_id) DO UPDATE SET role=EXCLUDED.role,registration_type=EXCLUDED.registration_type,registration_number=EXCLUDED.registration_number,credential_verified=EXCLUDED.credential_verified,status='active' RETURNING *",[b.organization_id,b.professional_id,b.role||"professional",b.registration_type||null,b.registration_number||null,b.credential_verified===true]);
  return res.status(201).json({membership:rows[0]});
 }
 if(b.action==="update_organization_status"){
  const allowed=["setup","active","transitioning","inactive"];
  if(!b.organization_id||!allowed.includes(b.status))return res.status(400).json({error:"Estado o prestador no válido."});
  const {rows}=await db.query("UPDATE provider_organizations SET status=$2,updated_at=now() WHERE id=$1 RETURNING *",[b.organization_id,b.status]);
  if(!rows.length)return res.status(404).json({error:"Prestador no encontrado."});
  return res.json({organization:rows[0]});
 }
 return res.status(400).json({error:"Acción no reconocida."});
}