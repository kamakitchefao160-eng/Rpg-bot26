import path from "node:path";
import { fileURLToPath } from "node:url";
import 'dotenv/config'; // 🔐 Esta linha carrega os dados secretos do seu arquivo .env automaticamente

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prefixo padrão dos comandos.
export const PREFIX = "/";

// Emoji do bot (mude se preferir).
export const BOT_EMOJI = "🌸";

// Nome do bot (mude se preferir).
export const BOT_NAME = "Takeshi Bot";

// LID do bot.
export const BOT_LID = "12345678901234567890@lid";

// LID do dono do bot.
export const OWNER_LID = "12345678901234567890@lid";

// Diretório dos comandos
export const COMMANDS_DIR = path.join(__dirname, "commands");

// Diretório de arquivos de mídia.
export const DATABASE_DIR = path.resolve(__dirname, "..", "database");

// Diretório de arquivos de mídia.
export const ASSETS_DIR = path.resolve(__dirname, "..", "assets");

// Diretório de arquivos temporários.
export const TEMP_DIR = path.resolve(__dirname, "..", "assets", "temp");

// Timeout em milissegundos por evento (evita banimento).
export const TIMEOUT_IN_MILLISECONDS_BY_EVENT = 500;

// Plataforma de API's
export const SPIDER_API_BASE_URL = "https://api.spiderx.com.br/api";

// Obtenha seu token, criando uma conta em: https://api.spiderx.com.br.
export const SPIDER_API_TOKEN = "seu_token_aqui";

// Plataforma recomendada para o comando gerar-link.
export const LINKER_BASE_URL = "https://linker.devgui.dev/api";

// Obtenha sua chave em: https://linker.devgui.dev.
export const LINKER_API_KEY = "seu_token_aqui";

// Caso queira responder apenas um grupo específico, coloque o ID dele abaixo.
export const ONLY_GROUP_ID = "";

// Configuração para modo de desenvolvimento
export const DEVELOPER_MODE = false;

// Caso queira usar proxy.
export const PROXY_PROTOCOL = "http";
export const PROXY_HOST = "";
export const PROXY_PORT = "";
export const PROXY_USERNAME = "";
export const PROXY_PASSWORD = "";

// Chave da OpenAI para o comando de suporte (pode deixar vazio se usar o Groq no RPG)
export const OPENAI_API_KEY = "";

// ==========================================
// 🚀 CONFIGURAÇÕES DO RPG (PUXANDO DO SEU .ENV)
// ==========================================
export const GROQ_API_KEY = process.env.GROQ_API_KEY || ""; // ⚡ Deixe assim! Ele busca no .env sozinho.
export const MARIDO_DA_RAIDEN = process.env.MARIDO_DA_RAIDEN || "5543996846448";
export const PRECO_PASSE_ELITE = parseInt(process.env.PRECO_PASSE_ELITE) || 5000;
export const CUSTO_GIRO_ROYALE = parseInt(process.env.CUSTO_GIRO_ROYALE) || 100;
export const CUSTO_DEZ_GIROS_ROYALE = parseInt(process.env.CUSTO_DEZ_GIROS_ROYALE) || 500;
