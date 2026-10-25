export const TIPOS = {
  sermao: {
    nome: 'Sermão',
    titulo: 'Criar sermão',
    descricao: 'Esboço completo com pontos e aplicação',
    placeholder: 'Ex.: Salmo 23 ou "Confiança em tempos difíceis"',
    estrutura: [
      '# (título do sermão)',
      '## Texto-base',
      '## Introdução',
      '## Pontos principais (3 pontos; cada um com explicação, ilustração e aplicação)',
      '## Aplicação',
      '## Conclusão',
      '## Oração final',
    ],
  },
  estudo: {
    nome: 'Estudo bíblico',
    titulo: 'Criar estudo bíblico',
    descricao: 'Roteiro com perguntas para o grupo',
    placeholder: 'Ex.: Romanos 12:1-8 ou "O fruto do Espírito"',
    estrutura: [
      '# (título do estudo)',
      '## Texto-base',
      '## Contexto',
      '## Ideia central',
      '## Perguntas para discussão (6 perguntas)',
      '## Aplicação para a semana',
      '## Oração',
    ],
  },
  devocional: {
    nome: 'Devocional',
    titulo: 'Criar devocional',
    descricao: 'Reflexão curta com oração',
    placeholder: 'Ex.: Filipenses 4:6-7 ou "Descansar em Deus"',
    estrutura: [
      '# (título do devocional)',
      '## Leitura',
      '## Reflexão',
      '## Oração',
      '## Desafio do dia',
    ],
  },
};

export const PUBLICOS = ['Geral', 'Jovens', 'Famílias', 'Líderes'];
export const TONS = ['Acolhedor', 'Didático', 'Inspirador'];
export const DURACOES = {
  sermao: [15, 30, 45],
  estudo: [30, 45, 60],
  devocional: [3, 5, 10],
};

export const REFINOS = [
  { rotulo: 'Mais curto', instrucao: 'Deixe o texto mais curto, mantendo as ideias principais.' },
  { rotulo: 'Mais prático', instrucao: 'Deixe o texto mais prático, com aplicações concretas do dia a dia.' },
  { rotulo: 'Mais profundo', instrucao: 'Aprofunde o texto, explorando melhor o contexto bíblico.' },
];

export function montarSistema() {
  return [
    'Você é um assistente de preparação de conteúdo bíblico para pastores, líderes e professores de escola bíblica, escrevendo em português do Brasil.',
    'Regras:',
    '- Seja fiel ao texto bíblico e ao seu contexto. Nunca invente versículos nem atribua a Bíblia o que ela não diz.',
    '- Cite as referências (livro, capítulo e versículo). Não reproduza longos trechos de traduções protegidas por direitos autorais; parafraseie ou cite no máximo um versículo curto.',
    '- Evite posições denominacionais polêmicas. Quando houver interpretações diferentes, mencione isso com respeito.',
    '- Use Markdown simples: títulos com #, listas com - ou números e **negrito** para destaques. Não use tabelas.',
    '- Responda somente com o conteúdo pedido, sem comentários sobre você mesmo.',
    '- O texto é um rascunho de apoio: quem ministra revisa antes de usar.',
  ].join('\n');
}

export function montarPrompt({ tipo, entrada, publico, duracao, tom }) {
  const t = TIPOS[tipo];
  const unidade = tipo === 'devocional' ? 'minutos de leitura' : 'minutos';
  return [
    `Crie um ${t.nome.toLowerCase()} sobre: ${entrada}`,
    `Público: ${publico}.`,
    `Duração: cerca de ${duracao} ${unidade}.`,
    `Tom: ${tom}.`,
    'Siga exatamente esta estrutura, nesta ordem:',
    ...t.estrutura,
    'Escreva notas desenvolvidas e úteis, proporcionais à duração pedida.',
  ].join('\n');
}

export function montarRefino({ texto, instrucao }) {
  return [
    'Abaixo está um texto de conteúdo bíblico. Reescreva-o seguindo a instrução, mantendo a mesma estrutura de seções em Markdown.',
    `Instrução: ${instrucao}`,
    '--- TEXTO ---',
    texto,
  ].join('\n');
}
