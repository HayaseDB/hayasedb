import { Section, Text } from '@react-email/components'
import { CtaButton } from './components/cta-button'
import { Layout } from './components/layout'
import { buttonWrap, heading, muted, paragraph } from './components/styles'

export interface VerifyEmailProps {
  url: string
}

export default function VerifyEmail({
  url = 'https://example.com/verify?token=preview',
}: VerifyEmailProps) {
  return (
    <Layout preview="Verify your Hayasedb email address">
      <Text style={heading}>Verify your email</Text>
      <Text style={paragraph}>
        Thanks for signing up. Confirm this is your email address to activate
        your account.
      </Text>
      <Section style={buttonWrap}>
        <CtaButton href={url}>Verify email</CtaButton>
      </Section>
      <Text style={muted}>
        If you didn&apos;t create an account, you can safely ignore this email.
      </Text>
    </Layout>
  )
}
