export type Titulo =
  | "NaoInformado"
  | "Tecnologo"
  | "Bacharel"
  | "Especialista"
  | "PosGraduado"
  | "Mestrado"
  | "Doutorado"
  | "PosDoutorado";

export type Funcao = "NaoInformado" | "Participante" | "Palestrante";

export const TITULO_OPTIONS: { value: Titulo; label: string }[] = [
  { value: "NaoInformado", label: "Não Quero" },
  { value: "Tecnologo", label: "Tecnólogo(a)" },
  { value: "Bacharel", label: "Bacharel" },
  { value: "Especialista", label: "Especialista" },
  { value: "PosGraduado", label: "Pós Graduado(a)" },
  { value: "Mestrado", label: "Mestre" },
  { value: "Doutorado", label: "Doutor(a)" },
  { value: "PosDoutorado", label: "Pós Doc" },
];

export const FUNCAO_OPTIONS: { value: Funcao; label: string }[] = [
  { value: "NaoInformado", label: "Não Informado" },
  { value: "Participante", label: "Participante" },
  { value: "Palestrante", label: "Palestrante" },
];

export interface UserProfile {
  nome: string;
  userName: string;
  email: string;
  primeiroNome: string;
  ultimoNome: string;
  titulo: Titulo;
  funcao: Funcao;
  telefone: string;
  descricao: string;
  imagemURL?: string | null;
  eventosMinistrados: number;
  eventosParticipados: number;
}

export interface AuthResponse {
  nome: string;
  userName: string;
  email: string;
  token: string;
  roles?: string[];
  palestranteId?: number | null;
  refreshToken?: string;
  expiresIn?: number;
}

export interface RegisterPalestranteRequest extends RegisterRequest {
  miniCurriculo?: string;
  telefone?: string;
  imagemURL?: string;
}

export interface RegisterRequest {
  nome: string;
  userName: string;
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  userName?: string;
  email: string;
  primeiroNome: string;
  ultimoNome: string;
  titulo: Titulo;
  funcao: Funcao;
  telefone: string;
  descricao: string;
  imagemURL?: string | null;
  password?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export class User {
  nome!: string;
  userName!: string;
  email!: string;
  password?: string;
  token?: string;
}
