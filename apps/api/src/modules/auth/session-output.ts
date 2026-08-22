interface SessionDates {
  createdAt: Date | string
  updatedAt: Date | string
  expiresAt: Date | string
}

export function withSessionDates<T extends SessionDates>(
  session: T,
): T & { createdAt: Date; updatedAt: Date; expiresAt: Date } {
  return {
    ...session,
    createdAt: new Date(session.createdAt),
    updatedAt: new Date(session.updatedAt),
    expiresAt: new Date(session.expiresAt),
  }
}
