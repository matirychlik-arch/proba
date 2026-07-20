export default function Logo({ size = 24 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" fill="none" stroke="#4A7FF8" strokeWidth="2" />
        <circle cx="12" cy="12" r="3.5" fill="#4A7FF8" />
      </svg>
      <span
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 17,
          fontWeight: 600,
          color: '#1A1916',
          letterSpacing: '-0.03em',
        }}
      >
        Proba
      </span>
    </div>
  )
}
