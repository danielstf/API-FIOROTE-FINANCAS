import { SugestaoComUsuario } from "../../repositories/interface/sugestoes/sugestao-repo-interface";

export function formatarSugestao(sugestao: SugestaoComUsuario) {
  return {
    id: sugestao.id,
    tipo: sugestao.tipo,
    titulo: sugestao.titulo,
    mensagem: sugestao.mensagem,
    status: sugestao.status,
    criadoEm: sugestao.criadoEm,
    usuario: sugestao.usuario,
  };
}
