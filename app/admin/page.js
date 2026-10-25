'use client';

import { useEffect, useState } from 'react';

const ORIGENS = {
  painel: 'cadastrada neste painel',
  ambiente: 'definida na variável OPENAI_API_KEY do servidor',
  nenhuma: 'nenhuma chave cadastrada',
};

export default function Admin() {
  const [status, setStatus] = useState(null);
  const [senha, setSenha] = useState('');
  const [chave, setChave] = useState('');
  const [modelo, setModelo] = useState('');
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function carregar() {
    try {
      const r = await fetch('/api/admin/chave', { cache: 'no-store' });
      const dados = await r.json();
      setStatus(dados);
      if (dados.logado) setModelo(dados.modelo || '');
    } catch {
      setErro('Não foi possível carregar o painel.');
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function mostrarAviso(texto) {
    setAviso(texto);
    setTimeout(() => setAviso(''), 3000);
  }

  async function enviar(url, metodo, corpo) {
    setOcupado(true);
    setErro('');
    try {
      const r = await fetch(url, {
        method: metodo,
        headers: { 'content-type': 'application/json' },
        body: corpo ? JSON.stringify(corpo) : undefined,
      });
      const dados = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErro(dados.erro || 'Algo deu errado.');
        return null;
      }
      return dados;
    } catch {
      setErro('Sem conexão com o servidor.');
      return null;
    } finally {
      setOcupado(false);
    }
  }

  async function entrar(e) {
    e.preventDefault();
    const dados = await enviar('/api/admin/login', 'POST', { senha });
    if (dados) {
      setSenha('');
      await carregar();
    }
  }

  async function sair() {
    await enviar('/api/admin/logout', 'POST');
    setStatus({ logado: false, adminConfigurado: true });
  }

  async function salvar(e) {
    e.preventDefault();
    const dados = await enviar('/api/admin/chave', 'PUT', { chave, modelo });
    if (dados) {
      setChave('');
      setStatus(dados);
      setModelo(dados.modelo || '');
      mostrarAviso('Configuração salva.');
    }
  }

  async function remover() {
    if (!window.confirm('Remover a chave cadastrada neste painel? O app deixará de gerar textos.')) return;
    const dados = await enviar('/api/admin/chave', 'DELETE');
    if (dados) {
      setStatus(dados);
      mostrarAviso('Chave removida.');
    }
  }

  if (!status) {
    return (
      <>
        <h1>Painel do administrador</h1>
        {erro ? <div className="erro" role="alert">{erro}</div> : <p className="sub">Carregando...</p>}
      </>
    );
  }

  if (!status.adminConfigurado) {
    return (
      <>
        <h1>Painel do administrador</h1>
        <div className="painel">
          <h2>CONFIGURAÇÃO PENDENTE</h2>
          <p className="sub">
            Para usar o painel, defina as variáveis <strong>ADMIN_PASSWORD</strong> (senha do administrador) e{' '}
            <strong>ADMIN_SECRET</strong> (texto longo e aleatório, com pelo menos 16 caracteres) no servidor e
            publique de novo.
          </p>
        </div>
      </>
    );
  }

  if (!status.logado) {
    return (
      <>
        <h1>Painel do administrador</h1>
        <form className="painel" onSubmit={entrar}>
          <h2>ENTRAR</h2>
          <label htmlFor="senha">SENHA DO ADMINISTRADOR</label>
          <input
            id="senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <div style={{ marginTop: 18 }}>
            <button type="submit" className="botao" disabled={ocupado || !senha}>
              {ocupado ? 'ENTRANDO...' : 'ENTRAR'}
            </button>
          </div>
          {erro && <div className="erro" role="alert">{erro}</div>}
        </form>
      </>
    );
  }

  return (
    <>
      <h1>Painel do administrador</h1>
      <p className="sub">Cadastre aqui a chave da API da OpenAI usada para gerar os textos.</p>

      <section className="painel" aria-label="Situação da chave">
        <h2>SITUAÇÃO</h2>
        <p style={{ margin: 0, lineHeight: 1.7 }}>
          {status.configurada ? (
            <>
              Chave ativa terminada em <strong>{status.final}</strong>, {ORIGENS[status.origem]}.
            </>
          ) : (
            <>Nenhuma chave configurada. O app não consegue gerar textos.</>
          )}
        </p>
        <p style={{ margin: '8px 0 0' }}>
          Modelo em uso: <strong>{status.modelo}</strong>
        </p>
        {!status.armazenamentoDisponivel && (
          <div className="erro" role="note">
            Nenhum armazenamento está conectado, então não é possível salvar a chave por aqui. Conecte o Upstash
            Redis ao projeto na Vercel ou defina a variável OPENAI_API_KEY no servidor.
          </div>
        )}
      </section>

      <form className="painel" onSubmit={salvar}>
        <h2>CADASTRAR OU TROCAR A CHAVE</h2>
        <label htmlFor="chave">CHAVE DA API DA OPENAI</label>
        <input
          id="chave"
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder="sk-..."
          value={chave}
          onChange={(e) => setChave(e.target.value)}
        />
        <p className="aviso" style={{ marginTop: 6 }}>
          A chave é conferida na OpenAI e guardada criptografada. Ela não é exibida de novo depois de salva.
        </p>

        <label htmlFor="modelo">MODELO</label>
        <input
          id="modelo"
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
        />
        <p className="aviso" style={{ marginTop: 6 }}>
          Padrão: {status.modeloPadrao}. Se a OpenAI aposentar o modelo, troque o nome aqui.
        </p>

        <div className="barra" style={{ marginTop: 20 }}>
          <button
            type="submit"
            className="botao"
            disabled={ocupado || !status.armazenamentoDisponivel || (!chave && !modelo)}
          >
            {ocupado ? 'SALVANDO...' : 'SALVAR'}
          </button>
          {status.origem === 'painel' && (
            <button type="button" className="botao-sec" onClick={remover} disabled={ocupado}>
              Remover chave
            </button>
          )}
          <button type="button" className="botao-sec" onClick={sair} disabled={ocupado}>
            Sair
          </button>
        </div>

        {aviso && <p className="aviso" role="status">{aviso}</p>}
        {erro && <div className="erro" role="alert">{erro}</div>}
      </form>
    </>
  );
}
