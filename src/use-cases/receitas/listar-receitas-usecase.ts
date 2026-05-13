import { ReceitaRepositoryInterface } from "../../repositories/interface/receitas/receita-repo-interface";
import { criarIntervaloDoMes, formatarMesReceita } from "./receita-mes";

interface ListarReceitasUseCaseRequest {
  usuarioId: string;
  mes?: string;
}

export class ListarReceitasUseCase {
  constructor(private receitaRepository: ReceitaRepositoryInterface) {}

  async execute({ usuarioId, mes }: ListarReceitasUseCaseRequest) {
    // Quando o mes vem na query, lista somente receitas daquele periodo.
    const filtroMes = mes ? criarIntervaloDoMes(mes) : null;

    const receitas = await this.receitaRepository.listByUsuario({
      usuarioId,
      dataInicio: filtroMes?.inicio,
      dataFim: filtroMes?.fim,
    });

    const itens = receitas.map((receita) => ({
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
    }));

    return {
      receitas: itens,
      total: itens.reduce((total, receita) => total + receita.valor, 0),
    };
  }
}
