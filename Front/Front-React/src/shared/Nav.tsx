import { NavLink, useNavigate } from "react-router-dom";
import { accountService } from "@/services/accountService";
import { isAuthenticated } from "@/services/authToken";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-[length:var(--radius-control)] px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-accent-soft text-accent-dark"
      : "text-muted hover:bg-accent-soft hover:text-accent-dark",
  ].join(" ");

export function Nav() {
  const navigate = useNavigate();
  const loggedIn = isAuthenticated();

  function handleLogout() {
    accountService.logout();
    void navigate("/login");
  }

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-panel">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <NavLink
          to="/eventos"
          className="text-xl font-semibold text-accent-dark"
        >
          ProEventos React
        </NavLink>
        <nav className="flex flex-wrap gap-1">
          <NavLink to="/eventos" className={linkClass}>
            Eventos
          </NavLink>
          <NavLink to="/palestrantes" className={linkClass}>
            Palestrantes
          </NavLink>
          {loggedIn ? (
            <>
              <NavLink to="/perfil" className={linkClass}>
                Perfil
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-[length:var(--radius-control)] px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-accent-soft hover:text-accent-dark"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Login
              </NavLink>
              <NavLink to="/register" className={linkClass}>
                Cadastro
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
