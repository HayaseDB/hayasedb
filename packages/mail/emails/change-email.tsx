import { CtaButton } from './_components/cta-button'
import { FallbackLink } from './_components/fallback-link'
import { Layout } from './_components/layout'
import { Heading, Muted, Paragraph } from './_components/typography'

export const subject = 'Confirm your new HayaseDB email'

export interface ChangeEmailProps {
  url: string
}

export default function ChangeEmail({
  url = 'https://example.com/auth/change-email?token=preview',
}: ChangeEmailProps) {
  return (
    <Layout preview="Confirm the new email address for your HayaseDB account.">
      <Heading>Confirm your new email</Heading>
      <Paragraph>
        You asked to change the email address on your HayaseDB account. Confirm
        this new address to complete the change. This link expires in 1 hour.
      </Paragraph>
      <CtaButton href={url}>Confirm new email</CtaButton>
      <FallbackLink url={url} />
      <Muted>
        If you didn&apos;t request this change, you can safely ignore this email
        and your address will stay the same.
      </Muted>
    </Layout>
  )
}
