import fs from "fs";
import path from "path";
import { PREFIX } from "../../config.js";

const dbPath = path.join(process.cwd(), "banco de dados", "rpg-usuarios.json");

export default {
  name: "perfil",
  description: "Mostra sua ficha de herói e mochila",
  commands: ["perfil", "ficha"],
  usage: `${PREFIX}perfil`,
  
  handle: async ({ args, socket, remoteJid, userLid, sendErrorReply }) => {
    // Coleta o ID do usuário de forma limpa e compatível com o restante do bot
    const numeroLimpo = userLid.split("@")[0];

    let bancoRPG = {};
    if (fs.existsSync(dbPath)) {
      try {
        bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
      } catch (e) {
        bancoRPG = {};
      }
    }

    // Se a conta não existir, cria ela zerada (Sem raça/classe inicial)
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
      
      fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));
    }

    const dados = bancoRPG[numeroLimpo];

    const mochilaVisivel = dados.inventario && dados.inventario.length > 0 
      ? dados.inventario.map(item => `• 📦 ${item}`).join("\n") 
      : "• Sua mochila está vazia no momento.";

    const mensagemFicha = `╭━━⪩ ⚔️ THE LEGENDARY ONLINE ⪨━━
▢
👤 *HERÓI:* ${dados.nomeOficial}
🎭 *PERSONAGEM:* ${dados.personagem}
• *Raça:* ${dados.raca} 
• *Classe:* ${dados.classe}
• *Título:* ${dados.titulo}

🏹 *STATUS DE COMBATE:*
• *HP:* ❤️ ${dados.hp}/100
• *ESCUDO:* 🛡️ ${dados.escudo}/100

🎒 *INVENTÁRIO EQUIPADO:*
• *Arma:* ${dados.arma || "Nenhuma"}
• *Montaria:* 🐎 ${dados.montaria || "Nenhuma"}
• *Consumível:* 🧪 ${dados.consumivel || "Nenhum"}

💰 *FINANÇAS:*
• *Saldo:* 🪙 ${dados.ouro} moedas de ouro

🎒 *MOCHILA DO JOGADOR:*
${mochilaVisivel}
▢
╰━━─「🎋」─━━`;

    await socket.sendMessage(remoteJid, {
      text: mensagemFicha,
      mentions: [userLid]
    });
  }
};
