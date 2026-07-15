import { Button } from '@react-email/components'
import * as React from 'react'

interface CtaButtonProps {
  href: string
  children: React.ReactNode
}

export function CtaButton({ href, children }: CtaButtonProps) {
  return (
    <Button href={href} style={button}>
      {children}
    </Button>
  )
}

const button: React.CSSProperties = {
  backgroundColor: '#18181b',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '15px',
  fontWeight: 600,
  padding: '12px 24px',
  textDecoration: 'none',
}
