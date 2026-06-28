import fs from "fs";
import path from "path";
import { PREFIX, DATABASE_DIR } from "../../config.js"; // Puxa o DATABASE_DIR correto do config

// Agora ele aponta direto para a pasta 'database' que está no seu GitHub
const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");

export default {
  name: "perfil",
  description: "Mostra sua ficha de herói e mochila",
  commands: ["perfil", "ficha"],
  usage: `${PREFIX}perfil`,
  
  handle: async ({ args, socket, remoteJid, userLid, sendErrorReply }) => {
    const numeroLimpo = userLid.split("@")[0];

    let bancoRPG = {};
    if (fs.existsSync(dbPath)) {
      try {
        bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
      } catch (e) {
        bancoRPG = {};
      }
    }

    if (!bancoRPG[numeroLimpo]) {
      bancoRPG[numeroLimpo] = {
        nomeOficial: `Lutador_${numeroLimpo.slice(-4)}`,
        personagem: "Não definido (Use /nome)",
        raca: "Ainda não escolheu (Use /loja racas)", 
        classe: "Ainda não escolheu (Use /loja classes)", 
        titulo: "🌱 Aventureiro Novato",
        arma: "Nenhuma",
        moldura: "Nenhuma",
        consumivel: "Nenhum",
        montaria: "Nenhuma",
        ouro: 200, 
        hp: 100,
        escudo: 100,
        racasCompradas: [], 
        classesCompradas: [], 
        inventario: []
      };
      
      // Garante que a pasta database existe antes de criar o arquivo
      if (!fs.existsSync(DATABASE_DIR)) {
        fs.mkdirSync(DATABASE_DIR, { recursive: true });
      }
      fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));
    }

    const dados = bancoRPG[numeroLimpo];

    const mochilaVisivel = dados.inventario && dados.inventario.length > 0 
      ? dados.inventario.map(item => `  📦 ${item}`).join("\n") 
      : "   📦 Sua mochila está vazia no momento."; // Corrigido o texto 'packing_box' para o emoji direto

    const barraHp = "█".repeat(Math.max(0, Math.floor(dados.hp / 10))).padEnd(10, "░");
    const barraEscudo = "█".repeat(Math.max(0, Math.floor(dados.escudo / 10))).padEnd(10, "░");

    const mensagemFicha = `✨ ═════ 🌎 *THE LEGENDARY ONLINE* 🌎 ═════ ✨
👋 Bem-vindo ao universo de The Legendary! Aqui jaz sua jornada:

👑 *FICHA DO AVENTUREIRO*
🌟 *Título:* ${dados.titulo}
👤 *Nome:* ${dados.nomeOficial}
🎭 *Personagem:* ${dados.personagem}
🧬 *Raça:* ${dados.raca}
⚔️ *Classe:* ${dados.classe}

📊 *ATRIBUTOS DE COMBATE*
❤️ *HP:* [${barraHp}] ${dados.hp}/100
🛡️ *Escudo:* [${barraEscudo}] ${dados.escudo}/100

🛡️ *EQUIPAMENTOS ATIVOS*
🗡️ *Arma:* ${dados.arma || "Nenhuma"}
🐎 *Montaria:* ${dados.montaria || "Nenhuma"}
🧪 *Consumível:* ${dados.consumivel || "Nenhum"}

🪙 *BANCO & FINANÇAS*
💰 *Saldo Atual:* 🪙 *${dados.ouro}* moedas de ouro

🎒 *MOCHILA DE ITENS*
${mochilaVisivel}

⚡ _Explore novos horizontes usando ${PREFIX}aventura ou desafie alguém com ${PREFIX}lutar!_
══════════════════════════════`;

    await socket.sendMessage(remoteJid, {
      text: mensagemFicha,
      mentions: [userLid]
    });
  }
};
