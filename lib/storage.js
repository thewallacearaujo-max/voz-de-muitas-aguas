// Biblioteca salva no navegador do usuário (localStorage). Nada é enviado a servidores.
const CHAVE = 'vma:biblioteca';
export const CHAVE_CODIGO = 'vma:codigo';

export function novoId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function listar() {
  if (typeof window === 'undefined') return [];
  try {
    const dados = JSON.parse(window.localStorage.getItem(CHAVE) || '[]');
    return Array.isArray(dados) ? dados : [];
  } catch {
    return [];
  }
}

function gravar(lista) {
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch {
    // armazenamento cheio ou bloqueado: ignora
  }
}

export function obter(id) {
  return listar().find((x) => x.id === id) || null;
}

export function salvar(item) {
  const lista = listar();
  const i = lista.findIndex((x) => x.id === item.id);
  if (i >= 0) lista[i] = { ...lista[i], ...item };
  else lista.unshift(item);
  gravar(lista);
  return item;
}

export function remover(id) {
  gravar(listar().filter((x) => x.id !== id));
}

export function alternarFavorito(id) {
  const lista = listar().map((x) => (x.id === id ? { ...x, favorito: !x.favorito } : x));
  gravar(lista);
  return lista;
}

export function lerCodigo() {
  try {
    return window.localStorage.getItem(CHAVE_CODIGO) || '';
  } catch {
    return '';
  }
}

export function gravarCodigo(codigo) {
  try {
    window.localStorage.setItem(CHAVE_CODIGO, codigo);
  } catch {
    // ignora
  }
}
