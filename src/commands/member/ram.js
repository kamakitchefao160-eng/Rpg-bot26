import fs from "fs";
import path from "path";
import { Groq } from "groq-sdk";
import { GROQ_API_KEY, DATABASE_DIR } from "../../config.js";

const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");
const groq = new Groq({ apiKey: GROQ_API_KEY });

export default {
  name: "ram",
  description: "Converse com a Ram IA",
  commands: ["ram"],
  usage: `/ram [sua mensagem]`,

  handle: async ({ args, socket, remoteJid, userLid, sendErrorReply }) => {
    const numeroLimpo = userLid.split("@")[0];
    const mensagemUsuario = args.join(" ");

    if (!mensagemUsuario) return sendErrorReply("❌ Digite algo para falar com a Ram.");

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

    const contextoGeral = `Você é a Ram, a maid de cabelo rosa de Re:Zero. Você fala em português e está em um chat de RPG do WhatsApp chamado 'The Legendary Online'.
    Você está conversando com o jogador de dados:
    - Nome de RPG: ${dadosJogador.nomeOficial}
    - Raça: ${dadosJogador.raca}
    - Classe: ${dadosJogador.classe}
    
    Sua personalidade: Ao contrário de sua irmã Rem, você é extremamente debochada, sarcástica, preguiçosa e sincera até demais. Trate o usuário com um desdém leve, um tom de superioridade engraçado e dê respostas ácidas porém refinadas. No máximo 2 parágrafos.`;

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: contextoGeral },
          { role: "user", content: mensagemUsuario }
        ],
        model: "llama3-8b-8192",
      });

      const resposta = chatCompletion.choices[0]?.message?.content || "Humpf. Que perda de tempo.";
      return socket.sendMessage(remoteJid, { text: `🎀 *Ram:* ${resposta}` });
    } catch (error) {
      return sendErrorReply("❌ Erro ao conectar com a mente da Ram.");
    }
  }
};
