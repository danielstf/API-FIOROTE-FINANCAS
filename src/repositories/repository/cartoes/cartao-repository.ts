import { CartaoCredito } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { CartaoRepositoryInterface } from "../../interface/cartoes/cartao-repo-interface";

interface CriarCartaoData {
  usuarioId: string;
  nome: string;
}

interface AtualizarCartaoData {
  nome: string;
}

export class CartaoRepository implements CartaoRepositoryInterface {
  // Cria um novo cartao vinculado ao usuario.
  async create(data: CriarCartaoData): Promise<CartaoCredito> {
    const cartao = await prisma.cartaoCredito.create({
      data,
    });

    return cartao;
  }

  // Lista cartoes do usuario em ordem alfabetica.
  async listByUsuario(usuarioId: string): Promise<CartaoCredito[]> {
    const cartoes = await prisma.cartaoCredito.findMany({
      where: { usuarioId },
      orderBy: { nome: "asc" },
    });

    return cartoes;
  }

  // Busca o cartao pelo id e pelo dono.
  async findByIdAndUsuario(
    cartaoId: string,
    usuarioId: string,
  ): Promise<CartaoCredito | null> {
    const cartao = await prisma.cartaoCredito.findFirst({
      where: {
        id: cartaoId,
        usuarioId,
      },
    });

    return cartao;
  }

  // Busca cartao pelo nome para evitar cadastro duplicado.
  async findByNomeAndUsuario(
    nome: string,
    usuarioId: string,
  ): Promise<CartaoCredito | null> {
    const cartao = await prisma.cartaoCredito.findFirst({
      where: {
        nome,
        usuarioId,
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

  // Exclui o cartao pelo id.
  async delete(cartaoId: string): Promise<void> {
    await prisma.cartaoCredito.delete({
      where: { id: cartaoId },
    });
  }
}
