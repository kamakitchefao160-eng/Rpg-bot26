import fs from "fs";
import path from "path";
import { PREFIX } from "../../config.js";

const dbPath = path.join(process.cwd(), "banco de dados", "rpg-usuarios.json");

export default {
  name: "amigos",
  description: "Gerencia sua lista de companheiros e amigos no RPG",
  commands: ["amigos", "amigo", "friends"],
  usage: `${PREFIX}amigos [add / remover] [@usuario]`,

  handle: async ({ socket, remoteJid, userLid, args, message }) => {
    const numeroLimpo = userLid.split("@")[0];

    let bancoRPG = {};
    if (fs.existsSync(dbPath)) {
      try { bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8")); } catch { bancoRPG = {}; }
    }

    const dados = bancoRPG[numeroLimpo];
    if (!dados) return socket.sendMessage(remoteJid, { text: "❌ Crie seu perfil primeiro." });

    if (!dados.amigos) dados.amigos = [];

    const acao = args[0]?.toLowerCase();

    // 📝 SELEÇÃO DO ALVO (Por menção ou resposta)
    let alvoJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                  message.message?.extendedTextMessage?.contextInfo?.participant;

    const alvoNumero = alvoJid ? alvoJid.split("@")[0] : null;

    // 📜 VISUALIZAR A LISTA DE AMIGOS
    if (!acao) {
      let textoAmigos = `╔═════ ❖ ═════╗\n`;
      textoAmigos += `   🤝  *LISTA DE COMPANHEIROS* 🤝\n`;
      textoAmigos += `╚═════ ❖ ═════╝\n\n`;
      textoAmigos += `👥 *Seus Amigos de Jornada:* [${dados.amigos.length}/20]\n`;
      textoAmigos += `───────────────────────────\n\n`;

      if (dados.amigos.length === 0) {
        textoAmigos += `_Você ainda não adicionou nenhum aliado à sua lista._\n\n`;
      } else {
        const mencoes = [];
        dados.amigos.forEach((amigoNum, index) => {
          const amigoDados = bancoRPG[amigoNum] || {};
          const racaAmigo = amigoDados.raca || "Humano";
          const classeAmigo = amigoDados.classe || "Guerreiro";
          
          textoAmigos += `${index + 1}. @${amigoNum} \n   └─ _Lvl: ${amigoDados.nivel_passe || 1} | ${racaAmigo} ${classeAmigo}_\n\n`;
          mencoes.push(`${amigoNum}@s.whatsapp.net`);
        });
      }

      textoAmigos += `───────────────────────────\n`;
      textoAmigos += `💡 *Comandos:* \n`;
      textoAmigos += `👉 \`${PREFIX}amigos add @usuario\`\n`;
      textoAmigos += `👉 \`${PREFIX}amigos remover @usuario\``;

      return socket.sendMessage(remoteJid, { text: textoAmigos, mentions: [userLid, ...dados.amigos.map(n => `${n}@s.whatsapp.net`)] });
    }

    // ➕ ADICIONAR AMIGO
    if (acao === "add" || acao === "adicionar") {
      if (!alvoNumero) return socket.sendMessage(remoteJid, { text: "❌ Você precisa mencionar (`@`) ou responder a mensagem de quem deseja adicionar." });
      if (alvoNumero === numeroLimpo) return socket.sendMessage(remoteJid, { text: "❌ Você não pode se adicionar na própria lista." });
      if (dados.amigos.includes(alvoNumero)) return socket.sendMessage(remoteJid, { text: "❌ Este jogador já é seu amigo de guilda!" });
      if (dados.amigos.length >= 20) return socket.sendMessage(remoteJid, { text: "❌ Sua lista de amigos está cheia (Limite: 20)." });
      if (!bancoRPG[alvoNumero]) return socket.sendMessage(remoteJid, { text: "❌ Este usuário ainda não possui um perfil criado no RPG." });

      dados.amigos.push(alvoNumero);
      fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));

      return socket.sendMessage(remoteJid, { 
        text: `🤝 *Parceria Formada!* @${alvoNumero} foi adicionado à sua lista de amigos com sucesso!`, 
        mentions: [alvoJid] 
      });
    }

    // ➖ REMOVER AMIGO
    if (acao === "remover" || acao === "rem") {
      if (!alvoNumero) return socket.sendMessage(remoteJid, { text: "❌ Você precisa mencionar ou responder a mensagem do amigo a ser removido." });
      if (!dados.amigos.includes(alvoNumero)) return socket.sendMessage(remoteJid, { text: "❌ Este jogador não está na sua lista de amigos." });

      dados.amigos = dados.amigos.filter(num => num !== alvoNumero);
      fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));

      return socket.sendMessage(remoteJid, { 
        text: `💔 *Laço Cortado!* @${alvoNumero} foi removido da sua aliança comercial de amigos.`, 
        mentions: [alvoJid] 
      });
    }

    return socket.sendMessage(remoteJid, { text: `❌ Ação inválida. Use \`${PREFIX}amigos add\` ou \`${PREFIX}amigos remover\`.` });
  }
};
