# GitLab Plugin (TRE-PR)

Plugin no padrão aberto **[Agent Plugins](https://agent-plugins.org/)** para integração com a instância interna do GitLab do TRE-PR (`gitlab.tre-pr.jus.br`). Permite que agentes de IA interajam diretamente com projetos, merge requests, issues, pipelines de CI/CD, wiki, releases, tags, milestones e outros recursos do GitLab através do Model Context Protocol (MCP).

O MCP server utilizado é o `@trepr/mcp-gitlab`, disponibilizado internamente no **Nexus do TRE-PR (`nexus.tre-pr.jus.br`)**, com suporte nativo a instâncias self-hosted e autenticação via OAuth2 Authorization Code Flow.

---

## Estrutura do Plugin

```text
gitlab-plugin/
├── plugin.json                     # Manifesto do plugin (Agent Plugins v1.0.0)
├── mcp.json                        # Configuração do MCP server (@trepr/mcp-gitlab)
├── skills/
│   └── gitlab-operator/
│       ├── SKILL.md                # Ponto focal com matriz de decisão
│       └── references/             # Guias detalhados sob demanda
├── icon.svg                        # Ícone do plugin
├── tre-root-v3.crt                 # Certificado raiz da AC interna do TRE-PR
├── README.md                       # Documentação do plugin
└── CHANGELOG.md                    # Histórico de versões
```

---

## Pré-requisitos

1. **Node.js** 22+ (necessário para o suporte a `--use-system-ca`)
2. **npx** disponível no PATH
3. **Configuração do Nexus no `~/.npmrc`**: O escopo `@trepr` deve apontar para o repositório npm do Nexus interno do TRE-PR:
   ```ini
   @trepr:registry=https://nexus.tre-pr.jus.br/repository/npm-group/
   ```
4. **Certificado da CA interna** do TRE-PR instalado no Certificate Store (geralmente distribuído via GPO na rede interna)

### Validação de Ambiente

```bash
node --version    # Deve retornar v22.x.x ou superior
npx --version     # Deve estar disponível no PATH
```

### SSL e Certificados

O GitLab do TRE-PR utiliza SSL com CA interna. A flag `--use-system-ca` (Node.js 22+) instrui o Node.js a confiar nos certificados do Certificate Store do sistema operacional.

Para verificar se o certificado da AC raiz está instalado no Windows:
```powershell
certutil -store Root "ACRAIZ"
```

Se o certificado não estiver instalado, utilize o arquivo `tre-root-v3.crt` incluído na raiz deste plugin:
```powershell
certutil -addstore Root "tre-root-v3.crt"
```

---

## Autenticação OAuth2 (Browser Flow)

Este plugin utiliza o **OAuth2 Authorization Code Flow** diretamente com o GitLab do TRE-PR como provedor de identidade. Não é necessário gerar ou salvar Personal Access Tokens manualmente.

### Como Funciona

1. Ao iniciar o MCP server, se não houver token válido, um servidor HTTP local é iniciado na porta `8888`.
2. O navegador abre automaticamente na página de autorização do GitLab (`https://gitlab.tre-pr.jus.br/oauth/authorize`).
3. O usuário realiza o login (caso não esteja logado).
4. O GitLab solicita autorização para a aplicação com escopo `api`.
5. Ao clicar em **Authorize**, o GitLab redireciona para `http://127.0.0.1:8888/callback` com o código de autorização.
6. O MCP server troca o código pelo token de acesso OAuth2 e inicia a comunicação.

### Detalhes Técnicos

| Aspecto | Valor |
|---------|-------|
| **Tipo de fluxo** | OAuth2 Authorization Code |
| **Provedor** | GitLab TRE-PR (`gitlab.tre-pr.jus.br`) |
| **Tipo de aplicação** | Pública (sem client secret) ou Confidencial (com `GITLAB_OAUTH_CLIENT_SECRET`) |
| **Escopos solicitados** | `api` (acesso completo à API) |
| **Redirect URI** | `http://127.0.0.1:8888/callback` |
| **Porta local** | 8888 (servidor HTTP temporário) |

---

## Skill: `gitlab-operator`

O plugin inclui a skill [`skills/gitlab-operator/SKILL.md`](skills/gitlab-operator/SKILL.md) que orienta o agente sobre:
- Convenções de referência a projetos (`group/subgroup/project` ou `usuario/projeto`).
- Modo somente leitura (`GITLAB_READ_ONLY_MODE`).
- Workflows de Merge Requests e Code Review estruturado (em 2 etapas).
- Gerenciamento de Issues, Pipelines de CI/CD, páginas de Wiki, Releases e Milestones.
- Tratamento estruturado de erros da API.
- Diretrizes de segurança e confirmação prévia para operações destrutivas.

---

## Workflows Comuns

### Projetos e Merge Requests
- *"Listar meus projetos no GitLab."*
- *"Mostrar merge requests abertos do projeto sds/sistemas/meu-projeto."*

### Code Review
- *"Revise o merge request !42 do projeto sds/sistemas/meu-projeto."*

### Issues
- *"Criar uma issue no projeto sds/sistemas/meu-projeto com título 'Bug no login'."*
- *"Listar issues abertas atribuídas a mim."*
- *"Fechar a issue #15 do projeto sds/sistemas/meu-projeto."*

### Pipelines de CI/CD
- *"Mostrar o status da última pipeline do projeto sds/sistemas/meu-projeto."*
- *"Ver o log do job 'build' que falhou na pipeline #123."*
- *"Retry da pipeline #123 do projeto sds/sistemas/meu-projeto."*

### Wiki, Releases e Milestones
- *"Listar páginas wiki do projeto sds/sistemas/meu-projeto."*
- *"Criar uma release v2.0.0 a partir da tag v2.0.0."*
- *"Criar milestone 'Sprint 42' com data de término 2026-07-01."*

---

## Troubleshooting

### Erro de SSL: "self-signed certificate in certificate chain"
- Verifique se o Node.js é versão 22+: `node --version`.
- Verifique se o certificado `ACRAIZ` está instalado: `certutil -store Root "ACRAIZ"`.
- Instale o certificado `tre-root-v3.crt` se necessário: `certutil -addstore Root "tre-root-v3.crt"`.

### Erro: "401 Unauthorized"
- O token OAuth pode ter expirado ou sido revogado. Reinicie ou reconecte o MCP server para abrir o navegador e autorizar novamente.

### Erro: "404 Not Found" ao acessar projeto
- Certifique-se de utilizar o namespace completo do projeto (ex: `grupo/subgrupo/projeto`).
- Verifique se seu usuário possui permissão de acesso ao projeto no GitLab.

### MCP Server não inicia ou "No tools available"
- Verifique se o Node.js 22+ e o `npx` estão instalados e disponíveis no PATH.
- Verifique se a porta 8888 não está ocupada por outro processo:
  ```powershell
  netstat -ano | findstr :8888
  ```

---

## Variáveis de Ambiente e Configuração

O pacote `@trepr/mcp-gitlab` é executado via `npx` e resolve as credenciais OAuth a partir do ambiente do usuário, garantindo que credenciais e IDs sensíveis não fiquem expostos no código versionado.

### Configuração das Credenciais OAuth

Configure as variáveis através de qualquer uma das opções abaixo:

1. **Variáveis de Ambiente do Sistema:**
   - Linux/macOS:
     ```bash
     export GITLAB_OAUTH_CLIENT_ID="<seu_client_id>"
     export GITLAB_OAUTH_CLIENT_SECRET="<seu_client_secret>" # Se confidencial
     ```
   - Windows:
     ```powershell
     [System.Environment]::SetEnvironmentVariable('GITLAB_OAUTH_CLIENT_ID', '<seu_client_id>', 'User')
     [System.Environment]::SetEnvironmentVariable('GITLAB_OAUTH_CLIENT_SECRET', '<seu_client_secret>', 'User') # Se confidencial
     ```
2. **Arquivo `.env` Local:** Crie um arquivo `.env` na raiz do workspace ou plugin (veja `.env.example`).
3. **Diretório Persistente do Usuário:** `${PLUGIN_DATA}/.env` (gerenciado pelo cliente Agent Plugins).
4. **Arquivo Global do Usuário:** `~/.gitlab-plugin.env`.

> [!NOTE]
> `GITLAB_OAUTH_CLIENT_SECRET` é **obrigatório apenas se** a aplicação OAuth no GitLab tiver sido criada com a opção **"Confidential"** marcada. Para aplicações públicas (não-confidenciais), deixe em branco.

### Variáveis Configuradas em `mcp.json`

| Variável | Valor Padrão | Descrição |
|----------|--------------|-----------|
| `GITLAB_USE_OAUTH` | `true` | Ativa autenticação OAuth2 |
| `GITLAB_OAUTH_REDIRECT_URI` | `http://127.0.0.1:8888/callback` | URI de callback local |
| `GITLAB_API_URL` | `https://gitlab.tre-pr.jus.br/api/v4` | URL da API do GitLab |
| `GITLAB_READ_ONLY_MODE` | `false` | Modo somente leitura (bloqueia mutações) |
| `USE_GITLAB_WIKI` | `true` | Habilita ferramentas de wiki |
| `USE_MILESTONE` | `true` | Habilita ferramentas de milestone |
| `USE_PIPELINE` | `true` | Habilita ferramentas de pipeline |
| `NODE_OPTIONS` | `--use-system-ca` | Carrega os certificados da CA do sistema |

---

## Licença

Distribuído sob uso interno TRE-PR.
