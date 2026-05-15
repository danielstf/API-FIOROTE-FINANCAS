import { SugestaoTipo } from "@prisma/client";
import { SugestaoRepositoryInterface } from "../../repositories/interface/sugestoes/sugestao-repo-interface";
import { UsuarioRepositoryInterface } from "../../repositories/interface/usuarios/usuario-repo-interface";
import { formatarSugestao } from "./sugestao-dados";

interface CriarSugestaoUseCaseRequest {
  usuarioId: string;
  tipo: SugestaoTipo;
  titulo: string;
  mensagem: string;
}

export class UsuarioNaoEncontradoError extends Error {
  constructor() {
    super("Usuario nao encontrado");
  }
}

export class CriarSugestaoUseCase {
  constructor(
    private sugestaoRepository: SugestaoRepositoryInterface,
    private usuarioRepository: UsuarioRepositoryInterface,
  ) {}

  async execute({ usuarioId, tipo, titulo, mensagem }: CriarSugestaoUseCaseRequest) {
    const usuario = await this.usuarioRepository.findById(usuarioId);

    if (!usuario) {
      throw new UsuarioNaoEncontradoError();
    }

    const sugestao = await this.sugestaoRepository.create({
      usuarioId,
      tipo,
      titulo: titulo.trim(),
      mensagem: mensagem.trim(),
    });

    return formatarSugestao(sugestao);
  }
}
