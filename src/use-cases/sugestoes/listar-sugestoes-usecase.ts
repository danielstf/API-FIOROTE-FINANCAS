import { SugestaoRepositoryInterface } from "../../repositories/interface/sugestoes/sugestao-repo-interface";
import { formatarSugestao } from "./sugestao-dados";

export class ListarSugestoesUseCase {
  constructor(private sugestaoRepository: SugestaoRepositoryInterface) {}

  async execute() {
    const sugestoes = await this.sugestaoRepository.listAll();

    return {
      sugestoes: sugestoes.map(formatarSugestao),
    };
  }
}
