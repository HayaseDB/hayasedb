import {
  Body,
  Container,
  Font,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'
import { brandName, color, font, radius, space } from './theme'

interface LayoutProps {
  preview: string
  children: React.ReactNode
}

export function Layout({ preview, children }: LayoutProps) {
  return (
    <Html lang="en">
      <Head>
        <Font
          fontFamily="Poppins"
          fallbackFontFamily={['Helvetica', 'Arial', 'sans-serif']}
          webFont={{
            url: 'https://fonts.gstatic.com/s/poppins/v24/pxiEyp8kv8JHgFVrJJfecnFHGPc.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="Poppins"
          fallbackFontFamily={['Helvetica', 'Arial', 'sans-serif']}
          webFont={{
            url: 'https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLEj6Z1xlFd2JQEk.woff2',
            format: 'woff2',
          }}
          fontWeight={600}
          fontStyle="normal"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Header />
          {children}
          <Footer />
        </Container>
      </Body>
    </Html>
  )
}

function Header() {
  return (
    <Section>
      <Text style={wordmark}>{brandName}</Text>
    </Section>
  )
}

function Footer() {
  return (
    <>
      <Hr style={hr} />
      <Text style={footer}>
        {brandName} · This is an automated message, please do not reply.
      </Text>
    </>
  )
}

const body: React.CSSProperties = {
  backgroundColor: color.bg,
  fontFamily: font.family,
  margin: 0,
  padding: '24px 12px',
}

const container: React.CSSProperties = {
  backgroundColor: color.surface,
  border: `1px solid ${color.border}`,
  borderRadius: radius.container,
  margin: '0 auto',
  maxWidth: '480px',
  padding: space.xl,
}

const wordmark: React.CSSProperties = {
  color: color.heading,
  fontSize: '18px',
  fontWeight: 700,
  letterSpacing: '-0.01em',
  margin: `0 0 ${space.lg}`,
}

const hr: React.CSSProperties = {
  borderColor: color.border,
  margin: '28px 0 16px',
}

const footer: React.CSSProperties = {
  color: color.muted,
  fontSize: font.footer.size,
  fontWeight: font.footer.weight,
  lineHeight: font.footer.lineHeight,
  margin: 0,
}
