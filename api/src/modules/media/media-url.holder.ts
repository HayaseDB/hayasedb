export class MediaUrlHolder {
  private static cdnUrl: string | null = null;

  static setCdnUrl(url: string | null): void {
    this.cdnUrl = url?.replace(/\/+$/, '') ?? null;
  }

  static buildUrl(bucket: string, key: string): string | null {
    return this.cdnUrl ? `${this.cdnUrl}/${bucket}/${key}` : null;
  }
}
