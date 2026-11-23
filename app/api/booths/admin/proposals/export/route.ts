import {connection} from "next/server";
import {boothFilters,boothQuery,exportRows} from "@/lib/admin/queries";
import {excelFile,excelResponse,exportDate} from "@/lib/admin/excel";
import {requireAdmin,responseError} from "@/lib/booths/server";
import {positionCode,zoneForPosition,type BoothProposal} from "@/lib/booths/types";
export async function GET(request:Request){
  await connection();
  try{await requireAdmin();const filters=boothFilters(new URL(request.url).searchParams),cutoff=new Date().toISOString();const rows=await exportRows((a,b)=>boothQuery(filters,cutoff).range(a,b)) as BoothProposal[];const en=filters.locale==="en";
    const headers=en?["Reference","Position","Zone","Brand","Booth name","Status","Contact","Phone","Email","Website","Category","Description","Base fee (VND)","Discount (VND)","Amount due (VND)","Voucher","Transfer memo","Receipt attached","Image count","Submitted at","Updated at","Reviewed at","Review note"]:["Mã hồ sơ","Vị trí","Khu","Thương hiệu","Tên gian hàng","Trạng thái","Người liên hệ","Số điện thoại","Email","Website","Lĩnh vực","Mô tả","Phí gốc (VND)","Giảm giá (VND)","Cần chuyển (VND)","Mã giảm giá","Nội dung chuyển khoản","Có ảnh chuyển khoản","Số ảnh","Ngày đăng ký","Ngày cập nhật","Ngày xét duyệt","Ghi chú xét duyệt"];
    const statuses=en?{pending:"Pending",approved:"Approved",rejected:"Rejected"}:{pending:"Chờ duyệt",approved:"Đã xác nhận",rejected:"Đã từ chối"};
    const bytes=await excelFile(en?"Booth proposals":"Ho so gian hang",headers.map((header,i)=>({header,width:[11,12,13,14,18].includes(i)?18:28,numeric:[12,13,14,18].includes(i)})),rows.map(r=>[r.reference,positionCode(r.position_id),zoneForPosition(r.position_id)?.name??"",r.brand,r.booth_name,statuses[r.status],r.contact_name,r.phone,r.email,r.website??"",r.category,r.description,r.payment?.base??null,r.payment?.discount??null,r.payment?.amount??null,r.payment?.discount_code??"",r.payment?.memo??"",r.payment?.receipt_path?(en?"Yes":"Có"):(en?"No":"Không"),r.image_paths.length,exportDate(r.created_at),exportDate(r.updated_at),exportDate(r.reviewed_at),r.review_note??""]),JSON.stringify(filters));return excelResponse(bytes,"booths");
  }catch(error){return responseError(error);}
}
