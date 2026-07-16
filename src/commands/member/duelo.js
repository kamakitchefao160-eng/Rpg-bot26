import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PREFIX } from "../../../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pastaDatabase = path.resolve(__dirname, "../../../banco de dados");
const dbPath = path.join(pastaDatabase, "rpg-usuarios.json");

export const BATALHAS_ATIVAS = new Map();

// Dados embutidos diretamente para evitar erros de importação de arquivos que não existem
const CLASSES_RPG = {
  "Guerreiro": {
    p1: { nome: "Golpe de Espada", danoBase: 15 },
    p2: { nome: "Impacto Devastador", danoBase: 30 },
    p3: { nome: "Escudo de Ferro", escudoBase: 30 }
  },
  "Mago": {
    p1: { nome: "Dardo de Fogo", danoBase: 18 },
    p2: { nome: "Explosão Arcana", danoBase: 35 },
    p3: { nome: "Barreira Mágica", escudoBase: 25 }
  },
  "Arqueiro": {
    p1: { nome: "Tiro Rápido", danoBase: 16 },
    p2: { nome: "Chuva de Flechas", danoBase: 32 },
    p3: { nome: "Foco Absoluto", curaBase: 25 }
  }
};

const RACAS_RPG = {
  "Humano": { hpBonus: 0, danoBonus: 0, criticoBonus: 0 },
  "Elfo": { hpBonus: -10, danoBonus: 3, criticoBonus: 10 },
  "Anão": { hpBonus: 25, danoBonus: 0, criticoBonus: 0 },
  "Orc": { hpBonus: 10, danoBonus: 5, criticoBonus: -5 }
};

function lerJSON(caminho) {
  if (!fs.existsSync(caminho)) {
    if (!fs.existsSync(pastaDatabase)) {
      fs.mkdirSync(pastaDatabase, { recursive: true });
    }
    fs.writeFileSync(caminho, JSON.stringify({}, null, 2));
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(caminho, "utf-8"));
  } catch {
    return {};
  }
}

function salvarJSON(caminho, dados) {
  try {
    fs.writeFileSync(caminho, JSON.stringify(dados, null, 2));
    return true;
  } catch {
    return false;
  }
}

export default {
  name: "duelo",
  description: "Duelo RPG interativo",
  commands: ["lutar", "duelo", "atacar"],
  usage: `${PREFIX}duelo @jogador`,

  handle: async ({ socket, remoteJid, userLid, args, mentions, sendErrorReply }) => {
    const isGroup = remoteJid.endsWith("@g.us");
    if (!isGroup) return sendErrorReply("Este comando só pode ser usado em grupo.");
    const jogadorId = userLid.split("@")[0];

    if (BATALHAS_ATIVAS.has(remoteJid)) {
      const luta = BATALHAS_ATIVAS.get(remoteJid);
      if (jogadorId !== luta.vezId) return;

      const escolha = parseInt(args[0]);
      if (!escolha || escolha < 1 || escolha > 3) {
        return socket.sendMessage(remoteJid, { text: "❌ Escolha inválida! Digite: 1, 2 ou 3." });
      }

      clearTimeout(luta.timer);

      let atacante = luta.jogador1.id === luta.vezId ? luta.jogador1 : luta.jogador2;
      let defensor = luta.jogador1.id === luta.vezId ? luta.jogador2 : luta.jogador1;

      let msgTurno = `⚔️ *AÇÃO NA ARENA* ⚔️\n───────────────────────────\n`;
      const golpesClasse = CLASSES_RPG[atacante.classe] || CLASSES_RPG["Guerreiro"];
      const passivaRacaAtacante = RACAS_RPG[atacante.raca] || { danoBonus: 0, criticoBonus: 0 };

      if (escolha === 3) {
        const p3 = golpesClasse.p3;
        if (p3.curaBase) {
          atacante.hp = Math.min(atacante.hpMax, atacante.hp + p3.curaBase);
          msgTurno += `✨ *${atacante.nome}* usou *${p3.nome}* e curou *${p3.curaBase} HP*!\n`;
        } else {
          atacante.escudo = Math.min(100, atacante.escudo + p3.escudoBase);
          msgTurno += `🛡️ *${atacante.nome}* ativou *${p3.nome}* obtendo *${p3.escudoBase} de Escudo*!\n`;
        }
      } else {
        const golpe = escolha === 1 ? golpesClasse.p1 : golpesClasse.p2;
        const sorteio = Math.random() * 100;
        let danoFinal = golpe.danoBase + (passivaRacaAtacante.danoBonus || 0);

        if (sorteio <= 15) {
          danoFinal = 0;
          msgTurno += `💨 *${atacante.nome}* atacou com *${golpe.nome}*, mas errou o golpe!\n`;
        } else if (sorteio <= 40) {
          danoFinal = Math.floor(danoFinal * 0.5);
          msgTurno += `💥 *DE RASPÃO!* O golpe *${golpe.nome}* causou apenas *${danoFinal} de dano*.\n`;
        } else if (sorteio <= (85 - (passivaRacaAtacante.criticoBonus || 0))) {
          msgTurno += `⚔️ *ACERTO!* O ataque *${golpe.nome}* causou *${danoFinal} de dano*.\n`;
        } else {
          danoFinal = Math.floor(danoFinal * 1.5);
          msgTurno += `⚡ *🚨 CRÍTICO!* Golpe letal com *${golpe.nome}*: Causou *${danoFinal} de dano*!\n`;
        }

        if (danoFinal > 0) {
          if (defensor.escudo > 0) {
            if (defensor.escudo >= danoFinal) {
              defensor.escudo -= danoFinal;
              msgTurno += `🛡️ O escudo de *${defensor.nome}* absorveu todo o impacto! (Restante: ${defensor.escudo})\n`;
              danoFinal = 0;
            } else {
              danoFinal -= defensor.escudo;
              msgTurno += `🛡️ O escudo de *${defensor.nome}* quebrou absorvendo *${defensor.escudo}* de dano!\n`;
              defensor.escudo = 0;
            }
          }
          defensor.hp = Math.max(0, defensor.hp - danoFinal);
        }
      }

      if (defensor.hp <= 0) {
        msgTurno += `\n💀 *${defensor.nome}* foi derrotado!\n🏆 *VENCEDOR:* *${atacante.nome}*! (+150 Ouro, +30 EXP)`;
        BATALHAS_ATIVAS.delete(remoteJid);

        let bancoRPG = lerJSON(dbPath);
        if (bancoRPG[atacante.id]) {
          bancoRPG[atacante.id].ouro = (bancoRPG[atacante.id].ouro || 0) + 150;
          bancoRPG[atacante.id].exp = (bancoRPG[atacante.id].exp || 0) + 30;
          salvarJSON(dbPath, bancoRPG);
        }
        return socket.sendMessage(remoteJid, { text: msgTurno });
      }

      luta.vezId = defensor.id;
      luta.turnoAtual++;

      let painel = `${msgTurno}\n───────────────────────────\n⏳ *TURNO ${luta.turnoAtual} — VEZ DE @${defensor.id}*\n`;
      painel += `❤️ *${luta.jogador1.nome}:* ${luta.jogador1.hp} HP | 🛡️ Escudo: ${luta.jogador1.escudo}\n`;
      painel += `❤️ *${luta.jogador2.nome}:* ${luta.jogador2.hp} HP | 🛡️ Escudo: ${luta.jogador2.escudo}\n───────────────────────────\n`;
      painel += `Responda com:\n👉 *1* (Ataque Básico)\n👉 *2* (Habilidade Especial)\n👉 *3* (Defesa/Cura)`;

      luta.timer = setTimeout(() => {
        socket.sendMessage(remoteJid, { text: `⏱️ Tempo limite de turno excedido. @${defensor.id} perdeu por W.O.` });
        BATALHAS_ATIVAS.delete(remoteJid);
      }, 30000);

      return socket.sendMessage(remoteJid, { text: painel, mentions: [luta.jogador1.id + "@s.whatsapp.net", luta.jogador2.id + "@s.whatsapp.net"] });
    }

    if (!mentions || mentions.length === 0) return sendErrorReply("Mencione um oponente válido para duelar.");
    const defensorId = mentions[0].split("@")[0];
    if (jogadorId === defensorId) return sendErrorReply("Você não pode lutar contra você mesmo.");

    let bancoRPG = lerJSON(dbPath);
    const p1 = bancoRPG[jogadorId];
    const p2 = bancoRPG[defensorId];

    if (!p1 || !p2) return sendErrorReply("Ambos os jogadores precisam possuir um registro de RPG ativo.");

    const racaP1 = p1.raca || "Humano";
    const racaP2 = p2.raca || "Humano";
    const classeP1 = p1.classe || "Guerreiro";
    const classeP2 = p2.classe || "Guerreiro";

    const hpP1 = 100 + (RACAS_RPG[racaP1]?.hpBonus || 0);
    const hpP2 = 100 + (RACAS_RPG[racaP2]?.hpBonus || 0);

    const novaLuta = {
      vezId: jogadorId,
      turnoAtual: 1,
      jogador1: { id: jogadorId, nome: p1.personagem || "Jogador 1", hp: hpP1, hpMax: hpP1, escudo: 0, classe: classeP1, raca: racaP1 },
      jogador2: { id: defensorId, nome: p2.personagem || "Jogador 2", hp: hpP2, hpMax: hpP2, escudo: 0, classe: classeP2, raca: racaP2 },
      timer: null
    };

    BATALHAS_ATIVAS.set(remoteJid, novaLuta);

    let inicio = `⚔️ *O DUELO ESTÁ PRESTES A COMEÇAR!* ⚔️\n───────────────────────────\n🔥 @${jogadorId} desafiou @${defensorId}!\n\n👤 *${novaLuta.jogador1.nome}* vs 👤 *${novaLuta.jogador2.nome}*\n\n⏳ Vez de @${jogadorId}. Escolha:\n👉 *1* para Golpe Rápido\n👉 *2* para Habilidade\n👉 *3* para Defesa/Cura\n───────────────────────────\n⏱️ Turnos de 30 segundos!`;

    novaLuta.timer = setTimeout(() => {
      socket.sendMessage(remoteJid, { text: `⏱️ Desafio cancelado por inatividade.` });
      BATALHAS_ATIVAS.delete(remoteJid);
    }, 30000);

    return socket.sendMessage(remoteJid, { text: inicio, mentions: [jogadorId + "@s.whatsapp.net", defensorId + "@s.whatsapp.net"] });
  }
};
