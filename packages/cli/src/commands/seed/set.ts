import { stdin } from 'node:process'
import { defineCommand } from 'citty'
import { consola } from 'consola'
import { seedEnv } from '../../env'
import { confirmOrAbort } from '../../prompts'
import {
  enforceDependencies,
  promptSteps,
  resolveSteps,
  runSeedSet,
} from '../../seed/runner'
import type { SeedSet } from '../../seed/types'

export function defineSeedSetCommand(set: SeedSet) {
  return defineCommand({
    meta: {
      name: set.name,
      description: set.description,
    },
    args: {
      'api-url': {
        type: 'string',
        description: 'Base URL of the running API (defaults to API_PUBLIC_URL)',
      },
      only: {
        type: 'string',
        description: `Comma-separated steps to apply (${set.steps
          .map((step) => step.name)
          .join(', ')}); dependencies are included automatically`,
      },
      yes: {
        type: 'boolean',
        description: 'Skip prompts and apply every step',
        default: false,
      },
    },
    async run({ args }) {
      const env = seedEnv()
      if (env.NODE_ENV === 'production') {
        consola.error(
          `Refusing to apply seed "${set.name}" with NODE_ENV=production.`,
        )
        process.exit(1)
      }

      const apiUrl = args['api-url'] ?? env.API_PUBLIC_URL
      const steps = args.only
        ? resolveSteps(
            set,
            args.only
              .split(',')
              .map((name) => name.trim())
              .filter(Boolean),
          )
        : args.yes || !stdin.isTTY
          ? set.steps
          : enforceDependencies(set, await promptSteps(set))

      await confirmOrAbort(
        `Apply seed "${set.name}" (${steps
          .map((step) => step.name)
          .join(', ')}) through the API at ${apiUrl}?`,
        args.yes,
      )
      await runSeedSet(set, steps, env, apiUrl)
    },
  })
}
