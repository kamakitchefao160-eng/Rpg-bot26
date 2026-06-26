import fs from "fs";
import path from "path";
import { PREFIX } from "../../config.js";
import { onlyNumbers } from "../../utils/index.js";

const dbPath = path.join(process.cwd(), "banco de dados", "rpg-usuarios.json");

export default {
  name: "perfil",
  description: "Mostra sua ficha de herói e mochila",
  commands: ["perfil", "ficha"],
  usage: `${PREFIX}perfil`,
  
  handle: async ({ args, socket, remoteJid, userLid, msg, sendErrorReply }) => {
    // 🛡️ CORREÇÃO: Evita a quebra caso msg ou pushName não existam (comum no privado)
    const nomeWhatsApp = msg?.pushName || `Lutador_${userLid.split("@")[0].slice(-4)}`;

    // Pega o ID limpando qualquer sufixo para bater certinho com o comando de resgatar e transferir
    const targetLid = args[0] ? `${onlyNumbers(args[0])}@lid` : userLid;
    const numeroLimpo = targetLid.split("@")[0];

    let bancoRPG = {};
    if (fs.existsSync(dbPath)) {
      try {
        bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
      } catch (e) {
        bancoRPG = {};
      }
    }

    // CONTA TOTALMENTE LIMPA E INICIALIZADA
    if (!bancoRPG[numeroLimpo]) {
      bancoRPG[numeroLimpo] = {
        nomeOficial: nomeWhatsApp,
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

    // Atualiza o nome oficial caso a pessoa tenha mudado no WhatsApp
    if (msg?.pushName && dados.nomeOficial !== msg.pushName && !args[0]) {
      dados.nomeOficial = msg.pushName;
      fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));
    }

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
      mentions: [targetLid]
    });
  }
};
