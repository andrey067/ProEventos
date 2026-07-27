import http from "./HttpClient";
import { clearToken, setToken } from "./authToken";
import type {
  AuthResponse,
  ChangePasswordRequest,
  RegisterRequest,
  UpdateProfileRequest,
  UserProfile,
} from "../Models/identity/User";
import type { UserLogin } from "../Models/identity/UserLogin";

export const accountService = {
  register(data: RegisterRequest): Promise<AuthResponse> {
    return http.post<AuthResponse>("/account/register", data).then((response) => {
      setToken(response.data.token);
      return response.data;
    });
  },

  login(data: UserLogin): Promise<AuthResponse> {
    return http.post<AuthResponse>("/account/login", data).then((response) => {
      setToken(response.data.token);
      return response.data;
    });
  },

  logout(): void {
    clearToken();
  },

  getProfile(): Promise<UserProfile> {
    return http.get<UserProfile>("/account/profile").then((response) => response.data);
  },

  updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    return http.put<UserProfile>("/account/profile", data).then((response) => response.data);
  },

  changePassword(data: ChangePasswordRequest): Promise<void> {
    return http.put<void>("/account/change-password", data).then(() => undefined);
  },
};

export default accountService;
