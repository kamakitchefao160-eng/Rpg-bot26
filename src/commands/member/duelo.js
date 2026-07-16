import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PREFIX } from "../../../config.js"; // CORRIGIDO: 3 níveis para a raiz!
import { isGroup } from "../../utils/index.js";
import { HAB_CLASSES } from "../../utilitarios/habilidades.js";
import { RACAS_RPG } from "../../utilitarios/racas.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pastaDatabase = path.resolve(__dirname, "../../../banco de dados");
const dbPath = path.join(pastaDatabase, "rpg-usuarios.json");

export const BATALHAS_ATIVAS = new Map();

function lerJSON(caminho) {
  if (!fs.existsSync(caminho)) return {};
  try { return JSON.parse(fs.readFileSync(caminho, "utf-8")); } catch { return {}; }
}

function salvarJSON(caminho, dados) {
  try { fs.writeFileSync(caminho, JSON.stringify(dados, null, 2)); return true; } catch { return false; }
}

export default {
  name: "duelo",
  description: "Sistema de batalha balanceado e corrigido",
  commands: ["lutar", "duelo", "atacar"],
  usage: `${PREFIX}duelo @jogador`,

  handle: async ({ socket, remoteJid, userLid, args, mentions, sendErrorReply }) => {
    if (!isGroup(remoteJid)) return sendErrorReply("Este comando só pode ser usado em grupo.");
    const jogadorId = userLid.split("@")[0];

    // TURNO ATIVO
    if (BATALHAS_ATIVAS.has(remoteJid)) {
      const luta = BATALHAS_ATIVAS.get(remoteJid);
      if (jogadorId !== luta.vezId) return;

      const escolha = parseInt(args[0]);
      if (!escolha || escolha < 1 || escolha > 3) {
        return socket.sendMessage(remoteJid, { text: "❌ Escolha inválida! Escolha de *1 a 3*." });
      }

      clearTimeout(luta.timer);

      let atacante = luta.jogador1.id === luta.vezId ? luta.jogador1 : luta.jogador2;
      let defensor = luta.jogador1.id === luta.vezId ? luta.jogador2 : luta.jogador1;

      let msg = `⚔️ *TURNO DE COMBATE* ⚔️\n\n`;
      const habilidades = HAB_CLASSES[atacante.classe] || HAB_CLASSES["Guerreiro"];

      if (escolha === 3) {
        const p3 = habilidades.p3;
        if (p3.curaBase) {
          atacante.hp = Math.min(atacante.hpMax, atacante.hp + p3.curaBase);
          msg += `✨ *${atacante.nome}* usou *${p3.nome}* e curou +${p3.curaBase} HP!\n`;
        } else {
          atacante.escudoAbsoluto = true;
          msg += `🛡️ *${atacante.nome}* preparou uma defesa impenetrável!\n`;
        }
      } else {
        const golpe = escolha === 1 ? habilidades.p1 : habilidades.p2;
        if (defensor.escudoAbsoluto) {
          msg += `🛡️ *${defensor.nome}* bloqueou o ataque completamente!\n`;
          defensor.escudoAbsoluto = false;
        } else {
          let dano = golpe.danoBase;
          defensor.hp -= dano;
          msg += `💥 *${atacante.nome}* usou *${golpe.nome}* causando *${dano} de dano* em *${defensor.nome}*!\n`;
        }
      }

      if (defensor.hp <= 0) {
        msg += `\n💀 *${defensor.nome}* caiu em batalha!\n🏆 *Vencedor:* *${atacante.nome}* (+150 Moedas e +20 EXP)!`;
        BATALHAS_ATIVAS.delete(remoteJid);

        let rpg = lerJSON(dbPath);
        if (rpg[atacante.id]) {
          rpg[atacante.id].ouro = (rpg[atacante.id].ouro || 0) + 150;
          rpg[atacante.id].exp = (rpg[atacante.id].exp || 0) + 20;
          
          // Adiciona EXP para o passe caso exista
          if (rpg[atacante.id].passeExp !== undefined) {
            rpg[atacante.id].passeExp += 10;
          }
          
          salvarJSON(dbPath, rpg);
        }
        return socket.sendMessage(remoteJid, { text: msg });
      }

      luta.vezId = defensor.id;
      luta.turnoAtual++;

      let painel = `${msg}\n` +
        `⏳ *TURNO ${luta.turnoAtual} - Vez de @${defensor.id}*\n` +
        `❤️ *${luta.jogador1.nome}:* ${luta.jogador1.hp} HP\n` +
        `❤️ *${luta.jogador2.nome}:* ${luta.jogador2.hp} HP\n\n` +
        `Digite *1*, *2* ou *3* para agir!`;

      luta.timer = setTimeout(() => {
        socket.sendMessage(remoteJid, { text: `⏱️ Tempo limite esgotado! @${defensor.id} demorou e perdeu.` });
        BATALHAS_ATIVAS.delete(remoteJid);
      }, 30000);

      return socket.sendMessage(remoteJid, { text: painel, mentions: [luta.jogador1.id + "@s.whatsapp.net", luta.jogador2.id + "@s.whatsapp.net"] });
    }

    // DESAFIO INICIAL
    if (!mentions || mentions.length === 0) return sendErrorReply("❌ Mencione quem deseja desafiar.");
    const defId = mentions[0].split("@")[0];
    if (jogadorId === defId) return sendErrorReply("❌ Não lute contra você mesmo.");

    let rpg = lerJSON(dbPath);
    if (!rpg[jogadorId] || !rpg[defId]) return sendErrorReply("❌ Ambos precisam ter perfil de RPG.");

    const p1 = rpg[jogadorId];
    const p2 = rpg[defId];

    const novaLuta = {
      vezId: jogadorId,
      turnoAtual: 1,
      jogador1: { id: jogadorId, nome: p1.personagem || p1.nomeOficial || "Guerreiro 1", hp: 100, hpMax: 100, classe: p1.classe || "Guerreiro", raca: p1.raca || "Humano", escudoAbsoluto: false },
      jogador2: { id: defId, nome: p2.personagem || p2.nomeOficial || "Guerreiro 2", hp: 100, hpMax: 100, classe: p2.classe || "Guerreiro", raca: p2.raca || "Humano", escudoAbsoluto: false },
      timer: null
    };

    BATALHAS_ATIVAS.set(remoteJid, novaLuta);

    let inicioMsg = `⚔️ *DESAFIO ACEITO!* ⚔️\n\n🔥 @${jogadorId} intimou @${defId}!\n👉 Digite *1* (Básico), *2* (Especial) ou *3* (Efeito/Defesa).`;
    
    novaLuta.timer = setTimeout(() => {
      socket.sendMessage(remoteJid, { text: `⏱️ Duelo cancelado por inatividade.` });
      BATALHAS_ATIVAS.delete(remoteJid);
    }, 30000);

    return socket.sendMessage(remoteJid, { text: inicioMsg, mentions: [jogadorId + "@s.whatsapp.net", defId + "@s.whatsapp.net"] });
  }
};
