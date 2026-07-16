import fs from "fs";
import path from "path";
import { Groq } from "groq-sdk";
import { GROQ_API_KEY, DATABASE_DIR } from "../../config.js";

const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");
const groq = new Groq({ apiKey: GROQ_API_KEY });

export default {
  name: "naruto",
  description: "Converse com o Naruto Uzumaki IA",
  commands: ["naruto", "uzumaki"],
  usage: `/naruto [sua mensagem]`,

  handle: async ({ args, socket, remoteJid, userLid, sendErrorReply }) => {
    const numeroLimpo = userLid.split("@")[0];
    const mensagemUsuario = args.join(" ");

    if (!mensagemUsuario) return sendErrorReply("❌ Digite algo para falar com o Naruto.");

    let bancoRPG = {};
    if (fs.existsSync(dbPath)) {
      try { bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8")); } catch (e) { bancoRPG = {}; }
    }

    const dadosJogador = bancoRPG[numeroLimpo] || {
      nomeOficial: `Aventureiro_${numeroLimpo.slice(-4)}`,
      raca: "Humano",
      classe: "Guerreiro"
    };

    const contextoGeral = `Você é o Naruto Uzumaki de Naruto. Você está em um chat de RPG do WhatsApp chamado 'The Legendary Online' e fala em português.
    Você está conversando com o jogador de dados:
    - Nome de RPG: ${dadosJogador.nomeOficial || dadosJogador.nome}
    - Raça: ${dadosJogador.raca}
    - Classe: ${dadosJogador.classe}
    
    Você é extremamente enérgico, otimista, cabeça-oca, mas tem um coração gigante. Use gírias como 'Ttebayo!' (ou 'Tô certo!'), fale sobre seu sonho de ser Hokage e sobre lamen. Seja muito amigável, responda de forma direta e use no máximo 2 a 3 parágrafos curtos.`;

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: contextoGeral },
          { role: "user", content: mensagemUsuario }
        ],
        model: "llama3-8b-8192",
      });

      const resposta = chatCompletion.choices[0]?.message?.content || "Estou sem tempo, tenho que treinar!";
      return socket.sendMessage(remoteJid, { text: `🦊 *Naruto Uzumaki:* ${resposta}` });
    } catch (error) {
      return sendErrorReply("❌ Erro ao conectar com a mente do Naruto.");
    }
  }
};
