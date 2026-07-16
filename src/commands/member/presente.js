// presente.js
import fs from "fs";
import path from "path";
import { DATABASE_DIR } from "../../config.js";
import { ITENS_LOJA } from "./loja.js";

const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");

export default {
  name: "presente",
  description: "Dá um item, classe ou raça comprado para outro jogador",
  commands: ["presente", "presentear"],
  usage: "/presente @jogador [ID da Loja]",

  handle: async ({ args, socket, remoteJid, userLid, mentions, sendErrorReply }) => {
    if (!mentions || mentions.length === 0) return sendErrorReply("❌ Você deve marcar o jogador que receberá o presente.");
    
    const idItem = args.find(arg => !arg.includes("@") && !isNaN(parseInt(arg)));
    const itemLoja = ITENS_LOJA[idItem];

    if (!itemLoja) return sendErrorReply("❌ ID inválida! Consulte as IDs na loja usando `/loja`.");

    const remetenteId = userLid.split("@")[0];
    const destinatarioId = mentions[0].split("@")[0];

    if (remetenteId === destinatarioId) return sendErrorReply("❌ Você não pode dar presentes para si mesmo.");

    if (!fs.existsSync(dbPath)) return sendErrorReply("❌ Banco de dados offline.");
    let bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

    const remetente = bancoRPG[remetenteId];
    const destinatario = bancoRPG[destinatarioId];

    if (!remetente) return sendErrorReply("❌ Crie sua conta primeiro.");
    if (!destinatario) return sendErrorReply("❌ O destinatário não tem uma conta ativa no RPG.");

    if (!remetente.racasCompradas) remetente.racasCompradas = [remetente.raca || "Humano"];
    if (!destinatario.racasCompradas) destinatario.racasCompradas = [destinatario.raca || "Humano"];
    if (!remetente.classesCompradas) remetente.classesCompradas = [remetente.classe || "Guerreiro"];
    if (!destinatario.classesCompradas) destinatario.classesCompradas = [destinatario.classe || "Guerreiro"];
    if (!remetente.inventario) remetente.inventario = [];
    if (!destinatario.inventario) destinatario.inventario = [];

    if (itemLoja.tipo === "raca") {
      if (!remetente.racasCompradas.includes(itemLoja.nome)) return sendErrorReply("❌ Você não possui essa raça comprada para enviar.");
      if (destinatario.racasCompradas.includes(itemLoja.nome)) return sendErrorReply("❌ O jogador já possui essa raça.");
      
      remetente.racasCompradas = remetente.racasCompradas.filter(r => r !== itemLoja.nome);
      destinatario.racasCompradas.push(itemLoja.nome);
    } 
    else if (itemLoja.tipo === "classe") {
      if (!remetente.classesCompradas.includes(itemLoja.nome)) return sendErrorReply("❌ Você não possui essa classe comprada para enviar.");
      if (destinatario.classesCompradas.includes(itemLoja.nome)) return sendErrorReply("❌ O jogador já possui essa classe.");
      
      remetente.classesCompradas = remetente.classesCompradas.filter(c => c !== itemLoja.nome);
      destinatario.classesCompradas.push(itemLoja.nome);
    } 
    else {
      if (!remetente.inventario.includes(itemLoja.nome)) return sendErrorReply("❌ Você não possui esse item no seu inventário.");
      
      remetente.inventario = remetente.inventario.filter(i => i !== itemLoja.nome);
      destinatario.inventario.push(itemLoja.nome);
    }

    fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));
    
    return await socket.sendMessage(remoteJid, { 
      text: `🎁 *SUCESSO!* O item *${itemLoja.nome}* foi enviado do inventário de @${remetenteId} para @${destinatarioId}!`, 
      mentions: [userLid, mentions[0]] 
    });
  }
};
