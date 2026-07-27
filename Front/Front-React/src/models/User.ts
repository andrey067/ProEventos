export interface UserProfile {
  userName: string;
  email: string;
  nome: string;
}

export interface AuthResponse {
  token: string;
  userName: string;
  email: string;
  nome: string;
}

export interface RegisterRequest {
  nome: string;
  userName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  userName: string;
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
