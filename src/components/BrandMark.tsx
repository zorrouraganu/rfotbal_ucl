import Image from "next/image";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand-mark" aria-label="UCL r/fotbal">
      <Image src="/icon.png" alt="" width={56} height={56} className="brand-orbit" priority />
      {!compact && (
        <span>
          <strong>UCL r/fotbal</strong>
        </span>
      )}
    </div>
  );
}
