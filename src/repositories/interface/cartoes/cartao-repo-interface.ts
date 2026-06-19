import { CartaoCredito } from "@prisma/client";

interface CriarCartaoData {
  usuarioId: string;
  perfilFinanceiroId?: string | null;
  nome: string;
  cor?: number | null;
}

interface AtualizarCartaoData {
  nome: string;
  cor?: number | null;
}

export interface CartaoRepositoryInterface {
  // Cria um novo cartao para o usuario informado.
  create(data: CriarCartaoData): Promise<CartaoCredito>;

  // Lista os cartoes cadastrados pelo usuario.
  listByUsuario(usuarioId: string, perfilFinanceiroId?: string | null): Promise<CartaoCredito[]>;

  // Busca um cartao garantindo que ele pertence ao usuario.
  findByIdAndUsuario(cartaoId: string, usuarioId: string, perfilFinanceiroId?: string | null): Promise<CartaoCredito | null>;

  // Busca cartao por nome para evitar duplicidade por usuario.
  findByNomeAndUsuario(nome: string, usuarioId: string, perfilFinanceiroId?: string | null): Promise<CartaoCredito | null>;

  // Atualiza o nome do cartao.
  update(cartaoId: string, data: AtualizarCartaoData): Promise<CartaoCredito>;

  // Soft delete: marca deletedAt sem remover o registro fisicamente.
  // Despesas vinculadas permanecem intactas com a referencia ao cartao preservada.
  delete(cartaoId: string): Promise<void>;
}
