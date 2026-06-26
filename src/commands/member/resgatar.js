import fs from "node:fs";
import path from "node:path";

// 🔄 CORREÇÃO DO CAMINHO: Apontando para a mesma pasta exata que o perfil usa
const dbPath = path.join(process.cwd(), "banco de dados", "rpg-usuarios.json");

export default {
  name: "resgatar",
  description: "Resgata códigos promocionais de itens ou moedas",
  commands: ["resgatar", "code", "codiguin"],
  usage: "/resgatar [CÓDIGO]",

  handle: async ({ socket, remoteJid, userLid, args, sendErrorReply }) => {
    // Garante que pega apenas os números do ID de forma idêntica ao perfil
    const numeroLimpo = userLid.split("@")[0];
    const codigo = args[0]?.toUpperCase();

    if (!codigo) return sendErrorReply("❌ Digite o código que deseja resgatar! Ex: `/resgatar YH4B-5789-8490`");

    // Se o banco não existir, avisa (ou cria a pasta caso necessário)
    if (!fs.existsSync(dbPath)) {
      return sendErrorReply("❌ Nenhum banco de dados do RPG foi encontrado. Digite `/perfil` para iniciar o sistema!");
    }

    let bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    const player = bancoRPG[numeroLimpo];

    // Agora vai achar perfeitamente porque estão lendo o mesmo arquivo JSON!
    if (!player) return sendErrorReply("❌ Erro! Crie sua conta primeiro com `/perfil`.");

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
      
      // Permite acumular itens repetidos na mochila normalmente
      player.inventario.push(item);
      recompensaMsg = `🎅 *${item}* adicionada à sua mochila!`;
    } 
    else {
      return sendErrorReply("❌ Código inválido ou expirado!");
    }

    // Salva as alterações no JSON correto
    fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));

    await socket.sendMessage(remoteJid, {
      text: `🎁 *CÓDIGO RESGATADO COM SUCESSO!* 🌹\n\n${recompensaMsg}`
    });
  }
}
