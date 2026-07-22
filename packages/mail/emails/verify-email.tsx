import { CtaButton } from './_components/cta-button'
import { FallbackLink } from './_components/fallback-link'
import { Layout } from './_components/layout'
import { Heading, Muted, Paragraph } from './_components/typography'

export const subject = 'Verify your HayaseDB email'

export interface VerifyEmailProps {
  url: string
}

export default function VerifyEmail({
  url = 'https://example.com/auth/verify-email?token=preview',
}: VerifyEmailProps) {
  return (
    <Layout preview="Confirm your email address to activate your HayaseDB account.">
      <Heading>Verify your email</Heading>
      <Paragraph>
        Thanks for signing up for HayaseDB. Confirm this is your email address
        to activate your account. This link expires in 1 hour.
      </Paragraph>
      <CtaButton href={url}>Verify email</CtaButton>
      <FallbackLink url={url} />
      <Muted>
        If you didn&apos;t create an account, you can safely ignore this email.
      </Muted>
    </Layout>
  )
}
