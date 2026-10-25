import { NextResponse } from 'next/server';
import { adminConfigurado, adminAutenticado } from '@/lib/seguranca';
import {
  obterConfig,
  lojaDisponivel,
  salvarChave,
  removerChave,
  salvarModelo,
  MODELO_PADRAO,
} from '@/lib/segredos';

function json(corpo, status = 200) {
  return NextResponse.json(corpo, { status, headers: { 'cache-control': 'no-store' } });
}

async function montarStatus() {
  const { chave, origem, modelo } = await obterConfig();
  return {
    logado: true,
    adminConfigurado: true,
    armazenamentoDisponivel: lojaDisponivel(),
    configurada: Boolean(chave),
    origem,
    final: chave ? chave.slice(-4) : '',
    modelo,
    modeloPadrao: MODELO_PADRAO,
  };
}

// Consulta o estado atual. Sem login, não revela nada além de "precisa entrar".
export async function GET(request) {
  if (!adminConfigurado()) return json({ logado: false, adminConfigurado: false });
  if (!adminAutenticado(request)) return json({ logado: false, adminConfigurado: true });
  return json(await montarStatus());
}

// Salva a chave (e, opcionalmente, o modelo).
export async function PUT(request) {
  if (!adminAutenticado(request)) return json({ erro: 'Faça login como administrador.' }, 401);
  if (!lojaDisponivel()) {
    return json(
      {
        erro:
          'Não há armazenamento conectado. Conecte o Upstash Redis na Vercel ou use a variável OPENAI_API_KEY.',
      },
      503
    );
  }

  let corpo;
  try {
    corpo = await request.json();
  } catch {
    return json({ erro: 'Pedido inválido.' }, 400);
  }

  const chave = typeof corpo.chave === 'string' ? corpo.chave.trim() : '';
  const modelo = typeof corpo.modelo === 'string' ? corpo.modelo.trim() : '';

  if (!chave && !modelo) return json({ erro: 'Informe a chave ou o modelo.' }, 400);
  if (modelo && !/^[A-Za-z0-9._:-]{1,60}$/.test(modelo)) {
    return json({ erro: 'Nome de modelo inválido.' }, 400);
  }

  try {
    if (chave) {
      if (!/^sk-[A-Za-z0-9_-]{20,}$/.test(chave)) {
        return json({ erro: 'O formato da chave parece incorreto. Ela começa com "sk-".' }, 400);
      }
      // Confere a chave na OpenAI antes de guardar, para evitar erro de digitação.
      let teste;
      try {
        teste = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: 'Bearer ' + chave },
          cache: 'no-store',
        });
      } catch {
        return json({ erro: 'Não foi possível verificar a chave na OpenAI agora. Tente de novo.' }, 502);
      }
      if (teste.status === 401) return json({ erro: 'A OpenAI recusou essa chave.' }, 400);
      if (!teste.ok) return json({ erro: 'A OpenAI não confirmou a chave. Tente de novo.' }, 502);
      await salvarChave(chave);
    }
    if (modelo) await salvarModelo(modelo);
  } catch (e) {
    console.error('Falha ao salvar configuração:', e.message);
    return json({ erro: 'Não foi possível salvar. Verifique o armazenamento e a variável ADMIN_SECRET.' }, 500);
  }

  return json(await montarStatus());
}

// Remove a chave guardada no painel.
export async function DELETE(request) {
  if (!adminAutenticado(request)) return json({ erro: 'Faça login como administrador.' }, 401);
  if (!lojaDisponivel()) return json({ erro: 'Não há armazenamento conectado.' }, 503);
  try {
    await removerChave();
  } catch (e) {
    console.error('Falha ao remover a chave:', e.message);
    return json({ erro: 'Não foi possível remover a chave.' }, 500);
  }
  return json(await montarStatus());
}
