import { stdin, stdout } from 'node:process'
import { consola } from 'consola'

export function promptSecret(message: string): Promise<string> {
  if (!stdin.isTTY) {
    consola.error(
      'No interactive terminal available. Pass the value via a flag instead.',
    )
    process.exit(2)
  }

  stdout.write(`${message}: `)

  return new Promise((resolve) => {
    let value = ''
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding('utf8')

    const done = () => {
      stdin.setRawMode(false)
      stdin.pause()
      stdin.removeListener('data', onData)
      stdout.write('\n')
    }

    const onData = (char: string) => {
      switch (char) {
        case '\r':
        case '\n':
          done()
          resolve(value)
          break
        case '\u0003':
          done()
          process.exit(130)
          break
        case '\u007F':
        case '\b':
          if (value.length > 0) {
            value = value.slice(0, -1)
            stdout.write('\b \b')
          }
          break
        default:
          value += char
          stdout.write('*'.repeat(char.length))
      }
    }

    stdin.on('data', onData)
  })
}

export async function promptNewPassword(): Promise<string> {
  const password = await promptSecret('Password')
  const confirmation = await promptSecret('Confirm password')
  if (password !== confirmation) {
    consola.error('Passwords do not match.')
    process.exit(2)
  }
  if (password.length === 0) {
    consola.error('Password must not be empty.')
    process.exit(2)
  }
  return password
}

export async function confirmOrAbort(
  message: string,
  skip: boolean,
): Promise<void> {
  if (skip || !stdin.isTTY || !stdout.isTTY) return
  const confirmed = await consola.prompt(message, {
    type: 'confirm',
    cancel: 'null',
  })
  if (confirmed !== true) {
    consola.info('Aborted.')
    process.exit(1)
  }
}
