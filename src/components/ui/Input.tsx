'use client'

import { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-input)',
  border: '0.5px solid var(--border-input)',
  borderRadius: 'var(--radius-md)',
  padding: '12px 16px',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 14,
  color: 'var(--text-primary)',
  transition: 'border-color 0.15s',
  outline: 'none',
  width: '100%',
}

export function Input({ style, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{ ...inputStyle, ...style }}
      onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--blue)')}
      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-input)')}
    />
  )
}

export function Textarea({ style, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, ...style }}
      onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--blue)')}
      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-input)')}
    />
  )
}
