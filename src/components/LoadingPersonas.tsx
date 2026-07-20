import { PERSONA_COLORS } from '@/lib/persona-colors'

export default function LoadingPersonas() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        padding: '48px 0',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: PERSONA_COLORS[i % 6],
              opacity: 0.3,
              animation: `pulse 1.5s ease-in-out ${i * 0.12}s infinite`,
            }}
          />
        ))}
      </div>
      <p
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          color: '#9A9890',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        Symulacja w toku...
      </p>
    </div>
  )
}
