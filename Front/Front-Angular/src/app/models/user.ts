export interface UserRegister {
  nome: string;
  userName: string;
  email: string;
  password: string;
}

export interface UserLogin {
  userName: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  userName: string;
  email: string;
  nome: string;
}

export interface UserProfile {
  userName: string;
  email: string;
  nome: string;
}

export interface UserUpdate {
  nome?: string;
  userName?: string;
  email?: string;
}

export interface ChangePassword {
  currentPassword: string;
  newPassword: string;
}
