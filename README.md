# Voz de Muitas Águas

Aplicativo web para preparar **sermões, estudos bíblicos e devocionais** com apoio de inteligência artificial (OpenAI).
Feito com Next.js (App Router). O texto gerado é um rascunho: quem ministra revisa antes de usar.

## Funcionalidades

- **Criar sermão, estudo bíblico e devocional** a partir de uma passagem ou tema
- **Personalização:** público, duração e tom
- **Editor:** o texto gerado é editável, com visualização formatada
- **Refino com IA:** versão mais curta, mais prática ou mais profunda
- **Biblioteca:** salvar, buscar, filtrar por tipo e favoritar (os dados ficam no navegador do usuário)
- **Exportar:** copiar, baixar em Markdown ou imprimir
- **Painel do administrador (`/admin`):** o administrador cadastra, troca ou remove a chave da API da OpenAI e escolhe o modelo
- **Responsivo:** funciona no celular, no tablet e no computador

## Como funciona o painel do administrador

- O acesso é protegido por senha (`ADMIN_PASSWORD`). A sessão dura 8 horas e há limite de 5 tentativas de senha a cada 15 minutos.
- Ao salvar, a chave é conferida na OpenAI e guardada **criptografada** (AES-256-GCM, com `ADMIN_SECRET`) num banco Redis (Upstash). A chave nunca é exibida de novo nem enviada ao navegador dos usuários.
- A Vercel não guarda arquivos entre execuções, por isso a chave precisa de um armazenamento. Conecte o **Upstash Redis** ao projeto pelo Marketplace da Vercel; as variáveis `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` (ou `KV_REST_API_URL` e `KV_REST_API_TOKEN`) são preenchidas sozinhas.
- Se preferir não usar armazenamento, defina `OPENAI_API_KEY` no servidor. O painel continua servindo para escolher o modelo apenas se houver armazenamento.
- A chave cadastrada no painel tem prioridade sobre `OPENAI_API_KEY`.

## Rodar no computador

Requer Node.js 18.18 ou superior.

```bash
npm install
cp .env.example .env.local   # no Windows: copy .env.example .env.local
# edite .env.local: no mínimo OPENAI_API_KEY (ou ADMIN_PASSWORD + ADMIN_SECRET + Upstash para usar o painel)
npm run dev
```

Abra http://localhost:3000 (painel em http://localhost:3000/admin).

## Variáveis de ambiente

| Variável | Obrigatória | Para que serve |
| --- | --- | --- |
| `ADMIN_PASSWORD` | Para usar o painel | Senha do administrador |
| `ADMIN_SECRET` | Para usar o painel | Texto aleatório de 16 caracteres ou mais. Criptografa a chave e assina a sessão. Se mudar, cadastre a chave de novo |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Para salvar a chave pelo painel | Banco onde a chave criptografada fica guardada |
| `OPENAI_API_KEY` | Alternativa ao painel | Chave da OpenAI direto no servidor |
| `OPENAI_MODEL` | Não | Modelo padrão. Se não definido, usa `gpt-4o-mini`. O painel pode sobrescrever |
| `ACCESS_CODE` | Recomendada | Se definida, só quem digitar esse código no app gera textos. Protege a chave contra uso por desconhecidos |

A IA cobra por uso. Defina um limite de gastos na conta da OpenAI.

## Publicar no GitHub

```bash
git init
git add .
git commit -m "Primeira versão do Voz de Muitas Águas"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/voz-de-muitas-aguas.git
git push -u origin main
```

Crie antes o repositório vazio no GitHub. Não envie o arquivo `.env.local` (já está no `.gitignore`).

## Publicar na Vercel

1. Em https://vercel.com, clique em **Add New > Project** e importe o repositório do GitHub.
2. Em **Environment Variables**, cadastre `ADMIN_PASSWORD`, `ADMIN_SECRET` e `ACCESS_CODE`.
3. Na aba **Storage** (ou no Marketplace), conecte o **Upstash Redis** ao projeto.
4. Clique em **Deploy**. O endereço será algo como `voz-de-muitas-aguas.vercel.app`.
5. Abra `/admin`, entre com a senha e cadastre a chave da OpenAI.

**Atenção ao plano:** o plano gratuito (Hobby) da Vercel é restrito a uso pessoal e não comercial. Para um app entregue a um cliente com uso comercial, use o plano Pro (US$ 20 por mês, conforme a documentação da Vercel).

## Estrutura

```
app/
  layout.js                 Cabeçalho, rodapé e fonte
  page.js                   Tela inicial
  criar/[tipo]/page.js      Formulário, resultado, editor, exportação
  biblioteca/page.js        Biblioteca salva no navegador
  admin/page.js             Painel do administrador
  api/gerar/route.js        Chamada à OpenAI (a chave só existe no servidor)
  api/admin/login           Login do administrador
  api/admin/logout          Encerra a sessão
  api/admin/chave           Consulta, salva e remove a chave
lib/
  prompts.js                Tipos de conteúdo e instruções para a IA
  markdown.js               Conversor simples de Markdown para HTML
  storage.js                Biblioteca em localStorage
  seguranca.js              Criptografia da chave e sessão do admin
  segredos.js               Leitura e gravação da chave no Redis
```
