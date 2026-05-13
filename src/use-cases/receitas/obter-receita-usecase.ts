import { ReceitaRepositoryInterface } from "../../repositories/interface/receitas/receita-repo-interface";
import { formatarMesReceita } from "./receita-mes";

interface ObterReceitaUseCaseRequest {
  usuarioId: string;
  receitaId: string;
}

export class ReceitaNaoEncontradaError extends Error {
  constructor() {
    super("Receita nao encontrada");
  }
}

export class ObterReceitaUseCase {
  constructor(private receitaRepository: ReceitaRepositoryInterface) {}

  async execute({ usuarioId, receitaId }: ObterReceitaUseCaseRequest) {
    // Busca somente receitas pertencentes ao usuario logado.
    const receita = await this.receitaRepository.findByIdAndUsuario(
      receitaId,
      usuarioId,
    );

    if (!receita) {
      throw new ReceitaNaoEncontradaError();
    }

    return {
      id: receita.id,
      nome: receita.descricao,
      valor: Number(receita.valor),
      mes: formatarMesReceita(receita.data),
      data: receita.data,
      fixa: receita.fixa,
      numeroParcelas: receita.numeroParcelas,
      parcelaAtual: receita.parcelaAtual,
      parcelamentoId: receita.parcelamentoId,
      criadoEm: receita.criadoEm,
    };
  }
}
