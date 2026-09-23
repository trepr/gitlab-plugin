# @trepr/mcp-gitlab

Pacote npm interno do **TRE-PR** que empacota o servidor Model Context Protocol (MCP) do GitLab (`@zereight/mcp-gitlab`), pré-configurado com os padrões da instância interna (`gitlab.tre-pr.jus.br`) e resolução simplificada de credenciais OAuth.

---

## Recursos

- **Defaults do TRE-PR:** Aponta por padrão para `https://gitlab.tre-pr.jus.br/api/v4` e utiliza `NODE_OPTIONS=--use-system-ca` para integração com o Certificate Store.
- **Autenticação OAuth2:** Fluxo Authorization Code no navegador via porta local `8888`.
- **Resolução Flexível de Credenciais:** Lê `GITLAB_OAUTH_CLIENT_ID` e `GITLAB_OAUTH_CLIENT_SECRET` de variáveis de ambiente, arquivos `.env` locais ou globais (`~/.gitlab-plugin.env`).
- **Suporte a Aplicações Confidenciais e Públicas:** Suporta `GITLAB_OAUTH_CLIENT_SECRET` caso a aplicação OAuth no GitLab seja marcada como confidencial.

---

## Instalação e Execução

### Via `npx` (Recomendado)

Com o repositório do Nexus configurado no `~/.npmrc`:
```ini
@trepr:registry=https://nexus.tre-pr.jus.br/repository/npm-group/
```

Execute diretamente:
```bash
npx -y @trepr/mcp-gitlab
```

---

## Publicação no Nexus do TRE-PR

Para publicar uma nova versão deste pacote no repositório npm hospedado no Nexus:

```bash
# 1. Instale as dependências
npm install

# 2. Realize o login no Nexus (caso ainda não esteja autenticado)
npm login --registry=https://nexus.tre-pr.jus.br/repository/npm-hosted/

# 3. Publique o pacote
npm publish --registry=https://nexus.tre-pr.jus.br/repository/npm-hosted/
```

---

## Variáveis de Ambiente Suportadas

| Variável | Padrão | Descrição |
| :--- | :--- | :--- |
| `GITLAB_OAUTH_CLIENT_ID` | *(Obrigatório)* | Application ID gerado no GitLab (`User Settings -> Applications`). |
| `GITLAB_OAUTH_CLIENT_SECRET` | *(Opcional)* | Client secret (necessário apenas se aplicação for confidencial). |
| `GITLAB_API_URL` | `https://gitlab.tre-pr.jus.br/api/v4` | URL base da API do GitLab. |
| `GITLAB_OAUTH_REDIRECT_URI` | `http://127.0.0.1:8888/callback` | Redirect URI local para o OAuth browser flow. |
| `GITLAB_READ_ONLY_MODE` | `false` | Se `true`, recusa operações de escrita. |
| `NODE_OPTIONS` | `--use-system-ca` | Carrega certificados da CA interna do sistema operacional. |
