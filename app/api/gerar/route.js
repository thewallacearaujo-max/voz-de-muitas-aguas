import { NextResponse } from 'next/server';
import {
  TIPOS,
  PUBLICOS,
  TONS,
  DURACOES,
  montarSistema,
  montarPrompt,
  montarRefino,
} from '@/lib/prompts';
import { obterConfig } from '@/lib/segredos';

export const maxDuration = 60;

const JANELA_MS = 10 * 60 * 1000;
const LIMITE = 20;
const acessos = new Map();

function limitado(ip) {
  const agora = Date.now();
  const lista = (acessos.get(ip) || []).filter((t) => agora - t < JANELA_MS);
  lista.push(agora);
  acessos.set(ip, lista);
  return lista.length > LIMITE;
}

function resposta(corpo, status = 200) {
  return NextResponse.json(corpo, { status });
}

export async function POST(request) {
  const { chave, modelo } = await obterConfig();
  if (!chave) {
    return resposta(
      { erro: 'A IA ainda não foi configurada. Peça ao administrador para cadastrar a chave da OpenAI.' },
      503
    );
  }

  const codigoEsperado = process.env.ACCESS_CODE;
  if (codigoEsperado && request.headers.get('x-access-code') !== codigoEsperado) {
    return resposta({ erro: 'Código de acesso inválido.' }, 401);
  }

  const ip = (request.headers.get('x-forwarded-for') || 'local').split(',')[0].trim();
  if (limitado(ip)) {
    return resposta({ erro: 'Muitas solicitações. Aguarde alguns minutos.' }, 429);
  }

  let corpo;
  try {
    corpo = await request.json();
  } catch {
    return resposta({ erro: 'Pedido inválido.' }, 400);
  }

  let mensagem;
  if (corpo.modo === 'refinar') {
    const texto = typeof corpo.texto === 'string' ? corpo.texto.trim() : '';
    const instrucao = typeof corpo.instrucao === 'string' ? corpo.instrucao.trim() : '';
    if (!texto || texto.length > 20000 || !instrucao || instrucao.length > 300) {
      return resposta({ erro: 'Texto ou instrução inválidos.' }, 400);
    }
    mensagem = montarRefino({ texto, instrucao });
  } else {
    const { tipo } = corpo;
    const entrada = typeof corpo.entrada === 'string' ? corpo.entrada.trim() : '';
    if (!TIPOS[tipo]) return resposta({ erro: 'Tipo de conteúdo inválido.' }, 400);
    if (entrada.length < 3 || entrada.length > 300) {
      return resposta({ erro: 'Informe uma passagem ou tema (3 a 300 caracteres).' }, 400);
    }
    if (!PUBLICOS.includes(corpo.publico) || !TONS.includes(corpo.tom)) {
      return resposta({ erro: 'Opções inválidas.' }, 400);
    }
    if (!DURACOES[tipo].includes(Number(corpo.duracao))) {
      return resposta({ erro: 'Duração inválida.' }, 400);
    }
    mensagem = montarPrompt({
      tipo,
      entrada,
      publico: corpo.publico,
      duracao: Number(corpo.duracao),
      tom: corpo.tom,
    });
  }

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: 'Bearer ' + chave,
      },
      body: JSON.stringify({
        model: modelo,
        max_completion_tokens: 6000,
        messages: [
          { role: 'system', content: montarSistema() },
          { role: 'user', content: mensagem },
        ],
      }),
    });

    if (!r.ok) {
      console.error('Erro da OpenAI:', r.status, await r.text());
      if (r.status === 401) {
        return resposta({ erro: 'A OpenAI recusou a chave. O administrador precisa atualizá-la.' }, 502);
      }
      if (r.status === 404) {
        return resposta({ erro: 'O modelo configurado não está disponível. O administrador deve ajustá-lo no painel.' }, 502);
      }
      if (r.status === 429) {
        return resposta({ erro: 'O limite de uso da conta OpenAI foi atingido. Tente mais tarde.' }, 502);
      }
      return resposta({ erro: 'A IA não respondeu. Tente novamente em instantes.' }, 502);
    }

    const dados = await r.json();
    const texto = (dados.choices?.[0]?.message?.content || '').trim();

    if (!texto) return resposta({ erro: 'A IA devolveu uma resposta vazia.' }, 502);
    return resposta({ texto });
  } catch (e) {
    console.error('Falha ao chamar a IA:', e);
    return resposta({ erro: 'Não foi possível falar com a IA agora.' }, 502);
  }
}
