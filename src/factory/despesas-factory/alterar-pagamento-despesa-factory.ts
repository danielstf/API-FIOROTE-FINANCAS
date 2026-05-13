import { DespesaRepository } from "../../repositories/repository/despesas/despesa-repository";
import { AlterarPagamentoDespesaUseCase } from "../../use-cases/despesas/alterar-pagamento-despesa-usecase";

export function makeAlterarPagamentoDespesaFactory() {
  const despesaRepository = new DespesaRepository();

  const alterarPagamentoDespesaUseCase = new AlterarPagamentoDespesaUseCase(
    despesaRepository,
  );

  return alterarPagamentoDespesaUseCase;
}
