export interface JwtPayload {
  id: number;
  name: string;
  email: string;
  role: string;
  tier?: string;
  discount?: number;
}
