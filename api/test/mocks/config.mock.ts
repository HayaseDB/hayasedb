export interface MockConfigOverrides {
  auth?: {
    API_JWT_SECRET?: string;
    API_JWT_EXPIRES_IN?: string;
    API_JWT_REFRESH_SECRET?: string;
    API_JWT_REFRESH_EXPIRES_IN?: string;
  };
  mail?: {
    API_MAIL_PROVIDER?: string;
    API_MAIL_FROM_NAME?: string;
    API_MAIL_FROM_ADDRESS?: string;
  };
  app?: {
    API_WEB_URL?: string;
    API_PORT?: number;
  };
  storage?: {
    API_STORAGE_PROVIDER?: string;
  };
}

const defaultConfig: Required<MockConfigOverrides> = {
  auth: {
    API_JWT_SECRET: 'test-jwt-secret',
    API_JWT_EXPIRES_IN: '15m',
    API_JWT_REFRESH_SECRET: 'test-refresh-secret',
    API_JWT_REFRESH_EXPIRES_IN: '7d',
  },
  mail: {
    API_MAIL_PROVIDER: 'smtp',
    API_MAIL_FROM_NAME: 'Test App',
    API_MAIL_FROM_ADDRESS: 'test@example.com',
  },
  app: {
    API_WEB_URL: 'http://localhost:5173',
    API_PORT: 3000,
  },
  storage: {
    API_STORAGE_PROVIDER: 'minio',
  },
};

export const createMockConfigService = (
  overrides: MockConfigOverrides = {},
) => {
  const config = {
    auth: { ...defaultConfig.auth, ...overrides.auth },
    mail: { ...defaultConfig.mail, ...overrides.mail },
    app: { ...defaultConfig.app, ...overrides.app },
    storage: { ...defaultConfig.storage, ...overrides.storage },
  };

  return {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      const keys = key.split('.');
      let value: unknown = config;
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = (value as Record<string, unknown>)[k];
        } else {
          return defaultValue;
        }
      }
      return value ?? defaultValue;
    }),
    getOrThrow: jest.fn((key: string) => {
      if (key in config) {
        return config[key as keyof typeof config];
      }
      const keys = key.split('.');
      let value: unknown = config;
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = (value as Record<string, unknown>)[k];
        } else {
          throw new Error(`Config key "${key}" not found`);
        }
      }
      return value;
    }),
  };
};
