import fs from "fs";
import path from "path";
import { PREFIX } from "../../config.js";
import { isGroup, onlyNumbers } from "../../utils/index.js";

const dbPath = path.join(process.cwd(), "banco de dados", "rpg-usuarios.json");

export default {
  name: "perfil",
  description: "Mostra sua ficha de herói",
  commands: ["perfil", "ficha"],
  usage: `${PREFIX}perfil`,
  
  handle: async ({ args, socket, remoteJid, userLid, msg, sendErrorReply }) => {
    if (!isGroup(remoteJid)) return sendErrorReply("Este comando só pode ser usado em grupo.");

    const targetLid = args[0] ? `${onlyNumbers(args[0])}@lid` : userLid;
    const numeroLimpo = targetLid.split("@")[0];
    const nomeUsuario = msg.pushName || `Lutador_${numeroLimpo.slice(-4)}`;

    let bancoRPG = {};
    if (fs.existsSync(dbPath)) {
      try {
        bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
      } catch (e) {
        bancoRPG = {};
      }
    }

    // CRIA A CONTA DIRETO SEM TRAVAR NO FORMULÁRIO
    if (!bancoRPG[numeroLimpo]) {
      bancoRPG[numeroLimpo] = {
        nomeOficial: nomeUsuario,
        personagem: "Recruta da Arena",
        raca: "Humano", 
        classe: "Guerreiro", 
        titulo: "🌱 Aventureiro Novato",
        arma: "Espada de Treino 🗡️",
        moldura: "Nenhuma",
        consumivel: "Nenhum",
        montaria: "Nenhuma",
        ouro: 200, 
        hp: 100,
        escudo: 100,
        inventario: []
      };
      
      fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));
    }

    const dados = bancoRPG[numeroLimpo];

    const mensagemFicha = `╭━━⪩ ⚔️ THE LEGENDARY ONLINE ⪨━━
▢
👤 *HERÓI:* @${dados.nomeOficial}
🎭 *PERSONAGEM:* ${dados.personagem}
• *Raça:* ${dados.raca} 
• *Classe:* ${dados.classe}
• *Título:* ${dados.titulo}

🏹 *STATUS DE COMBATE:*
• *HP:* ❤️ ${dados.hp}/100
• *ESCUDO:* 🛡️ ${dados.escudo}/100

🎒 *INVENTÁRIO EQUIPADO:*
• *Arma:* ${dados.arma}
• *Montaria:* 🐎 ${dados.montaria}
• *Consumível:* 🧪 ${dados.consumivel}

💰 *FINANÇAS:*
• *Saldo:* 🪙 ${dados.ouro} moedas de ouro
▢
╰━━─「🎋」─━━`;

    await socket.sendMessage(remoteJid, {
      text: mensagemFicha,
      mentions: [targetLid]
    });
  }
};
