function escapar(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function emLinha(s) {
  return escapar(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

// Conversor mínimo de Markdown para HTML (títulos, listas, negrito, itálico, parágrafos).
// Todo o texto é escapado antes de virar HTML.
export function markdownParaHtml(md) {
  const linhas = (md || '').split('\n');
  let html = '';
  let lista = null;
  let paragrafo = [];

  const fecharParagrafo = () => {
    if (paragrafo.length) {
      html += '<p>' + emLinha(paragrafo.join(' ')) + '</p>';
      paragrafo = [];
    }
  };
  const fecharLista = () => {
    if (lista) {
      html += '</' + lista + '>';
      lista = null;
    }
  };

  for (const bruta of linhas) {
    const l = bruta.trimEnd();
    if (!l.trim()) {
      fecharParagrafo();
      fecharLista();
      continue;
    }
    let m = l.match(/^(#{1,3})\s+(.*)$/);
    if (m) {
      fecharParagrafo();
      fecharLista();
      html += '<h' + m[1].length + '>' + emLinha(m[2]) + '</h' + m[1].length + '>';
      continue;
    }
    m = l.match(/^\s*[-*]\s+(.*)$/);
    if (m) {
      fecharParagrafo();
      if (lista !== 'ul') {
        fecharLista();
        html += '<ul>';
        lista = 'ul';
      }
      html += '<li>' + emLinha(m[1]) + '</li>';
      continue;
    }
    m = l.match(/^\s*\d+[.)]\s+(.*)$/);
    if (m) {
      fecharParagrafo();
      if (lista !== 'ol') {
        fecharLista();
        html += '<ol>';
        lista = 'ol';
      }
      html += '<li>' + emLinha(m[1]) + '</li>';
      continue;
    }
    fecharLista();
    paragrafo.push(l.trim());
  }
  fecharParagrafo();
  fecharLista();
  return html;
}

export function extrairTitulo(md) {
  const m = (md || '').match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : 'Sem título';
}
