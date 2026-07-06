# DeltaAI - Delta Admin: Diretrizes do Frontend

Este arquivo define os padrões arquiteturais, diretrizes de código e estilo visual para a aplicação **Frontend**.

---

## 1. Arquitetura de Pastas e Componentização Claramente Definida

Em vez da nomenclatura abstrata do Atomic Design (Atoms/Molecules/Organisms), organizamos nossos componentes de forma intuitiva, baseada na **responsabilidade e complexidade**:

```text
src/
├── assets/          # Arquivos estáticos (imagens, SVGs, fontes)
├── components/      # Componentes de interface organizados por escopo
│   ├── ui/          # Componentes visuais básicos e reutilizáveis (e.g., Botões, Badges, Modais, Skeletons)
│   ├── features/    # Componentes acoplados a regras de negócio e dados (e.g., ChatContainer, LoginMock, renderizadores de mensagens)
│   └── layouts/     # Componentes estruturais de layout de página (e.g., Sidebar, Layout Geral)
├── pages/           # Páginas da aplicação (orquestram componentes e carregamento de dados)
├── services/        # Clientes de API, adaptadores HTTP e integrações
├── hooks/           # Custom hooks para lógica de negócios e estado
└── styles/          # Tokens globais de CSS e variáveis
```

### Regras dos Componentes:
*   **UI Components**: Devem ser puros e sem regras de negócio ou chamadas de API. São customizáveis apenas via `props`.
*   **Feature Components**: Podem ler estados globais, hooks de API e lidar com lógica específica de features (e.g., chat, login mock).
*   **Layout Components**: Orquestram a estrutura visual de cabeçalhos, sidebars e grids de exibição.
*   **Pages**: Cada arquivo na pasta `pages/` representa uma visualização inteira do painel, separada por responsabilidade de tela (e.g. `EmpresasPage.tsx`).

### 1.1. Separação de Páginas e Roteamento
*   **Páginas Desacopladas**: O arquivo central `App.tsx` deve funcionar apenas como orquestrador geral de layout, menu de navegação lateral (Sidebar), barra de topo (Header) e controle de rotas de alto nível.
*   **Hash Routing/Navigation**: As rotas e navegação de páginas devem ser gerenciadas de forma declarativa e modular (e.g., mapeando a rota/hash para a renderização do componente correspondente da página importada de `src/pages/`). Evite colocar formulários e tabelas complexas de páginas diferentes dentro do mesmo arquivo `App.tsx`.
*   **Interface das Páginas**: Páginas devem expor métodos limpos e receber propriedades globais do estado de sessão (como `companyId` e `hasWritePermission`) para controlar permissões locais de leitura/escrita de forma coerente.

---

## 2. Padrões Modernos de React & TypeScript

*   **Custom Hooks para Regras de Negócio**: Separe a lógica do ciclo de vida e requisições da camada de visualização. Qualquer componente com lógica complexa ou chamadas de API deve extrair essa lógica para um hook dedicado (e.g., `useChatMessages.ts`).
*   **TypeScript Estrito**: Declare tipos explícitos para todas as `Props`. Evite o uso de `any`.
*   **Gerenciamento de Estado**:
    *   **Local**: Use `useState` e `useReducer` para estados locais de interface.
    *   **Compartilhado/Global**: Use `Context API` apenas para estados transversais verdadeiros (autenticação, tema).
*   **Performance**: Utilize `useMemo` e `useCallback` de forma consciente em listas longas ou renders caros. Evite rerenders desnecessários.

---

## 3. Identidade Visual e Estilo

Para manter a interface **moderna, clean e extremamente premium**:

*   **Styling**: Use **Vanilla CSS** nativo de forma modular (CSS Modules) ou arquivos estruturados associados ao componente. Evite estilos em linha (inline styles).
*   **Cores e Modo Escuro**: Defina uma paleta refinada baseada em HSL no arquivo CSS global (`index.css` / `variables.css`). Utilize tons sutis, cinzas azulados escuros para o modo dark, e realces com transições suaves.
*   **Tipografia**: Use fontes premium legíveis (como Inter ou Outfit) carregadas de forma otimizada.
*   **Efeitos Modernos**:
    *   **Glassmorphism**: Use `backdrop-filter: blur(...)` com bordas sutis e semitransparentes para modais, sidebars e painéis flutuantes.
    *   **Transições**: Adicione `transition: all 0.2s ease-in-out` para elementos interativos (hovers em botões, links, cards).
*   **Responsividade**: Desenvolva pensando em Mobile-First ou com breakpoints consistentes via Media Queries CSS bem organizadas.
