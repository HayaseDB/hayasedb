export interface CreateMediaInput {
  bucket: string;
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
  etag?: string;
}
