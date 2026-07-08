import { Section, Text } from '@react-email/components'
import { CtaButton } from './components/cta-button'
import { Layout } from './components/layout'
import { buttonWrap, heading, muted, paragraph } from './components/styles'

export interface ChangeEmailProps {
  url: string
}

export default function ChangeEmail({
  url = 'https://example.com/change-email?token=preview',
}: ChangeEmailProps) {
  return (
    <Layout preview="Confirm your new Hayasedb email">
      <Text style={heading}>Confirm your new email</Text>
      <Text style={paragraph}>
        You requested to change the email address on your account. Confirm this
        new address to complete the change.
      </Text>
      <Section style={buttonWrap}>
        <CtaButton href={url}>Confirm new email</CtaButton>
      </Section>
      <Text style={muted}>
        If you didn&apos;t request this change, please secure your account and
        ignore this email.
      </Text>
    </Layout>
  )
}
