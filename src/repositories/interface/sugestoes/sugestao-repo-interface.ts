import { Sugestao, SugestaoTipo } from "@prisma/client";

export type SugestaoComUsuario = Sugestao & {
  usuario: {
    id: string;
    nome: string;
    email: string;
  };
};

interface CriarSugestaoData {
  usuarioId: string;
  tipo: SugestaoTipo;
  titulo: string;
  mensagem: string;
}

export interface SugestaoRepositoryInterface {
  create(data: CriarSugestaoData): Promise<SugestaoComUsuario>;
  listAll(): Promise<SugestaoComUsuario[]>;
}
