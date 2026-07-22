import { Button, Section } from '@react-email/components'
import * as React from 'react'
import { color, font, radius, space } from './theme'

interface CtaButtonProps {
  href: string
  children: React.ReactNode
  style?: React.CSSProperties
}

export function CtaButton({ href, children, style }: CtaButtonProps) {
  return (
    <Section style={{ ...wrap, ...style }}>
      <Button href={href} style={button}>
        {children}
      </Button>
    </Section>
  )
}

const wrap: React.CSSProperties = {
  margin: `0 0 ${space.lg}`,
}

const button: React.CSSProperties = {
  backgroundColor: color.accent,
  borderRadius: radius.button,
  color: color.accentText,
  display: 'inline-block',
  fontSize: font.button.size,
  fontWeight: font.button.weight,
  lineHeight: font.button.lineHeight,
  padding: '12px 24px',
  textDecoration: 'none',
}
