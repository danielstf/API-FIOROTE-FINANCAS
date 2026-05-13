import { DespesaRepository } from "../../repositories/repository/despesas/despesa-repository";
import { ReceitaRepository } from "../../repositories/repository/receitas/receita-repository";
import { ResumoFinanceiroUseCase } from "../../use-cases/dashboard/resumo-financeiro-usecase";

export function makeResumoFinanceiroFactory() {
  const receitaRepository = new ReceitaRepository();
  const despesaRepository = new DespesaRepository();

  const resumoFinanceiroUseCase = new ResumoFinanceiroUseCase(
    receitaRepository,
    despesaRepository,
  );

  return resumoFinanceiroUseCase;
}
