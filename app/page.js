import Link from 'next/link';
import { TIPOS } from '@/lib/prompts';

export default function Inicio() {
  return (
    <>
      <h1>O que você vai preparar hoje?</h1>
      <p className="sub">
        Escolha o tipo de conteúdo, informe a passagem ou o tema e receba um rascunho para revisar,
        editar e guardar na sua biblioteca.
      </p>
      <div className="cartoes">
        {Object.entries(TIPOS).map(([id, t]) => (
          <Link key={id} href={`/criar/${id}`} className={`cartao-tipo tipo-${id}`}>
            <strong>{t.nome}</strong>
            <span>{t.descricao}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
