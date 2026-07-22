import { Link, Text } from '@react-email/components'
import * as React from 'react'
import { color, font, space } from './theme'
import { Muted } from './typography'

interface FallbackLinkProps {
  url: string
}

export function FallbackLink({ url }: FallbackLinkProps) {
  return (
    <>
      <Muted style={{ margin: `0 0 ${space.xs}` }}>
        If the button doesn&apos;t work, copy and paste this link into your
        browser:
      </Muted>
      <Text style={urlWrap}>
        <Link href={url} style={urlLink}>
          {url}
        </Link>
      </Text>
    </>
  )
}

const urlWrap: React.CSSProperties = {
  margin: `0 0 ${space.lg}`,
  wordBreak: 'break-all',
}

const urlLink: React.CSSProperties = {
  color: color.accent,
  fontSize: font.footer.size,
  lineHeight: font.footer.lineHeight,
  textDecoration: 'underline',
}
