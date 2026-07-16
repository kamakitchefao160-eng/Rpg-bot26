import fs from "fs";
import path from "path";
import { PREFIX } from "../../config.js";

const dbPath = path.join(process.cwd(), "banco de dados", "rpg-usuarios.json");

export default {
  name: "diario",
  description: "Resgata sua recompensa diária de 100 moedas",
  commands: ["diario", "daily"],
  usage: `${PREFIX}diario`,

  handle: async ({ socket, remoteJid, userLid, sendErrorReply }) => {
    const numeroLimpo = userLid.split("@")[0];

    if (!fs.existsSync(dbPath)) return sendErrorReply("❌ Banco de dados não encontrado!");

    let bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    const player = bancoRPG[numeroLimpo];

    if (!player) return sendErrorReply(`❌ Crie sua conta primeiro com *${PREFIX}perfil*.`);

    const hoje = new Date().toISOString().split("T")[0];

    if (player.ultimoDiario === hoje) {
      return sendErrorReply("⏱️ Você já resgatou sua recompensa de hoje! Volte amanhã.");
    }

    player.ouro = (player.ouro || 0) + 100;
    player.ultimoDiario = hoje;

    fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));

    await socket.sendMessage(remoteJid, {
      text: `🎁 *RECOMPENSA DIÁRIA!* 🌹\n\n🪙 Você abriu o baú diário e encontrou *100 moedas de ouro*!\n💰 Saldo Atual: *${player.ouro} moedas*.`
    });
  }
};
