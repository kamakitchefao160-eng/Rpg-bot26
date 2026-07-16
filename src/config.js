import path from "node:path";
import { fileURLToPath } from "node:url";
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prefixo padrão dos comandos.
export const PREFIX = "/";

// Emoji do bot
export const BOT_EMOJI = "🌸";

// Nome do bot
export const BOT_NAME = "Takeshi Bot";

// LID do bot (troque depois)
export const BOT_LID = "12345678901234567890@lid";

// LID do dono do bot (troque depois)
export const OWNER_LID = "12345678901234567890@lid";

// Diretórios
export const COMMANDS_DIR = path.join(__dirname, "commands");
export const DATABASE_DIR = path.resolve(__dirname, "..", "banco de dados");
export const ASSETS_DIR = path.resolve(__dirname, "..", "assets");
export const TEMP_DIR = path.resolve(__dirname, "..", "assets", "temp");

// Timeout aumentado para evitar rate-limit
export const TIMEOUT_IN_MILLISECONDS_BY_EVENT = 800;

// APIs (deixe como está)
export const SPIDER_API_BASE_URL = "https://api.spiderx.com.br/api";
export const SPIDER_API_TOKEN = "seu_token_aqui";

export const LINKER_BASE_URL = "https://linker.devgui.dev/api";
export const LINKER_API_KEY = "seu_token_aqui";

export const ONLY_GROUP_ID = "";
export const DEVELOPER_MODE = false;

// Proxy (deixe vazio)
export const PROXY_PROTOCOL = "http";
export const PROXY_HOST = "";
export const PROXY_PORT = "";
export const PROXY_USERNAME = "";
export const PROXY_PASSWORD = "";

export const OPENAI_API_KEY = "";

// Configurações do RPG
export const GROQ_API_KEY = "SUA_CHAVE_GSK_AQUI_DENTRO"; // ✅ Coloque direto aqui!
export const MARIDO_DA_RAIDEN = process.env.MARIDO_DA_RAIDEN || "5543996846448";
export const PRECO_PASSE_ELITE = parseInt(process.env.PRECO_PASSE_ELITE) || 5000;
export const CUSTO_GIRO_ROYALE = parseInt(process.env.CUSTO_GIRO_ROYALE) || 100;
export const CUSTO_DEZ_GIROS_ROYALE = parseInt(process.env.CUSTO_DEZ_GIROS_ROYALE) || 500;
