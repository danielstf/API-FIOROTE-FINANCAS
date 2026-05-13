import { CartaoCredito } from "@prisma/client";

interface CriarCartaoData {
  usuarioId: string;
  nome: string;
}

interface AtualizarCartaoData {
  nome: string;
}

export interface CartaoRepositoryInterface {
  // Cria um novo cartao para o usuario informado.
  create(data: CriarCartaoData): Promise<CartaoCredito>;

  // Lista os cartoes cadastrados pelo usuario.
  listByUsuario(usuarioId: string): Promise<CartaoCredito[]>;

  // Busca um cartao garantindo que ele pertence ao usuario.
  findByIdAndUsuario(cartaoId: string, usuarioId: string): Promise<CartaoCredito | null>;

  // Busca cartao por nome para evitar duplicidade por usuario.
  findByNomeAndUsuario(nome: string, usuarioId: string): Promise<CartaoCredito | null>;

  // Atualiza o nome do cartao.
  update(cartaoId: string, data: AtualizarCartaoData): Promise<CartaoCredito>;

  // Exclui o cartao; despesas antigas ficam sem cartao por causa do onDelete SetNull.
  delete(cartaoId: string): Promise<void>;
}
