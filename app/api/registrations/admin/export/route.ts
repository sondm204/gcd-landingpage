import {connection} from "next/server";
import {attendeeFilters,attendeeQuery,exportRows} from "@/lib/admin/queries";
import {excelFile,excelResponse,exportDate} from "@/lib/admin/excel";
import {requireAdmin,responseError} from "@/lib/booths/server";
export async function GET(request:Request){
  await connection();
  try{await requireAdmin();const filters=attendeeFilters(new URL(request.url).searchParams),cutoff=new Date().toISOString();const rows=await exportRows((a,b)=>attendeeQuery(filters,cutoff).range(a,b));const en=filters.locale==="en";
    const headers=en?["Reference","Full name","Date of birth","Phone","Email","Facebook","Active in JCI","Chapter","Registered at"]:["Mã đăng ký","Họ và tên","Ngày sinh","Số điện thoại","Email","Facebook","Hoạt động JCI","Chapter","Ngày đăng ký"];
    const bytes=await excelFile(en?"Attendees":"Nguoi tham du",headers.map((header,i)=>({header,width:[24,30,18,22,32,45,18,28,24][i]})),rows.map(r=>[r.reference,r.full_name,exportDate(r.birth_date,true),r.phone,r.email,r.facebook_url,r.is_jci?(en?"Yes":"Có"):(en?"No":"Không"),r.chapter,exportDate(r.created_at)]),JSON.stringify({...filters,page:undefined,page_size:undefined}));return excelResponse(bytes,"attendees");
  }catch(error){return responseError(error);}
}
