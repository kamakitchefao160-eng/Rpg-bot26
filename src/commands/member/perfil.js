import fs from "fs";
import path from "path";
import { PREFIX } from "../../config.js";
import { isGroup, onlyNumbers } from "../../utils/index.js";
import { ITENS_LOJA } from "./loja.js";

// Correção dinâmica para o Termux encontrar a pasta independentemente de onde o bot iniciar
const dbPath = path.join(process.cwd(), "banco de dados", "rpg-usuarios.json");

// Garante que a pasta física exista no celular
const pastaDb = path.join(process.cwd(), "banco de dados");
if (!fs.existsSync(pastaDb)) {
  fs.mkdirSync(pastaDb, { recursive: true });
}

export default {
  name: "perfil",
  description: "Mostra sua ficha de herói ou o formulário de criação",
  commands: ["perfil", "ficha"],
  usage: `${PREFIX}perfil`,
  
  handle: async ({ args, socket, remoteJid, userLid, sendErrorReply }) => {
    if (!isGroup(remoteJid)) return sendErrorReply("Este comando só pode ser usado em grupo.");

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

    // 📋 SE O USUÁRIO NÃO EXISTIR: CRIA A CONTA E ENVIA O FORMULÁRIO COMPLETO COM RAÇAS E CLASSES
    if (!bancoRPG[numeroLimpo]) {
      bancoRPG[numeroLimpo] = {
        nomeOficial: `Recruta_${numeroLimpo.slice(-4)}`,
        personagem: "Não definido",
        raca: "Nenhuma (Ainda não escolheu)",
        classe: "Nenhuma (Ainda não escolheu)",
        titulo: "🌱 Aventureiro Novato",
        arma: "Nenhuma",
        moldura: "Nenhuma",
        consumivel: "Nenhum",
        montaria: "Nenhuma",
        ouro: 200, 
        hp: 100,
        escudo: 100,
        inventario: []
      };
      
      fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));

      // Construindo o catálogo completo de Raças
      let listaRacas = "";
      for (const [id, item] of Object.entries(ITENS_LOJA)) {
        if (item.tipo === "raca") {
          listaRacas += `*🔹 ID [${id}]* - ${item.nome}\n`;
        }
      }

      // Construindo o catálogo completo de Classes
      let listaClasses = "";
      for (const [id, item] of Object.entries(ITENS_LOJA)) {
        if (item.tipo === "classe") {
          listaClasses += `*🔸 ID [${id}]* - ${item.nome}\n`;
        }
      }

      let msgCriacao = `👋 *BEM-VINDO AO THE LEGENDARY ONLINE!*
───────────────────────────
Sua conta foi gerada no banco de dados. Como este é o seu primeiro acesso, você precisa preencher o seu formulário de criação de personagem!

🎁 *Sua primeira RAÇA e sua primeira CLASSE são GRATUITAS!*
💰 Seu saldo inicial de *🪙 200 moedas* ficou guardado para o futuro.

📋 *FORMULÁRIO DE ESCOLA (Escolha os IDs):*

🧬 *1. SELECIONE SUA RAÇA (Grátis):*
${listaRacas}
🛡️ *2. SELECIONE SUA CLASSE (Grátis):*
${listaClasses}
───────────────────────────
🛒 *COMO PREENCHER:*
Digite *${PREFIX}comprar [Número do ID]* para escolher sua raça e depois faça o mesmo para a classe!

💡 _Exemplo: Se quiser ser Elfo e Arqueiro, digite *${PREFIX}comprar 2* e depois *${PREFIX}comprar 24*._
Após escolher ambos, digite *${PREFIX}perfil* para ver sua ficha oficial pronta!`;

      return await socket.sendMessage(remoteJid, { text: msgCriacao, mentions: [targetLid] });
    }

    // SE O USUÁRIO JÁ EXISTIR: MOSTRA A FICHA NORMAL IGUAL ANTES
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
• *Arma:* 🗡️ ${dados.arma}
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
