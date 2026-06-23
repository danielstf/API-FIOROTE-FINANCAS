import { Receita } from "@prisma/client";
import { ReceitaRepositoryInterface } from "../../repositories/interface/receitas/receita-repo-interface";
import { criarDataDoMes, formatarMesReceita } from "./receita-mes";
import { ReceitaNaoEncontradaError } from "./obter-receita-usecase";

function formatarReceita(r: Receita) {
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

interface EditarReceitaUseCaseRequest {
  usuarioId: string;
  perfilFinanceiroId?: string | null;
  receitaId: string;
  nome?: string;
  valor?: number;
  mes?: string;
  fixa?: boolean;
  escopo?: "mes" | "todas";
}

export class EditarReceitaUseCase {
  constructor(private receitaRepository: ReceitaRepositoryInterface) {}

  async execute({
    usuarioId,
    receitaId,
    nome,
    valor,
    mes,
    fixa,
    escopo,
  }: EditarReceitaUseCaseRequest) {
    const receitaExistente = await this.receitaRepository.findByIdAndUsuario(
      receitaId,
      usuarioId,
    );

    if (!receitaExistente) {
      throw new ReceitaNaoEncontradaError();
    }

    // Receita fixa: registros individuais agrupados por parcelamentoId.
    if (receitaExistente.fixa && receitaExistente.parcelamentoId) {
      if (escopo === "todas" && mes) {
        const mesAlvo = criarDataDoMes(mes);
        await this.receitaRepository.updateManyByParcelamentoFromMes(
          receitaExistente.parcelamentoId,
          usuarioId,
          mesAlvo,
          { descricao: nome?.trim(), valor },
        );
        return formatarReceita(
          await this.receitaRepository.findByIdAndUsuario(receitaExistente.id, usuarioId) ?? receitaExistente,
        );
      }

      const receita = await this.receitaRepository.update(receitaExistente.id, {
        descricao: nome?.trim(),
        valor,
      });
      return formatarReceita(receita);
    }

    const receita = await this.receitaRepository.update(receitaId, {
      descricao: nome?.trim(),
      valor,
      data: mes ? criarDataDoMes(mes) : undefined,
      fixa,
    });

    return formatarReceita(receita);
  }
}
