import fs from "fs";
import path from "path";
import { Groq } from "groq-sdk";
import { GROQ_API_KEY, DATABASE_DIR } from "../../config.js";

const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");
const groq = new Groq({ apiKey: GROQ_API_KEY });

export default {
  name: "sasuke",
  description: "Converse com o Sasuke Uchiha IA",
  commands: ["sasuke", "uchiha"],
  usage: `/sasuke [sua mensagem]`,

  handle: async ({ args, socket, remoteJid, userLid, sendErrorReply }) => {
    const numeroLimpo = userLid.split("@")[0];
    const mensagemUsuario = args.join(" ");

    if (!mensagemUsuario) return sendErrorReply("❌ Digite algo para falar com o Sasuke.");

    let bancoRPG = {};
    if (fs.existsSync(dbPath)) {
      try { bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8")); } catch (e) { bancoRPG = {}; }
    }

    const dadosJogador = bancoRPG[numeroLimpo] || {
      nomeOficial: `Aventureiro_${numeroLimpo.slice(-4)}`,
      raca: "Humano",
      classe: "Guerreiro"
    };

    const contextoGeral = `Você é o Sasuke Uchiha de Naruto. Você está em um chat de RPG do WhatsApp chamado 'The Legendary Online' e fala em português.
    Você está conversando com o jogador de dados:
    - Nome de RPG: ${dadosJogador.nomeOficial || dadosJogador.nome}
    - Raça: ${dadosJogador.raca}
    - Classe: ${dadosJogador.classe}
    
    Você é frio, calculista, arrogante, vingativo e de pouquíssimas palavras. Odeia perder tempo com bobagens, responde com patadas secas e desdém. Trate o usuário com indiferença e superioridade. Responda de forma curta (máximo de 2 parágrafos).`;

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: contextoGeral },
          { role: "user", content: mensagemUsuario }
        ],
        model: "llama3-8b-8192",
      });

      const resposta = chatCompletion.choices[0]?.message?.content || "Hum... irritante.";
      return socket.sendMessage(remoteJid, { text: `🦅 *Sasuke Uchiha:* ${resposta}` });
    } catch (error) {
      return sendErrorReply("❌ Erro ao conectar com a mente do Sasuke.");
    }
  }
};
