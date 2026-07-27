export interface UserProfile {
  nome: string;
  userName: string;
  email: string;
}

export interface AuthResponse extends UserProfile {
  token: string;
}

export interface RegisterRequest {
  nome: string;
  userName: string;
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  nome?: string;
  userName?: string;
  email?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export class User implements UserProfile {
  nome!: string;
  userName!: string;
  email!: string;
  password?: string;
  token?: string;
}
