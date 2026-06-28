import { Groq } from "groq-sdk";
import { MARIDO_DA_RAIDEN } from "../../config.js";

// Inicializa o Groq usando a chave que está salva em segredo no seu .env
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default {
  name: "raiden",
  description: "Converse com a Raiden Shogun IA",
  commands: ["raiden", "shogun"],
  usage: `/raiden [sua mensagem]`,

  handle: async ({ args, socket, remoteJid, userLid, sendErrorReply }) => {
    const numeroLimpo = userLid.split("@")[0];
    const mensagemUsuario = args.join(" ");

    // Se o usuário só digitar /raiden sem nenhuma mensagem da frente
    if (!mensagemUsuario) return sendErrorReply("❌ Digite algo para falar com a Raiden Shogun.");

    // Verifica se quem está mandando mensagem é o número configurado como marido no .env
    const ehMarido = numeroLimpo === MARIDO_DA_RAIDEN;

    const contextoGeral = `Você é a Raiden Shogun (Ei) de Genshin Impact. Você fala em português. 
    Seu comportamento muda drasticamente dependendo de quem fala com você.`;

    const contextoPersonalizado = ehMarido 
      ? `A pessoa que está falando com você é o seu amado esposo (número ${MARIDO_DA_RAIDEN}). Seja extremamente carinhosa, fofa, protetora, ciumenta saudável e demonstre muito amor por ele.`
      : `A pessoa que está falando com você NÃO é seu marido. Seja fria, distante, arrogante, use respostas curtas e dê patadas diretas caso tentem gracinhas.`;

    try {
      // Envia as instruções e a mensagem para a API do Groq
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
