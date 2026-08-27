import { stdin, stdout } from 'node:process'
import * as p from '@clack/prompts'

export const EXIT_USAGE = 2
export const EXIT_FAILURE = 1
export const EXIT_CANCELLED = 130

export class CliError extends Error {
  readonly exitCode: number

  constructor(message: string, exitCode: number = EXIT_FAILURE) {
    super(message)
    this.name = 'CliError'
    this.exitCode = exitCode
  }
}

export function prepareInput(): void {
  if (stdin.isTTY) stdin.setEncoding('utf8')
}

export function isInteractive(): boolean {
  return Boolean(stdin.isTTY && stdout.isTTY)
}

export const CANCEL = Symbol('hayasedb:cancel')

export function isCancelled(value: unknown): value is symbol {
  return value === CANCEL || p.isCancel(value)
}

export function unwrap<T>(value: T | symbol): T {
  if (isCancelled(value)) {
    p.cancel('Aborted.')
    process.exit(EXIT_CANCELLED)
  }
  return value
}

export async function ask<T>(prompt: () => Promise<T | symbol>): Promise<T> {
  return unwrap(await prompt())
}

export async function confirmOrAbort(
  message: string,
  skip = false,
): Promise<void> {
  if (skip || !isInteractive()) return
  const confirmed = await ask(() => p.confirm({ message, initialValue: true }))
  if (!confirmed) {
    p.cancel('Aborted.')
    process.exit(EXIT_FAILURE)
  }
}

export const intro = p.intro
export const outro = p.outro
export const log = p.log
export const note = p.note
export const spinner = p.spinner
export const cancel = p.cancel
