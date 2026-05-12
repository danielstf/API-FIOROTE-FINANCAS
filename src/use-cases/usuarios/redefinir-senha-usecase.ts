import { hash } from "bcryptjs";
import { UsuarioRepositoryInterface } from "../../repositories/interface/usuarios/usuario-repo-interface";

interface RedefinirSenhaUseCaseRequest {
  token: string;
  senha: string;
}

export class InvalidResetTokenError extends Error {
  constructor() {
    super("Token de redefinicao invalido ou expirado");
  }
}

export class RedefinirSenhaUseCase {
  constructor(private usuarioRepository: UsuarioRepositoryInterface) {}

  async execute({ token, senha }: RedefinirSenhaUseCaseRequest): Promise<void> {
    const usuario = await this.usuarioRepository.findByResetToken(token);

    if (!usuario || !usuario.resetTokenExp || usuario.resetTokenExp < new Date()) {
      throw new InvalidResetTokenError();
    }

    const hashedSenha = await hash(senha, 10);

    await this.usuarioRepository.update(usuario.id, {
      senha: hashedSenha,
      resetToken: null,
      resetTokenExp: null,
    });
  }
}
