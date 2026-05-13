import { prisma } from "../../../lib/prisma";
import { Receita } from "@prisma/client";
import { ReceitaRepositoryInterface } from "../../interface/receitas/receita-repo-interface";

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

export class ReceitaRepository implements ReceitaRepositoryInterface {
  // Cria uma nova receita vinculada ao usuario.
  async create(data: CriarReceitaData): Promise<Receita> {
    const receita = await prisma.receita.create({
      data,
    });

    return receita;
  }

  // Cria receitas em lote, uma por mes quando houver parcelamento.
  async createMany(data: CriarReceitaData[]): Promise<Receita[]> {
    const receitas = await Promise.all(
      data.map((receita) =>
        prisma.receita.create({
          data: receita,
        }),
      ),
    );

    return receitas;
  }

  // Lista receitas do usuario, filtrando por intervalo quando informado.
  async listByUsuario({
    usuarioId,
    dataInicio,
    dataFim,
  }: ListarPorUsuarioParams): Promise<Receita[]> {
    const receitas = await prisma.receita.findMany({
      where: {
        usuarioId,
        OR:
          dataInicio && dataFim
            ? [
                {
                  data: {
                    gte: dataInicio,
                    lt: dataFim,
                  },
                },
                {
                  fixa: true,
                  data: {
                    lt: dataFim,
                  },
                },
              ]
            : undefined,
      },
      orderBy: [{ data: "desc" }, { criadoEm: "desc" }],
    });

    return receitas;
  }

  // Busca a receita pelo id e pelo dono para evitar acesso a dados de outro usuario.
  async findByIdAndUsuario(
    receitaId: string,
    usuarioId: string,
  ): Promise<Receita | null> {
    const receita = await prisma.receita.findFirst({
      where: {
        id: receitaId,
        usuarioId,
      },
    });

    return receita;
  }

  // Atualiza os campos informados da receita.
  async update(receitaId: string, data: AtualizarReceitaData): Promise<Receita> {
    const receita = await prisma.receita.update({
      where: { id: receitaId },
      data,
    });

    return receita;
  }

  // Exclui a receita pelo id.
  async delete(receitaId: string): Promise<void> {
    await prisma.receita.delete({
      where: { id: receitaId },
    });
  }
}
