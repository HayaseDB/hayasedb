export function describeDevice(userAgent?: string | null): string {
  if (!userAgent) return 'Unknown device'
  const browser = /Edg/.test(userAgent)
    ? 'Edge'
    : /OPR|Opera/.test(userAgent)
      ? 'Opera'
      : /Chrome/.test(userAgent)
        ? 'Chrome'
        : /Firefox/.test(userAgent)
          ? 'Firefox'
          : /Safari/.test(userAgent)
            ? 'Safari'
            : 'Browser'
  const os = /Windows/.test(userAgent)
    ? 'Windows'
    : /iPhone|iPad|iPod|iOS/.test(userAgent)
      ? 'iOS'
      : /Mac OS|Macintosh/.test(userAgent)
        ? 'macOS'
        : /Android/.test(userAgent)
          ? 'Android'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : 'Unknown OS'
  return `${browser} on ${os}`
}
