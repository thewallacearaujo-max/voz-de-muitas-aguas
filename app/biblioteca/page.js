'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { TIPOS } from '@/lib/prompts';
import { listar, remover, alternarFavorito } from '@/lib/storage';

export default function Biblioteca() {
  const [itens, setItens] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    setItens(listar());
    setPronto(true);
  }, []);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return itens.filter((i) => {
      if (filtro === 'favoritos' && !i.favorito) return false;
      if (filtro !== 'todos' && filtro !== 'favoritos' && i.tipo !== filtro) return false;
      if (!termo) return true;
      return (i.titulo + ' ' + (i.entrada || '')).toLowerCase().includes(termo);
    });
  }, [itens, busca, filtro]);

  function favoritar(id) {
    setItens(alternarFavorito(id));
  }

  function excluir(id) {
    if (window.confirm('Excluir este item da biblioteca?')) {
      remover(id);
      setItens(listar());
    }
  }

  const filtros = [
    ['todos', 'Todos'],
    ['favoritos', '★ Favoritos'],
    ...Object.entries(TIPOS).map(([id, t]) => [id, t.nome]),
  ];

  return (
    <>
      <h1>Minha biblioteca</h1>
      <p className="sub">Os itens ficam salvos neste navegador. Limpar os dados do navegador apaga a biblioteca.</p>

      <label htmlFor="busca">BUSCAR POR PASSAGEM OU TEMA</label>
      <input id="busca" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} />

      <div className="opcoes" role="group" aria-label="Filtrar por tipo" style={{ margin: '16px 0 20px' }}>
        {filtros.map(([id, nome]) => (
          <button key={id} type="button" className="opcao" aria-pressed={filtro === id} onClick={() => setFiltro(id)}>
            {nome}
          </button>
        ))}
      </div>

      {pronto && visiveis.length === 0 && (
        <div className="painel vazio">
          <p>{itens.length === 0 ? 'Sua biblioteca ainda está vazia.' : 'Nenhum item encontrado.'}</p>
          <Link href="/">Criar um conteúdo</Link>
        </div>
      )}

      {visiveis.map((i) => (
        <div className="lista-item" key={i.id}>
          <div className="info">
            <div className="tipo">{(TIPOS[i.tipo]?.nome || i.tipo).toUpperCase()}</div>
            <div className="titulo">{i.titulo}</div>
          </div>
          <div className="acoes">
            <Link className="botao-sec" href={`/criar/${i.tipo}?id=${i.id}`}>
              Abrir
            </Link>
            <button type="button" className="botao-sec" aria-pressed={!!i.favorito} onClick={() => favoritar(i.id)}>
              {i.favorito ? '★ Favorito' : '☆ Favoritar'}
            </button>
            <button type="button" className="botao-sec" onClick={() => excluir(i.id)}>
              Excluir
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
