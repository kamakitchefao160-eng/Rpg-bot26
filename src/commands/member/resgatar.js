import fs from "node:fs";
import path from "node:path";
import { DATABASE_DIR } from "../../config.js";

const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");

export default {
  name: "resgatar",
  description: "Resgata códigos promocionais de itens ou moedas",
  commands: ["resgatar", "code", "codiguin"],
  usage: "/resgatar [CÓDIGO]",

  handle: async ({ socket, remoteJid, userLid, args, sendErrorReply }) => {
    const numeroLimpo = userLid.split("@")[0];
    const codigo = args[0]?.toUpperCase();

    if (!codigo) return sendErrorReply("❌ Digite o código que deseja resgatar! Ex: `/resgatar CODIGO123`");

    if (!fs.existsSync(dbPath)) return sendErrorReply("❌ Banco de dados não encontrado!");

    let bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    const player = bancoRPG[numeroLimpo];

    if (!player) return sendErrorReply("❌ Crie sua conta primeiro com `/perfil`.");

    // Inicializa o inventário caso não exista
    if (!player.inventario) player.inventario = [];

    let recompensaMsg = "";

    // 🔴 VALIDAÇÃO DOS CÓDIGOS
    if (codigo === "YH4B-5789-8490") {
      const moedas = 1200000;
      player.ouro = (player.ouro || 0) + moedas;
      recompensaMsg = `🪙 *${moedas.toLocaleString()} moedas de ouro* adicionadas à sua conta!`;
    } 
    else if (codigo === "FELIZ-NATAL-2027") {
      const item = "Foice do Papai Noel";
      
      // Como você pediu infinito/várias vezes, adiciona mesmo se já tiver
      player.inventario.push(item);
      recompensaMsg = `🎅 *${item}* adicionada ao seu inventário!`;
    } 
    else {
      return sendErrorReply("❌ Código inválido ou expirado!");
    }

    // Salva as alterações no JSON
    fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));

    await socket.sendMessage(remoteJid, {
      text: `🎁 *CÓDIGO RESGATADO COM SUCESSO!* 🌹\n\n${recompensaMsg}`
    });
  }
};
