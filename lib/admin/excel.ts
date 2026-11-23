import ExcelJS from "exceljs";
export type ExportColumn={header:string;width?:number;numeric?:boolean};
export async function excelFile(sheetName:string,columns:ExportColumn[],rows:(string|number|null)[][],filters:string) {
  const book=new ExcelJS.Workbook();book.creator="Global Citizens Day 2026";book.created=new Date();
  const sheet=book.addWorksheet(sheetName,{views:[{state:"frozen",ySplit:1}]});
  sheet.columns=columns.map(c=>({header:c.header,width:c.width??24,style:{numFmt:c.numeric?"#,##0":"@",alignment:{vertical:"top",wrapText:true}}}));
  for(const values of rows)sheet.addRow(values);
  sheet.autoFilter={from:{row:1,column:1},to:{row:Math.max(1,sheet.rowCount),column:columns.length}};
  const header=sheet.getRow(1);header.height=32;header.font={bold:true,color:{argb:"FFFFFFFF"}};header.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF123B6B"}};
  const info=book.addWorksheet("Info");info.columns=[{header:"Global Citizens Day 2026",width:28},{header:"Export",width:90}];info.addRows([["Filters",filters],["Records",rows.length],["Exported at (UTC)",new Date().toISOString()],["Timezone for dates","Asia/Ho_Chi_Minh"]]);info.getRow(1).font={bold:true};
  return new Uint8Array(await book.xlsx.writeBuffer());
}
export function excelResponse(bytes:Uint8Array,kind:string) {
  return new Response(bytes as BodyInit,{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","Content-Disposition":`attachment; filename="GCD2026-${kind}-${new Date().toISOString().slice(0,10)}.xlsx"`,"Cache-Control":"no-store, private","X-Content-Type-Options":"nosniff"}});
}
export const exportDate=(value:string|null|undefined,birth=false)=>!value?"":birth?value.slice(0,10).split("-").reverse().join("/"):new Date(value).toLocaleString("en-GB",{timeZone:"Asia/Ho_Chi_Minh",hour12:false});
