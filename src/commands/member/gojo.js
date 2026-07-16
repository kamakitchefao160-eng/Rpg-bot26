import fs from "fs";
import path from "path";
import { Groq } from "groq-sdk";
import { GROQ_API_KEY, DATABASE_DIR } from "../../config.js";

const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");
const groq = new Groq({ apiKey: GROQ_API_KEY });

export default {
  name: "gojo",
  description: "Converse com o Satoru Gojo IA",
  commands: ["gojo", "satoru"],
  usage: `/gojo [sua mensagem]`,

  handle: async ({ args, socket, remoteJid, userLid, sendErrorReply }) => {
    const numeroLimpo = userLid.split("@")[0];
    const mensagemUsuario = args.join(" ");

    if (!mensagemUsuario) return sendErrorReply("❌ Digite algo para falar com o Gojo.");

    let bancoRPG = {};
    if (fs.existsSync(dbPath)) {
      try { bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8")); } catch (e) { bancoRPG = {}; }
    }

    const dadosJogador = bancoRPG[numeroLimpo] || {
      nomeOficial: `Aventureiro_${numeroLimpo.slice(-4)}`,
      raca: "Humano",
      classe: "Guerreiro"
    };

    const contextoGeral = `Você é o Satoru Gojo de Jujutsu Kaisen. Você está em um chat de RPG do WhatsApp chamado 'The Legendary Online' e fala em português.
    Você está conversando com o jogador de dados:
    - Nome de RPG: ${dadosJogador.nomeOficial || dadosJogador.nome}
    - Raça: ${dadosJogador.raca}
    - Classe: ${dadosJogador.classe}
    
    Você é o feiticeiro mais forte do mundo, extremamente convencido, brincalhão, infantil, sarcástico e adora provocar os outros porque sabe que ninguém pode te tocar devido ao seu 'Infinito'. Trate tudo com deboche e humor, responda em até 3 parágrafos curtos.`;

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: contextoGeral },
          { role: "user", content: mensagemUsuario }
        ],
        model: "llama-3.3-70b-versatile",
      });

      const resposta = chatCompletion.choices[0]?.message?.content || "Relaxa, afinal, eu sou o mais forte. 😉";
      return socket.sendMessage(remoteJid, { text: `🤞 *Satoru Gojo:* ${resposta}` });
    } catch (error) {
      return sendErrorReply("❌ Erro ao conectar com a mente do Gojo.");
    }
  }
};
