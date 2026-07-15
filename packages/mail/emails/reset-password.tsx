import { Section, Text } from '@react-email/components'
import { CtaButton } from './components/cta-button'
import { Layout } from './components/layout'
import { buttonWrap, heading, muted, paragraph } from './components/styles'

export interface ResetPasswordProps {
  url: string
}

export default function ResetPassword({
  url = 'https://example.com/reset?token=preview',
}: ResetPasswordProps) {
  return (
    <Layout preview="Reset your Hayasedb password">
      <Text style={heading}>Reset your password</Text>
      <Text style={paragraph}>
        We received a request to reset your password. Click the button below to
        choose a new one. This link expires shortly.
      </Text>
      <Section style={buttonWrap}>
        <CtaButton href={url}>Reset password</CtaButton>
      </Section>
      <Text style={muted}>
        If you didn&apos;t request this, you can safely ignore this email — your
        password won&apos;t change.
      </Text>
    </Layout>
  )
}
