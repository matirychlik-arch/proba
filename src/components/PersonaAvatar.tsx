import { getPersonaColor, getPersonaTextColor } from '@/lib/persona-colors'

export default function PersonaAvatar({
  name,
  index,
  size = 36,
}: {
  name: string
  index: number
  size?: number
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: getPersonaColor(index),
        color: getPersonaTextColor(index),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.39,
        fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
        flexShrink: 0,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}
