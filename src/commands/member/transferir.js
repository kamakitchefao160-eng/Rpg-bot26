import fs from "fs";
import path from "path";
import { PREFIX } from "../../config.js";
import { onlyNumbers } from "../../utils/index.js";

const dbPath = path.join(process.cwd(), "banco de dados", "rpg-usuarios.json");

export default {
  name: "transferir",
  description: "Transfere moedas de ouro para outro jogador",
  commands: ["transferir", "pagar", "pay"],
  usage: `${PREFIX}transferir [@marcar] [quantia]`,

  handle: async ({ args, socket, remoteJid, userLid, sendErrorReply }) => {
    const remetenteId = userLid.split("@")[0];

    if (!args[0] || !args[1]) {
      return sendErrorReply(`❌ Uso incorreto! Exemplo: *${PREFIX}transferir @jogador 50*`);
    }

    const destinatarioId = onlyNumbers(args[0]);
    const quantia = parseInt(args[1]);

    if (isNaN(quantia) || quantia <= 0) {
      return sendErrorReply("❌ Insira uma quantia válida de ouro para transferir.");
    }

    if (!fs.existsSync(dbPath)) return sendErrorReply("❌ Banco de dados offline.");
    let bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

    if (!bancoRPG[remetenteId]) return sendErrorReply("❌ Crie sua conta primeiro!");
    if (!bancoRPG[destinatarioId]) return sendErrorReply("❌ O jogador de destino não possui uma conta no RPG.");

    if (bancoRPG[remetenteId].ouro < quantia) {
      return sendErrorReply(`❌ Você não tem saldo suficiente! Saldo atual: 🪙 ${bancoRPG[remetenteId].ouro}`);
    }

    // Executa a transferência no JSON
    bancoRPG[remetenteId].ouro -= quantia;
    bancoRPG[destinatarioId].ouro += quantia;

    fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));

    return await socket.sendMessage(remoteJid, {
      text: `🪙 *TRANSFERÊNCIA REALIZADA!* \n\n@${remetenteId} enviou *${quantia} moedas* para @${destinatarioId} com sucesso!`,
      mentions: [userLid, `${destinatarioId}@lid`]
    });
  }
};
