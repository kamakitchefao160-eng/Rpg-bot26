import fs from "fs";
import path from "path";
import { Groq } from "groq-sdk";
import { MARIDO_DA_RAIDEN } from "../../config.js";

// Caminho correto do banco para ela consultar os dados do jogador
const dbPath = path.join(process.cwd(), "banco de dados", "rpg-usuarios.json");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default {
  name: "raiden",
  description: "Converse com a Raiden Shogun IA",
  commands: ["raiden", "shogun"],
  usage: `/raiden [sua mensagem]`,

  handle: async ({ args, socket, remoteJid, userLid, sendErrorReply }) => {
    const numeroLimpo = userLid.split("@")[0];
    const mensagemUsuario = args.join(" ");

    if (!mensagemUsuario) return sendErrorReply("❌ Digite algo para falar com a Raiden Shogun.");

    // Busca dados do jogador para dar mais imersão ao RPG
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

    const ehMarido = numeroLimpo === MARIDO_DA_RAIDEN;

    const contextoGeral = `Você é a Raiden Shogun (Ei) de Genshin Impact. Você fala em português e está em um chat de RPG do WhatsApp. 
    Seu comportamento muda drasticamente dependendo de quem fala com você.`;

    // Agora ela sabe a classe e raça do usuário para usar nos diálogos!
    const contextoPersonalizado = ehMarido 
      ? `A pessoa que está falando com você é o seu amado esposo (Nome no RPG: ${dadosJogador.nomeOficial}). Seja extremamente carinhosa, fofa, protetora, ciumenta saudável e demonstre muito amor por ele.`
      : `A pessoa que está falando com você NÃO é seu marido. O nome dele é ${dadosJogador.nomeOficial}, ele é um ${dadosJogador.raca} da classe ${dadosJogador.classe}. Seja fria, distante, arrogante, use respostas curtas e dê patadas diretas caso tentem gracinhas ou intimidade. Trate-o apenas como um mero mortal inferior.`;

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: `${contextoGeral}\n${contextoPersonalizado}` },
          { role: "user", content: mensagemUsuario }
        ],
        model: "llama3-8b-8192",
      });

      const resposta = chatCompletion.choices[0]?.message?.content || "Estou sem tempo para bobagens.";
      return socket.sendMessage(remoteJid, { text: `⚡ *Raiden Shogun:* ${resposta}` });
    } catch (error) {
      return sendErrorReply("❌ Erro ao conectar com a mente da Shogun. Verifique sua API Key no seu arquivo .env.");
    }
  }
};
