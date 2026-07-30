import type {
  AuthResponse,
  ChangePasswordRequest,
  LoginRequest,
  RegisterPalestranteRequest,
  RegisterRequest,
  UpdateProfileRequest,
  UserProfile,
} from "@/models";
import { clearToken, setSession } from "./authToken";
import { http } from "./http";

function persistAuth(response: AuthResponse): AuthResponse {
  setSession(response.token, response.roles);
  return response;
}

export const accountService = {
  register(data: RegisterRequest): Promise<AuthResponse> {
    return http<AuthResponse>("/account/register", {
      method: "POST",
      body: JSON.stringify(data),
    }).then(persistAuth);
  },

  registerPalestrante(data: RegisterPalestranteRequest): Promise<AuthResponse> {
    return http<AuthResponse>("/account/register-palestrante", {
      method: "POST",
      body: JSON.stringify(data),
    }).then(persistAuth);
  },

  login(data: LoginRequest): Promise<AuthResponse> {
    return http<AuthResponse>("/account/login", {
      method: "POST",
      body: JSON.stringify(data),
    }).then(persistAuth);
  },

  logout(): void {
    clearToken();
  },

  getProfile(): Promise<UserProfile> {
    return http<UserProfile>("/account/profile");
  },

  updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    return http<UserProfile>("/account/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  changePassword(data: ChangePasswordRequest): Promise<void> {
    return http<void>("/account/change-password", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};
