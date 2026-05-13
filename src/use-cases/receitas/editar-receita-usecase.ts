import { ReceitaRepositoryInterface } from "../../repositories/interface/receitas/receita-repo-interface";
import { criarDataDoMes, formatarMesReceita } from "./receita-mes";
import { ReceitaNaoEncontradaError } from "./obter-receita-usecase";

interface EditarReceitaUseCaseRequest {
  usuarioId: string;
  receitaId: string;
  nome?: string;
  valor?: number;
  mes?: string;
  fixa?: boolean;
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
  }: EditarReceitaUseCaseRequest) {
    // Garante que a receita existe e pertence ao usuario antes de atualizar.
    const receitaExistente = await this.receitaRepository.findByIdAndUsuario(
      receitaId,
      usuarioId,
    );

    if (!receitaExistente) {
      throw new ReceitaNaoEncontradaError();
    }

    const receita = await this.receitaRepository.update(receitaId, {
      descricao: nome?.trim(),
      valor,
      data: mes ? criarDataDoMes(mes) : undefined,
      fixa,
    });

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
