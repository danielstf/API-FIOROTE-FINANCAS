import { compare, hash } from "bcryptjs";
import { UsuarioRepositoryInterface } from "../../repositories/interface/usuarios/usuario-repo-interface";

interface TrocarSenhaUseCaseRequest {
  usuarioId: string;
  senhaAtual: string;
  novaSenha: string;
}

export class CurrentPasswordInvalidError extends Error {
  constructor() {
    super("Senha atual invalida");
  }
}

export class TrocarSenhaUseCase {
  constructor(private usuarioRepository: UsuarioRepositoryInterface) {}

  async execute({
    usuarioId,
    senhaAtual,
    novaSenha,
  }: TrocarSenhaUseCaseRequest): Promise<void> {
    const usuario = await this.usuarioRepository.findById(usuarioId);

    if (!usuario) {
      throw new CurrentPasswordInvalidError();
    }

    const senhaAtualCorreta = await compare(senhaAtual, usuario.senha);

    if (!senhaAtualCorreta) {
      throw new CurrentPasswordInvalidError();
    }

    const hashedSenha = await hash(novaSenha, 10);

    await this.usuarioRepository.update(usuario.id, {
      senha: hashedSenha,
      resetToken: null,
      resetTokenExp: null,
    });
  }
}
