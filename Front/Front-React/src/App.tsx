import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { EventoDetailPage } from "@/components/eventos/EventoDetailPage";
import { EventosPage } from "@/components/eventos/EventosPage";
import { PalestranteFormPage } from "@/components/palestrantes/PalestranteFormPage";
import { PalestrantesPage } from "@/components/palestrantes/PalestrantesPage";
import { ChangePasswordRedirect, ProfilePage } from "@/components/user/ProfilePage";
import { LoginPage } from "@/components/user/LoginPage";
import { RegisterPage } from "@/components/user/RegisterPage";
import { RouteFade } from "@/shared/motion";
import { Nav } from "@/shared/Nav";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}

export default function App() {
  const location = useLocation();
  return (
    <div className="flex min-h-[100dvh] flex-col bg-surface font-sans text-ink">
      <Nav />
      <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-4 py-6 md:py-8">
        <RouteFade routeKey={location.pathname}>
          <Routes location={location}>
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
            <Route
              path="/palestrantes/new"
              element={
                <ProtectedRoute>
                  <PalestranteFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/palestrantes/:id"
              element={
                <ProtectedRoute>
                  <PalestranteFormPage />
                </ProtectedRoute>
              }
            />
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
                  <ChangePasswordRedirect />
                </ProtectedRoute>
              }
            />
          </Routes>
        </RouteFade>
      </main>
    </div>
  );
}
