import { Text } from '@react-email/components'
import * as React from 'react'
import { color, font, space } from './theme'

interface TypographyProps {
  children: React.ReactNode
  style?: React.CSSProperties
}

export function Heading({ children, style }: TypographyProps) {
  return <Text style={{ ...heading, ...style }}>{children}</Text>
}

export function Paragraph({ children, style }: TypographyProps) {
  return <Text style={{ ...paragraph, ...style }}>{children}</Text>
}

export function Muted({ children, style }: TypographyProps) {
  return <Text style={{ ...muted, ...style }}>{children}</Text>
}

const heading: React.CSSProperties = {
  color: color.heading,
  fontSize: font.heading.size,
  fontWeight: font.heading.weight,
  lineHeight: font.heading.lineHeight,
  margin: `0 0 ${space.sm}`,
}

const paragraph: React.CSSProperties = {
  color: color.body,
  fontSize: font.body.size,
  fontWeight: font.body.weight,
  lineHeight: font.body.lineHeight,
  margin: `0 0 ${space.lg}`,
}

const muted: React.CSSProperties = {
  color: color.muted,
  fontSize: font.small.size,
  fontWeight: font.small.weight,
  lineHeight: font.small.lineHeight,
  margin: 0,
}
