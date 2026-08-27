import { getDynamicPathParams } from '@orpc/openapi'

export function toNestPath(path: string): string {
  const params = getDynamicPathParams(path as `/${string}`)
  if (!params?.length) return path

  let result = path
  for (let i = params.length - 1; i >= 0; i--) {
    const param = params[i]!
    const pattern = param.allowsSlash ? '*' : `:${param.parameterName}`
    result =
      result.slice(0, param.startIndex) +
      pattern +
      result.slice(param.startIndex + param.segment.length)
  }
  return result
}
