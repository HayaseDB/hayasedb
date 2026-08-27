import { stdin, stdout } from 'node:process'
import { emitKeypressEvents } from 'node:readline'
import {
  S_BAR,
  S_BAR_END,
  S_CHECKBOX_ACTIVE,
  S_CHECKBOX_INACTIVE,
  S_CHECKBOX_SELECTED,
  S_STEP_SUBMIT,
} from '@clack/prompts'
import { colors } from 'consola/utils'
import { CANCEL } from './tui'

export interface TreeNode {
  value: string
  label: string
  hint?: string
  children?: TreeNode[]
}

export interface TreePromptOptions {
  message: string
  nodes: TreeNode[]
  initial?: string[]
  requires?: Record<string, string[]>
}

interface FlatNode {
  value: string
  label: string
  hint?: string
  branch: string
}

export function flattenTree(nodes: TreeNode[]): FlatNode[] {
  const flat: FlatNode[] = []
  const walk = (items: TreeNode[], prefix: string, depth: number): void => {
    for (const [index, node] of items.entries()) {
      const last = index === items.length - 1
      const branch = depth === 0 ? '' : `${prefix}${last ? '└─ ' : '├─ '}`
      flat.push({
        value: node.value,
        label: node.label,
        hint: node.hint,
        branch,
      })
      if (node.children?.length) {
        const childPrefix =
          depth === 0 ? '' : `${prefix}${last ? '   ' : '│  '}`
        walk(node.children, childPrefix, depth + 1)
      }
    }
  }
  walk(nodes, '', 0)
  return flat
}

export function buildRequirements(
  nodes: TreeNode[],
  extra: Record<string, string[]> = {},
): Map<string, string[]> {
  const requirements = new Map<string, string[]>()
  const walk = (items: TreeNode[], parent: string | null): void => {
    for (const node of items) {
      const direct = new Set(extra[node.value] ?? [])
      if (parent) direct.add(parent)
      requirements.set(node.value, [...direct])
      if (node.children?.length) walk(node.children, node.value)
    }
  }
  walk(nodes, null)
  return requirements
}

export function selectValue(
  selected: ReadonlySet<string>,
  value: string,
  requirements: Map<string, string[]>,
): Set<string> {
  const next = new Set(selected)
  const include = (name: string): void => {
    if (next.has(name)) return
    next.add(name)
    for (const requirement of requirements.get(name) ?? []) include(requirement)
  }
  include(value)
  return next
}

export function deselectValue(
  selected: ReadonlySet<string>,
  value: string,
  requirements: Map<string, string[]>,
): Set<string> {
  const next = new Set(selected)
  const dependentsOf = (name: string): string[] =>
    [...requirements.entries()]
      .filter(([, required]) => required.includes(name))
      .map(([dependent]) => dependent)
  const exclude = (name: string): void => {
    if (!next.has(name)) return
    next.delete(name)
    for (const dependent of dependentsOf(name)) exclude(dependent)
  }
  exclude(value)
  return next
}

export function toggleValue(
  selected: ReadonlySet<string>,
  value: string,
  requirements: Map<string, string[]>,
): Set<string> {
  return selected.has(value)
    ? deselectValue(selected, value, requirements)
    : selectValue(selected, value, requirements)
}

function renderLines(
  options: TreePromptOptions,
  flat: FlatNode[],
  selected: ReadonlySet<string>,
  cursor: number,
): string[] {
  const lines = [
    `${colors.green(S_STEP_SUBMIT)}  ${colors.bold(options.message)}`,
  ]
  for (const [index, node] of flat.entries()) {
    const active = index === cursor
    const checked = selected.has(node.value)
    const checkbox = checked
      ? active
        ? colors.green(S_CHECKBOX_ACTIVE)
        : colors.green(S_CHECKBOX_SELECTED)
      : colors.dim(S_CHECKBOX_INACTIVE)
    const label = active
      ? colors.cyan(node.label)
      : checked
        ? node.label
        : colors.dim(node.label)
    const hint = node.hint ? ` ${colors.dim(node.hint)}` : ''
    lines.push(
      `${colors.gray(S_BAR)}  ${colors.dim(node.branch)}${checkbox} ${label}${hint}`,
    )
  }
  lines.push(
    `${colors.gray(S_BAR_END)}  ${colors.dim(
      '↑/↓ move · space toggle · a all · enter confirm',
    )}`,
  )
  return lines
}

export async function promptTree(
  options: TreePromptOptions,
): Promise<string[] | symbol> {
  const flat = flattenTree(options.nodes)
  const requirements = buildRequirements(options.nodes, options.requires)
  const order = flat.map((node) => node.value)

  if (!stdin.isTTY || !stdout.isTTY) {
    return options.initial ?? order
  }

  let selected = new Set(options.initial ?? order)
  let cursor = 0
  let rendered = 0

  const draw = (): void => {
    if (rendered > 0) {
      stdout.write(`\u001B[${rendered}A\u001B[0J`)
    }
    const lines = renderLines(options, flat, selected, cursor)
    stdout.write(`${lines.join('\n')}\n`)
    rendered = lines.length
  }

  emitKeypressEvents(stdin)
  const wasRaw = stdin.isRaw
  stdin.setRawMode(true)
  stdin.resume()
  stdout.write('\u001B[?25l')

  const result = await new Promise<string[] | symbol>((resolve) => {
    const finish = (value: string[] | symbol): void => {
      stdin.off('keypress', onKeypress)
      stdin.setRawMode(wasRaw)
      stdin.pause()
      stdout.write('\u001B[?25h')
      resolve(value)
    }
    const onKeypress = (
      _input: string | undefined,
      key: { name?: string; ctrl?: boolean } | undefined,
    ): void => {
      if (!key) return
      if ((key.ctrl && key.name === 'c') || key.name === 'escape') {
        finish(CANCEL)
        return
      }
      switch (key.name) {
        case 'up':
        case 'k':
          cursor = (cursor - 1 + flat.length) % flat.length
          break
        case 'down':
        case 'j':
          cursor = (cursor + 1) % flat.length
          break
        case 'space': {
          const node = flat[cursor]
          if (node) selected = toggleValue(selected, node.value, requirements)
          break
        }
        case 'a':
          selected = selected.size === order.length ? new Set() : new Set(order)
          break
        case 'return':
        case 'enter':
          finish(order.filter((value) => selected.has(value)))
          return
        default:
          return
      }
      draw()
    }
    stdin.on('keypress', onKeypress)
    draw()
  })

  return result
}
