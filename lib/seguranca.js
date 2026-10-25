// Funções de segurança usadas apenas no servidor (criptografia da chave e sessão do admin).
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'crypto';

export const COOKIE_ADMIN = 'vma_admin';
const DURACAO_SESSAO_MS = 8 * 60 * 60 * 1000;

export function adminConfigurado() {
  const segredo = process.env.ADMIN_SECRET;
  return Boolean(process.env.ADMIN_PASSWORD) && Boolean(segredo) && segredo.length >= 16;
}

function chaveSecreta() {
  const segredo = process.env.ADMIN_SECRET;
  if (!segredo || segredo.length < 16) {
    throw new Error('ADMIN_SECRET ausente ou com menos de 16 caracteres.');
  }
  return createHash('sha256').update(segredo).digest();
}

export function iguais(a, b) {
  const ha = createHash('sha256').update(String(a)).digest();
  const hb = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

export function criptografar(texto) {
  const iv = randomBytes(12);
  const cifra = createCipheriv('aes-256-gcm', chaveSecreta(), iv);
  const dados = Buffer.concat([cifra.update(texto, 'utf8'), cifra.final()]);
  const tag = cifra.getAuthTag();
  return Buffer.concat([iv, tag, dados]).toString('base64');
}

export function descriptografar(base64) {
  const buf = Buffer.from(base64, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const dados = buf.subarray(28);
  const decifra = createDecipheriv('aes-256-gcm', chaveSecreta(), iv);
  decifra.setAuthTag(tag);
  return Buffer.concat([decifra.update(dados), decifra.final()]).toString('utf8');
}

function assinar(payload) {
  return createHmac('sha256', chaveSecreta()).update(payload).digest('base64url');
}

export function criarToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + DURACAO_SESSAO_MS })).toString('base64url');
  return payload + '.' + assinar(payload);
}

function tokenValido(token) {
  if (!token) return false;
  const [payload, assinatura] = token.split('.');
  if (!payload || !assinatura) return false;
  if (!iguais(assinatura, assinar(payload))) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
}

export function adminAutenticado(request) {
  if (!adminConfigurado()) return false;
  return tokenValido(request.cookies.get(COOKIE_ADMIN)?.value);
}

export function opcoesCookie(maxAgeSegundos) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: maxAgeSegundos,
  };
}

export const DURACAO_SESSAO_SEGUNDOS = DURACAO_SESSAO_MS / 1000;

// Limite simples de tentativas por IP (em memória; vale por instância do servidor).
const tentativas = new Map();
export function excedeuTentativas(ip, limite, janelaMs) {
  const agora = Date.now();
  const lista = (tentativas.get(ip) || []).filter((t) => agora - t < janelaMs);
  lista.push(agora);
  tentativas.set(ip, lista);
  return lista.length > limite;
}
