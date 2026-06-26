import fs from "fs";
import path from "path";
import { PREFIX } from "../../config.js";
import { isGroup } from "../../utils/index.js";
import { HAB_CLASSES } from "../utils/Habilidades.js"; 
import { RACAS_RPG } from "../utils/Racas.js"; // Importa as passivas que você criou

const dbPath = path.join(process.cwd(), "banco de dados", "rpg-usuarios.json");

export const BATALHAS_ATIVAS = new Map();

export default {
  name: "lutar",
  description: "Duelo interativo baseado na sua classe e raça equipadas",
  commands: ["lutar", "duelo", "atacar"],
  usage: `${PREFIX}lutar @jogador ou ${PREFIX}lutar [1, 2 ou 3] no seu turno`,

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

      // Formatação de compatibilidade para os nomes das classes
      let classeChave = atacante.classe;
      if (classeChave === "Bardo") classeChave = "Bardo (Músico Mágico)";
      if (classeChave === "Druida") classeChave = "Druida (Mago da Natureza)";
      if (classeChave === "Atirador de Elite") classeChave = "Atirador de Elite (Sniper)";
      if (classeChave === "Sacerdote") classeChave = "Sacerdote / Clérigo";
      if (classeChave === "Ladino") classeChave = "Ladino / Larápio";
      
      const golpesClasse = HAB_CLASSES[classeChave] || HAB_CLASSES["Guerreiro"];
      const passivaRacaAtacante = RACAS_RPG[atacante.raca] || { danoBonus: 0, criticoBonus: 0 };

      // 🛡️ ESCOLHA 3: DEFESA OU CURA
      if (escolha === 3) {
        const p3 = golpesClasse.p3;
        if (p3.curaBase) {
          atacante.hp = Math.min(atacante.hpMax, atacante.hp + p3.curaBase);
          msgTurno += `✨ *${atacante.nome}* usou *${p3.nome}* e recuperou *${p3.curaBase} HP*!\n`;
        } else {
          atacante.escudoAbsoluto = true;
          msgTurno += `🛡️ *${atacante.nome}* ativou *${p3.nome}* e vai bloquear o próximo golpe!\n`;
        }
      } else {
        // ⚔️ ESCOLHA 1 OU 2: ATAQUES DIRETOS
        const golpe = escolha === 1 ? golpesClasse.p1 : golpesClasse.p2;

        if (defensor.escudoAbsoluto) {
          msgTurno += `🛡️ *${defensor.nome}* bloqueou completamente o golpe *${golpe.nome}* com seu escudo!\n`;
          defensor.escudoAbsoluto = false; 
        } else {
          const sorteio = Math.random() * 100;
          // Aplica o Dano Base da Classe + O Dano Bônus da Raça do Atacante!
          let danoFinal = golpe.danoBase + (passivaRacaAtacante.danoBonus || 0);

          // Adiciona bônus de crítico da raça (ex: Elfo ganha +10% de chance de crítico)
          const taxaCritico = 10 + (passivaRacaAtacante.criticoBonus || 0);

          if (sorteio <= 30) {
            // ❌ 30% de Chance de Errar
            danoFinal = 0;
            msgTurno += `💨 *${atacante.nome}* tentou usar *${golpe.nome}*, mas errou o golpe!\n`;
          } else if (sorteio <= 50) {
            // 💥 20% de Chance de Raspão
            danoFinal = Math.floor(danoFinal * 0.5);
            msgTurno += `💥 *DE RASPÃO!* O golpe *${golpe.nome}* de *${atacante.nome}* pegou de raspão: Causou *${danoFinal} de dano*.\n`;
          } else if (sorteio <= (90 - (passivaRacaAtacante.criticoBonus || 0))) {
            // ⚔️ Chance de Dano Normal
            msgTurno += `⚔️ *IMPACTO!* *${atacante.nome}* acertou *${golpe.nome}*: Causou *${danoFinal} de dano*.\n`;
          } else {
            // ⚡ Chance de Crítico (Ampliada pela Raça)
            danoFinal = Math.floor(danoFinal * 1.5);
            msgTurno += `⚡ *🚨 CRÍTICO!* *${atacante.nome}* (Passiva de *${atacante.raca}*) acertou um ponto vital com *${golpe.nome}*: Causou *${danoFinal} de dano Letal*!\n`;
          }

          defensor.hp -= danoFinal;
        }
      }

      // FIM DE JOGO
      if (defensor.hp <= 0) {
        msgTurno += `\n💀 *${defensor.nome}* foi nocauteado!\n🏆 *VENCEDOR:* *${atacante.nome}*! (+150 Moedas de Ouro)`;
        BATALHAS_ATIVAS.delete(remoteJid);

        let bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
        if (bancoRPG[atacante.id]) {
          bancoRPG[atacante.id].ouro = (bancoRPG[atacante.id].ouro || 0) + 150;
          fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));
        }

        return socket.sendMessage(remoteJid, { text: msgTurno });
      }

      luta.vezId = defensor.id;
      luta.turnoAtual++;

      let oponenteChave = defensor.classe;
      if (oponenteChave === "Bardo") oponenteChave = "Bardo (Músico Mágico)";
      if (oponenteChave === "Druida") oponenteChave = "Druida (Mago da Natureza)";
      if (oponenteChave === "Atirador de Elite") oponenteChave = "Atirador de Elite (Sniper)";
      if (oponenteChave === "Sacerdote") oponenteChave = "Sacerdote / Clérigo";
      if (oponenteChave === "Ladino") oponenteChave = "Ladino / Larápio";
      const proximosGolpes = HAB_CLASSES[oponenteChave] || HAB_CLASSES["Guerreiro"];

      let painel = `${msgTurno}\n───────────────────────────\n`;
      painel += `⏳ *TURNO ${luta.turnoAtual} — VEZ DE @${defensor.id}* (⏱️ 30s)\n`;
      painel += `🧬 Raça: *${defensor.raca}* | 🎭 Classe: *${defensor.classe}*\n\n`;
      painel += `❤️ *${luta.jogador1.nome}:* ${Math.max(0, luta.jogador1.hp)}/${luta.jogador1.hpMax} HP ${luta.jogador1.escudoAbsoluto ? "🛡️" : ""}\n`;
      painel += `❤️ *${luta.jogador2.nome}:* ${Math.max(0, luta.jogador2.hp)}/${luta.jogador2.hpMax} HP ${luta.jogador2.escudoAbsoluto ? "🛡️" : ""}\n`;
      painel += `───────────────────────────\n`;
      painel += `🎮 *Escolha sua ação respondendo com /lutar [1, 2 ou 3]:*\n`;
      painel += `1️⃣ ${proximosGolpes.p1.nome} (Dano: ${proximosGolpes.p1.danoBase})\n`;
      painel += `2️⃣ ${proximosGolpes.p2.nome} (Dano: ${proximosGolpes.p2.danoBase})\n`;
      painel += `3️⃣ ${proximosGolpes.p3.nome} (${proximosGolpes.p3.curaBase ? "Cura" : "Defesa"})\n`;

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
      return sendErrorReply("❌ Desafie alguém marcando o usuário! Ex: `/lutar @jogador`");
    }
    
    const defensorId = mentions[0].split("@")[0];
    if (jogadorId === defensorId) return sendErrorReply("❌ Você não pode lutar contra si mesmo.");

    if (!fs.existsSync(dbPath)) return sendErrorReply("❌ Banco de dados offline.");
    let bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    
    const p1 = bancoRPG[jogadorId];
    const p2 = bancoRPG[defensorId];

    if (!p1 || !p2) return sendErrorReply("❌ Ambos precisam ter conta no RPG para batalhar.");

    const racaP1 = p1.raca || "Humano";
    const racaP2 = p2.raca || "Humano";
    const classeP1 = p1.classe || "Guerreiro";
    const classeP2 = p2.classe || "Guerreiro";

    // Pega as passivas de HP das Raças que você configurou (Ex: Titã ganha +50 HP, Orc ganha +30 HP)
    const passivaP1 = RACAS_RPG[racaP1] || { hpBonus: 0 };
    const passivaP2 = RACAS_RPG[racaP2] || { hpBonus: 0 };

    const hpMaxP1 = 100 + (passivaP1.hpBonus || 0);
    const hpMaxP2 = 100 + (passivaP2.hpBonus || 0);

    let buscaChave = classeP1;
    if (buscaChave === "Bardo") buscaChave = "Bardo (Músico Mágico)";
    if (buscaChave === "Druida") buscaChave = "Druida (Mago da Natureza)";
    if (buscaChave === "Atirador de Elite") buscaChave = "Atirador de Elite (Sniper)";
    if (buscaChave === "Sacerdote") buscaChave = "Sacerdote / Clérigo";
    if (buscaChave === "Ladino") buscaChave = "Ladino / Larápio";
    const golpesP1 = HAB_CLASSES[buscaChave] || HAB_CLASSES["Guerreiro"];

    const novaLuta = {
      vezId: jogadorId,
      turnoAtual: 1,
      jogador1: { id: jogadorId, nome: p1.nomeOficial, hp: hpMaxP1, hpMax: hpMaxP1, classe: classeP1, raca: racaP1, escudoAbsoluto: false },
      jogador2: { id: defensorId, nome: p2.nomeOficial, hp: hpMaxP2, hpMax: hpMaxP2, classe: classeP2, raca: racaP2, escudoAbsoluto: false },
      timer: null
    };

    BATALHAS_ATIVAS.set(remoteJid, novaLuta);

    let painelInicial = `⚔️ *DESAFIO ACEITO NA ARENA THE LEGENDARY* ⚔️\n`;
    painelInicial += `───────────────────────────\n`;
    painelInicial += `⏳ *TURNO 1 — VEZ DE @${jogadorId}* (⏱️ 30s)\n`;
    painelInicial += `🧬 Sua Raça: *${racaP1}* | 🎭 Classe: *${classeP1}*\n\n`;
    painelInicial += `❤️ *${p1.nomeOficial}:* ${hpMaxP1}/${hpMaxP1} HP\n❤️ *${p2.nomeOficial}:* ${hpMaxP2}/${hpMaxP2} HP\n`;
    painelInicial += `───────────────────────────\n`;
    painelInicial += `🎮 *Escolha sua ação respondendo com /lutar [1, 2 ou 3]:*\n`;
    painelInicial += `1️⃣ ${golpesP1.p1.nome} (Dano: ${golpesP1.p1.danoBase})\n`;
    painelInicial += `2️⃣ ${golpesP1.p2.nome} (Dano: ${golpesP1.p2.danoBase})\n`;
    painelInicial += `3️⃣ ${golpesP1.p3.nome} (${golpesP1.p3.curaBase ? "Cura" : "Defesa"})\n`;

    novaLuta.timer = setTimeout(() => {
      socket.sendMessage(remoteJid, { text: `⏱️ O desafiador demorou demais para agir.` });
      BATALHAS_ATIVAS.delete(remoteJid);
    }, 30000);

    await socket.sendMessage(remoteJid, { text: painelInicial, mentions: [userLid] });
  }
};
