"use client";
import { useEffect, useState } from "react";
import { gameNames, type GameId } from "@/lib/games/types";
export default function GameAvailability(){
 const [games,setGames]=useState<{game:GameId;is_open:boolean}[]>([]),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 async function load(){try{const response=await fetch('/api/game/admin/availability',{cache:'no-store'});const data=await response.json();if(!response.ok)throw Error(data.error);setGames(data.games);setError('');}catch(e){setError(e instanceof Error?e.message:'Mất kết nối.');}}
 useEffect(()=>{const timer=setTimeout(()=>void load(),0);return ()=>clearTimeout(timer);},[]);
 async function toggle(game:GameId,is_open:boolean){setBusy(true);try{const response=await fetch('/api/game/admin/availability',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({game,is_open})});const data=await response.json();if(!response.ok)throw Error(data.error);await load();}catch(e){setError(e instanceof Error?e.message:'Mất kết nối.');}finally{setBusy(false);}}
 return <section><h2>Đóng / mở game online</h2><p>Đóng game sẽ ngừng nhận lượt chơi mới. Lượt đang chơi vẫn có thể hoàn tất.</p>{error&&<p role="alert">{error}</p>}{games.map(item=><div key={item.game} style={{display:'flex',justifyContent:'space-between',gap:16,marginBottom:16}}><span>{gameNames[item.game]} · {item.is_open?'Đang mở':'Đang đóng'}</span><button disabled={busy} onClick={()=>void toggle(item.game,!item.is_open)}>{item.is_open?'Đóng game':'Mở game'}</button></div>)}<button disabled={busy} onClick={()=>void load()}>Tải lại trạng thái</button></section>;
}
