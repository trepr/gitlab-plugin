# Changelog

Todas as mudanças notáveis deste plugin serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e este projeto adota [Semantic Versioning](https://semver.org/).

## [2.0.0] — 2026-09-21

### Alterado
- Conversão do formato Kiro Power (`gitlab-trepr`) para o padrão aberto **[Agent Plugins](https://agent-plugins.org/)** (v1.0.0).
- Criação do manifesto `plugin.json` compatível com a especificação da Agent Plugins.
- Adaptação do `mcp.json` para adicionar o campo `"type": "stdio"` e o schema oficial de MCP da Agent Plugins.
- Adaptação da skill `gitlab-operator` para o padrão Agent Skills / MCP direto, removendo comandos proprietários `kiro_powers`.
- Redução do footprint da skill `gitlab-operator` através do padrão de *Progressive Disclosure*, mantendo o `SKILL.md` compacto (~84 linhas) com matriz de decisão e movendo detalhes para `references/` (`operations-guide.md`, `rules.md`, `error-handling.md`).
- Configuração do MCP server para chamada direta via `npx -y @trepr/mcp-gitlab`, com o pacote hospedado no Nexus interno do TRE-PR (`nexus.tre-pr.jus.br`).
- Suporte a resolução de credenciais OAuth (Client ID e Secret para aplicações públicas e confidenciais).
- Criação de `.gitignore` e `.env.example`.

### Removido
- Pastas legadas do Kiro: `/agents`, `/hooks` e `/steering`.
- Skill `/skills/git-operator`.

## [1.0.0] — 2025-06-30

### Adicionado
- Integração com GitLab TRE-PR via MCP server (`@zereight/mcp-gitlab`).
- Autenticação OAuth2 Authorization Code Flow (browser-based).
- Suporte a SSL com CA interna via `--use-system-ca` (Node.js 22+).
- Certificado `tre-root-v3.crt` incluso para instalação manual.
- Skill `gitlab-operator` para condução de operações no GitLab pelo agente.
- Documentação completa em pt-BR.
