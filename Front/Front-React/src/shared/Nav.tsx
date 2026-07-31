import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { accountService } from "@/services/accountService";
import { isAuthenticated } from "@/services/authToken";
import { usePrefersReducedMotion } from "@/shared/motion";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-[length:var(--radius-control)] px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-accent-soft text-accent-dark"
      : "text-muted hover:bg-accent-soft hover:text-accent-dark",
  ].join(" ");

const logoutClass =
  "rounded-[length:var(--radius-control)] px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-accent-soft hover:text-accent-dark";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const loggedIn = isAuthenticated();

  function handleLogout() {
    accountService.logout();
    onNavigate?.();
    void navigate("/login");
  }

  return (
    <>
      <NavLink to="/eventos" className={linkClass} onClick={onNavigate}>
        Eventos
      </NavLink>
      <NavLink to="/palestrantes" className={linkClass} onClick={onNavigate}>
        Palestrantes
      </NavLink>
      {loggedIn ? (
        <>
          <NavLink to="/perfil" className={linkClass} onClick={onNavigate}>
            Perfil
          </NavLink>
          <button type="button" onClick={handleLogout} className={logoutClass}>
            Sair
          </button>
        </>
      ) : (
        <>
          <NavLink to="/login" className={linkClass} onClick={onNavigate}>
            Login
          </NavLink>
          <NavLink to="/register" className={linkClass} onClick={onNavigate}>
            Cadastro
          </NavLink>
        </>
      )}
    </>
  );
}

export function Nav() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-panel">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <NavLink
          to="/eventos"
          className="text-xl font-semibold text-accent-dark"
        >
          ProEventos React
        </NavLink>

        <button
          type="button"
          className="rounded-[length:var(--radius-control)] p-2 text-muted transition-colors hover:bg-accent-soft hover:text-accent-dark md:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label="Menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-6"
            aria-hidden="true"
          >
            {menuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>

        <nav className="hidden flex-wrap gap-1 md:flex">
          <NavLinks />
        </nav>
      </div>

      {menuOpen ? (
        <motion.nav
          id="mobile-nav"
          className="flex flex-col gap-1 border-t border-line px-4 py-3 md:hidden"
          initial={reduced ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.22 }}
        >
          <NavLinks onNavigate={() => setMenuOpen(false)} />
        </motion.nav>
      ) : null}
    </header>
  );
}
