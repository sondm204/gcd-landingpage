import "server-only";
import { z } from "zod";
import { BoothError, serviceClient } from "@/lib/booths/server";
import { normalizePhone } from "@/lib/games/validation";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => { const d=new Date(v+"T00:00:00Z"); return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10)===v; });
const common = { q:z.string().trim().max(120).default(""), from:date.optional(), to:date.optional(), sort:z.enum(["newest","oldest"]).default("newest"), locale:z.enum(["vi","en"]).default("vi") };
const attendeeSchema=z.object({...common,jci:z.enum(["all","yes","no"]).default("all"),page:z.coerce.number().int().min(1).max(10000).default(1),page_size:z.coerce.number().pipe(z.union([z.literal(20),z.literal(50),z.literal(100)])).default(20)});
const boothSchema=z.object({...common,status:z.enum(["all","pending","approved","rejected"]).default("all"),position:z.coerce.number().int().min(1).max(40).optional()});
export function attendeeFilters(params:URLSearchParams) { const result=attendeeSchema.safeParse(Object.fromEntries(params)); if(!result.success || (result.data.from && result.data.to && result.data.from>result.data.to))throw new BoothError(400,"Bộ lọc không hợp lệ.");return result.data; }
export function boothFilters(params:URLSearchParams) { const result=boothSchema.safeParse(Object.fromEntries(params));if(!result.success || (result.data.from && result.data.to && result.data.from>result.data.to))throw new BoothError(400,"Bộ lọc không hợp lệ.");return result.data; }
export const attendeeColumns="id,reference,full_name,birth_date,phone,email,facebook_url,is_jci,chapter,created_at";
export const boothColumns="id,reference,position_id,brand,booth_name,contact_name,phone,email,website,category,description,image_paths,payment,status,created_at,updated_at,reviewed_at,review_note";
function pattern(value:string) { return "%"+value.replace(/[^\p{L}\p{N}\s@.+_-]/gu," ").replaceAll("_","\\_").trim()+"%"; }
function search(fields:string[],value:string) {
  const parts=fields.map(field=>`${field}.ilike."${pattern(value)}"`);
  if(/^[+\d\s().-]+$/.test(value)){
    const normalized=normalizePhone(value);
    if(normalized!==value)parts.push(`phone.ilike."${pattern(normalized)}"`);
  }
  return parts.join(",");
}
export function attendeeQuery(filters:ReturnType<typeof attendeeFilters>,cutoff?:string) {
  let query=serviceClient().from("event_registrations").select(attendeeColumns,{count:"exact"}).order("created_at",{ascending:filters.sort==="oldest"}).order("id");
  if(filters.jci!=="all")query=query.eq("is_jci",filters.jci==="yes");
  if(filters.q)query=query.or(search(["full_name","email","phone","chapter","reference"],filters.q));
  if(filters.from)query=query.gte("created_at",filters.from+"T00:00:00+07:00");
  if(filters.to)query=query.lte("created_at",filters.to+"T23:59:59.999999+07:00");
  if(cutoff)query=query.lte("created_at",cutoff);
  return query;
}
export function boothQuery(filters:ReturnType<typeof boothFilters>,cutoff?:string) {
  let query=serviceClient().from("booth_proposals").select(boothColumns,{count:"exact"}).order("created_at",{ascending:filters.sort==="oldest"}).order("id");
  if(filters.status!=="all")query=query.eq("status",filters.status);
  if(filters.position)query=query.eq("position_id",filters.position);
  if(filters.q)query=query.or(search(["brand","booth_name","contact_name","email","phone","reference"],filters.q));
  if(filters.from)query=query.gte("created_at",filters.from+"T00:00:00+07:00");
  if(filters.to)query=query.lte("created_at",filters.to+"T23:59:59.999999+07:00");
  if(cutoff)query=query.lte("created_at",cutoff);
  return query;
}
export const MAX_EXPORT_ROWS=20000;
export async function exportRows<T>(fetchPage:(start:number,end:number)=>PromiseLike<{data:T[]|null;count:number|null;error:unknown}>) {
  const rows:T[]=[];
  for(;;){
    const result=await fetchPage(rows.length,rows.length+499);
    if(result.error)throw new BoothError(503,"Chưa tải được dữ liệu xuất Excel. Vui lòng thử lại.");
    if((result.count??0)>MAX_EXPORT_ROWS || rows.length+(result.data?.length??0)>MAX_EXPORT_ROWS)throw new BoothError(400,"Kết quả vượt 20.000 hồ sơ. Hãy thu hẹp khoảng ngày để xuất Excel.");
    const batch=result.data||[];
    rows.push(...batch);
    if(result.count!==null && rows.length>=result.count)break;
    // Advance by the returned count even if Supabase caps batches below 500 rows.
    if(!batch.length){
      if(result.count===null)break;
      throw new BoothError(503,"Chưa tải được dữ liệu xuất Excel. Vui lòng thử lại.");
    }
  }
  return rows;
}
