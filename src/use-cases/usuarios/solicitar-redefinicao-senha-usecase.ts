import { randomBytes } from "node:crypto";
import { UsuarioRepositoryInterface } from "../../repositories/interface/usuarios/usuario-repo-interface";

interface SolicitarRedefinicaoSenhaUseCaseRequest {
  email: string;
}

interface SolicitarRedefinicaoSenhaUseCaseResponse {
  resetToken: string | null;
}

export class SolicitarRedefinicaoSenhaUseCase {
  constructor(private usuarioRepository: UsuarioRepositoryInterface) {}

  async execute({
    email,
  }: SolicitarRedefinicaoSenhaUseCaseRequest): Promise<SolicitarRedefinicaoSenhaUseCaseResponse> {
    const usuario = await this.usuarioRepository.findByEmail(email);

    if (!usuario) {
      return {
        resetToken: null,
      };
    }

    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExp = new Date(Date.now() + 1000 * 60 * 30);

    await this.usuarioRepository.update(usuario.id, {
      resetToken,
      resetTokenExp,
    });

    return {
      resetToken,
    };
  }
}
