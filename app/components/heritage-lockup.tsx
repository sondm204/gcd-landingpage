/** Display the supplied wordmark at its original proportions without its wide canvas. */
export default function HeritageLockup({ className = "" }: { className?: string }) {
  return <svg className={`heritage-lockup ${className}`} viewBox="270 225 1150 215" role="img" aria-label="The Heritage Odyssey">
    <image href="/keyvisual/4.png" width="1672" height="941" />
  </svg>;
}
