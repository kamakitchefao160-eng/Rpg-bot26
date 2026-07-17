import fs from "fs";
import path from "path";
import { PREFIX, DATABASE_DIR } from "../../config.js";

const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");

// Mapeia onde cada item deve aparecer visualmente no cofre
const CATEGORIAS_COFRE = {
  // 👒 Chapéus
  "tio chapéu": "chapeu",
  "chapéu ff": "chapeu",
  "chapéu ff raro": "chapeu",
  "coroa do caos": "chapeu",
  
  // ⚔️ Armas e Evolutivos
  "espada antiga": "arma",
  "katana lendária": "arma",
  "cajado do infinito": "arma",
  "katana evolutiva lvl 1 (raríssimo)": "arma",
  "katana evolutiva (padrão)": "arma",
  "katana evolutiva (upgrade)": "arma",
  "caixa suprema x2": "arma",
  "caixa de armas suprema": "arma",

  // 🐴 Montarias
  "lobo da noite": "montaria",
  "dragão ancião (montaria)": "montaria",
  "dragão ancião": "montaria",

  // 🌸 Emblemas e Colecionáveis
  "emblema lendário de cerejeira": "emblema",
  "emblema cerejeira x5": "emblema",

  // 🧪 Consumíveis
  "poção de vida": "consumivel"
};

export default {
  name: "cofre",
  description: "Mostra todos os pertences, itens e colecionáveis do seu personagem",
  commands: ["cofre", "inventario", "mochila", "bag"],
  usage: `${PREFIX}cofre`,

  handle: async ({ socket, remoteJid, userLid }) => {
    const numeroLimpo = userLid.split("@")[0];

    let bancoRPG = {};
    if (fs.existsSync(dbPath)) {
      try { bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8")); } catch { bancoRPG = {}; }
    }

    const dados = bancoRPG[numeroLimpo];
    if (!dados) return socket.sendMessage(remoteJid, { text: "❌ Crie seu perfil primeiro." });

    const inventario = dados.inventario || [];

    if (inventario.length === 0) {
      return socket.sendMessage(remoteJid, {
        text: `📦 *SEU COFRE ESTÁ VAZIO* 📦\n───────────────────────────\n@${numeroLimpo}, você não possui itens guardados. Rode a roleta, compre na loja ou suba de nível no passe para rechear seu cofre!`,
        mentions: [userLid]
      });
    }

    // Listas separadas para o design do painel
    const chapeus = [];
    const armas = [];
    const montarias = [];
    const emblemas = [];
    const outros = [];

    // Classifica cada item limpando espaços e caixa alta
    inventario.forEach(item => {
      const formatado = item.toLowerCase().trim();
      const cat = CATEGORIAS_COFRE[formatado];

      if (cat === "chapeu") chapeus.push(`👒 ${item}`);
      else if (cat === "arma") armas.push(`⚔️ ${item}`);
      else if (cat === "montaria") montarias.push(`🐴 ${item}`);
      else if (cat === "emblema") emblemas.push(`🌸 ${item}`);
      else outros.push(`📦 ${item}`);
    });

    let corpoCofre = `✨ ══════ 📦 *COFRE DO GUERREIRO* 📦 ══════ ✨\n`;
    corpoCofre += `👤 *Dono:* @${numeroLimpo}\n`;
    corpoCofre += `🪙 *Banco:* 🪙 *${dados.ouro || 0}* ouros\n`;
    corpoCofre += `🌸 *Emblemas Totais:* 🌸 *${dados.emblemas_flor || 0}*\n`;
    corpoCofre += `───────────────────────────\n\n`;

    // 👒 Seção Chapéus
    corpoCofre += `👒 *EQUIPAMENTOS DE CABEÇA*:\n`;
    corpoCofre += chapeus.length > 0 ? chapeus.map(i => `  • ${i}`).join("\n") + "\n" : "  _Nenhum item nesta categoria._\n";
    corpoCofre += `───────────────────────────\n`;

    // ⚔️ Seção Armas
    corpoCofre += `⚔️ *ARMAS & ARTEFATOS EVOLUTIVOS*:\n`;
    corpoCofre += armas.length > 0 ? armas.map(i => `  • ${i}`).join("\n") + "\n" : "  _Nenhuma arma guardada._\n";
    corpoCofre += `───────────────────────────\n`;

    // 🐴 Seção Montarias
    corpoCofre += `🐴 *ESTÁBULO & MONTARIAS*:\n`;
    corpoCofre += montarias.length > 0 ? montarias.map(i => `  • ${i}`).join("\n") + "\n" : "  _Nenhuma montaria domada._\n";
    corpoCofre += `───────────────────────────\n`;

    // 🌸 Seção Emblemas
    corpoCofre += `🌸 *EMBLEMAS DO PASSE*:\n`;
    corpoCofre += emblemas.length > 0 ? emblemas.map(i => `  • ${i}`).join("\n") + "\n" : "  _Nenhum emblema guardado no inventário._\n";

    // Seção Outros
    if (outros.length > 0) {
      corpoCofre += `───────────────────────────\n`;
      corpoCofre += `🎒 *OUTROS RECURSOS*:\n`;
      corpoCofre += outros.map(i => `  • ${i}`).join("\n") + "\n";
    }

    corpoCofre += `\n🎮 _Exiba seus itens raros desafiando outros guerreiros!_`;

    return socket.sendMessage(remoteJid, {
      text: corpoCofre,
      mentions: [userLid]
    });
  }
};
