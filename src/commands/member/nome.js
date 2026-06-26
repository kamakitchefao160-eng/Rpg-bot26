import fs from "fs";
import path from "path";
import { PREFIX } from "../../config.js";

const dbPath = path.join(process.cwd(), "banco de dados", "rpg-usuarios.json");

export default {
  name: "nome",
  description: "Altera o nome do seu personagem no RPG",
  commands: ["nome", "definirnome", "nick"],
  usage: `${PREFIX}nome [Novo Nome]`,

  handle: async ({ args, socket, remoteJid, userLid, sendErrorReply }) => {
    const numeroLimpo = userLid.split("@")[0];
    const novoNome = args.join(" ");

    if (!novoNome) {
      return sendErrorReply(`❌ Digite o novo nome do seu personagem!\nExemplo: *${PREFIX}nome Alucard*`);
    }

    if (novoNome.length > 20) {
      return sendErrorReply("❌ O nome do personagem não pode ter mais de 20 caracteres.");
    }

    if (!fs.existsSync(dbPath)) return sendErrorReply("❌ Banco de dados offline.");
    let bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

    if (!bancoRPG[numeroLimpo]) {
      return sendErrorReply(`❌ Crie seu perfil primeiro digitando *${PREFIX}perfil*`);
    }

    // Altera o campo do personagem
    bancoRPG[numeroLimpo].personagem = novoNome;
    fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));

    return await socket.sendMessage(remoteJid, {
      text: `🎉 *NOME ALTERADO!* Agora o seu personagem chama-se: *${novoNome}* ⚔️`
    });
  }
};
