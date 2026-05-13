import { Receita } from "@prisma/client";

interface CriarReceitaData {
  usuarioId: string;
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
  // Cria uma nova receita para o usuario informado.
  create(data: CriarReceitaData): Promise<Receita>;

  // Cria varias receitas, usado para parcelamento mensal.
  createMany(data: CriarReceitaData[]): Promise<Receita[]>;

  // Lista receitas do usuario, com filtro opcional por periodo.
  listByUsuario(params: ListarPorUsuarioParams): Promise<Receita[]>;

  // Busca uma receita especifica garantindo que ela pertence ao usuario.
  findByIdAndUsuario(receitaId: string, usuarioId: string): Promise<Receita | null>;

  // Atualiza uma receita depois que o use case confirmou a permissao do usuario.
  update(receitaId: string, data: AtualizarReceitaData): Promise<Receita>;

  // Remove uma receita depois que o use case confirmou a permissao do usuario.
  delete(receitaId: string): Promise<void>;
}
