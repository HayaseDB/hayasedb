import { Request } from 'express';

import {
  DeviceType,
  RequestMetadata,
} from '../types/request-metadata.interface';

export function parseBrowser(userAgent: string): {
  name: string;
  version?: string;
} {
  const browsers = [
    { name: 'Edge', pattern: /Edg(?:e|A|iOS)?\/([^\s]+)/ },
    { name: 'Opera', pattern: /(?:Opera|OPR)[\s/]([^\s]+)/ },
    { name: 'Chrome', pattern: /Chrome\/([^\s]+)/ },
    { name: 'Safari', pattern: /Version\/([^\s]+).{0,50}?Safari/ },
    { name: 'Firefox', pattern: /Firefox\/([^\s]+)/ },
  ];

  for (const browser of browsers) {
    const match = browser.pattern.exec(userAgent);
    if (match) {
      return {
        name: browser.name,
        version: match[1],
      };
    }
  }

  return { name: 'Unknown' };
}

export function parseOS(userAgent: string): { name: string; version?: string } {
  const macOSMatch =
    /Mac OS X (\d{1,2}[._]\d{1,2}[._]\d{1,2}|\d{1,2}[._]\d{1,2})/.exec(
      userAgent,
    );
  if (macOSMatch) {
    return {
      name: 'macOS',
      version: macOSMatch[1].replaceAll('_', '.'),
    };
  }

  const iosMatch = /OS (\d{1,2}[._]\d{1,2}[._]\d{1,2}|\d{1,2}[._]\d{1,2})/.exec(
    userAgent,
  );
  if (
    iosMatch &&
    (userAgent.includes('iPhone') ||
      userAgent.includes('iPad') ||
      userAgent.includes('iPod'))
  ) {
    return {
      name: 'iOS',
      version: iosMatch[1].replaceAll('_', '.'),
    };
  }

  const androidMatch = /Android (\d{1,2}\.\d{1,2}|\d{1,2})/.exec(userAgent);
  if (androidMatch) {
    return {
      name: 'Android',
      version: androidMatch[1],
    };
  }

  const windowsMatch = /Windows NT (\d+\.\d+)/.exec(userAgent);
  if (windowsMatch) {
    const versionMap: Record<string, string> = {
      '10.0': '10',
      '6.3': '8.1',
      '6.2': '8',
      '6.1': '7',
    };
    const version = windowsMatch[1];
    return {
      name: 'Windows',
      version: versionMap[version] || version,
    };
  }

  if (userAgent.includes('Linux')) {
    return { name: 'Linux' };
  }

  return { name: 'Unknown' };
}

export function parseDeviceType(userAgent: string): DeviceType {
  if (/Mobile|Android|iPhone/i.test(userAgent)) {
    return DeviceType.MOBILE;
  }

  if (/iPad|Tablet/i.test(userAgent)) {
    return DeviceType.TABLET;
  }

  if (/Windows|Macintosh|Linux/i.test(userAgent)) {
    return DeviceType.DESKTOP;
  }

  return DeviceType.UNKNOWN;
}

export function extractClientIP(request: Request): string {
  const forwardedFor = request.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)
      .split(',')
      .map((ip) => ip.trim());
    if (ips[0]) {
      return ips[0];
    }
  }

  const realIp = request.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  const cfIp = request.headers['cf-connecting-ip'];
  if (cfIp) {
    return Array.isArray(cfIp) ? cfIp[0] : cfIp;
  }

  return request.ip ?? request.socket?.remoteAddress ?? 'Unknown';
}

export function parseRequestMetadata(request: Request): RequestMetadata {
  const userAgent = request.headers['user-agent'] ?? '';
  const browser = parseBrowser(userAgent);
  const os = parseOS(userAgent);
  const deviceType = parseDeviceType(userAgent);
  const ipAddress = extractClientIP(request);

  const referer = request.headers.referer ?? request.headers.referrer;
  const origin = request.headers.origin;
  const language = request.headers['accept-language'];

  return {
    timestamp: new Date(),
    ipAddress,
    userAgent,
    browser: browser.name,
    browserVersion: browser.version,
    os: os.name,
    osVersion: os.version,
    deviceType,
    referer: Array.isArray(referer) ? referer[0] : referer,
    origin,
    language: typeof language === 'string' ? language : language?.[0],
  };
}
