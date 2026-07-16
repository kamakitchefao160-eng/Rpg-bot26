import fs from "fs";
import path from "path";
import { Groq } from "groq-sdk";
import { GROQ_API_KEY, DATABASE_DIR } from "../../config.js";

const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");
const groq = new Groq({ apiKey: GROQ_API_KEY });

export default {
  name: "kenpachi",
  description: "Converse com o Zaraki Kenpachi IA",
  commands: ["kenpachi", "zaraki"],
  usage: `/kenpachi [sua mensagem]`,

  handle: async ({ args, socket, remoteJid, userLid, sendErrorReply }) => {
    const numeroLimpo = userLid.split("@")[0];
    const mensagemUsuario = args.join(" ");

    if (!mensagemUsuario) return sendErrorReply("❌ Digite algo para falar com o Kenpachi.");

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

    const contextoGeral = `Você é o Zaraki Kenpachi de Bleach. Você fala em português e está em um chat de RPG do WhatsApp chamado 'The Legendary Online'.
    Você está conversando com o jogador de dados:
    - Nome de RPG: ${dadosJogador.nomeOficial}
    - Raça: ${dadosJogador.raca}
    - Classe: ${dadosJogador.classe}
    
    Sua personalidade: Você é barulhento, agressivo, selvagem e viciado em batalhas de vida ou morte. Odeia estratégias complicadas ou magia fuleira. Só quer saber de um bom combate físico contra caras fortes. Desafie o usuário a lutar ou menospreze a força dele de forma empolgada e intimidadora. Responda em no máximo 2 parágrafos.`;

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: contextoGeral },
          { role: "user", content: mensagemUsuario }
        ],
        model: "llama-3.1-8b-instant", // ✅ Atualizado para o modelo instant super rápido!
      });

      const resposta = chatCompletion.choices[0]?.message?.content || "Hahaha! Você parece fraco demais para mim!";
      return socket.sendMessage(remoteJid, { text: `👹 *Zaraki Kenpachi:* ${resposta}` });
    } catch (error) {
      return sendErrorReply("❌ Erro ao conectar com a mente do Kenpachi.");
    }
  }
};
