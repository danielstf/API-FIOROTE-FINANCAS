import { Despesa, FormaPagamentoDespesa } from "@prisma/client";

interface CriarDespesaData {
  usuarioId: string;
  perfilFinanceiroId?: string | null;
  descricao: string;
  valor: number;
  categoriaNome?: string | null;
  formaPagamento: FormaPagamentoDespesa;
  cartaoCreditoId?: string | null;
  mesReferencia: Date;
  dataVencimento?: Date | null;
  fixa?: boolean;
  numeroParcelas?: number | null;
  parcelaAtual?: number | null;
  parcelamentoId?: string | null;
}

interface ListarPorUsuarioParams {
  usuarioId: string;
  perfilFinanceiroId?: string | null;
  formaPagamento?: FormaPagamentoDespesa;
  cartaoCreditoId?: string;
  dataInicio?: Date;
  dataFim?: Date;
  somenteVencidas?: boolean;
  paga?: boolean;
}

interface AtualizarDespesaData {
  descricao?: string;
  valor?: number;
  categoriaNome?: string | null;
  formaPagamento?: FormaPagamentoDespesa;
  cartaoCreditoId?: string | null;
  mesReferencia?: Date;
  dataVencimento?: Date | null;
  paga?: boolean;
  dataPagamento?: Date | null;
  fixa?: boolean;
  numeroParcelas?: number | null;
  parcelaAtual?: number | null;
  parcelamentoId?: string | null;
}

export interface DespesaRepositoryInterface {
  create(data: CriarDespesaData): Promise<Despesa>;
  createMany(data: CriarDespesaData[]): Promise<Despesa[]>;
  listByUsuario(params: ListarPorUsuarioParams): Promise<Despesa[]>;
  findByIdAndUsuario(despesaId: string, usuarioId: string): Promise<Despesa | null>;
  update(despesaId: string, data: AtualizarDespesaData): Promise<Despesa>;
  delete(despesaId: string): Promise<void>;
  deleteByParcelamento(parcelamentoId: string, usuarioId: string): Promise<void>;
  deleteByParcelamentoFromMes(parcelamentoId: string, usuarioId: string, fromMes: Date): Promise<void>;
  updateManyByParcelamentoFromMes(parcelamentoId: string, usuarioId: string, fromMes: Date, data: AtualizarDespesaData): Promise<void>;
}
