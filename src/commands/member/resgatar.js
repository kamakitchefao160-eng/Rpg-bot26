import fs from "node:fs";
import path from "node:path";

const dbPath = path.join(process.cwd(), "banco de dados", "rpg-usuarios.json");

export default {
  name: "resgatar",
  description: "Resgata códigos promocionais de itens ou moedas",
  commands: ["resgatar", "code", "codiguin"],
  usage: "/resgatar [CÓDIGO]",

  handle: async ({ socket, remoteJid, userLid, msg, sender, args, sendErrorReply }) => {
    // 🔍 BLINDAGEM MÁXIMA DE ID: Tenta capturar o número de todas as propriedades comuns do bot
    const idBruto = userLid || sender || msg?.key?.participant || msg?.key?.remoteJid || "";
    
    if (!idBruto) {
      return sendErrorReply("❌ Não foi possível identificar o seu ID do WhatsApp no comando.");
    }

    // Limpa deixando apenas os números para bater direto com a chave salva pelo perfil
    const numeroLimpo = idBruto.replace(/\D/g, "");
    const codigo = args[0]?.toUpperCase();

    if (!codigo) return sendErrorReply("❌ Digite o código que deseja resgatar! Ex: `/resgatar YH4B-5789-8490`");

    if (!fs.existsSync(dbPath)) {
      return sendErrorReply("❌ Banco de dados não encontrado. Use `/perfil` primeiro!");
    }

    let bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    const player = bancoRPG[numeroLimpo];

    // Se falhar de novo, ele vai cuspir o ID no chat para sabermos exatamente o que está errado!
    if (!player) {
      return sendErrorReply(`❌ Erro! Conta não encontrada para o ID: *${numeroLimpo}*.\n\n💡 Dica: Dê `/perfil` novamente para registrar.`);
    }

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
      player.inventario.push(item);
      recompensaMsg = `🎅 *${item}* adicionada à sua mochila!`;
    } 
    else {
      return sendErrorReply("❌ Código inválido ou expirado!");
    }

    fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));

    await socket.sendMessage(remoteJid, {
      text: `🎁 *CÓDIGO RESGATADO COM SUCESSO!* 🌹\n\n${recompensaMsg}`
    });
  }
}
