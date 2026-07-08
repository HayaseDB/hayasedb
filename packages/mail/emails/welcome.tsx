import { Text } from '@react-email/components'
import { Layout } from './components/layout'
import { heading, paragraph } from './components/styles'

export interface WelcomeProps {
  name?: string
}

export default function Welcome({ name = 'there' }: WelcomeProps) {
  return (
    <Layout preview="Welcome to Hayasedb">
      <Text style={heading}>Welcome, {name}!</Text>
      <Text style={{ ...paragraph, margin: 0 }}>
        Your email is verified and your account is ready. We&apos;re glad to
        have you on board — dive in and start exploring Hayasedb.
      </Text>
    </Layout>
  )
}
