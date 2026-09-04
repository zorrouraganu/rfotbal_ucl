import Image from "next/image";

export function TeamCrest({
  name,
  abbreviation,
  crestUrl,
  size = 42,
  eager = false,
}: {
  name: string;
  abbreviation: string;
  crestUrl: string | null;
  size?: number;
  eager?: boolean;
}) {
  if (!crestUrl) {
    return <span className="crest-fallback" style={{ width: size, height: size }}>{abbreviation.slice(0, 3)}</span>;
  }
  return (
    <span className="team-crest" style={{ width: size, height: size }}>
      <Image
        src={crestUrl}
        alt={`${name} crest`}
        width={size}
        height={size}
        sizes={`${size}px`}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
      />
    </span>
  );
}
