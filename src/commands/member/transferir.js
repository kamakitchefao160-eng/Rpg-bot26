import fs from "node:fs";
import path from "node:path";
import { DATABASE_DIR } from "../../config.js";

const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");

export default {
  name: "transferir",
  description: "Transfere uma quantidade de moedas de ouro para outro jogador",
  commands: ["transferir", "pagar", "enviarouro"],
  usage: "/transferir @jogador [quantidade]",

  handle: async ({ socket, remoteJid, userLid, args, mentions, sendErrorReply }) => {
    const remetenteId = userLid.split("@")[0];

    // Validação 1: Verificar se marcou alguém
    if (!mentions || mentions.length === 0) {
      return sendErrorReply("❌ Você precisa marcar o jogador que vai receber as moedas! Exemplo: `/transferir @goku 100`");
    }

    const destinatarioId = mentions[0].split("@")[0];

    // Validação 2: Impedir de transferir para si mesmo
    if (remetenteId === destinatarioId) {
      return sendErrorReply("❌ Você não pode transferir moedas para você mesmo!");
    }

    // Validação 3: Pegar e validar a quantidade de moedas
    // Como o primeiro argumento (args[0]) é a menção, a quantidade deve ser o args[1]
    const quantidade = parseInt(args[1]);
    if (isNaN(quantidade) || quantidade <= 0) {
      return sendErrorReply("❌ Quantidade inválida! Insira um valor numérico maior que zero. Exemplo: `/transferir @goku 100`");
    }

    if (!fs.existsSync(dbPath)) {
      return sendErrorReply("❌ Banco de dados de usuários não encontrado!");
    }

    let bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    const remetente = bancoRPG[remetenteId];
    const destinatario = bancoRPG[destinatarioId];

    // Validação 4: Verificar se as contas existem
    if (!remetente) {
      return sendErrorReply("❌ Você precisa criar sua conta primeiro com `/perfil`.");
    }
    if (!destinatario) {
      return sendErrorReply("❌ O jogador que vai receber as moedas ainda não tem uma conta no RPG.");
    }

    // Validação 5: Verificar se o remetente tem saldo suficiente
    const saldoRemetente = remetente.ouro || 0;
    if (saldoRemetente < quantidade) {
      return sendErrorReply(`❌ Saldo insuficiente! Você tem apenas 🪙 *${saldoRemetente} moedas* de ouro.`);
    }

    // Executa a transferência de valores
    remetente.ouro = saldoRemetente - quantidade;
    destinatario.ouro = (destinatario.ouro || 0) + quantidade;

    // Grava as alterações de volta no arquivo JSON
    fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));

    // Envia a mensagem de sucesso marcando os dois envolvidos
    await socket.sendMessage(remoteJid, {
      text: `💸 *TRANSFERÊNCIA CONCLUÍDA!* 🌹\n\n🪙 *${remetente.nomeOficial}* enviou *${quantidade} moedas de ouro* para *${destinatario.nomeOficial}*!\n\n📉 Saldo de quem enviou: *${remetente.ouro} moedas*\n📈 Saldo de quem recebeu: *${destinatario.ouro} moedas*`,
      mentions: [userLid, mentions[0]]
    });
  }
};
