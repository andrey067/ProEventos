import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { EventoDetailPage } from "@/components/eventos/EventoDetailPage";
import { EventosPage } from "@/components/eventos/EventosPage";
import { PalestrantesPage } from "@/components/palestrantes/PalestrantesPage";
import { ChangePasswordPage } from "@/components/user/ChangePasswordPage";
import { LoginPage } from "@/components/user/LoginPage";
import { ProfilePage } from "@/components/user/ProfilePage";
import { RegisterPage } from "@/components/user/RegisterPage";
import { Nav } from "@/shared/Nav";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}

export default function App() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-surface font-sans text-ink">
      <Nav />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/eventos" replace />} />
          <Route path="/eventos" element={<EventosPage />} />
          <Route
            path="/eventos/:id"
            element={
              <ProtectedRoute>
                <EventoDetailPage />
              </ProtectedRoute>
            }
          />
          <Route path="/palestrantes" element={<PalestrantesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil/senha"
            element={
              <ProtectedRoute>
                <ChangePasswordPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
