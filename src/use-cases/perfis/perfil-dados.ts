import { PerfilFinanceiro } from "@prisma/client";

export function formatarPerfil(perfil: PerfilFinanceiro) {
  return {
    id: perfil.id,
    nome: perfil.nome,
    avatar: perfil.avatar,
    tema: perfil.tema,
    criadoEm: perfil.criadoEm,
    atualizadoEm: perfil.atualizadoEm,
  };
}