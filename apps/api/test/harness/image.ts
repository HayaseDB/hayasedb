import sharp from 'sharp'

export const pngBuffer = (
  width: number,
  height: number,
  background = '#ff8800',
): Promise<Buffer> =>
  sharp({ create: { width, height, channels: 3, background } })
    .png()
    .toBuffer()

export async function pngFile(
  width: number,
  height: number,
  background = '#ff8800',
  name = 'in.png',
): Promise<File> {
  return new File([await pngBuffer(width, height, background)], name, {
    type: 'image/png',
  })
}

export function textFile(name = 'note.txt'): File {
  return new File(['not an image'], name, { type: 'text/plain' })
}

export function fakePng(name = 'fake.png'): File {
  return new File(['definitely not png bytes'], name, { type: 'image/png' })
}
