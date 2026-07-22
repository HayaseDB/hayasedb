import { CtaButton } from './_components/cta-button'
import { Layout } from './_components/layout'
import { Heading, Paragraph } from './_components/typography'

export const subject = 'Welcome to HayaseDB'

export interface WelcomeProps {
  name?: string
  url?: string
}

export default function Welcome({
  name = 'there',
  url = 'https://example.com',
}: WelcomeProps) {
  return (
    <Layout preview="Your account is verified and ready to go.">
      <Heading>Welcome, {name}!</Heading>
      <Paragraph style={url ? undefined : { margin: 0 }}>
        Your email is verified and your HayaseDB account is ready. Jump in
        whenever you like: everything is set up and waiting for you.
      </Paragraph>
      {url ? (
        <CtaButton href={url} style={{ margin: 0 }}>
          Open HayaseDB
        </CtaButton>
      ) : null}
    </Layout>
  )
}
