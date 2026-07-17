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

    if (!mentions || mentions.length === 0) {
      return sendErrorReply(`❌ *Uso incorreto! Mencionamento obrigatório. Exemplo:* \`${PREFIX}transferir @jogador 50\``);
    }

    const destinatarioId = mentions[0].split("@")[0];
    if (remetenteId === destinatarioId) {
      return sendErrorReply("❌ *Você não pode enviar moedas para o seu próprio perfil.*");
    }

    // Pega o número que sobrou nos argumentos (valor da transferência)
    const quantia = parseInt(args.find(arg => !arg.includes("@") && !isNaN(parseInt(arg))));

    if (isNaN(quantia) || quantia <= 0) {
      return sendErrorReply("❌ *Por favor, informe uma quantidade numérica válida e maior que zero.*");
    }

    if (!fs.existsSync(dbPath)) return sendErrorReply("❌ *Banco de dados offline.*");
    let bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

    const remetente = bancoRPG[remetenteId];
    const destinatario = bancoRPG[destinatarioId];

    if (!remetente) return sendErrorReply("❌ *Crie sua conta no RPG primeiro.*");
    if (!destinatario) return sendErrorReply("❌ *O usuário de destino não foi localizado na nossa database.*");

    const saldoRemetente = remetente.ouro || 0;
    if (saldoRemetente < quantia) {
      return sendErrorReply(`❌ *Você não tem ouro suficiente! Seu saldo atual:* *🪙 ${saldoRemetente}*`);
    }

    // ATUALIZAÇÃO MANTENDO OS DADOS DE AMBOS INTACTOS
    bancoRPG[remetenteId] = {
      ...bancoRPG[remetenteId],
      ouro: saldoRemetente - quantia
    };

    bancoRPG[destinatarioId] = {
      ...bancoRPG[destinatarioId],
      ouro: (destinatario.ouro || 0) + quantia
    };

    fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));

    return await socket.sendMessage(remoteJid, {
      text: `🪙 *TRANSAÇÃO BANCÁRIA REALIZADA!* 🪙\n───────────────────────────\n📤 *Remetente:* @${remetenteId}\n📥 *Destinatário:* @${destinatarioId}\n💰 *Valor transferido:* *🪙 ${quantia} moedas*\n───────────────────────────\n✅ _O montante foi depositado na conta de destino com sucesso._`,
      mentions: [userLid, mentions[0]]
    });
  }
};
