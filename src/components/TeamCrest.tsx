import Image from "next/image";

export function TeamCrest({
  name,
  abbreviation,
  crestUrl,
  size = 42,
}: {
  name: string;
  abbreviation: string;
  crestUrl: string | null;
  size?: number;
}) {
  if (!crestUrl) {
    return <span className="crest-fallback" style={{ width: size, height: size }}>{abbreviation.slice(0, 3)}</span>;
  }
  return (
    <span className="team-crest" style={{ width: size, height: size }}>
      <Image src={crestUrl} alt={`${name} crest`} width={size} height={size} sizes={`${size}px`} />
    </span>
  );
}
