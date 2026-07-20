export default function Aura({ pulse = false }: { pulse?: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: -30,
        right: -20,
        width: 200,
        height: 150,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      <svg width="200" height="150" viewBox="0 0 200 150" fill="none">
        <ellipse
          className={pulse ? 'aura-pulse-1' : undefined}
          cx="60" cy="100" rx="90" ry="70" fill="#4A7FF8" opacity="0.2"
        />
        <ellipse
          className={pulse ? 'aura-pulse-2' : undefined}
          cx="110" cy="80" rx="80" ry="65" fill="#FF7648" opacity="0.2"
        />
        <ellipse
          className={pulse ? 'aura-pulse-3' : undefined}
          cx="150" cy="105" rx="70" ry="55" fill="#FFC757" opacity="0.25"
        />
      </svg>
    </div>
  )
}
