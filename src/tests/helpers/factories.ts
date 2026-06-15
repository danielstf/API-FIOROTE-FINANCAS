// Fábricas de dados mock baseadas no schema Prisma real

// UUIDs v4 válidos (requeridos por Zod .uuid() nos controllers)
export const TEST_USER_ID = "11111111-1111-4111-a111-111111111111";
export const TEST_ADMIN_ID = "22222222-2222-4222-a222-222222222222";
export const TEST_PREMIUM_USER_ID = "33333333-3333-4333-a333-333333333333";
export const TEST_SESSION_ID = "44444444-4444-4444-a444-444444444444";

// ─── Usuario ──────────────────────────────────────────────────────────────────
export const mockUser = {
  id: TEST_USER_ID,
  nome: "Usuário Teste",
  email: "usuario@teste.com",
  senha: "$2a$10$hashedPassword123" as string | null,
  googleId: null as string | null,
  criadoEm: new Date("2024-01-01"),
  plano: "FREE" as const,
  premiumExpiraEm: null as Date | null,
  exibirAnuncios: true,
  role: "USER" as const,
  resetToken: null as string | null,
  resetTokenExp: null as Date | null,
};

export const mockAdmin = {
  ...mockUser,
  id: TEST_ADMIN_ID,
  nome: "Admin Teste",
  email: "admin@teste.com",
  role: "ADMIN" as const,
};

export const mockPremiumUser = {
  ...mockUser,
  id: TEST_PREMIUM_USER_ID,
  plano: "PREMIUM" as const,
  premiumExpiraEm: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  exibirAnuncios: false,
};

// ─── Receita (campos reais do schema) ────────────────────────────────────────
export const mockReceita = {
  id: "55555555-5555-4555-a555-555555555555",
  usuarioId: TEST_USER_ID,
  perfilFinanceiroId: null as string | null,
  categoriaId: null as string | null,
  descricao: "Salário",
  valor: 3000 as unknown as import("@prisma/client").Prisma.Decimal,
  data: new Date("2024-05-01"),
  fixa: false,
  recorrenciaFim: null as Date | null,
  recorrenciaEncerrada: false,
  numeroParcelas: null as number | null,
  parcelaAtual: null as number | null,
  parcelamentoId: null as string | null,
  criadoEm: new Date("2024-01-01"),
};

// ─── Despesa (campos reais do schema) ─────────────────────────────────────────
export const mockDespesa = {
  id: "66666666-6666-4666-a666-666666666666",
  usuarioId: TEST_USER_ID,
  perfilFinanceiroId: null as string | null,
  categoriaId: null as string | null,
  descricao: "Aluguel",
  valor: 1500 as unknown as import("@prisma/client").Prisma.Decimal,
  categoriaNome: null as string | null,
  formaPagamento: "BOLETO" as const,
  cartaoCreditoId: null as string | null,
  mesReferencia: new Date("2024-05-01"),
  dataVencimento: new Date("2024-05-10") as Date | null,
  dataPagamento: null as Date | null,
  paga: false,
  fixa: false,
  recorrenciaFim: null as Date | null,
  recorrenciaEncerrada: false,
  numeroParcelas: null as number | null,
  parcelaAtual: null as number | null,
  parcelamentoId: null as string | null,
  criadoEm: new Date("2024-01-01"),
};

// ─── CartaoCredito ────────────────────────────────────────────────────────────
export const mockCartao = {
  id: "77777777-7777-4777-a777-777777777777",
  usuarioId: TEST_USER_ID,
  perfilFinanceiroId: null as string | null,
  nome: "Nubank",
  criadoEm: new Date("2024-01-01"),
  deletedAt: null as Date | null,
};

// ─── Sugestao (campos reais do schema) ───────────────────────────────────────
export const mockSugestao = {
  id: "88888888-8888-4888-a888-888888888888",
  usuarioId: TEST_USER_ID,
  tipo: "SUGESTAO" as const,
  titulo: "Nova funcionalidade",
  mensagem: "Seria legal ter exportação de relatórios em PDF",
  status: "ABERTO",
  criadoEm: new Date("2024-01-01"),
};

// ─── PerfilFinanceiro ─────────────────────────────────────────────────────────
export const mockPerfil = {
  id: "99999999-9999-4999-a999-999999999999",
  usuarioId: TEST_USER_ID,
  nome: "Perfil Principal",
  avatar: "user",
  tema: "system",
  criadoEm: new Date("2024-01-01"),
  atualizadoEm: new Date("2024-01-01"),
};

// ─── PagamentoPremium ─────────────────────────────────────────────────────────
export const mockPagamentoCheckout = {
  id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
  usuarioId: TEST_USER_ID,
  mercadoPagoPreferenceId: "pref-123" as string | null,
  mercadoPagoPreapprovalId: null as string | null,
  mercadoPagoPaymentId: null as string | null,
  externalReference: "ext-ref-uuid-123",
  tipo: "CHECKOUT" as const,
  status: "PENDING" as const,
  assinaturaStatus: null as string | null,
  valor: 8 as unknown as import("@prisma/client").Prisma.Decimal,
  checkoutUrl: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=123" as string | null,
  canceladoEm: null as Date | null,
  criadoEm: new Date("2024-01-01"),
  atualizadoEm: new Date("2024-01-01"),
};

export const mockPagamentoAssinatura = {
  ...mockPagamentoCheckout,
  id: "pagamento-assinatura-id-456",
  tipo: "ASSINATURA" as const,
  status: "APPROVED" as const,
  mercadoPagoPreferenceId: null,
  mercadoPagoPreapprovalId: "preapproval-123",
  assinaturaStatus: "authorized",
  checkoutUrl: "https://www.mercadopago.com.br/subscriptions/checkout",
  valor: 5 as unknown as import("@prisma/client").Prisma.Decimal,
};
