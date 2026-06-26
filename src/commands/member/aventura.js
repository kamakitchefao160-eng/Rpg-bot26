import fs from "fs";
import path from "path";
import { PREFIX } from "../../config.js";
import { isGroup } from "../../utils/index.js";
import { RACAS_RPG } from "../../utilitarios/racas.js";

const dbPath = path.join(process.cwd(), "banco de dados", "rpg-usuarios.json");

const MONSTROS = [
  { nome: "Slime de Ácido 🟢", hp: 60, dano: 12 },
  { nome: "Goblin Saqueador 👺", hp: 80, dano: 15 },
  { nome: "Orc Enfurecido 🐗", hp: 110, dano: 18 },
  { nome: "Esqueleto Amaldiçoado 💀", hp: 90, dano: 16 },
  { nome: "Dragão Filhote 🔥", hp: 150, dano: 24 }
];

export default {
  name: "aventura",
  description: "Explore o mapa para enfrentar um monstro e ganhar de 30 a 100 de ouro (Limite: 3 por dia)",
  commands: ["aventura", "explorar", "pve"],
  usage: `${PREFIX}aventura`,

  handle: async ({ socket, remoteJid, userLid, sendErrorReply }) => {
    if (!isGroup(remoteJid)) return sendErrorReply("Este comando só pode ser usado em grupo.");

    const jogadorId = userLid.split("@")[0];

    if (!fs.existsSync(dbPath)) return sendErrorReply("❌ Banco de dados offline.");
    let bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

    const player = bancoRPG[jogadorId];
    if (!player) return sendErrorReply(`❌ Crie sua conta primeiro digitando *${PREFIX}perfil*!`);

    const hoje = new Date().toISOString().slice(0, 10);
    
    if (!player.limitesDiarios) player.limitesDiarios = {};
    if (player.limitesDiarios.data !== hoje) {
      player.limitesDiarios.data = hoje;
      player.limitesDiarios.aventuras = 0;
    }

    if (player.limitesDiarios.aventuras >= 3) {
      return socket.sendMessage(remoteJid, { 
        text: `⚠️ *LIMITE DIÁRIO ATINGIDO!* @${jogadorId}, você já realizou suas 3 aventuras de hoje. Volte amanhã para explorar mais!` 
      });
    }

    const monstro = MONSTROS[Math.floor(Math.random() * MONSTROS.length)];
    
    const passiva = RACAS_RPG[player.raca] || { hpBonus: 0, danoBonus: 0 };
    let playerHp = 100 + (passiva.hpBonus || 0);
    let playerDanoBonus = passiva.danoBonus || 0;

    let monstroHp = monstro.hp;

    let logBatalha = `🗺️ *EXPLORAÇÃO DE AVENTURA* 🗺️\n`;
    logBatalha += `───────────────────────────\n`;
    logBatalha += `⚔️ @${player.nomeOficial} encontrou um *${monstro.nome}* selvagem!\n\n`;
    logBatalha += `❤️ Seu HP: *${playerHp}* | 👾 HP do Monstro: *${monstroHp}*\n`;
    logBatalha += `───────────────────────────\n\n`;

    let turno = 1;
    while (playerHp > 0 && monstroHp > 0 && turno <= 6) {
      let danoPlayer = Math.floor(Math.random() * 15) + 15 + playerDanoBonus;
      monstroHp -= danoPlayer;
      logBatalha += `💥 *Turno ${turno}:* Você causou *${danoPlayer}* de dano no monstro.\n`;

      if (monstroHp <= 0) break;

      let danoMonstro = Math.floor(Math.random() * 10) + monstro.dano;
      playerHp -= danoMonstro;
      logBatalha += `👹 *Turno ${turno}:* O monstro te golpeou causando *${danoMonstro}* de dano.\n`;
      
      turno++;
    }

    logBatalha += `\n───────────────────────────\n`;

    if (monstroHp <= 0) {
      const ouroSorteado = Math.floor(Math.random() * (100 - 30 + 1)) + 30;
      player.ouro = (player.ouro || 0) + ouroSorteado;
      player.limitesDiarios.aventuras += 1;
      
      logBatalha += `🏆 *VITÓRIA INCRÍVEL!*\n`;
      logBatalha += `💀 Você derrotou o *${monstro.nome}*.\n`;
      logBatalha += `💰 *Recompensa:* 🪙 +${ouroSorteado} moedas de ouro.\n`;
      logBatalha += `📊 *Aventuras hoje:* ${player.limitesDiarios.aventuras}/3`;
    } else {
      player.limitesDiarios.aventuras += 1;
      logBatalha += `💀 *DERROTA!*\n`;
      logBatalha += `O *${monstro.nome}* provou ser forte demais e você teve que fugir para a cidade.\n`;
      logBatalha += `📊 *Aventuras hoje:* ${player.limitesDiarios.aventuras}/3`;
    }

    fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));

    return await socket.sendMessage(remoteJid, { text: logBatalha });
  }
};
