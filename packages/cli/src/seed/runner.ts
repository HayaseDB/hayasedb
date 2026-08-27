import type { SeedEnv } from '../env'
import {
  assertApiReachable,
  createApiClient,
  signIn,
  type ApiClient,
  type ApiClientOptions,
} from './api-client'
import { promptTree, type TreeNode } from '../tree-prompt'
import { loadAsset } from './assets'
import { assertUserExists, ensureUsers } from './ensure'
import { CliError, EXIT_USAGE, log, outro, spinner, unwrap } from '../tui'
import type { SeedContext, SeedSet, SeedStep, SeedUser } from './types'

export function resolveSteps(set: SeedSet, names: string[]): SeedStep[] {
  const byName = new Map(set.steps.map((step) => [step.name, step]))
  for (const name of names) {
    if (!byName.has(name)) {
      throw new CliError(
        `Unknown step "${name}" for seed "${set.name}". Available steps: ${set.steps
          .map((step) => step.name)
          .join(', ')}.`,
        EXIT_USAGE,
      )
    }
  }

  const selected = new Set<string>()
  const include = (name: string): void => {
    if (selected.has(name)) return
    const step = byName.get(name)
    if (!step) return
    for (const dependency of step.dependsOn ?? []) include(dependency)
    selected.add(name)
  }
  for (const name of names) include(name)

  return set.steps.filter((step) => selected.has(step.name))
}

export function buildStepTree(set: SeedSet): {
  nodes: TreeNode[]
  requires: Record<string, string[]>
} {
  const nodes: TreeNode[] = []
  const byName = new Map<string, TreeNode>()
  const requires: Record<string, string[]> = {}
  for (const step of set.steps) {
    const node: TreeNode = {
      value: step.name,
      label: step.name,
      hint: step.description,
      children: [],
    }
    byName.set(step.name, node)
    const [parent, ...rest] = step.dependsOn ?? []
    const parentNode = parent ? byName.get(parent) : undefined
    if (parentNode) {
      parentNode.children?.push(node)
      if (rest.length > 0) requires[step.name] = rest
    } else {
      nodes.push(node)
      const extras = step.dependsOn ?? []
      if (extras.length > 0) requires[step.name] = extras
    }
  }
  return { nodes, requires }
}

export async function promptSteps(set: SeedSet): Promise<string[]> {
  const { nodes, requires } = buildStepTree(set)
  const selection = unwrap(
    await promptTree({
      message: `Which parts of the "${set.name}" seed should be applied?`,
      nodes,
      requires,
    }),
  )
  if (selection.length === 0) throw new CliError('Nothing selected, aborting.')
  return selection
}

export function enforceDependencies(set: SeedSet, names: string[]): SeedStep[] {
  const selected = new Set(names)
  const steps: SeedStep[] = []
  for (const step of set.steps) {
    if (!selected.has(step.name)) continue
    const missing = (step.dependsOn ?? []).filter((name) => !selected.has(name))
    if (missing.length > 0) {
      selected.delete(step.name)
      log.warn(
        `Skipping step "${step.name}" because it requires ${missing.join(', ')}.`,
      )
      continue
    }
    steps.push(step)
  }
  if (steps.length === 0)
    throw new CliError('No applicable steps left, aborting.')
  return steps
}

export async function runSeedSet(
  set: SeedSet,
  steps: SeedStep[],
  env: SeedEnv,
  apiUrl: string,
): Promise<void> {
  const options: ApiClientOptions = {
    apiUrl,
    internalToken: env.INTERNAL_API_TOKEN[0],
  }

  const userStepName = set.steps.find((step) => step.provisionsUsers)?.name
  const provisionUsers = steps.some((step) => step.provisionsUsers)

  let reachablePromise: Promise<void> | undefined
  const clients = new Map<string, Promise<ApiClient>>()
  const clientFor = (user: SeedUser): Promise<ApiClient> => {
    let clientPromise = clients.get(user.email)
    if (!clientPromise) {
      clientPromise = (async () => {
        reachablePromise ??= assertApiReachable(options)
        await reachablePromise
        if (provisionUsers) {
          await ensureUsers(env, [user], { silentExisting: true })
        } else {
          await assertUserExists(env, user, userStepName)
        }
        const cookie = await signIn(options, user.email, user.password)
        return createApiClient({ ...options, cookie })
      })()
      clients.set(user.email, clientPromise)
    }
    return clientPromise
  }

  const context: SeedContext = {
    env,
    apiUrl,
    client: () => clientFor(set.admin),
    clientFor,
    loadAsset: (name) => loadAsset(set.assetsUrl, name),
  }

  for (const step of steps) {
    const progress = spinner()
    progress.start(`${step.name}: ${step.description}`)
    try {
      await step.run(context)
    } catch (error) {
      progress.error(`${step.name} failed.`)
      throw error
    }
    progress.stop(`${step.name}: ${step.description}`)
  }
  outro(`Seed "${set.name}" complete.`)
}
