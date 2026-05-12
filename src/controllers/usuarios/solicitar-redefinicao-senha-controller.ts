import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { env } from "../../env";
import { makeSolicitarRedefinicaoSenhaFactory } from "../../factory/usuarios-factory/solicitar-redefinicao-senha-factory";
import { resend } from "../../lib/resend";

export async function solicitarRedefinicaoSenhaController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const solicitarRedefinicaoSenhaSchema = z.object({
    email: z.string().email("Email invalido"),
  });

  const { email } = solicitarRedefinicaoSenhaSchema.parse(request.body);

  try {
    const solicitarRedefinicaoSenha = makeSolicitarRedefinicaoSenhaFactory();
    const { resetToken } = await solicitarRedefinicaoSenha.execute({ email });

    if (!resetToken) {
      console.log(
        "Redefinicao de senha solicitada, mas o email nao esta cadastrado:",
        email,
      );
    }

    if (resetToken) {
      const resetUrl = `${env.FRONTEND_URL}/redefinir-senha?token=${resetToken}`;

      const { data, error } = await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: email,
        subject: "Redefinicao de senha",
        html: `
          <p>Voce solicitou a redefinicao da sua senha.</p>
          <p>Clique no link abaixo para criar uma nova senha:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>Esse link expira em 30 minutos.</p>
        `,
      });

      if (error) {
        console.error("Erro retornado pelo Resend:", error);
        throw new Error("Erro ao enviar email de redefinicao");
      }

      console.log("Email de redefinicao enviado pelo Resend:", data?.id);
    }

    return reply.status(200).send({
      message:
        "Se o email estiver cadastrado, enviaremos instrucoes para redefinir a senha",
    });
  } catch (error) {
    console.error("Erro ao solicitar redefinicao de senha:", error);
    return reply
      .status(500)
      .send({ message: "Erro ao solicitar redefinicao de senha" });
  }
}
