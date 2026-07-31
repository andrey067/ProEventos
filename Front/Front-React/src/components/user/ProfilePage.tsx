import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  AlertMotion,
  PageEnter,
  PanelEnter,
} from "@/shared/motion";
import type { Funcao, UserProfile } from "@/models";
import { accountService } from "@/services/accountService";
import { PalestranteDetalhe } from "@/components/user/PalestranteDetalhe";
import {
  PerfilDetalhe,
  type ProfileFormPreview,
} from "@/components/user/PerfilDetalhe";
import { RedesSociais } from "@/components/user/RedesSociais";

const PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect fill="#e5e7eb" width="120" height="120"/><circle cx="60" cy="46" r="22" fill="#9ca3af"/><ellipse cx="60" cy="100" rx="36" ry="28" fill="#9ca3af"/></svg>`,
  );

type ProfileTab = "perfil" | "palestrante" | "rede-social";

type CardSnapshot = {
  userName: string;
  nome: string;
  primeiroNome: string;
  ultimoNome: string;
  descricao: string;
  funcao: Funcao;
  imagemURL: string | null;
  eventosMinistrados: number;
  eventosParticipados: number;
};

type CardView = {
  nome: string;
  primeiroNome: string;
  ultimoNome: string;
  descricao: string;
};

function toCardSnapshot(p: UserProfile): CardSnapshot {
  return {
    userName: p.userName,
    nome: p.nome,
    primeiroNome: p.primeiroNome ?? "",
    ultimoNome: p.ultimoNome ?? "",
    descricao: p.descricao ?? "",
    funcao: p.funcao ?? "Participante",
    imagemURL: p.imagemURL ?? null,
    eventosMinistrados: p.eventosMinistrados ?? 0,
    eventosParticipados: p.eventosParticipados ?? 0,
  };
}

function toCardView(p: UserProfile): CardView {
  return {
    nome: p.nome,
    primeiroNome: p.primeiroNome ?? "",
    ultimoNome: p.ultimoNome ?? "",
    descricao: p.descricao ?? "",
  };
}

export function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [snapshot, setSnapshot] = useState<CardSnapshot | null>(null);
  const [cardView, setCardView] = useState<CardView>({
    nome: "",
    primeiroNome: "",
    ultimoNome: "",
    descricao: "",
  });
  const [ehPalestrante, setEhPalestrante] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("perfil");
  const [imgBroken, setImgBroken] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const loaded = await accountService.getProfile();
        applySnapshot(loaded);
      } catch {
        setError("Não foi possível carregar o perfil.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  function applySnapshot(p: UserProfile) {
    setProfile(p);
    setSnapshot(toCardSnapshot(p));
    setCardView(toCardView(p));
    const isPalestrante = p.funcao === "Palestrante";
    setEhPalestrante(isPalestrante);
    setImgBroken(false);
    if (!isPalestrante && activeTab !== "perfil") {
      setActiveTab("perfil");
    }
  }

  function handlePreview(preview: ProfileFormPreview) {
    setCardView({
      nome: "",
      primeiroNome: preview.primeiroNome,
      ultimoNome: preview.ultimoNome,
      descricao: preview.descricao,
    });
    const wasPalestrante = ehPalestrante;
    const nowPalestrante = preview.funcao === "Palestrante";
    setEhPalestrante(nowPalestrante);
    if (wasPalestrante && !nowPalestrante && activeTab !== "perfil") {
      setActiveTab("perfil");
    }
  }

  function handlePerfilSaved(p: UserProfile) {
    applySnapshot(p);
  }

  function handlePerfilCancelled() {
    if (profile) {
      applySnapshot(profile);
    }
  }

  function selectTab(tab: ProfileTab) {
    if (tab !== "perfil" && !ehPalestrante) return;
    setActiveTab(tab);
  }

  if (loading) {
    return <LoadingSpinner loading variant="page" />;
  }

  const photoSrc =
    imgBroken || !snapshot?.imagemURL ? PLACEHOLDER : snapshot.imagemURL;

  const alertDangerClass =
    "rounded-[length:var(--radius-control)] border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger";

  const tabClass = (tab: ProfileTab) =>
    `px-4 py-2 text-sm font-medium ${
      activeTab === tab
        ? "border-b-2 border-accent text-accent"
        : "text-muted"
    }`;

  return (
    <PageEnter>
      <div className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Perfil</h1>
          <p className="mt-1 text-sm text-muted">Atualize seus dados de conta.</p>
        </div>

        <AlertMotion show={!!error} className={alertDangerClass}>
          {error}
        </AlertMotion>

        {profile && snapshot && (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <PanelEnter className="flex flex-col overflow-hidden rounded-[length:var(--radius-control)] border border-line bg-panel">
              <div className="flex flex-col items-center gap-3 px-4 pt-6">
                <img
                  src={photoSrc}
                  alt="Foto de perfil"
                  className="h-28 w-28 rounded-full object-cover ring-1 ring-line"
                  onError={() => setImgBroken(true)}
                />
                <p className="text-lg font-medium text-muted">@{snapshot.userName}</p>
              </div>
              <div className="flex flex-col gap-2 px-4 py-4 text-sm">
                <p>
                  <span className="font-semibold">Nome:</span>{" "}
                  {cardView.nome ||
                    `${cardView.primeiroNome} ${cardView.ultimoNome}`}
                </p>
                <p className="text-muted">{cardView.descricao}</p>
              </div>
              <ul className="mt-auto grid grid-cols-2 border-t border-line text-center text-sm">
                <li className="border-r border-line px-2 py-3">
                  <div className="text-lg font-semibold">
                    {snapshot.eventosMinistrados}
                  </div>
                  <div className="text-xs text-muted">Eventos Ministrados</div>
                </li>
                <li className="px-2 py-3">
                  <div className="text-lg font-semibold">
                    {snapshot.eventosParticipados}
                  </div>
                  <div className="text-xs text-muted">Eventos Participados</div>
                </li>
              </ul>
            </PanelEnter>

            <PanelEnter className="flex flex-col rounded-[length:var(--radius-control)] border border-line bg-panel">
              <div
                role="tablist"
                aria-label="Seções do perfil"
                className="flex gap-1 border-b border-line px-2 pt-2"
              >
                <button
                  type="button"
                  role="tab"
                  data-tab="perfil"
                  aria-selected={activeTab === "perfil"}
                  className={tabClass("perfil")}
                  onClick={() => selectTab("perfil")}
                >
                  Perfil
                </button>
                {ehPalestrante && (
                  <>
                    <button
                      type="button"
                      role="tab"
                      data-tab="palestrante"
                      aria-selected={activeTab === "palestrante"}
                      className={tabClass("palestrante")}
                      onClick={() => selectTab("palestrante")}
                    >
                      Palestrante
                    </button>
                    <button
                      type="button"
                      role="tab"
                      data-tab="rede-social"
                      aria-selected={activeTab === "rede-social"}
                      className={tabClass("rede-social")}
                      onClick={() => selectTab("rede-social")}
                    >
                      Rede Social
                    </button>
                  </>
                )}
              </div>

              <div
                className="border border-t-0 border-transparent p-6"
                role="tabpanel"
              >
                <div hidden={activeTab !== "perfil"} aria-hidden={activeTab !== "perfil"}>
                  <PerfilDetalhe
                    profile={profile}
                    onPreview={handlePreview}
                    onSaved={handlePerfilSaved}
                    onCancelled={handlePerfilCancelled}
                  />
                </div>
                {ehPalestrante && (
                  <>
                    <div
                      hidden={activeTab !== "palestrante"}
                      aria-hidden={activeTab !== "palestrante"}
                    >
                      <PalestranteDetalhe />
                    </div>
                    <div
                      hidden={activeTab !== "rede-social"}
                      aria-hidden={activeTab !== "rede-social"}
                    >
                      <RedesSociais />
                    </div>
                  </>
                )}
              </div>
            </PanelEnter>
          </div>
        )}
      </div>
    </PageEnter>
  );
}

/** Dedicated change-password route redirects to profile (inline Mudar Senha). */
export function ChangePasswordRedirect() {
  return <Navigate to="/perfil" replace />;
}
