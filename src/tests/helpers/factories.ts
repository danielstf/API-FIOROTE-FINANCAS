// Fábricas de dados mock para os testes

export const TEST_USER_ID = "user-id-test-123";
export const TEST_ADMIN_ID = "admin-id-test-456";
export const TEST_PREMIUM_USER_ID = "premium-id-test-789";
export const TEST_SESSION_ID = "session-id-test-abc";

export const mockUser = {
  id: TEST_USER_ID,
  nome: "Usuário Teste",
  email: "usuario@teste.com",
  senha: "$2a$10$hashedPassword123",
  role: "USER" as const,
  plano: "FREE" as const,
  premiumExpiraEm: null as Date | null,
  exibirAnuncios: true,
  genero: null as string | null,
  dataNascimento: null as Date | null,
  googleId: null as string | null,
  criadoEm: new Date("2024-01-01"),
  atualizadoEm: new Date("2024-01-01"),
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

export const mockSessao = {
  count: 1,
};

export const mockReceita = {
  id: "receita-id-123",
  usuarioId: TEST_USER_ID,
  perfilFinanceiroId: null as string | null,
  nome: "Salário",
  valor: 3000,
  mes: "2024-05",
  fixa: false,
  numeroParcelas: null as number | null,
  parcelaDe: null as number | null,
  parcelaTotal: null as number | null,
  recorrenciaEncerrada: false,
  criadaEm: new Date("2024-01-01"),
  atualizadaEm: new Date("2024-01-01"),
};

export const mockDespesa = {
  id: "despesa-id-123",
  usuarioId: TEST_USER_ID,
  perfilFinanceiroId: null as string | null,
  nome: "Aluguel",
  valor: 1500,
  categoria: "Moradia" as string | null,
  formaPagamento: "BOLETO" as const,
  cartaoCreditoId: null as string | null,
  mes: "2024-05" as string | null,
  dataVencimento: "2024-05-10" as string | null,
  paga: false,
  fixa: false,
  numeroParcelas: null as number | null,
  parcelaDe: null as number | null,
  parcelaTotal: null as number | null,
  recorrenciaEncerrada: false,
  criadaEm: new Date("2024-01-01"),
  atualizadaEm: new Date("2024-01-01"),
};

export const mockCartao = {
  id: "cartao-id-123",
  usuarioId: TEST_USER_ID,
  nome: "Nubank",
  criadoEm: new Date("2024-01-01"),
  atualizadoEm: new Date("2024-01-01"),
};

export const mockSugestao = {
  id: "sugestao-id-123",
  usuarioId: TEST_USER_ID,
  titulo: "Nova funcionalidade",
  descricao: "Seria legal ter exportação de relatórios em PDF",
  status: "PENDENTE" as const,
  criadaEm: new Date("2024-01-01"),
  atualizadaEm: new Date("2024-01-01"),
};

export const mockPerfil = {
  id: "perfil-id-123",
  usuarioId: TEST_USER_ID,
  nome: "Perfil Principal",
  criadoEm: new Date("2024-01-01"),
  atualizadoEm: new Date("2024-01-01"),
};

export const mockPagamentoCheckout = {
  id: "pagamento-id-123",
  usuarioId: TEST_USER_ID,
  externalReference: "ext-ref-uuid-123",
  tipo: "CHECKOUT" as const,
  valor: 8,
  status: "PENDING" as const,
  mercadoPagoPaymentId: null as string | null,
  mercadoPagoPreferenceId: "pref-123",
  mercadoPagoPreapprovalId: null as string | null,
  assinaturaStatus: null as string | null,
  checkoutUrl: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=123",
  canceladoEm: null as Date | null,
  criadoEm: new Date("2024-01-01"),
  atualizadoEm: new Date("2024-01-01"),
};

export const mockPagamentoAssinatura = {
  ...mockPagamentoCheckout,
  id: "pagamento-assinatura-id-456",
  tipo: "ASSINATURA" as const,
  valor: 5,
  status: "APPROVED" as const,
  mercadoPagoPreferenceId: null,
  mercadoPagoPreapprovalId: "preapproval-123",
  assinaturaStatus: "authorized",
  checkoutUrl: "https://www.mercadopago.com.br/subscriptions/checkout",
};

export const mockRedefinicaoSenha = {
  id: "redefinicao-id-123",
  usuarioId: TEST_USER_ID,
  token: "valid-reset-token-abc123",
  expiraEm: new Date(Date.now() + 60 * 60 * 1000),
  usado: false,
  criadoEm: new Date("2024-01-01"),
};

export const mockResumoDashboard = {
  mes: "2024-05",
  totalReceitas: 3000,
  totalDespesas: 1500,
  saldo: 1500,
  despesasPorCategoria: [],
  evolucaoMensal: [],
};
