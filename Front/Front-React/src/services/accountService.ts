import type {
  AuthResponse,
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  UserProfile,
} from "@/models";
import { clearToken, setToken } from "./authToken";
import { http } from "./http";

export const accountService = {
  register(data: RegisterRequest): Promise<AuthResponse> {
    return http<AuthResponse>("/account/register", {
      method: "POST",
      body: JSON.stringify(data),
    }).then((response) => {
      setToken(response.token);
      return response;
    });
  },

  login(data: LoginRequest): Promise<AuthResponse> {
    return http<AuthResponse>("/account/login", {
      method: "POST",
      body: JSON.stringify(data),
    }).then((response) => {
      setToken(response.token);
      return response;
    });
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
