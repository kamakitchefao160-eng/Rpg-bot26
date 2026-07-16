import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PREFIX } from "../../config.js";
import { isGroup } from "../../utils/index.js";
import { HAB_CLASSES } from "../../utilitarios/habilidades.js";
import { RACAS_RPG } from "../../utilitarios/racas.js";

// Caminho absoluto seguro para a pasta "banco de dados"
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pastaDatabase = path.resolve(__dirname, "../../../banco de dados");
const dbPath = path.join(pastaDatabase, "rpg-usuarios.json");

export const BATALHAS_ATIVAS = new Map();

// Função auxiliar para ler JSON com segurança contra travamentos
function lerJSON(caminho) {
  if (!fs.existsSync(caminho)) return {};
  try {
    return JSON.parse(fs.readFileSync(caminho, "utf-8"));
  } catch (e) {
    console.error("Erro ao ler banco de dados no duelo:", e);
    return {};
  }
}

// Função auxiliar para salvar JSON com segurança
function salvarJSON(caminho, dados) {
  try {
    fs.writeFileSync(caminho, JSON.stringify(dados, null, 2));
    return true;
  } catch (e) {
    console.error("Erro ao salvar banco de dados no duelo:", e);
    return false;
  }
}

export default {
  name: "duelo",
  description: "Duelo interativo baseado na sua classe e raça equipadas",
  commands: ["lutar", "duelo", "atacar"], // Mantém todos os apelidos funcionando
  usage: `${PREFIX}duelo @jogador ou ${PREFIX}duelo [1, 2 ou 3] no seu turno`,

  handle: async ({ socket, remoteJid, userLid, args, mentions, sendErrorReply }) => {
    if (!isGroup(remoteJid)) return sendErrorReply("Este comando só pode ser usado em grupo.");
    const jogadorId = userLid.split("@")[0];

    // ───────────────────────────────────────────────────────────
    // FASE 1: EXECUÇÃO DO TURNO
    // ───────────────────────────────────────────────────────────
    if (BATALHAS_ATIVAS.has(remoteJid)) {
      const luta = BATALHAS_ATIVAS.get(remoteJid);
      if (jogadorId !== luta.vezId) return; 

      const escolha = parseInt(args[0]);
      if (!escolha || escolha < 1 || escolha > 3) {
        return socket.sendMessage(remoteJid, { text: "❌ Escolha inválida! Digite: *1, 2 ou 3*." });
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
        } else if (p3.escudoBase) {
          atacante.escudo = Math.min(100, atacante.escudo + p3.escudoBase);
          msgTurno += `🛡️ *${atacante.nome}* usou *${p3.nome}* e ganhou *${p3.escudoBase} de Escudo*!\n`;
        } else {
          atacante.escudoAbsoluto = true;
          msgTurno += `🛡️ *${atacante.nome}* ativou *${p3.nome}* e vai bloquear o próximo golpe!\n`;
        }
      } else {
        const golpe = escolha === 1 ? golpesClasse.p1 : golpesClasse.p2;

        if (defensor.escudoAbsoluto) {
          msgTurno += `🛡️ *${defensor.nome}* bloqueou completamente o golpe *${golpe.nome}* com seu escudo absoluto!\n`;
          defensor.escudoAbsoluto = false; 
        } else {
          const sorteio = Math.random() * 100;
          let danoFinal = golpe.danoBase + (passivaRacaAtacante.danoBonus || 0);

          if (sorteio <= 20) {
            danoFinal = 0;
            msgTurno += `💨 *${atacante.nome}* tentou usar *${golpe.nome}*, mas errou o golpe!\n`;
          } else if (sorteio <= 45) {
            danoFinal = Math.floor(danoFinal * 0.5);
            msgTurno += `💥 *DE RASPÃO!* O golpe *${golpe.nome}* de *${atacante.nome}* pegou de raspão: Causou *${danoFinal} de dano*.\n`;
          } else if (sorteio <= (90 - (passivaRacaAtacante.criticoBonus || 0))) {
            msgTurno += `⚔️ *IMPACTO!* *${atacante.nome}* acertou *${golpe.nome}*: Causou *${danoFinal} de dano*.\n`;
          } else {
            danoFinal = Math.floor(danoFinal * 1.5);
            msgTurno += `⚡ *🚨 CRÍTICO!* *${atacante.nome}* (Passiva de *${atacante.raca}*) acertou um ponto vital com *${golpe.nome}*: Causou *${danoFinal} de dano Letal*!\n`;
          }

          if (danoFinal > 0) {
            if (defensor.escudo > 0) {
              if (defensor.escudo >= danoFinal) {
                defensor.escudo -= danoFinal;
                msgTurno += `🛡️ O escudo de *${defensor.nome}* absorveu todo o dano! (Escudo Restante: ${defensor.escudo})\n`;
                danoFinal = 0;
              } else {
                danoFinal -= defensor.escudo;
                msgTurno += `🛡️ O escudo de *${defensor.nome}* quebrou mitigando *${defensor.escudo}* de dano!\n`;
                defensor.escudo = 0;
              }
            }
            defensor.hp -= danoFinal;
          }
        }
      }

      // Fim do Duelo - Vitória
      if (defensor.hp <= 0) {
        msgTurno += `\n💀 *${defensor.nome}* foi nocauteado!\n🏆 *VENCEDOR:* *${atacante.nome}*! (+150 Moedas de Ouro)`;
        BATALHAS_ATIVAS.delete(remoteJid);

        let bancoRPG = lerJSON(dbPath);
        if (bancoRPG[atacante.id]) {
          bancoRPG[atacante.id].ouro = (bancoRPG[atacante.id].ouro || 0) + 150;
          salvarJSON(dbPath, bancoRPG);
        }
        return socket.sendMessage(remoteJid, { text: msgTurno });
      }

      luta.vezId = defensor.id;
      luta.turnoAtual++;

      let painel = `${msgTurno}\n───────────────────────────\n`;
      painel += `⏳ *TURNO ${luta.turnoAtual} — VEZ DE @${defensor.id}* (⏱️ 30s)\n`;
      painel += `🧬 Raça: *${defensor.raca}* | 🎭 Classe: *${defensor.classe}*\n\n`;
      painel += `❤️ *${luta.jogador1.nome}:* ${Math.max(0, luta.jogador1.hp)} HP | 🛡️ Escudo: ${luta.jogador1.escudo}\n`;
      painel += `❤️ *${luta.jogador2.nome}:* ${Math.max(0, luta.jogador2.hp)} HP | 🛡️ Escudo: ${luta.jogador2.escudo}\n`;
      painel += `───────────────────────────\n`;
      painel += `Digite: *1* (Ataque Básico), *2* (Habilidade) ou *3* (Defesa/Cura/Especial)`;

      luta.timer = setTimeout(() => {
        socket.sendMessage(remoteJid, { text: `⏱️ Tempo esgotado! @${defensor.id} demorou demais e perdeu.` });
        BATALHAS_ATIVAS.delete(remoteJid);
      }, 30000);

      return socket.sendMessage(remoteJid, { text: painel, mentions: [luta.jogador1.id + "@s.whatsapp.net", luta.jogador2.id + "@s.whatsapp.net"] });
    }

    // ───────────────────────────────────────────────────────────
    // FASE 2: INÍCIO DO DUELO
    // ───────────────────────────────────────────────────────────
    if (!mentions || mentions.length === 0) {
      return sendErrorReply("❌ Desafie alguém marcando o usuário! Ex: `/duelo @jogador`");
    }
    
    const defensorId = mentions[0].split("@")[0];
    if (jogadorId === defensorId) return sendErrorReply("❌ Você não pode lutar contra si mesmo.");

    let bancoRPG = lerJSON(dbPath);
    
    const p1 = bancoRPG[jogadorId];
    const p2 = bancoRPG[defensorId];

    if (!p1 || !p2) return sendErrorReply("❌ Ambos os lutadores precisam ter conta no RPG para batalhar!");

    const racaP1 = p1.raca || "Humano";
    const racaP2 = p2.raca || "Humano";
    const classeP1 = p1.classe || "Guerreiro";
    const classeP2 = p2.classe || "Guerreiro";

    const passivaP1 = RACAS_RPG[racaP1] || { hpBonus: 0 };
    const passivaP2 = RACAS_RPG[racaP2] || { hpBonus: 0 };

    const hpMaxP1 = 100 + (passivaP1.hpBonus || 0);
    const hpMaxP2 = 100 + (passivaP2.hpBonus || 0);

    // Prioriza o nome customizado se houver
    const nomeP1 = p1.personagem && p1.personagem !== "Não definido (Use /nome)" ? p1.personagem : (p1.nomeOficial || "Guerreiro 1");
    const nomeP2 = p2.personagem && p2.personagem !== "Não definido (Use /nome)" ? p2.personagem : (p2.nomeOficial || "Guerreiro 2");

    const novaLuta = {
      vezId: jogadorId,
      turnoAtual: 1,
      jogador1: { id: jogadorId, nome: nomeP1, hp: hpMaxP1, hpMax: hpMaxP1, escudo: p1.escudo || 0, classe: classeP1, raca: racaP1, escudoAbsoluto: false },
      jogador2: { id: defensorId, nome: nomeP2, hp: hpMaxP2, hpMax: hpMaxP2, escudo: p2.escudo || 0, classe: classeP2, raca: racaP2, escudoAbsoluto: false },
      timer: null
    };

    BATALHAS_ATIVAS.set(remoteJid, novaLuta);

    let painelInicial = `⚔️ *UM DUELO FOI INICIADO!* ⚔️\n───────────────────────────\n`;
    painelInicial += `🔥 @${jogadorId} desafiou @${defensorId}!\n\n`;
    painelInicial += `👤 *${nomeP1}* (${classeP1}) vs 👤 *${nomeP2}* (${classeP2})\n\n`;
    painelInicial += `⏳ Vez de @${jogadorId}! Escolha sua ação digitando:\n`;
    painelInicial += `👉 *1* para usar o Golpe Básico\n`;
    painelInicial += `👉 *2* para usar a Habilidade Especial\n`;
    painelInicial += `👉 *3* para Usar Defesa/Cura\n`;
    painelInicial += `───────────────────────────\n⏱️ Você tem 30 segundos!`;

    novaLuta.timer = setTimeout(() => {
      socket.sendMessage(remoteJid, { text: `⏱️ Tempo esgotado! @${jogadorId} demorou demais para iniciar e o duelo foi cancelado.` });
      BATALHAS_ATIVAS.delete(remoteJid);
    }, 30000);

    return socket.sendMessage(remoteJid, { text: painelInicial, mentions: [jogadorId + "@s.whatsapp.net", defensorId + "@s.whatsapp.net"] });
  }
};
