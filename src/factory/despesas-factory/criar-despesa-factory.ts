import { DespesaRepository } from "../../repositories/repository/despesas/despesa-repository";
import { CartaoRepository } from "../../repositories/repository/cartoes/cartao-repository";
import { UsuarioRepository } from "../../repositories/repository/usuarios/usuario-repository";
import { CriarDespesaUseCase } from "../../use-cases/despesas/criar-despesa-usecase";

export function makeCriarDespesaFactory() {
  const despesaRepository = new DespesaRepository();
  const usuarioRepository = new UsuarioRepository();
  const cartaoRepository = new CartaoRepository();

  const criarDespesaUseCase = new CriarDespesaUseCase(
    despesaRepository,
    usuarioRepository,
    cartaoRepository,
  );

  return criarDespesaUseCase;
}
