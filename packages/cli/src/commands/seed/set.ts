import { defineCommand } from 'citty'
import { seedEnv } from '../../env'
import { CliError, confirmOrAbort, intro, isInteractive } from '../../tui'
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
        throw new CliError(
          `Refusing to apply seed "${set.name}" with NODE_ENV=production.`,
        )
      }

      if (isInteractive()) intro(`Seed "${set.name}"`)

      const apiUrl = args['api-url'] ?? env.API_PUBLIC_URL
      const steps = args.only
        ? resolveSteps(
            set,
            args.only
              .split(',')
              .map((name) => name.trim())
              .filter(Boolean),
          )
        : args.yes || !isInteractive()
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
