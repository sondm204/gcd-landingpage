import { connection } from "next/server";
import { z } from "zod";
import { gameIds } from "@/lib/games/types";
import { requireAdmin, serviceClient, json, responseError, BoothError, checkOrigin, readJson } from "@/lib/booths/server";
export async function GET() {
  await connection();
  try { await requireAdmin(); const {data,error}=await serviceClient().from("game_availability").select("game,is_open"); if(error)throw new BoothError(503,"Chưa tải được trạng thái game."); return json({games:gameIds.flatMap(game=>(data??[]).filter(item=>item.game===game))}); } catch(error){return responseError(error);}
}
export async function PATCH(request:Request) {
  try { checkOrigin(request); await requireAdmin(); const input=z.object({game:z.enum(gameIds),is_open:z.boolean()}).strict().safeParse(await readJson(request)); if(!input.success)throw new BoothError(400,"Thông tin không hợp lệ."); const {data,error}=await serviceClient().from("game_availability").update({is_open:input.data.is_open}).eq("game",input.data.game).select("game").maybeSingle(); if(error||!data)throw new BoothError(503,"Chưa cập nhật được trạng thái game."); return json({ok:true}); } catch(error){return responseError(error);}
}
