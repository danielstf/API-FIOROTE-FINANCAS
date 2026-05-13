import { CartaoCredito } from "@prisma/client";

// Padroniza a resposta do cartao para o frontend.
export function formatarCartao(cartao: CartaoCredito) {
  return {
    id: cartao.id,
    nome: cartao.nome,
    criadoEm: cartao.criadoEm,
  };
}

export class CartaoNaoEncontradoError extends Error {
  constructor() {
    super("Cartao nao encontrado");
  }
}

export class CartaoJaExisteError extends Error {
  constructor() {
    super("Ja existe um cartao com esse nome");
  }
}
