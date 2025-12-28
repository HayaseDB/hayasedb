export interface JwtPayloadType {
  sub: string;
  sessionId: string;
  iat: number;
  exp: number;
}
