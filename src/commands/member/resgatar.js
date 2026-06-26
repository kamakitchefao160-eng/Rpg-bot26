import fs from "node:fs";
import path from "node:path";

const dbPath = path.join(process.cwd(), "banco de dados", "rpg-usuarios.json");

export default {
  name: "resgatar",
  description: "Resgata códigos promocionais de itens ou moedas",
  commands: ["resgatar", "code", "codiguin"],
  usage: "/resgatar [CÓDIGO]",

  handle: async ({ socket, remoteJid, userLid, msg, sender, args, sendErrorReply }) => {
    // Captura o ID do jogador de forma blindada
    const idBruto = userLid || sender || msg?.key?.participant || msg?.key?.remoteJid || "";
    
    if (!idBruto) {
      return sendErrorReply("❌ Não consegui identificar seu ID. Tente enviar o comando novamente.");
    }

    const numeroLimpo = idBruto.replace(/\D/g, "");
    const codigo = args[0]?.toUpperCase();

    if (!codigo) {
      return sendErrorReply("🎁 *Ops! Esqueceu o código?* \nDigite o código que quer resgatar!\n\n💡 Exemplo: `/resgatar YH4B-5789-8490`");
    }

    if (!fs.existsSync(dbPath)) {
      return sendErrorReply("❌ Sistema de RPG offline. Use `/perfil` para iniciar o banco de dados!");
    }

    let bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    const player = bancoRPG[numeroLimpo];

    if (!player) {
      return sendErrorReply("✨ *Ainda não tem registro?* \nCrie sua conta primeiro digitando `/perfil` para poder receber recompensas!");
    }

    if (!player.inventario) player.inventario = [];
    let recompensaMsg = "";

    // 🔴 VALIDAÇÃO DOS CÓDIGOS COM TEMA DE FESTA/PARABÉNS
    if (codigo === "YH4B-5789-8490") {
      const moedas = 1200000;
      player.ouro = (player.ouro || 0) + moedas;
      recompensaMsg = `🎉 *PARABÉNS, HERÓI!* 🎉\n\n Você acabou de faturar:\n🪙 *${moedas.toLocaleString()} moedas de ouro*!\n\n Seu saldo foi atualizado, gaste com sabedoria! ⚔️`;
    } 
    else if (codigo === "FELIZ-NATAL-2027") {
      const item = "Foice do Papai Noel";
      player.inventario.push(item);
      recompensaMsg = `🎄 *PARABÉNS! UM PRESENTE ESPECIAL!* 🎄\n\n O bom velhinho deixou isso para você:\n🎅 *${item}* \n\n O item foi guardado com sucesso na sua mochila! 🎒✨`;
    } 
    else if (codigo === "BOASVINDAS") {
      const moedas = 50000;
      player.ouro = (player.ouro || 0) + moedas;
      recompensaMsg = `🥳 *PARABÉNS! BOAS-VINDAS AO RPG!* 🥳\n\n Para começar sua jornada com o pé direito:\n🪙 *${moedas.toLocaleString()} moedas de ouro* de bônus!\n\n Digite \`/perfil\` para ver sua nova fortuna! 🚀`;
    }
    else {
      return sendErrorReply("❌ *Código Inválido ou Expirado!* \nVerifique se digitou certinho e tente de novo.");
    }

    // Grava as alterações no banco de dados correto
    fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));

    // Envia a mensagem temática estourando confetes!
    await socket.sendMessage(remoteJid, {
      text: `🎁 ✨ *RESGATE REALIZADO COM SUCESSO!* ✨ 🎁\n\n${recompensaMsg}`
    });
  }
}
