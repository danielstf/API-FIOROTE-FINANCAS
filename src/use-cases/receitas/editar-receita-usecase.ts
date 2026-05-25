import { Receita } from "@prisma/client";
import { ReceitaRepositoryInterface } from "../../repositories/interface/receitas/receita-repo-interface";
import { criarDataDoMes, formatarMesReceita, somarMeses } from "./receita-mes";
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
    perfilFinanceiroId,
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

    // "Editar este e todos os seguintes": encerra o original e cria um novo a partir do mes informado.
    if (receitaExistente.fixa && escopo === "todas" && mes) {
      const mesAlvo = criarDataDoMes(mes);

      await this.receitaRepository.update(receitaExistente.id, {
        recorrenciaFim: mesAlvo,
        recorrenciaEncerrada: true,
      });

      const novaReceita = await this.receitaRepository.create({
        usuarioId,
        perfilFinanceiroId: perfilFinanceiroId ?? receitaExistente.perfilFinanceiroId,
        descricao: nome?.trim() ?? receitaExistente.descricao,
        valor: valor ?? Number(receitaExistente.valor),
        data: mesAlvo,
        fixa: true,
        recorrenciaFim: somarMeses(mesAlvo, 12),
      });

      return formatarReceita(novaReceita);
    }

    // "Editar só este mês": cria excecao no original e um registro avulso para o mes.
    if (receitaExistente.fixa && mes) {
      const mesReferencia = criarDataDoMes(mes);

      await this.receitaRepository.createExcecaoRecorrencia(
        receitaExistente.id,
        usuarioId,
        mesReferencia,
      );

      const receitaDoMes = await this.receitaRepository.create({
        usuarioId,
        perfilFinanceiroId: perfilFinanceiroId ?? receitaExistente.perfilFinanceiroId,
        descricao: nome?.trim() ?? receitaExistente.descricao,
        valor: valor ?? Number(receitaExistente.valor),
        data: mesReferencia,
        fixa: false,
        numeroParcelas: null,
        parcelaAtual: null,
        parcelamentoId: null,
      });

      return formatarReceita(receitaDoMes);
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
