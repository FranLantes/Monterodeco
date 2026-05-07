export function MonterodecoLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-label="Monterodeco"
      className="text-primary"
    >
      {/* Simple textile/wave mark — stylized M with curtain fold */}
      <rect x="2" y="2" width="28" height="28" rx="4" stroke="currentColor" strokeWidth="1.5" />
      {/* Curtain rods at top */}
      <line x1="6" y1="8" x2="26" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Left panel */}
      <path d="M6 8 C6 14 10 16 8 26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Right panel */}
      <path d="M26 8 C26 14 22 16 24 26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Center fold */}
      <path d="M16 8 C16 13 14 15 16 26" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" strokeDasharray="2 2" />
    </svg>
  );
}
