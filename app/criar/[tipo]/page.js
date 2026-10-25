'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { TIPOS, PUBLICOS, TONS, DURACOES, REFINOS } from '@/lib/prompts';
import { markdownParaHtml, extrairTitulo } from '@/lib/markdown';
import { salvar, obter, novoId, lerCodigo, gravarCodigo } from '@/lib/storage';

export default function Criar() {
  const { tipo } = useParams();
  const config = TIPOS[tipo];

  const [entrada, setEntrada] = useState('');
  const [publico, setPublico] = useState('Geral');
  const [duracao, setDuracao] = useState(DURACOES[tipo]?.[1] ?? 30);
  const [tom, setTom] = useState('Didático');
  const [texto, setTexto] = useState('');
  const [id, setId] = useState(null);
  const [favorito, setFavorito] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [previa, setPrevia] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [pedirCodigo, setPedirCodigo] = useState(false);

  useEffect(() => {
    setCodigo(lerCodigo());
    const params = new URLSearchParams(window.location.search);
    const abrir = params.get('id');
    if (abrir) {
      const item = obter(abrir);
      if (item) {
        setId(item.id);
        setEntrada(item.entrada || '');
        setTexto(item.texto || '');
        setFavorito(!!item.favorito);
        if (item.opcoes) {
          setPublico(item.opcoes.publico || 'Geral');
          setDuracao(item.opcoes.duracao || duracao);
          setTom(item.opcoes.tom || 'Didático');
        }
        setPrevia(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!config) {
    return (
      <div className="painel vazio">
        <p>Tipo de conteúdo não encontrado.</p>
        <Link href="/">Voltar ao início</Link>
      </div>
    );
  }

  function avisar(mensagem) {
    setAviso(mensagem);
    setTimeout(() => setAviso(''), 2500);
  }

  async function chamar(corpo) {
    setCarregando(true);
    setErro('');
    try {
      const r = await fetch('/api/gerar', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-access-code': codigo },
        body: JSON.stringify(corpo),
      });
      const dados = await r.json().catch(() => ({}));
      if (r.status === 401) {
        setPedirCodigo(true);
        setErro(dados.erro || 'Informe o código de acesso.');
        return null;
      }
      if (!r.ok) {
        setErro(dados.erro || 'Não foi possível gerar o texto.');
        return null;
      }
      setPedirCodigo(false);
      return dados.texto;
    } catch {
      setErro('Sem conexão com o servidor. Verifique a internet e tente de novo.');
      return null;
    } finally {
      setCarregando(false);
    }
  }

  async function gerar(e) {
    e.preventDefault();
    if (entrada.trim().length < 3) {
      setErro('Informe uma passagem ou tema.');
      return;
    }
    const resultado = await chamar({ modo: 'criar', tipo, entrada, publico, duracao, tom });
    if (resultado) {
      setTexto(resultado);
      setId(null);
      setFavorito(false);
      setPrevia(true);
    }
  }

  async function refinar(instrucao) {
    const resultado = await chamar({ modo: 'refinar', texto, instrucao });
    if (resultado) {
      setTexto(resultado);
      setPrevia(true);
    }
  }

  function guardar(novoFavorito = favorito) {
    const itemId = id || novoId();
    salvar({
      id: itemId,
      tipo,
      titulo: extrairTitulo(texto),
      entrada,
      opcoes: { publico, duracao, tom },
      texto,
      favorito: novoFavorito,
      criadoEm: new Date().toISOString(),
    });
    setId(itemId);
    setFavorito(novoFavorito);
    avisar('Salvo na biblioteca.');
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      avisar('Texto copiado.');
    } catch {
      avisar('Não foi possível copiar. Selecione o texto e copie manualmente.');
    }
  }

  function baixar() {
    const arquivo = new Blob([texto], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(arquivo);
    const a = document.createElement('a');
    const nome = extrairTitulo(texto)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    a.href = url;
    a.download = (nome || 'conteudo') + '.md';
    a.click();
    URL.revokeObjectURL(url);
  }

  function salvarCodigo(e) {
    e.preventDefault();
    gravarCodigo(codigo);
    setErro('');
    setPedirCodigo(false);
  }

  return (
    <>
      <p>
        <Link href="/">← Início</Link>
      </p>
      <h1>{config.titulo}</h1>

      <form className="painel" onSubmit={gerar}>
        <label htmlFor="entrada">PASSAGEM OU TEMA</label>
        <input
          id="entrada"
          type="text"
          value={entrada}
          maxLength={300}
          placeholder={config.placeholder}
          onChange={(e) => setEntrada(e.target.value)}
        />

        <span className="rotulo" id="rot-publico">PÚBLICO</span>
        <div className="opcoes" role="group" aria-labelledby="rot-publico">
          {PUBLICOS.map((p) => (
            <button type="button" key={p} className="opcao" aria-pressed={publico === p} onClick={() => setPublico(p)}>
              {p}
            </button>
          ))}
        </div>

        <span className="rotulo" id="rot-duracao">
          {tipo === 'devocional' ? 'TEMPO DE LEITURA' : 'DURAÇÃO'}
        </span>
        <div className="opcoes" role="group" aria-labelledby="rot-duracao">
          {DURACOES[tipo].map((d) => (
            <button type="button" key={d} className="opcao" aria-pressed={duracao === d} onClick={() => setDuracao(d)}>
              {d} min
            </button>
          ))}
        </div>

        <span className="rotulo" id="rot-tom">TOM</span>
        <div className="opcoes" role="group" aria-labelledby="rot-tom">
          {TONS.map((t) => (
            <button type="button" key={t} className="opcao" aria-pressed={tom === t} onClick={() => setTom(t)}>
              {t}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 22 }}>
          <button type="submit" className="botao" disabled={carregando}>
            {carregando ? 'GERANDO...' : 'GERAR COM IA'}
          </button>
        </div>

        {erro && (
          <div className="erro" role="alert">
            {erro}
          </div>
        )}
      </form>

      {pedirCodigo && (
        <form className="painel" onSubmit={salvarCodigo}>
          <h2>CÓDIGO DE ACESSO</h2>
          <label htmlFor="codigo">Digite o código fornecido para usar a IA</label>
          <input id="codigo" type="password" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
          <div style={{ marginTop: 14 }}>
            <button type="submit" className="botao-sec">
              Salvar código
            </button>
          </div>
        </form>
      )}

      {texto && (
        <section className="painel" aria-label="Resultado">
          <div className="barra">
            <button type="button" className="botao-sec" onClick={copiar}>Copiar</button>
            <button type="button" className="botao-sec" onClick={baixar}>Baixar</button>
            <button type="button" className="botao-sec" onClick={() => window.print()}>Imprimir</button>
            <button type="button" className="botao-sec" onClick={() => guardar(favorito)}>Salvar</button>
            <button type="button" className="botao-sec" aria-pressed={favorito} onClick={() => guardar(!favorito)}>
              {favorito ? '★ Favorito' : '☆ Favoritar'}
            </button>
            <button type="button" className="botao-sec" onClick={() => setPrevia(!previa)}>
              {previa ? 'Editar texto' : 'Ver formatado'}
            </button>
          </div>

          {aviso && <p className="aviso" role="status">{aviso}</p>}

          {previa ? (
            <div className="leitura" dangerouslySetInnerHTML={{ __html: markdownParaHtml(texto) }} />
          ) : (
            <>
              <label htmlFor="texto">TEXTO (EDITÁVEL)</label>
              <textarea id="texto" value={texto} onChange={(e) => setTexto(e.target.value)} />
            </>
          )}

          <span className="rotulo" style={{ marginTop: 22 }}>REFINAR COM IA</span>
          <div className="opcoes">
            {REFINOS.map((r) => (
              <button
                type="button"
                key={r.rotulo}
                className="opcao"
                aria-pressed={false}
                disabled={carregando}
                onClick={() => refinar(r.instrucao)}
              >
                {r.rotulo}
              </button>
            ))}
          </div>
        </section>
      )}

      {texto && (
        <div className="area-impressao leitura" dangerouslySetInnerHTML={{ __html: markdownParaHtml(texto) }} />
      )}
    </>
  );
}
