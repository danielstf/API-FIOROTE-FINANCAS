import OpenAI from 'openai';

function parsePdf(buffer: Buffer): Promise<{ text: string }> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
  return (require('pdf-parse') as any)(buffer);
}

export type FaturaItem = {
  nome: string;
  valor: number;
  parcelaAtual?: number;
  totalParcelas?: number;
};

async function analisarTextoComOpenAI(texto: string): Promise<FaturaItem[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Você é um especialista em análise de faturas de cartão de crédito brasileiras.
Analise o texto extraído de uma fatura e retorne APENAS as despesas/compras realizadas.

Retorne um JSON com exatamente este formato:
{
  "itens": [
    {
      "nome": "Nome do estabelecimento ou produto",
      "valor": 99.90,
      "parcelaAtual": 3,
      "totalParcelas": 12
    }
  ]
}

Regras obrigatórias:
- Inclua SOMENTE compras e despesas (débitos).
- Exclua: pagamentos recebidos, créditos, estornos, cashback, IOF, anuidade, encargos, juros, taxas, saldo anterior, limite, totais, subtotais e linhas de cabeçalho.
- O campo "valor" deve ser número decimal positivo (ex: 149.90).
- "parcelaAtual" e "totalParcelas" são opcionais — inclua somente quando a transação for claramente parcelada (ex: "03/12" = parcelaAtual 3, totalParcelas 12).
- Retorne SOMENTE o JSON, sem texto adicional.`,
      },
      {
        role: 'user',
        content: texto.slice(0, 28000),
      },
    ],
  });

  const content = completion.choices[0].message.content ?? '{"itens":[]}';
  const parsed = JSON.parse(content);

  if (!Array.isArray(parsed.itens)) return [];

  return parsed.itens
    .filter(
      (item: any) =>
        typeof item.nome === 'string' &&
        item.nome.length >= 2 &&
        typeof item.valor === 'number' &&
        item.valor > 0 &&
        item.valor < 100000,
    )
    .map((item: any) => ({
      nome: String(item.nome).trim(),
      valor: Number(item.valor),
      parcelaAtual: item.parcelaAtual ? Number(item.parcelaAtual) : undefined,
      totalParcelas: item.totalParcelas ? Number(item.totalParcelas) : undefined,
    }));
}

export async function extrairItensFatura(pdfBuffer: Buffer): Promise<FaturaItem[]> {
  const { text } = await parsePdf(pdfBuffer);

  if (!text || text.trim().length < 20) {
    throw new Error('PDF sem texto legível — pode ser uma imagem escaneada.');
  }

  return analisarTextoComOpenAI(text);
}
