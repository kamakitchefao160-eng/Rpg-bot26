import fs from "fs";
import path from "path";
import { PREFIX } from "../../config.js";
import { isGroup } from "../../utils/index.js";

const dbPath = path.resolve("banco de dados", "rpg-usuarios.json");

export const ITENS_LOJA = {
  // 🧬 RAÇAS (Custo: 200)
  "1": { nome: "Humano", preco: 200, tipo: "raca" },
  "2": { nome: "Elfo", preco: 200, tipo: "raca" },
  "3": { nome: "Oni (Demônio Oriental)", preco: 200, tipo: "raca" },
  "4": { nome: "Meio-Fera", preco: 200, tipo: "raca" },
  "5": { nome: "Anão", preco: 200, tipo: "raca" },
  "6": { nome: "Morto-Vivo", preco: 200, tipo: "raca" },
  "7": { nome: "Vampiro", preco: 200, tipo: "raca" },
  "8": { nome: "Anjo Caído", preco: 200, tipo: "raca" },
  "9": { nome: "Fada", preco: 200, tipo: "raca" },
  "10": { nome: "Sereia / Tritão", preco: 200, tipo: "raca" },
  "11": { nome: "Goblin", preco: 200, tipo: "raca" },
  "12": { nome: "Orc", preco: 200, tipo: "raca" },
  "13": { nome: "Ciborgue / Autômato", preco: 200, tipo: "raca" },
  "14": { nome: "Espírito / Fantasma", preco: 200, tipo: "raca" },
  "15": { nome: "Draconato (Meio-Dragão)", preco: 200, tipo: "raca" },
  "16": { nome: "Elfo Negro (Drow)", preco: 200, tipo: "raca" },
  "17": { nome: "Slime Humanóide", preco: 200, tipo: "raca" },
  "18": { nome: "Metamorfo", preco: 200, tipo: "raca" },
  "19": { nome: "Titã (Gigante)", preco: 200, tipo: "raca" },
  "20": { nome: "Ser Estelar", preco: 200, tipo: "raca" },

  // 🛡️ CLASSES (Custo: 200)
  "21": { nome: "Guerreiro", preco: 200, tipo: "classe" },
  "22": { nome: "Mago", preco: 200, tipo: "classe" },
  "23": { nome: "Assassino", preco: 200, tipo: "classe" },
  "24": { nome: "Arqueiro", preco: 200, tipo: "classe" },
  "25": { nome: "Samurai", preco: 200, tipo: "classe" },
  "26": { nome: "Sacerdote / Clérigo", preco: 200, tipo: "classe" },
  "27": { nome: "Paladino", preco: 200, tipo: "classe" },
  "28": { nome: "Necromante", preco: 200, tipo: "classe" },
  "29": { nome: "Ninja", preco: 200, tipo: "classe" },
  "30": { nome: "Ladino / Larápio", preco: 200, tipo: "classe" },
  "31": { nome: "Bardo", preco: 200, tipo: "classe" },
  "32": { nome: "Bárbaro", preco: 200, tipo: "classe" },
  "33": { nome: "Monge", preco: 200, tipo: "classe" },
  "34": { nome: "Alquimista", preco: 200, tipo: "classe" },
  "35": { nome: "Cavaleiro Rúnico", preco: 200, tipo: "classe" },
  "36": { nome: "Druida", preco: 200, tipo: "classe" },
  "37": { nome: "Lanceiro", preco: 200, tipo: "classe" },
  "38": { nome: "Invocador (Summoner)", preco: 200, tipo: "classe" },
  "39": { nome: "Atirador de Elite (Sniper)", preco: 200, tipo: "classe" },
  "40": { nome: "Berserker", preco: 200, tipo: "classe" },

  // 🏅 TÍTULOS
  "41": { nome: "🌸 Guardião de Sakura", preco: 100, tipo: "titulo" },
  "42": { nome: "⚔️ Andarilho das Sombras", preco: 100, tipo: "titulo" },
  "43": { nome: "🔥 Arauto do Cataclismo", preco: 150, tipo: "titulo" },
  "44": { nome: "👑 Soberano da Taverna", preco: 200, tipo: "titulo" },

  // 🐎 MONTARIAS & COSMÉTICOS
  "45": { nome: "Vassoura Voadora Mística", preco: 500, tipo: "montaria" },
  "46": { nome: "Brisa de Sakura (Moldura)", preco: 150, tipo: "moldura" },

  // 🧪 CONSUMÍVEIS & EVENTOS (Novos itens adicionados aqui!)
  "47": { nome: "Poção de HP Maior", preco: 30, tipo: "consumivel" },
  "48": { nome: "🎟️ Ticket Gojo [EM BREVE]", preco: 99999, tipo: "raro" },
  "49": { nome: "🎟️ Ticket Deku [EM BREVE]", preco: 99999, tipo: "raro" },
  "50": { nome: "🎫 Passe de Elite (Temporada 1)", preco: 1000, tipo: "passe" }
};

export default {
  name: "loja",
  description: "Mostra as abas de itens do RPG",
  commands: ["loja", "shop"],
  usage: `${PREFIX}loja [racas/classes/itens]`,

  handle: async ({ args, socket, remoteJid, userLid, sendErrorReply }) => {
    if (!isGroup(remoteJid)) return sendErrorReply("Este comando só pode ser usado em grupo.");

    const categoria = args[0] ? args[0].toLowerCase() : "";
    
    let bancoRPG = {};
    if (fs.existsSync(dbPath)) bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    const numeroLimpo = userLid.split("@")[0];
    
    const p = bancoRPG[numeroLimpo] || {};
    const saldo = p.ouro || 0;

    // Pega o que o jogador já comprou para colocar o selo
    const racasCompradas = p.racasCompradas || [p.raca || "Humano"];
    const classesCompradas = p.classesCompradas || [p.classe || "Nenhuma"];
    const inventario = p.inventario || [];

    let textoLoja = `🛒 *LOJA THE LEGENDARY ONLINE* 🛒\n`;
    textoLoja += `💰 *Seu Saldo:* 🪙 ${saldo} moedas de ouro\n`;
    textoLoja += `─────────────────────────\n\n`;

    if (categoria === "racas") {
      textoLoja += `🧬 *ABA DE RAÇAS (Custo: 🪙 200)*\n\n`;
      for (const [id, item] of Object.entries(ITENS_LOJA)) {
        if (item.tipo === "raca") {
          const jaTem = racasCompradas.includes(item.nome) ? " ✅" : "";
          textoLoja += `*🆔 [${id}]* - ${item.nome}${jaTem}\n`;
        }
      }
    } else if (categoria === "classes") {
      textoLoja += `🛡️ *ABA DE CLASSES (Custo: 🪙 200)*\n\n`;
      for (const [id, item] of Object.entries(ITENS_LOJA)) {
        if (item.tipo === "classe") {
          const jaTem = classesCompradas.includes(item.nome) ? " ✅" : "";
          textoLoja += `*🆔 [${id}]* - ${item.nome}${jaTem}\n`;
        }
      }
    } else {
      textoLoja += `📜 *PRODUTOS GERAIS*\n\n`;
      for (const [id, item] of Object.entries(ITENS_LOJA)) {
        if (["titulo", "montaria", "moldura", "consumivel", "raro", "passe"].includes(item.tipo)) {
          const jaTem = inventario.includes(item.nome) ? " ✅" : "";
          textoLoja += `*🆔 [${id}]* - ${item.nome}${jaTem}\n• Preço: 🪙 ${item.preco} moedas\n\n`;
        }
      }
      textoLoja += `─────────────────────────\n`;
      textoLoja += `💡 *Veja outras abas usando:*\n`;
      textoLoja += `• *${PREFIX}loja racas*\n• *${PREFIX}loja classes*`;
    }

    textoLoja += `\n\n🛒 Para comprar use: *${PREFIX}comprar [número]*`;

    await socket.sendMessage(remoteJid, { text: textoLoja });
  }
};
