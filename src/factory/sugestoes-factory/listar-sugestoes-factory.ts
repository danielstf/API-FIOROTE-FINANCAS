import { SugestaoRepository } from "../../repositories/repository/sugestoes/sugestao-repository";
import { ListarSugestoesUseCase } from "../../use-cases/sugestoes/listar-sugestoes-usecase";

export function makeListarSugestoesFactory() {
  const sugestaoRepository = new SugestaoRepository();

  return new ListarSugestoesUseCase(sugestaoRepository);
}
