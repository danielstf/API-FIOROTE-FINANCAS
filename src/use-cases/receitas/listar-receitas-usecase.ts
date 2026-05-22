import { ReceitaRepositoryInterface } from "../../repositories/interface/receitas/receita-repo-interface";
import { criarIntervaloDoMes, formatarMesReceita } from "./receita-mes";

interface ListarReceitasUseCaseRequest {
  usuarioId: string;
  perfilFinanceiroId?: string | null;
  mes?: string;
}

export class ListarReceitasUseCase {
  constructor(private receitaRepository: ReceitaRepositoryInterface) {}

  async execute({ usuarioId, perfilFinanceiroId, mes }: ListarReceitasUseCaseRequest) {
    // Quando o mes vem na query, lista somente receitas daquele periodo.
    const mesConsulta = mes ?? formatarMesReceita(new Date());
    const filtroMes = criarIntervaloDoMes(mesConsulta);

    const receitas = await this.receitaRepository.listByUsuario({
      usuarioId,
      perfilFinanceiroId,
      dataInicio: filtroMes.inicio,
      dataFim: filtroMes.fim,
    });

    const itens = receitas.map((receita) => {
      const mesDaOcorrencia = receita.fixa ? mesConsulta : formatarMesReceita(receita.data);
      const dataDaOcorrencia = receita.fixa ? filtroMes.inicio : receita.data;

      return {
        id: receita.id,
        nome: receita.descricao,
        valor: Number(receita.valor),
        mes: mesDaOcorrencia,
        data: dataDaOcorrencia,
        fixa: receita.fixa,
        numeroParcelas: receita.numeroParcelas,
        parcelaAtual: receita.parcelaAtual,
        parcelamentoId: receita.parcelamentoId,
        criadoEm: receita.criadoEm,
      };
    });

    return {
      receitas: itens,
      total: itens.reduce((total, receita) => total + receita.valor, 0),
    };
  }
}
