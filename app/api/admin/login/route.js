import { NextResponse } from 'next/server';
import {
  adminConfigurado,
  iguais,
  criarToken,
  opcoesCookie,
  excedeuTentativas,
  COOKIE_ADMIN,
  DURACAO_SESSAO_SEGUNDOS,
} from '@/lib/seguranca';

export async function POST(request) {
  if (!adminConfigurado()) {
    return NextResponse.json(
      { erro: 'O painel ainda não foi configurado. Defina ADMIN_PASSWORD e ADMIN_SECRET no servidor.' },
      { status: 503 }
    );
  }

  const ip = (request.headers.get('x-forwarded-for') || 'local').split(',')[0].trim();
  if (excedeuTentativas(ip, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ erro: 'Muitas tentativas. Aguarde 15 minutos.' }, { status: 429 });
  }

  let corpo;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: 'Pedido inválido.' }, { status: 400 });
  }

  const senha = typeof corpo.senha === 'string' ? corpo.senha : '';
  if (!senha || !iguais(senha, process.env.ADMIN_PASSWORD)) {
    return NextResponse.json({ erro: 'Senha incorreta.' }, { status: 401 });
  }

  const resposta = NextResponse.json({ ok: true });
  resposta.cookies.set(COOKIE_ADMIN, criarToken(), opcoesCookie(DURACAO_SESSAO_SEGUNDOS));
  return resposta;
}
