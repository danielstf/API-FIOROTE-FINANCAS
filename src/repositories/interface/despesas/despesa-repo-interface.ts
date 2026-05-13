import { Despesa, FormaPagamentoDespesa } from "@prisma/client";

interface CriarDespesaData {
  usuarioId: string;
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
  // Cria uma nova despesa para o usuario informado.
  create(data: CriarDespesaData): Promise<Despesa>;

  // Cria varias despesas, usado para parcelamento mensal.
  createMany(data: CriarDespesaData[]): Promise<Despesa[]>;

  // Lista despesas do usuario com filtros opcionais.
  listByUsuario(params: ListarPorUsuarioParams): Promise<Despesa[]>;

  // Busca uma despesa garantindo que ela pertence ao usuario logado.
  findByIdAndUsuario(despesaId: string, usuarioId: string): Promise<Despesa | null>;

  // Atualiza uma despesa apos validacao do use case.
  update(despesaId: string, data: AtualizarDespesaData): Promise<Despesa>;

  // Exclui uma despesa apos validacao do use case.
  delete(despesaId: string): Promise<void>;

  // Exclui todas as despesas do mesmo parcelamento pertencentes ao usuario.
  deleteByParcelamento(parcelamentoId: string, usuarioId: string): Promise<void>;
}
