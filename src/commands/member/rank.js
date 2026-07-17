import fs from "fs";
import path from "path";
import { PREFIX, DATABASE_DIR } from "../../config.js";

const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");

export default {
  name: "rank",
  description: "Exibe o Rank Global baseado em Kills, Nível do Passe e Guildas",
  commands: ["rank", "top", "placar"],
  usage: `${PREFIX}rank`,

  handle: async ({ socket, remoteJid, userLid }) => { // <-- Adicionado userLid aqui para evitar novos erros de escopo
    if (!fs.existsSync(dbPath)) {
      return socket.sendMessage(remoteJid, { text: "❌ Nenhum jogador registrado no banco de dados ainda." });
    }

    let bancoRPG = {};
    try {
      bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    } catch {
      return socket.sendMessage(remoteJid, { text: "❌ Erro ao ler o banco de dados." });
    }

    const listaJogadores = Object.keys(bancoRPG).map(numero => {
      return {
        numero: numero,
        kills: bancoRPG[numero].kills || 0,
        nivel_passe: bancoRPG[numero].nivel_passe || 1,
        guilda: bancoRPG[numero].guilda || "Sem Guilda"
      };
    });

    if (listaJogadores.length === 0) {
      return socket.sendMessage(remoteJid, { text: "❌ Sem jogadores para gerar o rank." });
    }

    // Ordena principalmente por Kills (se empatar, olha o nível do Passe)
    listaJogadores.sort((a, b) => {
      if (b.kills === a.kills) {
        return b.nivel_passe - a.nivel_passe;
      }
      return b.kills - a.kills;
    });

    const top10 = listaJogadores.slice(0, 10);
    let painelRank = `🏆 ══════ 🏅 *RANK DE COMBATE* 🏅 ══════ 🏆\n\n`;
    const medalhas = ["🥇", "🥈", "🥉", "🏅", "🏅", "🏅", "🏅", "🏅", "🏅", "🏅"];
    const mencoes = [];

    top10.forEach((jogador, index) => {
      const medalha = medalhas[index];
      painelRank += `${medalha} *${index + 1}º* — @${jogador.numero}\n`;
      painelRank += `   ⚔️ *Kills:* ${jogador.kills} | 🎫 *Passe:* Nvl ${jogador.nivel_passe}\n`;
      painelRank += `   🛡️ *Guilda:* ${jogador.guilda}\n\n`;
      
      mencoes.push(`${jogador.numero}@lid`);
    });

    painelRank += `───────────────────────────\n⚡ _Vença duelos para subir sua contagem de Kills no servidor!_`;

    // Corrigido para passar a array 'mencoes', marcando os jogadores do topo corretamente
    return socket.sendMessage(remoteJid, { text: painelRank, mentions: mencoes });
  }
};
