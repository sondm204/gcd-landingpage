import {connection} from "next/server";
import {attendeeFilters,attendeeQuery} from "@/lib/admin/queries";
import {BoothError,json,requireAdmin,responseError} from "@/lib/booths/server";
export async function GET(request:Request){
  await connection();
  try{await requireAdmin();const filters=attendeeFilters(new URL(request.url).searchParams);const {data,count,error}=await attendeeQuery(filters).range((filters.page-1)*filters.page_size,filters.page*filters.page_size-1);if(error)throw new BoothError(503,"Chưa tải được danh sách người đăng ký.");return json({registrations:data,total:count??0,page:filters.page,page_size:filters.page_size});}catch(error){return responseError(error);}
}
