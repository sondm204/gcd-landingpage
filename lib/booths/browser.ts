// A hint only: host applications can replace or hide their user-agent.
export function isEmbeddedBrowser(userAgent: string): boolean {
  if (/Zalo|FBAN|FBAV|Instagram|MicroMessenger|Line\/|\bwv\b|WebView/i.test(userAgent)) return true;
  if (/Android/i.test(userAgent) && /Version\/4\.0.*Chrome\//i.test(userAgent)) return true;
  return /iPhone|iPad|iPod/i.test(userAgent) && /AppleWebKit/i.test(userAgent)
    && !/Safari\/|CriOS\/|FxiOS\/|EdgiOS\/|OPiOS\//i.test(userAgent);
}
