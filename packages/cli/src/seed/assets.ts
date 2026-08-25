import { readFile } from 'node:fs/promises'
import { extname } from 'node:path'

const MIME_TYPES: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.avif': 'image/avif',
}

export async function loadAsset(base: URL, name: string): Promise<File> {
  const buffer = await readFile(new URL(name, base))
  const type = MIME_TYPES[extname(name).toLowerCase()]
  if (!type) throw new Error(`Unsupported seed asset type: ${name}`)
  return new File([buffer], name, { type })
}
