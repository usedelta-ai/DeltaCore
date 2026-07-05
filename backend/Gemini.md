# DeltaAI - Delta Admin: Diretrizes do Backend

Este arquivo define as diretrizes arquiteturais e padrões de código para o **Backend**, utilizando o padrão de **Arquitetura Hexagonal (Portas e Adaptadores)**.

---

## 1. Estrutura de Arquitetura Hexagonal (Ports & Adapters)

O backend deve isolar a lógica de negócios central (o domínio) de preocupações externas, como frameworks web (Express), bibliotecas de banco de dados e clientes HTTP externos.

```text
src/
├── domain/            # Núcleo da aplicação (Sem dependências externas)
│   ├── entities/      # Modelos e regras de negócio essenciais
│   └── usecases/      # Casos de uso (Lógica de aplicação/regras de processo)
├── ports/             # Interfaces de comunicação
│   ├── driver/        # Portas de Entrada (Interfaces implementadas pelos Use Cases)
│   └── driven/        # Portas de Saída (Interfaces que os Adaptadores de Saída implementam)
├── adapters/          # Implementações tecnológicas específicas
│   ├── driver/        # Adaptadores de Entrada (e.g., Controllers Express, Middlewares, CLI)
│   └── driven/        # Adaptadores de Saída (e.g., Repositórios DB, Gateways de API, Email Sendgrid)
├── config/            # Variáveis de ambiente, conexões e setup inicial
├── db.ts              # Arquivo de inicialização/driver do banco de dados
└── server.ts          # Arquivo principal que acopla e inicia a aplicação Express
```

### Detalhamento das Camadas:

1.  **Domain (Domínio)**:
    *   Contém apenas regras puras do negócio.
    *   **NÃO** deve importar nada de bibliotecas externas (como Express, ORMs, bibliotecas de hash específicas).
2.  **Ports (Portas)**:
    *   Interfaces TypeScript puras.
    *   **Portas de Entrada (Driver/Primary)**: Métodos que a aplicação expõe para o mundo exterior (e.g., `CreateUserUseCase`).
    *   **Portas de Saída (Driven/Secondary)**: Abstrações das ferramentas que a aplicação precisa usar (e.g., `UserRepository`, `NotificationGateway`).
3.  **Adapters (Adaptadores)**:
    *   **Adaptadores de Entrada (Driver)**: Capturam a requisição externa, convertem os dados brutos e chamam um Caso de Uso usando a interface apropriada.
    *   **Adaptadores de Saída (Driven)**: Implementam as portas de saída. Aqui ficam as queries de SQL, chamadas Axios, envio de emails, etc.

---

## 2. Princípios de Clean Code & Segurança no Backend

*   **Validação Antecipada (Fail Fast)**: Valide todos os payloads recebidos nos adaptadores de entrada (e.g., usando Zod) antes de enviá-los ao Domínio.
*   **Tratamento Centralizado de Erros**:
    *   Lógica de erros de domínio deve lançar exceções customizadas (e.g., `UserNotFoundError`, `InvalidEmailError`).
    *   Um middleware global do Express captura essas exceções e as traduz em respostas HTTP adequadas com o status code correto.
*   **Injeção de Dependência**:
    *   Use cases devem receber suas dependências (Portas de Saída) via construtor ou fábrica de funções. Isso facilita a substituição por mocks nos testes unitários.
