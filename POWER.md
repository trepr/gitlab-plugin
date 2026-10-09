---
name: "gitlab-plugin"
icon: "icon.svg"
displayName: "GitLab Plugin TRE-PR"
---

# GitLab Plugin TRE-PR

## Onboarding

### Step 1: Validar pré-requisitos do ambiente

Verifique se o ambiente atende aos requisitos mínimos antes de utilizar o plugin:

1. **Node.js** 22+ (necessário para a opção `--use-system-ca`)
2. **npx** disponível no PATH
3. **Configuração do Nexus no `~/.npmrc`**: O escopo `@trepr` deve apontar para o repositório npm do Nexus interno do TRE-PR:
   ```ini
   @trepr:registry=https://nexus.tre-pr.jus.br/repository/npm-group/
   ```
4. **Certificado da CA interna** do TRE-PR instalado no Certificate Store do sistema operacional (normalmente já distribuído via GPO na rede interna)

#### Comandos de validação

```powershell
node --version                  # Deve retornar v22.x.x ou superior
npx --version                   # Deve estar disponível no PATH
npm config get @trepr:registry  # Deve retornar https://nexus.tre-pr.jus.br/repository/npm-group/
```

Caso o registro do escopo `@trepr` não esteja configurado, execute:
```bash
npm config set @trepr:registry https://nexus.tre-pr.jus.br/repository/npm-group/
```

#### SSL e Certificados

O GitLab do TRE-PR utiliza SSL com CA interna. Este plugin resolve a confiança no certificado por meio da flag `--use-system-ca` do Node.js 22+, que instrui o Node.js a confiar nos certificados presentes no Certificate Store do sistema operacional.

**Não é necessária nenhuma configuração manual de certificado** — desde que:
1. O certificado da CA interna esteja instalado no sistema operacional (Trusted Root Certification Authorities no Windows)
2. A versão do Node.js seja 22 ou superior

Para verificar se o certificado está instalado no Windows:
```powershell
certutil -store Root "ACRAIZ"
```

Se o certificado não estiver instalado, o arquivo `tre-root-v3.crt` está disponível na raiz deste plugin. Instale-o com:
```powershell
certutil -addstore Root "tre-root-v3.crt"
```

Se algum pré-requisito não for atendido, informe ao usuário com as instruções de resolução e **não prossiga** com as operações do plugin até a regularização do ambiente.

### Step 2: Validar configuração de credenciais OAuth

O MCP server (`@trepr/mcp-gitlab`) requer a definição da variável `GITLAB_OAUTH_CLIENT_ID` para viabilizar o fluxo de autorização. Opcionalmente, caso a aplicação registrada no GitLab seja do tipo confidencial, a variável `GITLAB_OAUTH_CLIENT_SECRET` também deve ser informada.

O MCP server pesquisa credenciais nos seguintes locais (em ordem de prioridade):
1. Variáveis de ambiente do sistema (`GITLAB_OAUTH_CLIENT_ID` e `GITLAB_OAUTH_CLIENT_SECRET`)
2. Arquivo `.env` na raiz do workspace do projeto atual
3. Arquivo global do usuário `~/.gitlab-plugin.env` (Linux/macOS) ou `%USERPROFILE%\.gitlab-plugin.env` (Windows)

#### Alerta importante de persistência

> [!WARNING]
> **Nunca crie o arquivo `.env` dentro da pasta deste plugin!**
> O Kiro e gerenciadores de plugins substituem integralmente o diretório do plugin durante atualizações, excluindo qualquer arquivo local criado nessa pasta.
> Utilize o arquivo global `~/.gitlab-plugin.env` (recomendado), variáveis de ambiente do sistema ou o arquivo `.env` na raiz do workspace do seu projeto.

#### Como configurar

Caso a variável `GITLAB_OAUTH_CLIENT_ID` ainda não esteja configurada, oriente o usuário a adotar a opção recomendada (arquivo global):

- **Linux/macOS:** Crie o arquivo `~/.gitlab-plugin.env`:
  ```env
  GITLAB_OAUTH_CLIENT_ID=<seu_client_id>
  GITLAB_OAUTH_CLIENT_SECRET=<seu_client_secret> # Apenas se a aplicação for confidencial
  ```

- **Windows:** Crie o arquivo `%USERPROFILE%\.gitlab-plugin.env`:
  ```env
  GITLAB_OAUTH_CLIENT_ID=<seu_client_id>
  GITLAB_OAUTH_CLIENT_SECRET=<seu_client_secret> # Apenas se a aplicação for confidencial
  ```

Após definir as credenciais, reinicie o editor ou reconecte o MCP server para carregar os novos valores.

### Step 3: Autenticação OAuth2 (Browser Flow)

Este plugin utiliza **OAuth2 Authorization Code Flow** diretamente com a instância do GitLab do TRE-PR como provedor de identidade. Não é necessário gerar nem armazenar Personal Access Tokens manualmente — a autenticação ocorre pelo navegador.

#### Como funciona

1. **Ao iniciar o MCP server**, o servidor detecta a ausência de token de acesso válido e inicializa um servidor HTTP local na porta `8888`.
2. **O navegador abre automaticamente** na URL de autorização do GitLab (`https://gitlab.tre-pr.jus.br/oauth/authorize`).
3. **O usuário realiza o login** com as credenciais institucionais do GitLab (caso ainda não esteja com sessão ativa).
4. **O GitLab solicita autorização** para a aplicação com escopo `api`.
5. **Clique em "Authorize"** para conceder o acesso.
6. **O GitLab redireciona** a requisição para `http://127.0.0.1:8888/callback` contendo o código de autorização.
7. **O MCP server troca** o código pelo token de acesso OAuth2.
8. **Concluído** — o plugin está autenticado e pronto para executar as operações.

#### Detalhes técnicos

| Aspecto | Valor |
|---------|-------|
| **Tipo de fluxo** | OAuth2 Authorization Code |
| **Provedor** | GitLab TRE-PR (`gitlab.tre-pr.jus.br`) |
| **Tipo de aplicação** | Pública (sem client secret) ou Confidencial (com `GITLAB_OAUTH_CLIENT_SECRET`) |
| **Escopos solicitados** | `api` (acesso completo à API) |
| **Redirect URI** | `http://127.0.0.1:8888/callback` |
| **Porta local** | 8888 (servidor HTTP temporário) |

#### Consentimento no navegador

Na primeira autorização, o GitLab exibe uma tela com a seguinte solicitação:

```
Authorize <Aplicação> to use your account?

This application will be able to:
- Access the API on your behalf (api scope)

[Authorize]  [Deny]
```

Clique em **Authorize**. Esta autorização fica persistida no GitLab — em sessões subsequentes, a reautorização pode ocorrer de forma transparente.

#### Renovação e expiração

- O token OAuth2 é **armazenado localmente** pelo MCP server em memória durante a sessão.
- Quando o token expira, o MCP server realiza a renovação automática utilizando o **refresh token**.
- Se a renovação não for bem-sucedida (ex.: token revogado), o navegador será reaberto para efetuar nova autenticação.
- **Para forçar uma nova autenticação**: desconecte e reconecte o servidor MCP no painel de Powers/Plugins do Kiro.

#### Segurança

- Nenhum token ou credencial sensível é gravado em arquivos de código versionados.
- O fluxo OAuth2 garante que as operações do agente sejam executadas com as **mesmas permissões** atribuídas ao seu usuário no GitLab.
- O escopo `api` fornece acesso completo aos recursos da API.
- Para revogar o acesso concedido: gerencie as permissões em **GitLab → User Settings → Applications → Authorized Applications** e revogue a aplicação autorizada.
