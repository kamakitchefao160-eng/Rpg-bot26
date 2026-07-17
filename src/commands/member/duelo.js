import fs from "fs";
import path from "path";
import { PREFIX, DATABASE_DIR } from "../../config.js";

const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");

export const BATALHAS_ATIVAS = new Map();

// [HAB_CLASSES e RACAS_RPG ocultados aqui para poupar espaço, mantenha os seus exatamente iguais]

function lerJSON(caminho) {
  try { return JSON.parse(fs.readFileSync(caminho, "utf-8")); } catch { return {}; }
}

function salvarJSON(caminho, dados) {
  try { fs.writeFileSync(caminho, JSON.stringify(dados, null, 2)); return true; } catch { return false; }
}

export default {
  name: "duelo",
  description: "Duelo de RPG utilizando classes e raças integradas",
  commands: ["lutar", "duelo", "atacar"],
  usage: `${PREFIX}duelo @jogador`,

  handle: async ({ socket, remoteJid, userLid, args, mentions }) => {
    const isGroup = remoteJid.endsWith("@g.us");
    if (!isGroup) return socket.sendMessage(remoteJid, { text: "❌ Este comando só pode ser usado em grupo." });

    const jidUsuario = userLid || remoteJid;
    const jogadorId = jidUsuario.split("@")[0];

    // 1. PRIMEIRA CHECAGEM: Se já existe uma batalha ativa, processa o turno primeiro!
    if (BATALHAS_ATIVAS.has(remoteJid)) {
      const luta = BATALHAS_ATIVAS.get(remoteJid);
      
      // Se não for a vez do jogador que enviou a mensagem, ignora em silêncio
      if (jogadorId !== luta.vezId) return;

      const escolha = parseInt(args[0]);
      if (!escolha || escolha < 1 || escolha > 3) {
        return socket.sendMessage(remoteJid, { text: "❌ Escolha inválida! Digite: 1, 2 ou 3." });
      }

      clearTimeout(luta.timer);

      let atacante = luta.jogador1.id === luta.vezId ? luta.jogador1 : luta.jogador2;
      let defensor = luta.jogador1.id === luta.vezId ? luta.jogador2 : luta.jogador1;

      let msgTurno = `⚔️ *AÇÃO NA ARENA* ⚔️\n───────────────────────────\n`;
      const golpesClasse = HAB_CLASSES[atacante.classe] || HAB_CLASSES["Guerreiro"];
      const passivaRacaAtacante = RACAS_RPG[atacante.raca] || { danoBonus: 0, criticoBonus: 0 };

      if (escolha === 3) {
        const p3 = golpesClasse.p3;
        if (p3.curaBase) {
          atacante.hp = Math.min(atacante.hpMax, atacante.hp + p3.curaBase);
          msgTurno += `✨ *${atacante.nome}* usou *${p3.nome}* e recuperou *${p3.curaBase} HP*!\n`;
        } else {
          atacante.escudo = Math.min(200, atacante.escudo + p3.escudoBase);
          msgTurno += `🛡️ *${atacante.nome}* ativou *${p3.nome}* ganhando *${p3.escudoBase} de Escudo*!\n`;
        }
      } else {
        const golpe = escolha === 1 ? golpesClasse.p1 : golpesClasse.p2;
        const sorteio = Math.random() * 100;
        let danoFinal = golpe.danoBase + (passivaRacaAtacante.danoBonus || 0);

        if (sorteio <= 12) {
          danoFinal = 0;
          msgTurno += `💨 *${atacante.nome}* tentou usar *${golpe.nome}*, mas errou o golpe!\n`;
        } else if (sorteio <= 35) {
          danoFinal = Math.floor(danoFinal * 0.6);
          msgTurno += `💥 *DE RASPÃO!* *${atacante.nome}* aplicou *${golpe.nome}* e causou *${danoFinal} de dano*.\n`;
        } else if (sorteio <= (85 - (passivaRacaAtacante.criticoBonus || 0))) {
          msgTurno += `⚔️ *ACERTO!* O golpe *${golpe.nome}* causou *${danoFinal} de dano*.\n`;
        } else {
          danoFinal = Math.floor(danoFinal * 1.5);
          msgTurno += `⚡ *🚨 GOLPE CRÍTICO!* *${atacante.nome}* usou *${golpe.nome}* causando *${danoFinal} de dano*!\n`;
        }

        if (danoFinal > 0) {
          if (defensor.escudo > 0) {
            if (defensor.escudo >= danoFinal) {
              defensor.escudo -= danoFinal;
              msgTurno += `🛡️ O escudo de *${defensor.nome}* absorveu o impacto! (Restante: ${defensor.escudo})\n`;
              danoFinal = 0;
            } else {
              danoFinal -= defensor.escudo;
              msgTurno += `🛡️ O escudo de *${defensor.nome}* estilhaçou amortecendo *${defensor.escudo}* de dano!\n`;
              defensor.escudo = 0;
            }
          }
          defensor.hp = Math.max(0, defensor.hp - danoFinal);
        }
      }

      if (defensor.hp <= 0) {
        msgTurno += `\n💀 *${defensor.nome}* foi derrotado por *${atacante.nome}*!\n🏆 *VENCEDOR:* *${atacante.nome}*! (+150 Ouro, +1 Vitória)`;
        BATALHAS_ATIVAS.delete(remoteJid);

        let bancoRPG = lerJSON(dbPath);
        if (bancoRPG[atacante.id]) {
          bancoRPG[atacante.id].ouro = (bancoRPG[atacante.id].ouro || 0) + 150;
          bancoRPG[atacante.id].vitorias = (bancoRPG[atacante.id].vitorias || 0) + 1; // Corrigido de +150 para +1
          bancoRPG[atacante.id].kills = (bancoRPG[atacante.id].kills || 0) + 1;
          salvarJSON(dbPath, bancoRPG);
        }
        if (bancoRPG[defensor.id]) {
          bancoRPG[defensor.id].derrotas = (bancoRPG[defensor.id].derrotas || 0) + 1;
          salvarJSON(dbPath, bancoRPG);
        }
        return socket.sendMessage(remoteJid, { text: msgTurno });
      }

      luta.vezId = defensor.id;
      luta.turnoAtual++;

      const proxClasse = HAB_CLASSES[defensor.classe] || HAB_CLASSES["Guerreiro"];
      let painel = `${msgTurno}\n───────────────────────────\n⏳ *TURNO ${luta.turnoAtual} — VEZ DE @${defensor.id}*\n`;
      painel += `❤️ *${luta.jogador1.nome}:* ${luta.jogador1.hp}/${luta.jogador1.hpMax} HP | 🛡️ Escudo: ${luta.jogador1.escudo}\n`;
      painel += `❤️ *${luta.jogador2.nome}:* ${luta.jogador2.hp}/${luta.jogador2.hpMax} HP | 🛡️ Escudo: ${luta.jogador2.escudo}\n───────────────────────────\n`;
      painel += `Escolha seu próximo movimento:\n`;
      painel += `👉 *1* - ${proxClasse.p1.nome}\n`;
      painel += `👉 *2* - ${proxClasse.p2.nome}\n`;
      painel += `👉 *3* - ${proxClasse.p3.nome}`;

      luta.timer = setTimeout(() => {
        socket.sendMessage(remoteJid, { text: `⏱️ Turno esgotado! @${defensor.id} demorou demais e perdeu por inatividade.` });
        BATALHAS_ATIVAS.delete(remoteJid);
      }, 30000);

      return socket.sendMessage(remoteJid, { text: painel, mentions: [luta.jogador1.id + "@s.whatsapp.net", luta.jogador2.id + "@s.whatsapp.net"] });
    }

    // 2. SEGUNDA CHECAGEM: Se não houver batalha ativa, aí sim exige a menção para começar uma nova.
    if (!mentions || mentions.length === 0) {
      return socket.sendMessage(remoteJid, { text: `❌ Mencione um oponente válido para desafiar! Ex: \`${PREFIX}duelo @jogador\`` });
    }

    const defensorId = mentions[0].split("@")[0];
    if (jogadorId === defensorId) {
      return socket.sendMessage(remoteJid, { text: "❌ Você não pode desafiar a si mesmo." });
    }

    let bancoRPG = lerJSON(dbPath);
    const p1 = bancoRPG[jogadorId];
    const p2 = bancoRPG[defensorId];

    if (!p1 || !p2) {
      return socket.sendMessage(remoteJid, { text: "❌ Ambos os jogadores precisam ter um perfil de RPG ativo para duelar." });
    }

    const classeP1 = p1.classe && p1.classe !== "Não definida" ? p1.classe : "Guerreiro";
    const classeP2 = p2.classe && p2.classe !== "Não definida" ? p2.classe : "Guerreiro";
    const racaP1 = p1.raca && p1.raca !== "Não definida" ? p1.raca : "Humano";
    const racaP2 = p2.raca && p2.raca !== "Não definida" ? p2.raca : "Humano";

    const hpP1 = 200 + (RACAS_RPG[racaP1]?.hpBonus || 0);
    const hpP2 = 200 + (RACAS_RPG[racaP2]?.hpBonus || 0);

    const novaLuta = {
      vezId: jogadorId,
      turnoAtual: 1,
      jogador1: { id: jogadorId, nome: p1.nomeOficial || "Jogador 1", hp: hpP1, hpMax: hpP1, escudo: 100, classe: classeP1, raca: racaP1 },
      jogador2: { id: defensorId, nome: p2.nomeOficial || "Jogador 2", hp: hpP2, hpMax: hpP2, escudo: 100, classe: classeP2, raca: racaP2 },
      timer: null
    };

    BATALHAS_ATIVAS.set(remoteJid, novaLuta);

    const golpe1 = HAB_CLASSES[classeP1] || HAB_CLASSES["Guerreiro"];
    let inicio = `⚔️ *O DUELO FOI INICIADO!* ⚔️\n───────────────────────────\n🔥 @${jogadorId} desafiou @${defensorId}!\n\n`;
    inicio += `👤 *${novaLuta.jogador1.nome}* [Classe: ${classeP1} | Raça: ${racaP1}]\n`;
    inicio += `👤 *${novaLuta.jogador2.nome}* [Classe: ${classeP2} | Raça: ${racaP2}]\n\n`;
    inicio += `💖 Ambos começam com Vida customizada e *🛡️ 100 de Escudo*!\n───────────────────────────\n`;
    inicio += `⏳ Vez de @${jogadorId}. Selecione a sua ação digitando apenas o número:\n`;
    inicio += `👉 *1* - ${golpe1.p1.nome}\n`;
    inicio += `👉 *2* - ${golpe1.p2.nome}\n`;
    inicio += `👉 *3* - ${golpe1.p3.nome}\n───────────────────────────\n⏱️ Você tem 30 segundos!`;

    novaLuta.timer = setTimeout(() => {
      socket.sendMessage(remoteJid, { text: `⏱️ O duelo entre @${jogadorId} e @${defensorId} foi cancelado por falta de atividade.` });
      BATALHAS_ATIVAS.delete(remoteJid);
    }, 30000);

    return socket.sendMessage(remoteJid, { text: inicio, mentions: [jogadorId + "@s.whatsapp.net", defensorId + "@s.whatsapp.net"] });
  }
};
