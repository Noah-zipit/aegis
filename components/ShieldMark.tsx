/**
 * ShieldMark — the Aegis brand glyph.
 * Pure geometric shield, no letterforms. Lucide-style: 24px grid, stroke-based,
 * round caps/joins. Rendered in currentColor so parents control the color.
 */
export function ShieldMark({
  size = 24,
  className,
  strokeWidth = 1.8,
}: {
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* outer shield */}
      <path d="M12 2.5 19.5 5.7v5.1c0 5.2-3.2 8.9-7.5 10.7-4.3-1.8-7.5-5.5-7.5-10.7V5.7Z" />
      {/* inner shield line — the aegis within */}
      <path d="M12 6.2l4.6 2.1v2.9c0 3.4-2 5.9-4.6 7.1-2.6-1.2-4.6-3.7-4.6-7.1V8.3Z" />
    </svg>
  );
}
