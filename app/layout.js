import { Montserrat } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

export const metadata = {
  title: 'Voz de Muitas Águas',
  description: 'Prepare sermões, estudos bíblicos e devocionais com apoio de inteligência artificial.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={montserrat.className}>
        <header className="topo">
          <Link href="/" className="marca">
            VOZ DE MUITAS <span>ÁGUAS</span>
          </Link>
          <nav aria-label="Principal">
            <Link href="/">Início</Link>
            <Link href="/biblioteca">Biblioteca</Link>
          </nav>
        </header>
        <main className="conteudo">{children}</main>
        <footer className="rodape">
          O conteúdo gerado é um rascunho de apoio. Revise sempre antes de usar.{' '}
          <Link href="/admin" style={{ marginLeft: 12 }}>
            Admin
          </Link>
        </footer>
      </body>
    </html>
  );
}
