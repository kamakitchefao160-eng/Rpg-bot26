import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PREFIX } from "../../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pastaDatabase = path.resolve(__dirname, "../../../banco de dados");

const dbPath = path.join(pastaDatabase, "rpg-usuarios.json");
const guildaPath = path.join(pastaDatabase, "guildas.json");
const correioPath = path.join(pastaDatabase, "correio.json");

function lerJSON(caminho) {
  try { return JSON.parse(fs.readFileSync(caminho, "utf-8")); } catch { return {}; }
}
function salvarJSON(caminho, dados) {
  try { fs.writeFileSync(caminho, JSON.stringify(dados, null, 2)); return true; } catch { return false; }
}

export default {
  name: "correio",
  description: "Acessa sua caixa de mensagens, convites de guilda e recompensas",
  commands: ["correio", "caixa"],
  usage: `${PREFIX}correio`,

  handle: async ({ args, socket, remoteJid, userLid }) => {
    const numeroLimpo = (userLid || remoteJid).split("@")[0];
    const acao = args[0]?.toLowerCase();

    let bancoRPG = lerJSON(dbPath);
    let guildas = lerJSON(guildaPath);
    let correio = lerJSON(correioPath);

    if (!correio[numeroLimpo]) correio[numeroLimpo] = [];
    const minhasMensagens = correio[numeroLimpo];

    // ACEITAR UM CONVITE
    if (acao === "aceitar") {
      const index = parseInt(args[1]) - 1;
      if (isNaN(index) || !minhasMensagens[index]) {
        return socket.sendMessage(remoteJid, { text: "❌ *Índice de mensagem inválido.*" });
      }

      const msg = minhasMensagens[index];

      if (msg.tipo === "guilda") {
        if (bancoRPG[numeroLimpo].guilda && bancoRPG[numeroLimpo].guilda !== "Sem Guilda") {
          return socket.sendMessage(remoteJid, { text: "❌ *Você já está em uma guilda. Saia dela primeiro.*" });
        }

        const nomeG = msg.guilda;
        if (!guildas[nomeG]) {
          return socket.sendMessage(remoteJid, { text: "❌ *Esta guilda não existe mais.*" });
        }

        // Adiciona o jogador na guilda
        bancoRPG[numeroLimpo].guilda = nomeG;
        if (!guildas[nomeG].membros.includes(numeroLimpo)) {
          guildas[nomeG].membros.push(numeroLimpo);
        }

        // Remove a mensagem da caixa
        correio[numeroLimpo] = minhasMensagens.filter((_, idx) => idx !== index);

        salvarJSON(dbPath, bancoRPG);
        salvarJSON(guildaPath, guildas);
        salvarJSON(correioPath, correio);

        return socket.sendMessage(remoteJid, { text: `🎉 *Sucesso! Você agora é oficialmente membro da guilda* *${nomeG}* ${guildas[nomeG].emblema}!` });
      }
    }

    // RECUSAR/APAGAR MENSAGEM
    if (acao === "recusar" || acao === "deletar") {
      const index = parseInt(args[1]) - 1;
      if (isNaN(index) || !minhasMensagens[index]) return socket.sendMessage(remoteJid, { text: "❌ *Mensagem não encontrada.*" });

      correio[numeroLimpo] = minhasMensagens.filter((_, idx) => idx !== index);
      salvarJSON(correioPath, correio);
      return socket.sendMessage(remoteJid, { text: "🗑️ *Mensagem removida do seu correio.*" });
    }

    // EXIBIÇÃO DA CAIXA DE ENTRADA
    if (minhasMensagens.length === 0) {
      return socket.sendMessage(remoteJid, { text: "📬 *Sua caixa de correio está completamente vazia.*" });
    }

    let painel = `📬 *SUA CAIXA DE CORREIO* 📬\n───────────────────────────\n`;
    minhasMensagens.forEach((m, idx) => {
      painel += `*${idx + 1}.* [${m.tipo.toUpperCase()}] de @${m.remetente}\n   _${m.texto}_\n\n`;
    });
    painel += `───────────────────────────\n💡 *Comandos:* \n• Comandar resposta: \`${PREFIX}correio aceitar [Número]\`\n• Excluir mensagem: \`${PREFIX}correio recusar [Número]\``;

    return socket.sendMessage(remoteJid, { text: painel, mentions: minhasMensagens.map(m => m.remetente + "@s.whatsapp.net") });
  }
};
