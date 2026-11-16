"use client";
import Image from "next/image";
import { useState } from "react";

export default function BoothLogo({ src, name }: { src?: string | null; name: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  return <div className="booth-confirmed-logo">{src && failed !== src ? <Image src={src} alt={`Logo ${name}`} fill sizes="120px" unoptimized onError={() => setFailed(src)} /> : <span aria-label={`Gian hàng ${name}`}>{name.trim().slice(0, 2).toLocaleUpperCase("vi-VN")}</span>}</div>;
}
