import fs from "fs";
import path from "path";
import { DATABASE_DIR } from "../../config.js";

const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");

export default {
  name: "presente",
  description: "Envia um item da sua mochila para outro jogador",
  commands: ["presente", "presentear"],
  usage: "/presente @jogador [Nome do Item]",

  handle: async ({ args, socket, remoteJid, userLid, mentions, sendErrorReply }) => {
    if (!mentions || mentions.length === 0) return sendErrorReply("❌ *Você precisa marcar o jogador que vai ganhar o presente.*");
    
    const remetenteId = userLid.split("@")[0];
    const destinatarioId = mentions[0].split("@")[0];

    if (remetenteId === destinatarioId) return sendErrorReply("❌ *Você não pode presentear a si próprio.*");

    // O resto dos argumentos após a menção vira o nome do item
    const nomeItem = args.slice(1).join(" ").trim();
    if (!nomeItem) return sendErrorReply("❌ *Especifique o nome do item que deseja enviar.*");

    if (!fs.existsSync(dbPath)) return sendErrorReply("❌ *Banco de dados offline.*");
    let bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

    const remetente = bancoRPG[remetenteId];
    const destinatario = bancoRPG[destinatarioId];

    if (!remetente || !remetente.inventario || remetente.inventario.length === 0) {
      return sendErrorReply("❌ *Você não tem itens na sua mochila para presentear.*");
    }
    if (!destinatario) return sendErrorReply("❌ *O destinatário não possui cadastro no RPG.*");

    const indexItem = remetente.inventario.findIndex(i => i.toLowerCase() === nomeItem.toLowerCase());
    if (indexItem === -1) {
      return sendErrorReply(`❌ *Você não possui o item* *"${nomeItem}"* *na sua mochila.*`);
    }

    const itemReal = remetente.inventario[indexItem];

    // ATUALIZAÇÃO SEGURA UTILIZANDO OPERADOR SPREAD
    bancoRPG[remetenteId] = {
      ...bancoRPG[remetenteId],
      inventario: remetente.inventario.filter((_, idx) => idx !== indexItem)
    };

    bancoRPG[destinatarioId] = {
      ...bancoRPG[destinatarioId],
      inventario: [...(destinatario.inventario || []), itemReal]
    };

    fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));
    
    return await socket.sendMessage(remoteJid, { 
      text: `🎁 *PRESENTE ENVIADO!* 🎁\n───────────────────────────\n👤 *De:* @${remetenteId}\n👤 *Para:* @${destinatarioId}\n📦 *Objeto:* *${itemReal}*\n───────────────────────────\n✨ _Que bela demonstração de generosidade!_`, 
      mentions: [userLid, mentions[0]] 
    });
  }
};
