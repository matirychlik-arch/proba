export default function Label({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <span
      style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--text-placeholder)',
        display: 'block',
        ...style,
      }}
    >
      {children}
    </span>
  )
}
