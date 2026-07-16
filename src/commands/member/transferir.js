// transferir.js
import fs from "fs";
import path from "path";
import { PREFIX, DATABASE_DIR } from "../../config.js";

const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");

export default {
  name: "transferir",
  description: "Transfere moedas de ouro para outro jogador",
  commands: ["transferir", "pagar", "pay"],
  usage: `${PREFIX}transferir [@marcar] [quantia]`,

  handle: async ({ args, socket, remoteJid, userLid, mentions, sendErrorReply }) => {
    const remetenteId = userLid.split("@")[0];

    if (!mentions || mentions.length === 0 || !args[1]) {
      return sendErrorReply(`❌ Uso incorreto! Exemplo: *${PREFIX}transferir @jogador 50*`);
    }

    const destinatarioId = mentions[0].split("@")[0];
    const quantia = parseInt(args.find(arg => !arg.includes("@") && !isNaN(parseInt(arg))));

    if (isNaN(quantia) || quantia <= 0) {
      return sendErrorReply("❌ Insira uma quantia válida de ouro para transferir.");
    }

    if (remetenteId === destinatarioId) {
      return sendErrorReply("❌ Você não pode transferir dinheiro para você mesmo.");
    }

    if (!fs.existsSync(dbPath)) return sendErrorReply("❌ Banco de dados offline.");
    let bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

    if (!bancoRPG[remetenteId]) return sendErrorReply("❌ Crie sua conta primeiro!");
    if (!bancoRPG[destinatarioId]) return sendErrorReply("❌ O jogador de destino não possui uma conta no RPG.");

    if (bancoRPG[remetenteId].ouro < quantia) {
      return sendErrorReply(`❌ Você não tem saldo suficiente! Saldo atual: 🪙 ${bancoRPG[remetenteId].ouro}`);
    }

    bancoRPG[remetenteId].ouro -= quantia;
    bancoRPG[destinatarioId].ouro += quantia;

    fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));

    return await socket.sendMessage(remoteJid, {
      text: `🪙 *TRANSFERÊNCIA REALIZADA!* \n\n@${remetenteId} enviou *${quantia} moedas* para @${destinatarioId} com sucesso!`,
      mentions: [remetenteId + "@s.whatsapp.net", destinatarioId + "@s.whatsapp.net"]
    });
  }
};
