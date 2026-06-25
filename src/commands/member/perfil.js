import fs from "fs";
import path from "path";
import { ASSETS_DIR, PREFIX } from "../../config.js";
import { InvalidParameterError } from "../../errors/index.js";
import { getProfileImageData } from "../../services/baileys.js";
import { isGroup, onlyNumbers } from "../../utils/index.js";
import { errorLog } from "../../utils/logger.js";

// Caminho para o banco de dados JSON do RPG
const dbPath = path.resolve("banco de dados", "rpg-usuarios.json");

export default {
  name: "perfil",
  description: "Mostra o seu perfil oficial ou de um membro no RPG",
  commands: ["perfil", "profile"],
  usage: `${PREFIX}perfil ou perfil @usuario`,
  
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({
    args,
    socket,
    remoteJid,
    userLid,
    sendErrorReply,
    sendWaitReply,
    sendSuccessReact,
  }) => {
    if (!isGroup(remoteJid)) {
      throw new InvalidParameterError(
        "Este comando só pode ser usado em grupo."
      );
    }

    // Pega o número de quem enviou ou de quem foi marcado
    const targetLid = args[0] ? `${onlyNumbers(args[0])}@lid` : userLid;
    const numeroLimpo = targetLid.split("@")[0];

    await sendWaitReply("Buscando dados no pergaminho sagrado...");

    try {
      let profilePicUrl;
      try {
        const { profileImage } = await getProfileImageData(socket, targetLid);
        profilePicUrl = profileImage || `${ASSETS_DIR}/images/default-user.png`;
      } catch (error) {
        profilePicUrl = `${ASSETS_DIR}/images/default-user.png`;
      }

      // Lendo o arquivo do banco de dados
      let bancoRPG = {};
      if (fs.existsSync(dbPath)) {
        bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
      }

      // Se o usuário não existir no banco, registra ele com dados iniciais automáticos
      if (!bancoRPG[numeroLimpo]) {
        bancoRPG[numeroLimpo] = {
          nomeOficial: `Jogador_${numeroLimpo.slice(-4)}`,
          personagem: "Novato Sem Classe",
          raca: "Humano",
          classe: "Aprendiz",
          titulo: "🌱 Aventureiro Iniciante 🌱",
          arma: "Adaga de Ferro Velha",
          moldura: "Nenhuma (Padrão)",
          consumivel: "Nenhum",
          montaria: "Nenhuma (A pé)",
          ouro: 100,
          petalas: "0/100",
          status: "Herói Autorizado para Jogar"
        };
        // Salva o novo registro no arquivo
        fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));
      }

      const dados = bancoRPG[numeroLimpo];

      // Montando o layout idêntico ao que você pediu
      const mensagem = `📱 +${numeroLimpo}

👤 *PERFIL OFICIAL:* @${dados.nomeOficial}

🎭 *PERSONAGEM:* ${dados.personagem}
• *Raça:* ${dados.raca}  • *Classe:* ${dados.classe}
• *Título Atual:* ${dados.titulo}

🎒 *INVENTÁRIO ATUAL:*
• [Arma] ${dados.arma}
• [Moldura] ${dados.moldura}
• [Consumível] ${dados.consumivel}

🐎 *ESTÁBULO (Montarias):*
• [Montaria] ${dados.montaria}

💰 *SALDO NO BANCO:*
• 🪙 Moedas de Ouro: ${dados.ouro}
• 🌸 Pétalas Sakura: ${dados.petalas}

--------------------------------------
*STATUS:* [${dados.status}]`;

      const mentions = [targetLid];
      await sendSuccessReact();

      await socket.sendMessage(remoteJid, {
        image: { url: profilePicUrl },
        caption: mensagem,
        mentions: mentions,
      });

    } catch (error) {
      console.error(error);
      sendErrorReply("Ocorreu um erro ao carregar os dados do herói.");
    }
  },
};
