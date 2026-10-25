import { NextResponse } from 'next/server';
import { COOKIE_ADMIN, opcoesCookie } from '@/lib/seguranca';

export async function POST() {
  const resposta = NextResponse.json({ ok: true });
  resposta.cookies.set(COOKIE_ADMIN, '', opcoesCookie(0));
  return resposta;
}
