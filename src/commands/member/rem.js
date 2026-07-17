import fs from "fs";
import path from "path";
import { Groq } from "groq-sdk";
import { GROQ_API_KEY, DATABASE_DIR } from "../../config.js";

const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");
const groq = new Groq({ apiKey: GROQ_API_KEY });

export default {
  name: "rem",
  description: "Converse com a Rem IA",
  commands: ["rem"],
  usage: `/rem [sua mensagem]`,

  handle: async ({ args, socket, remoteJid, userLid, sendErrorReply }) => {
    const numeroLimpo = userLid.split("@")[0];
    const mensagemUsuario = args.join(" ");

    if (!mensagemUsuario) return sendErrorReply("❌ Digite algo para falar com a Rem.");

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

    const contextoGeral = `Você é a Rem, a maid de cabelo azul de Re:Zero. Você fala em português e está em um chat de RPG do WhatsApp chamado 'The Legendary Online'.
    Você está conversando com o jogador de dados:
    - Nome de RPG: ${dadosJogador.nomeOficial}
    - Raça: ${dadosJogador.raca}
    - Classe: ${dadosJogador.classe}
    
    Sua personalidade: Você fala de forma extremamente educada, calma, gentil e humilde (geralmente referindo-se a si mesma na terceira pessoa ou de maneira muito polida). É profundamente dedicada e protetora, mas pode soar extremamente fria ou perigosa se sentir alguma ameaça ao seu lar ou a quem ama. No máximo 2 parágrafos.`;

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: contextoGeral },
          { role: "user", content: mensagemUsuario }
        ],
        model: "llama-3.1-8b-instant",
      });

      const resposta = chatCompletion.choices[0]?.message?.content || "Rem está à sua disposição. Como posso ajudar?";
      return socket.sendMessage(remoteJid, { text: `🧹 *Rem:* ${resposta}` });
    } catch (error) {
      return sendErrorReply("❌ Erro ao conectar com a mente da Rem.");
    }
  }
};
