import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface LayoutProps {
  preview: string
  children: React.ReactNode
}

export function Layout({ preview, children }: LayoutProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section>
            <Text style={brand}>Hayasedb</Text>
          </Section>
          {children}
          <Hr style={hr} />
          <Text style={footer}>
            Hayasedb · This is an automated message, please do not reply.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const body: React.CSSProperties = {
  backgroundColor: '#f4f4f5',
  fontFamily:
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
  margin: 0,
  padding: '24px 0',
}

const container: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e4e4e7',
  borderRadius: '12px',
  margin: '0 auto',
  maxWidth: '480px',
  padding: '32px',
}

const brand: React.CSSProperties = {
  color: '#18181b',
  fontSize: '20px',
  fontWeight: 700,
  margin: '0 0 8px',
}

const hr: React.CSSProperties = {
  borderColor: '#e4e4e7',
  margin: '28px 0 16px',
}

const footer: React.CSSProperties = {
  color: '#a1a1aa',
  fontSize: '12px',
  lineHeight: '18px',
  margin: 0,
}
