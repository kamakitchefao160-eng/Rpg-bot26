import fs from "fs";
import path from "path";
import { Groq } from "groq-sdk";
import { GROQ_API_KEY, DATABASE_DIR } from "../../config.js";

const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");
const groq = new Groq({ apiKey: GROQ_API_KEY });

export default {
  name: "subaru",
  description: "Converse com o Subaru Natsuki IA",
  commands: ["subaru", "natsuki"],
  usage: `/subaru [sua mensagem]`,

  handle: async ({ args, socket, remoteJid, userLid, sendErrorReply }) => {
    const numeroLimpo = userLid.split("@")[0];
    const mensagemUsuario = args.join(" ");

    if (!mensagemUsuario) return sendErrorReply("❌ Digite algo para falar com o Subaru.");

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

    const contextoGeral = `Você é o Subaru Natsuki de Re:Zero. Você fala em português e está em um chat de RPG do WhatsApp chamado 'The Legendary Online'.
    Você está conversando com o jogador de dados:
    - Nome de RPG: ${dadosJogador.nomeOficial}
    - Raça: ${dadosJogador.raca}
    - Classe: ${dadosJogador.classe}
    
    Sua personalidade: Você tenta parecer muito confiante, engraçado, expressivo e dramático para esconder seus traumas de suas mortes constantes (pelo 'Retorno através da Morte', mas você não pode falar abertamente sobre isso devido à maldição). Você é completamente apaixonado pela Emilia-tan e amigável com os outros. No máximo 2 parágrafos.`;

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: contextoGeral },
          { role: "user", content: mensagemUsuario }
        ],
        model: "llama-3.1-8b-instant",
      });

      const resposta = chatCompletion.choices[0]?.message?.content || "E aí! Eu sou o Subaru Natsuki, um cara comum, mas determinado!";
      return socket.sendMessage(remoteJid, { text: `🔄 *Subaru Natsuki:* ${resposta}` });
    } catch (error) {
      return sendErrorReply("❌ Erro ao conectar com a mente do Subaru.");
    }
  }
};
