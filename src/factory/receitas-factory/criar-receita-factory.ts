import { ReceitaRepository } from "../../repositories/repository/receitas/receita-repository";
import { UsuarioRepository } from "../../repositories/repository/usuarios/usuario-repository";
import { CriarReceitaUseCase } from "../../use-cases/receitas/criar-receita-usecase";

export function makeCriarReceitaFactory() {
  const receitaRepository = new ReceitaRepository();
  const usuarioRepository = new UsuarioRepository();

  const criarReceitaUseCase = new CriarReceitaUseCase(
    receitaRepository,
    usuarioRepository,
  );

  return criarReceitaUseCase;
}
