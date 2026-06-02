import pdfParse from 'pdf-parse';

export type FaturaItem = {
  nome: string;
  valor: number;
  parcelaAtual?: number;
  totalParcelas?: number;
};

const reDataInicio =
  /^(\d{1,2}[/.-]\d{2}(?:[/.-]\d{2,4})?\s+|\d{1,2}\s+(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\w*\s*(?:\d{2,4})?\s+)/i;

const reValorFim = /(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})\s*$/;

const reParcelamento =
  /\b(?:parc(?:ela)?\s*)?(\d{1,2})\s*(?:[/]|de)\s*(\d{1,2})\b/i;

const excluirDescricao =
  /^(pagamento|pago|paga|estorno|crédito|credito|devolução|devolucao|reembolso|ajuste|cash\s*back|cashback|saque|juro|encargo|iof|anuidade|tarifa|taxa|multa|mora|saldo|débito\s*autom|debito\s*autom|parcelamento\s*fatura|fatura\s*anterior)/i;

function parsearTextoFatura(texto: string): FaturaItem[] {
  const linhas = texto
    .split(/[\n\r]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 4);

  const itens: FaturaItem[] = [];

  for (const linha of linhas) {
    const matchData = linha.match(reDataInicio);
    if (!matchData) continue;

    const matchValor = linha.match(reValorFim);
    if (!matchValor) continue;

    const posValor = linha.lastIndexOf(matchValor[1]);
    const sufixo = linha.slice(posValor + matchValor[1].length).trim();
    const prefixo = linha.slice(Math.max(0, posValor - 2), posValor).trim();
    if (/cr/i.test(sufixo) || prefixo === '-') continue;

    const valorStr = matchValor[1].replace(/\./g, '').replace(',', '.');
    const valor = parseFloat(valorStr);
    if (isNaN(valor) || valor <= 0 || valor > 50000) continue;

    const semData = linha.slice(matchData[0].length).trim();
    let nome = semData
      .slice(0, semData.lastIndexOf(matchValor[1]))
      .replace(/\s*R\$\s*$/, '')
      .replace(/^R\$\s*/, '')
      .trim();

    if (excluirDescricao.test(nome)) continue;
    if (/\blimite\b|\bdisponível\b|\bdisponivel\b/i.test(nome)) continue;

    const matchParc = nome.match(reParcelamento);
    let parcelaAtual: number | undefined;
    let totalParcelas: number | undefined;

    if (matchParc) {
      const pa = parseInt(matchParc[1]);
      const pt = parseInt(matchParc[2]);
      if (pa >= 1 && pt > 1 && pa <= pt) {
        parcelaAtual = pa;
        totalParcelas = pt;
        nome = nome.replace(matchParc[0], '').replace(/\s+/g, ' ').trim();
      }
    }

    nome = nome.replace(/\s+/g, ' ').trim();
    if (!nome || nome.length < 3) continue;
    if (/^\d{1,2}[/.-]\d{2}$/.test(nome) || /^\d+$/.test(nome)) continue;
    if (/^\d{1,3}(?:\.\d{3})*,\d{2}$/.test(nome)) continue;

    itens.push({ nome, valor, parcelaAtual, totalParcelas });
  }

  return itens.filter(
    (item, i, arr) =>
      arr.findIndex(
        (a) =>
          a.nome === item.nome &&
          Math.abs(a.valor - item.valor) < 0.01 &&
          a.parcelaAtual === item.parcelaAtual,
      ) === i,
  );
}

export async function extrairItensFatura(pdfBuffer: Buffer): Promise<FaturaItem[]> {
  const result = await pdfParse(pdfBuffer);
  return parsearTextoFatura(result.text);
}
