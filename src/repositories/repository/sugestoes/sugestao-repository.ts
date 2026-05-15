import { SugestaoTipo } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import {
  SugestaoComUsuario,
  SugestaoRepositoryInterface,
} from "../../interface/sugestoes/sugestao-repo-interface";

interface CriarSugestaoData {
  usuarioId: string;
  tipo: SugestaoTipo;
  titulo: string;
  mensagem: string;
}

export class SugestaoRepository implements SugestaoRepositoryInterface {
  async create(data: CriarSugestaoData): Promise<SugestaoComUsuario> {
    const sugestao = await prisma.sugestao.create({
      data,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    return sugestao;
  }

  async listAll(): Promise<SugestaoComUsuario[]> {
    const sugestoes = await prisma.sugestao.findMany({
      orderBy: { criadoEm: "desc" },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    return sugestoes;
  }
}
