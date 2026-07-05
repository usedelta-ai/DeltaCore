# DeltaAI - Delta Admin: Diretrizes Gerais de Desenvolvimento

Este arquivo contém as diretrizes gerais de arquitetura, padrões e boas práticas para guiar o desenvolvimento do projeto **Delta Admin**. Qualquer agente de IA ou desenvolvedor atuando neste repositório deve ler e seguir rigorosamente estas regras.

---

## 1. Visão Geral da Arquitetura

O **Delta Admin** é uma aplicação dividida em duas partes principais:
1. **`frontend/`**: Uma aplicação React SPA moderna construída com Vite, TypeScript e CSS Vanilla, focada em uma interface rica, limpa e responsiva.
2. **`backend/`**: Uma API construída com Node.js, Express, TypeScript e banco de dados, utilizando os princípios da **Arquitetura Hexagonal (Portas e Adaptadores)**.

---

## 2. Princípios Gerais de Clean Code & SOLID

*   **S - Single Responsibility Principle (SRP)**: Uma classe/função/arquivo deve ter apenas um motivo para mudar. No front, separe a renderização da lógica de negócios. No back, separe controllers de casos de uso e repositórios.
*   **O - Open/Closed Principle (OCP)**: Entidades de software devem estar abertas para extensão, mas fechadas para modificação. Use polimorfismo e interfaces.
*   **L - Liskov Substitution Principle (LSP)**: Subclasses devem ser substituíveis por suas superclasses ou interfaces sem quebrar a aplicação.
*   **I - Interface Segregation Principle (ISP)**: Muitas interfaces específicas são melhores do que uma única interface geral. Evite interfaces gigantescas.
*   **D - Dependency Inversion Principle (DIP)**: Dependa de abstrações (interfaces/portas), não de implementações concretas (adaptadores).

### Regras Práticas de Código Limpo:
*   **Nomes Significativos**: Use nomes autoexplicativos para funções, variáveis e classes. Evite abreviações confusas.
*   **Funções Pequenas**: Funções devem fazer apenas uma coisa e fazê-la bem. Se uma função tem mais de 20-30 linhas, considere refatorar.
*   **Tratamento de Erros Limpo**: Evite silenciar erros com `catch (e) {}` vazios. Trate e propague de forma robusta e amigável.
*   **Evite Código Duplicado (DRY)**: Centralize lógicas repetidas em utilitários bem testados.

---

## 3. Padrão de Comunicação Front-End & Back-End

*   **API RESTful**: A comunicação ocorre via requisições HTTP REST clássicas.
*   **Contratos de API Tipados**: Mantenha as definições de DTOs e payloads em sincronia estrutural. Sempre tipar respostas da API no frontend com interfaces TypeScript correspondentes às do backend.
*   **Resiliência e Tratamento de Erros**:
    *   O backend deve sempre responder com códigos de status HTTP corretos (e.g., `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`).
    *   O frontend deve interceptar e lidar elegantemente com falhas de rede e erros HTTP, mostrando feedbacks visuais adequados ao usuário.

---

## 4. Convenções do Repositório

*   **Commits Semânticos**: Use Conventional Commits (e.g., `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`).
*   **Idiomas**:
    *   Código (nomes de variáveis, funções, classes, arquivos, banco de dados): **Inglês**.
    *   Documentação, comentários e commits: **Português** (ou conforme o padrão já estabelecido no projeto).
