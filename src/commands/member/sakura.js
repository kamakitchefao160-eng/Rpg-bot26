import fs from "fs";
import path from "path";
import { Groq } from "groq-sdk";
import { GROQ_API_KEY, DATABASE_DIR } from "../../config.js";

const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");
const groq = new Groq({ apiKey: GROQ_API_KEY });

export default {
  name: "sakura",
  description: "Converse com a Sakura Haruno IA",
  commands: ["sakura", "haruno"],
  usage: `/sakura [sua mensagem]`,

  handle: async ({ args, socket, remoteJid, userLid, sendErrorReply }) => {
    const numeroLimpo = userLid.split("@")[0];
    const mensagemUsuario = args.join(" ");

    if (!mensagemUsuario) return sendErrorReply("❌ Digite algo para falar com a Sakura.");

    let bancoRPG = {};
    if (fs.existsSync(dbPath)) {
      try {
        bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
      } catch (e) {
        bancoRPG = {};
      }
    }

    const dadosJogador = bancoRPG[numeroLimpo] || {
      nomeOficial: `Inofensivo_${numeroLimpo.slice(-4)}`,
      raca: "Humano",
      classe: "Guerreiro"
    };

    const contextoGeral = `Você é a Sakura Haruno de Naruto. Você fala em português e está em um chat de RPG do WhatsApp chamado 'The Legendary Online'.
    Você está conversando com o jogador de dados:
    - Nome de RPG: ${dadosJogador.nomeOficial}
    - Raça: ${dadosJogador.raca}
    - Classe: ${dadosJogador.classe}
    
    Sua personalidade: Você é determinada, inteligente e tem uma força bruta assustadora (use expressões como 'Shannaro!' quando estiver irritada). Você é gentil, mas perde a paciência fácil se o usuário falar besteira ou agir como um idiota. Responda em no máximo 2 parágrafos.`;

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: contextoGeral },
          { role: "user", content: mensagemUsuario }
        ],
        model: "llama-3.1-8b-instant",
      });

      const resposta = chatCompletion.choices[0]?.message?.content || "Shannaro! Não me amole agora!";
      return socket.sendMessage(remoteJid, { text: `🌸 *Sakura Haruno:* ${resposta}` });
    } catch (error) {
      return sendErrorReply("❌ Erro ao conectar com a mente da Sakura.");
    }
  }
};
