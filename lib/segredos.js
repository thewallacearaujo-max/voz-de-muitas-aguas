// Guarda a chave da OpenAI (criptografada) e o modelo escolhido pelo administrador.
// O armazenamento é um banco Redis acessado por REST (Upstash, disponível pelo Marketplace da Vercel).
// A Vercel não mantém arquivos entre execuções, por isso a chave não pode ficar em disco.
import { criptografar, descriptografar } from './seguranca';

const CHAVE_OPENAI = 'vma:openai:chave';
const CHAVE_MODELO = 'vma:openai:modelo';

export const MODELO_PADRAO = 'gpt-4o-mini';

function loja() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

export function lojaDisponivel() {
  return Boolean(loja());
}

async function comando(args) {
  const l = loja();
  if (!l) throw new Error('Armazenamento não configurado.');
  const r = await fetch(l.url, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + l.token, 'content-type': 'application/json' },
    body: JSON.stringify(args),
    cache: 'no-store',
  });
  if (!r.ok) throw new Error('Falha no armazenamento (' + r.status + ').');
  const dados = await r.json();
  if (dados.error) throw new Error('Falha no armazenamento.');
  return dados.result;
}

// Devolve a chave em uso: primeiro a cadastrada no painel, depois a variável OPENAI_API_KEY.
export async function obterConfig() {
  let chave = null;
  let origem = 'nenhuma';
  let modelo = null;

  if (loja()) {
    try {
      const guardada = await comando(['GET', CHAVE_OPENAI]);
      if (guardada) {
        chave = descriptografar(guardada);
        origem = 'painel';
      }
      modelo = await comando(['GET', CHAVE_MODELO]);
    } catch (e) {
      console.error('Falha ao ler as configurações:', e.message);
    }
  }

  if (!chave && process.env.OPENAI_API_KEY) {
    chave = process.env.OPENAI_API_KEY;
    origem = 'ambiente';
  }

  return { chave, origem, modelo: modelo || process.env.OPENAI_MODEL || MODELO_PADRAO };
}

export async function salvarChave(chave) {
  await comando(['SET', CHAVE_OPENAI, criptografar(chave)]);
}

export async function removerChave() {
  await comando(['DEL', CHAVE_OPENAI]);
}

export async function salvarModelo(modelo) {
  await comando(['SET', CHAVE_MODELO, modelo]);
}
