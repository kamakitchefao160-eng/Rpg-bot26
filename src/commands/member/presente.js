import fs from "fs";
import path from "path";
import { ITENS_LOJA } from "./loja.js";

const dbPath = path.resolve("banco de dados", "rpg-usuarios.json");

export default {
  name: "presente",
  description: "Dá um item, classe ou raça comprado para outro jogador",
  commands: ["presente", "presentear"],
  usage: "/presente @jogador [ID da Loja]",

  handle: async ({ args, socket, remoteJid, userLid, mentions, sendErrorReply }) => {
    if (!mentions || mentions.length === 0) return sendErrorReply("❌ Você deve marcar o jogador que receberá o presente.");
    
    const idItem = args[1]; // O primeiro argumento é a menção, o segundo é a ID
    const itemLoja = ITENS_LOJA[idItem];

    if (!itemLoja) return sendErrorReply("❌ ID inválida! Consulte as IDs na loja usando `/loja`.");

    const remetenteId = userLid.split("@")[0];
    const destinatarioId = mentions[0].split("@")[0];

    if (!fs.existsSync(dbPath)) return sendErrorReply("❌ Banco de dados ausente.");
    let bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

    const remetente = bancoRPG[remetenteId];
    const destinatario = bancoRPG[destinatarioId];

    if (!remetente) return sendErrorReply("❌ Crie sua conta primeiro.");
    if (!destinatario) return sendErrorReply("❌ O destinatário não tem uma conta ativa.");

    // Inicializa campos essenciais
    if (!remetente.racasCompradas) remetente.racasCompradas = [remetente.raca || "Humano"];
    if (!destinatario.racasCompradas) destinatario.racasCompradas = [destinatario.raca || "Humano"];
    if (!remetente.classesCompradas) remetente.classesCompradas = [remetente.classe || "Guerreiro"];
    if (!destinatario.classesCompradas) destinatario.classesCompradas = [destinatario.classe || "Guerreiro"];
    if (!remetente.inventario) remetente.inventario = [];
    if (!destinatario.inventario) destinatario.inventario = [];

    // Processamento do Presente com base no tipo
    if (itemLoja.tipo === "raca") {
      if (!remetente.racasCompradas.includes(itemLoja.nome)) return sendErrorReply("❌ Você não possui essa raça para enviar.");
      if (destinatario.racasCompradas.includes(itemLoja.nome)) return sendErrorReply("❌ O jogador já possui essa raça.");
      destinatario.racasCompradas.push(itemLoja.nome);
    } 
    else if (itemLoja.tipo === "classe") {
      if (!remetente.classesCompradas.includes(itemLoja.nome)) return sendErrorReply("❌ Você não possui essa classe para enviar.");
      if (destinatario.classesCompradas.includes(itemLoja.nome)) return sendErrorReply("❌ O jogador já possui essa classe.");
      destinatario.classesCompradas.push(itemLoja.nome);
    } 
    else {
      // Itens normais, títulos e consumíveis
      if (!remetente.inventario.includes(itemLoja.nome)) return sendErrorReply("❌ Você não possui esse item no seu inventário.");
      
      // Remove do remetente e insere no destinatário
      remetente.inventario = remetente.inventario.filter(i => i !== itemLoja.nome);
      destinatario.inventario.push(itemLoja.nome);
    }

    fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));
    await socket.sendMessage(remoteJid, { text: `🎁 *SUCESSO!* O item *${itemLoja.nome}* foi enviado para o inventário de @${destinatarioId}!`, mentions: [mentions[0]] });
  }
};
