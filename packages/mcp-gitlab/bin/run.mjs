#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/**
 * Carrega variáveis de um arquivo .env simples (sem dependências externas)
 */
function loadEnvFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return false;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let val = match[2].trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
    return true;
  } catch {
    return false;
  }
}

// 1. Carrega variáveis de arquivos candidatos (.env no cwd, diretório do plugin ou home)
const candidateEnvFiles = [
  process.env.PLUGIN_DATA && path.join(process.env.PLUGIN_DATA, '.env'),
  path.join(process.cwd(), '.env'),
  path.join(os.homedir(), '.gitlab-plugin.env'),
].filter(Boolean);

for (const envFile of candidateEnvFiles) {
  loadEnvFile(envFile);
}

// 2. Define defaults corporativos do TRE-PR se não informados
const defaults = {
  GITLAB_API_URL: 'https://gitlab.tre-pr.jus.br/api/v4',
  GITLAB_USE_OAUTH: 'true',
  GITLAB_OAUTH_REDIRECT_URI: 'http://127.0.0.1:8888/callback',
  GITLAB_READ_ONLY_MODE: 'false',
  USE_GITLAB_WIKI: 'true',
  USE_MILESTONE: 'true',
  USE_PIPELINE: 'true',
  NODE_OPTIONS: '--use-system-ca',
};

for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

// 3. Valida se o Client ID foi configurado
if (!process.env.GITLAB_OAUTH_CLIENT_ID) {
  console.error('\n[@trepr/mcp-gitlab] ERRO: GITLAB_OAUTH_CLIENT_ID não está configurado.');
  console.error('Por favor, configure o Client ID através de uma das seguintes opções:');
  console.error('  1. Defina a variável de ambiente: export GITLAB_OAUTH_CLIENT_ID="<seu_client_id>"');
  console.error(`  2. Crie um arquivo .env no diretório atual: ${path.join(process.cwd(), '.env')}`);
  console.error(`  3. Ou crie o arquivo global em: ${path.join(os.homedir(), '.gitlab-plugin.env')}\n`);
  process.exit(1);
}

// 4. Localiza o ponto de entrada do @zereight/mcp-gitlab
let entryScript = null;
try {
  // Tenta resolver a partir da dependência instalada no pacote
  entryScript = require.resolve('@zereight/mcp-gitlab');
} catch {
  // Fallback: se não encontrar localmente, usará npx
}

let child;
if (entryScript) {
  child = spawn(process.execPath, [entryScript, ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: process.env,
  });
} else {
  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  child = spawn(npxCmd, ['-y', '@zereight/mcp-gitlab', ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: process.env,
  });
}

child.on('error', (err) => {
  console.error('[@trepr/mcp-gitlab] Falha ao iniciar o MCP server:', err);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});
