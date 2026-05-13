import { randomUUID } from "node:crypto";
import { ReceitaRepositoryInterface } from "../../repositories/interface/receitas/receita-repo-interface";
import { UsuarioRepositoryInterface } from "../../repositories/interface/usuarios/usuario-repo-interface";
import { criarDataDoMes, formatarMesReceita, somarMeses } from "./receita-mes";

interface CriarReceitaUseCaseRequest {
  usuarioId: string;
  nome: string;
  valor: number;
  mes: string;
  fixa?: boolean;
  numeroParcelas?: number;
}

export class UsuarioNaoEncontradoError extends Error {
  constructor() {
    super("Usuario nao encontrado");
  }
}

export class CriarReceitaUseCase {
  constructor(
    private receitaRepository: ReceitaRepositoryInterface,
    private usuarioRepository: UsuarioRepositoryInterface,
  ) {}

  async execute({
    usuarioId,
    nome,
    valor,
    mes,
    fixa = false,
    numeroParcelas,
  }: CriarReceitaUseCaseRequest) {
    // Confere se o usuario do token ainda existe antes de gravar a receita.
    const usuario = await this.usuarioRepository.findById(usuarioId);

    if (!usuario) {
      throw new UsuarioNaoEncontradoError();
    }

    // O mes e salvo como uma data no primeiro dia do mes informado.
    const data = criarDataDoMes(mes);
    const totalParcelas = numeroParcelas && numeroParcelas > 1 ? numeroParcelas : 1;
    const parcelamentoId = totalParcelas > 1 ? randomUUID() : null;

    const receitas = await this.receitaRepository.createMany(
      Array.from({ length: totalParcelas }, (_, index) => ({
        descricao:
          totalParcelas > 1
            ? `${nome.trim()} (${index + 1}/${totalParcelas})`
            : nome.trim(),
        valor,
        data: somarMeses(data, index),
        usuarioId,
        fixa: totalParcelas > 1 ? false : fixa,
        numeroParcelas: totalParcelas > 1 ? totalParcelas : null,
        parcelaAtual: totalParcelas > 1 ? index + 1 : null,
        parcelamentoId,
      })),
    );

    return {
      receitas: receitas.map((receita) => ({
        id: receita.id,
        nome: receita.descricao,
        valor: Number(receita.valor),
        mes: formatarMesReceita(receita.data),
        data: receita.data,
        fixa: receita.fixa,
        numeroParcelas: receita.numeroParcelas,
        parcelaAtual: receita.parcelaAtual,
        parcelamentoId: receita.parcelamentoId,
        criadoEm: receita.criadoEm,
      })),
    };
  }
}
