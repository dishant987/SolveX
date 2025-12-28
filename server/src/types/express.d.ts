export interface AuthRequest extends Request {
  user?: User;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface GoogleProfile {
  id: string;
  email: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}
