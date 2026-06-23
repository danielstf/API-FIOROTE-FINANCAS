import { randomUUID } from "node:crypto";
import { ReceitaRepositoryInterface } from "../../repositories/interface/receitas/receita-repo-interface";
import { UsuarioRepositoryInterface } from "../../repositories/interface/usuarios/usuario-repo-interface";
import {
  atualizarPremiumExpirado,
  usuarioTemPremiumAtivo,
} from "../pagamentos/premium-validade";
import { criarDataDoMes, formatarMesReceita, somarMeses } from "./receita-mes";

import { UsuarioNaoEncontradoError } from "../../errors/app-errors";
export { UsuarioNaoEncontradoError };

const MESES_FIXO = 60; // 5 anos

interface CriarReceitaUseCaseRequest {
  usuarioId: string;
  perfilFinanceiroId?: string | null;
  nome: string;
  valor: number;
  mes: string;
  fixa?: boolean;
  numeroParcelas?: number;
}

export class PlanoPremiumObrigatorioError extends Error {
  constructor() {
    super("Receita fixa e um recurso Premium");
  }
}

export class CriarReceitaUseCase {
  constructor(
    private receitaRepository: ReceitaRepositoryInterface,
    private usuarioRepository: UsuarioRepositoryInterface,
  ) {}

  async execute({
    usuarioId,
    perfilFinanceiroId,
    nome,
    valor,
    mes,
    fixa = false,
    numeroParcelas,
  }: CriarReceitaUseCaseRequest) {
    const usuario = await this.usuarioRepository.findById(usuarioId);

    if (!usuario) {
      throw new UsuarioNaoEncontradoError();
    }

    if (fixa) {
      const usuarioAtualizado = await atualizarPremiumExpirado(usuario);

      if (!usuarioTemPremiumAtivo(usuarioAtualizado)) {
        throw new PlanoPremiumObrigatorioError();
      }
    }

    const data = criarDataDoMes(mes);

    function formatarReceita(r: { id: string; descricao: string; valor: unknown; data: Date; fixa: boolean; numeroParcelas: number | null; parcelaAtual: number | null; parcelamentoId: string | null; criadoEm: Date }) {
      return {
        id: r.id,
        nome: r.descricao,
        valor: Number(r.valor),
        mes: formatarMesReceita(r.data),
        data: r.data,
        fixa: r.fixa,
        numeroParcelas: r.numeroParcelas,
        parcelaAtual: r.parcelaAtual,
        parcelamentoId: r.parcelamentoId,
        criadoEm: r.criadoEm,
      };
    }

    // Receita fixa: cria 60 registros individuais (5 anos), um por mês.
    if (fixa) {
      const grupoId = randomUUID();

      const receitas = await this.receitaRepository.createMany(
        Array.from({ length: MESES_FIXO }, (_, index) => ({
          descricao: nome.trim(),
          valor,
          data: somarMeses(data, index),
          usuarioId,
          perfilFinanceiroId,
          fixa: true,
          parcelamentoId: grupoId,
          numeroParcelas: null,
          parcelaAtual: null,
        })),
      );

      return { receitas: receitas.map(formatarReceita) };
    }

    // Receita parcelada ou avulsa.
    const totalParcelas = numeroParcelas && numeroParcelas > 1 ? numeroParcelas : 1;
    const parcelamentoId = totalParcelas > 1 ? randomUUID() : null;

    const receitas = await this.receitaRepository.createMany(
      Array.from({ length: totalParcelas }, (_, index) => ({
        descricao:
          totalParcelas > 1
            ? `${nome.trim()} (${index + 1}/${totalParcelas})`
            : nome.trim(),
        valor,
        data: somarMeses(data, index),
        usuarioId,
        perfilFinanceiroId,
        fixa: false,
        numeroParcelas: totalParcelas > 1 ? totalParcelas : null,
        parcelaAtual: totalParcelas > 1 ? index + 1 : null,
        parcelamentoId,
      })),
    );

    return { receitas: receitas.map(formatarReceita) };
  }
}
