export interface MediaResponse {
  id: string
  bucket: string
  key: string
  originalName: string
  mimeType: string
  size: number
  etag: string | null
  url: string | null
}
