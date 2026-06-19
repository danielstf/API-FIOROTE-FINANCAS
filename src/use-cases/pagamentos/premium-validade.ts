import { prisma } from "../../lib/prisma";

interface UsuarioPremium {
  id: string;
  plano: string;
  premiumExpiraEm: Date | null;
  exibirAnuncios: boolean;
}

// Calcula a validade do premium como 1 mes de calendario a partir da data informada.
export function calcularPremiumExpiraEm(dataInicio = new Date()) {
  const premiumExpiraEm = new Date(dataInicio);
  premiumExpiraEm.setMonth(premiumExpiraEm.getMonth() + 1);

  return premiumExpiraEm;
}

// Confere se o usuario ainda possui premium valido na data atual.
export function usuarioTemPremiumAtivo(
  usuario: Pick<UsuarioPremium, "plano" | "premiumExpiraEm">,
  agora = new Date(),
) {
  return (
    usuario.plano === "PREMIUM" &&
    !!usuario.premiumExpiraEm &&
    usuario.premiumExpiraEm > agora
  );
}

// Se a validade venceu, rebaixa o usuario para FREE e volta a exibir anuncios.
export async function atualizarPremiumExpirado<T extends UsuarioPremium>(
  usuario: T,
): Promise<T> {
  if (usuario.plano !== "PREMIUM" || usuarioTemPremiumAtivo(usuario)) {
    return usuario;
  }

  const usuarioAtualizado = await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      plano: "FREE",
      exibirAnuncios: true,
      premiumExpiraEm: null,
    },
  });

  return usuarioAtualizado as unknown as T;
}
