"use client";

export function LocalDateTime({ value }: { value: string }) {
  const date = new Date(value);
  return (
    <time dateTime={value} suppressHydrationWarning>
      {new Intl.DateTimeFormat("ro-RO", { dateStyle: "medium", timeStyle: "short" }).format(date)}
    </time>
  );
}
