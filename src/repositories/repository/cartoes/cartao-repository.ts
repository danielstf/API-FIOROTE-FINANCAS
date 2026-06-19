import { CartaoCredito } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { CartaoRepositoryInterface } from "../../interface/cartoes/cartao-repo-interface";

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

export class CartaoRepository implements CartaoRepositoryInterface {
  // Cria um novo cartao vinculado ao usuario.
  async create(data: CriarCartaoData): Promise<CartaoCredito> {
    const cartao = await prisma.cartaoCredito.create({
      data,
    });

    return cartao;
  }

  // Lista apenas cartoes ativos (nao excluidos) em ordem alfabetica.
  async listByUsuario(
    usuarioId: string,
    perfilFinanceiroId?: string | null,
  ): Promise<CartaoCredito[]> {
    const cartoes = await prisma.cartaoCredito.findMany({
      where: { usuarioId, perfilFinanceiroId: perfilFinanceiroId ?? null, deletedAt: null },
      orderBy: { nome: "asc" },
    });

    return cartoes;
  }

  // Busca o cartao ativo pelo id e pelo dono.
  async findByIdAndUsuario(
    cartaoId: string,
    usuarioId: string,
    perfilFinanceiroId?: string | null,
  ): Promise<CartaoCredito | null> {
    const cartao = await prisma.cartaoCredito.findFirst({
      where: {
        id: cartaoId,
        usuarioId,
        perfilFinanceiroId: perfilFinanceiroId ?? null,
        deletedAt: null,
      },
    });

    return cartao;
  }

  // Busca cartao ativo pelo nome para evitar cadastro duplicado.
  async findByNomeAndUsuario(
    nome: string,
    usuarioId: string,
    perfilFinanceiroId?: string | null,
  ): Promise<CartaoCredito | null> {
    const cartao = await prisma.cartaoCredito.findFirst({
      where: {
        nome,
        usuarioId,
        perfilFinanceiroId: perfilFinanceiroId ?? null,
        deletedAt: null,
      },
    });

    return cartao;
  }

  // Atualiza o nome do cartao.
  async update(cartaoId: string, data: AtualizarCartaoData): Promise<CartaoCredito> {
    const cartao = await prisma.cartaoCredito.update({
      where: { id: cartaoId },
      data,
    });

    return cartao;
  }

  // Soft delete: preserva o registro e todas as despesas vinculadas.
  // O cartao desaparece das listagens mas continua referenciado historicamente.
  async delete(cartaoId: string): Promise<void> {
    await prisma.cartaoCredito.update({
      where: { id: cartaoId },
      data: { deletedAt: new Date() },
    });
  }
}
