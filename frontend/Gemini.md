# DeltaAI - Delta Admin: Diretrizes do Frontend

Este arquivo define os padrões arquiteturais, diretrizes de código e estilo visual para a aplicação **Frontend**.

---

## 1. Arquitetura de Pastas e Componentização Atômica

Utilizamos o conceito de **Atomic Design** adaptado para React, permitindo que os componentes sejam altamente reutilizáveis, modulares e fáceis de testar.

```text
src/
├── assets/          # Arquivos estáticos (imagens, SVGs, fontes)
├── components/      # Componentes organizados por nível atômico
│   ├── atoms/       # Elementos básicos (botões, inputs, labels, ícones)
│   ├── molecules/   # Combinações simples de átomos (campo de busca, item de lista)
│   ├── organisms/   # Estruturas complexas (sidebar, navbar, formulários, chat widget)
│   └── templates/   # Layouts de página (DashboardLayout, AuthLayout)
├── pages/           # Páginas completas da aplicação (instâncias de templates e organismos)
├── services/        # Clientes de API, adaptadores HTTP e gateways de integração
├── hooks/           # Custom hooks compartilhados (useAuth, useTheme, etc.)
├── context/         # Provedores de estado global (Context API)
├── styles/          # Tokens globais de CSS, variáveis e reset
└── utils/           # Funções utilitárias puras
```

### Regras dos Componentes Atômicos:
*   **Atoms**: Não devem conter regras de negócio nem estados complexos do domínio. Devem receber dados e callbacks via props.
*   **Molecules**: Gerenciam apenas estados internos simples (e.g., aberto/fechado, foco).
*   **Organisms**: Podem interagir com hooks de serviços ou contexts, mas devem focar na composição visual.
*   **Pages**: São responsáveis por inicializar a busca de dados, injetar estados nos componentes e estruturar as rotas.

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
