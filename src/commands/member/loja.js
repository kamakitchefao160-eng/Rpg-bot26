import fs from "fs";
import path from "path";
import { PREFIX } from "../../config.js";
import { isGroup } from "../../utils/index.js";

const dbPath = path.resolve("banco de dados", "rpg-usuarios.json");

// Aqui fica o catálogo oficial do seu RPG. Você pode adicionar quantos itens quiser!
export const ITENS_LOJA = {
  "1": { nome: "Arco Longo: Sopro da Primavera", preco: 200, tipo: "arma" },
  "2": { nome: "Brisa de Sakura (Moldura)", preco: 150, tipo: "moldura" },
  "3": { nome: "Elixir do Shogun (XP Duplo)", preco: 50, tipo: "consumivel" },
  "4": { nome: "Vassoura Voadora Mística", preco: 500, tipo: "montaria" },
  // Exemplo de como colocar o item 29 que você mencionou:
  "29": { nome: "Espada Justiceira de Elfo", preco: 1000, tipo: "arma" }
};

export default {
  name: "loja",
  description: "Mostra o catálogo de itens do RPG",
  commands: ["loja", "shop", "mercado"],
  usage: `${PREFIX}loja`,

  handle: async ({ socket, remoteJid, userLid, sendErrorReply }) => {
    if (!isGroup(remoteJid)) {
      return sendErrorReply("Este comando só pode ser usado em grupo.");
    }

    const numeroLimpo = userLid.split("@")[0];

    // Carrega o banco para ver o saldo atual do player na mensagem
    let bancoRPG = {};
    if (fs.existsSync(dbPath)) {
      bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    }

    const saldoAtual = bancoRPG[numeroLimpo] ? bancoRPG[numeroLimpo].ouro : 0;

    // Montando o catálogo visual da loja
    let textoLoja = `🛒 *LOJA OFICIAL DO RPG* 🛒\n\n`;
    textoLoja += `💰 *Seu Saldo:* 🪙 ${saldoAtual} moedas de ouro\n`;
    textoLoja += `─────────────────────────\n\n`;
    textoLoja += `Digite *!comprar [número]* para adquirir um item:\n\n`;

    for (const [id, item] of Object.entries(ITENS_LOJA)) {
      textoLoja += `*🆔 [${id}]* ➡️ *${item.nome}*\n`;
      textoLoja += `• 🪙 Custo: ${item.preco} moedas\n`;
      textoLoja += `• 🏷️ Tipo: ${item.tipo.toUpperCase()}\n\n`;
    }

    textoLoja += `─────────────────────────\n`;
    textoLoja += `🌸 Boas compras, herói!`;

    await socket.sendMessage(remoteJid, { text: textoLoja });
  }
};

