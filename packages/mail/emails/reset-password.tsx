import { CtaButton } from './components/cta-button'
import { FallbackLink } from './components/fallback-link'
import { Layout } from './components/layout'
import { Heading, Muted, Paragraph } from './components/typography'

export const subject = 'Reset your HayaseDB password'

export interface ResetPasswordProps {
  url: string
}

export default function ResetPassword({
  url = 'https://example.com/auth/reset-password?token=preview',
}: ResetPasswordProps) {
  return (
    <Layout preview="Choose a new password for your HayaseDB account.">
      <Heading>Reset your password</Heading>
      <Paragraph>
        We received a request to reset the password for your HayaseDB account.
        Click the button below to choose a new one. This link expires in 1 hour.
      </Paragraph>
      <CtaButton href={url}>Reset password</CtaButton>
      <FallbackLink url={url} />
      <Muted>
        If you didn&apos;t request this, you can safely ignore this email. Your
        password won&apos;t change.
      </Muted>
    </Layout>
  )
}
