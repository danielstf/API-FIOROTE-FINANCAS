import { Receita } from "@prisma/client";

interface CriarReceitaData {
  usuarioId: string;
  perfilFinanceiroId?: string | null;
  descricao: string;
  valor: number;
  data: Date;
  fixa?: boolean;
  numeroParcelas?: number | null;
  parcelaAtual?: number | null;
  parcelamentoId?: string | null;
}

interface ListarPorUsuarioParams {
  usuarioId: string;
  perfilFinanceiroId?: string | null;
  dataInicio?: Date;
  dataFim?: Date;
}

interface AtualizarReceitaData {
  descricao?: string;
  valor?: number;
  data?: Date;
  fixa?: boolean;
  numeroParcelas?: number | null;
  parcelaAtual?: number | null;
  parcelamentoId?: string | null;
}

export interface ReceitaRepositoryInterface {
  create(data: CriarReceitaData): Promise<Receita>;
  createMany(data: CriarReceitaData[]): Promise<Receita[]>;
  listByUsuario(params: ListarPorUsuarioParams): Promise<Receita[]>;
  findByIdAndUsuario(receitaId: string, usuarioId: string): Promise<Receita | null>;
  update(receitaId: string, data: AtualizarReceitaData): Promise<Receita>;
  delete(receitaId: string): Promise<void>;
  deleteByParcelamento(parcelamentoId: string, usuarioId: string): Promise<void>;
  deleteByParcelamentoFromMes(parcelamentoId: string, usuarioId: string, fromMes: Date): Promise<void>;
  updateManyByParcelamentoFromMes(parcelamentoId: string, usuarioId: string, fromMes: Date, data: AtualizarReceitaData): Promise<void>;
}
