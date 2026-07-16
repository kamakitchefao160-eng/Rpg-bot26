import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PREFIX } from "../../../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pastaDatabase = path.resolve(__dirname, "../../../banco de dados");

const dbPath = path.join(pastaDatabase, "rpg-usuarios.json");
const guildaPath = path.join(pastaDatabase, "guildas.json");

function lerJSON(caminho) {
  if (!fs.existsSync(caminho)) {
    if (!fs.existsSync(pastaDatabase)) {
      fs.mkdirSync(pastaDatabase, { recursive: true });
    }
    fs.writeFileSync(caminho, JSON.stringify({}, null, 2));
    return {};
  }
  try { return JSON.parse(fs.readFileSync(caminho, "utf-8")); } catch { return {}; }
}

function salvarJSON(caminho, dados) {
  try { fs.writeFileSync(caminho, JSON.stringify(dados, null, 2)); return true; } catch { return false; }
}

export default {
  name: "guilda",
  description: "Gerenciamento completo de Guildas",
  commands: ["guilda", "g", "guildas"],
  usage: `${PREFIX}guilda`,

  handle: async ({ args, socket, remoteJid, userLid }) => {
    const numeroLimpo = userLid.split("@")[0];
    const subComando = args[0]?.toLowerCase();

    let bancoRPG = lerJSON(dbPath);
    let guildas = lerJSON(guildaPath);

    if (!bancoRPG[numeroLimpo]) {
      return await socket.sendMessage(remoteJid, { text: "❌ Crie o seu perfil de RPG primeiro para usar este comando." });
    }

    const jogador = bancoRPG[numeroLimpo];

    if (subComando === "criar") {
      const emblema = args[1];
      const nomeGuilda = args.slice(2).join(" ").trim();

      if (!emblema || !nomeGuilda) {
        return await socket.sendMessage(remoteJid, { text: `⚠️ Uso correto: *${PREFIX}guilda criar [Emoji] [Nome]*` });
      }

      const temGuilda = jogador.guilda && jogador.guilda !== "Sem Guilda 🛡️" && jogador.guilda !== "Sem Guilda";
      if (temGuilda) return await socket.sendMessage(remoteJid, { text: "❌ Você já é membro de uma guilda." });

      const existe = Object.keys(guildas).some(g => g.toLowerCase() === nomeGuilda.toLowerCase());
      if (existe) return await socket.sendMessage(remoteJid, { text: "❌ Uma guilda com este nome já existe." });

      jogador.guilda = nomeGuilda;
      guildas[nomeGuilda] = {
        nome: nomeGuilda,
        emblema: emblema,
        lider: numeroLimpo,
        membros: [numeroLimpo],
        pontosGuerra: 0
      };

      salvarJSON(dbPath, bancoRPG);
      salvarJSON(guildaPath, guildas);

      return await socket.sendMessage(remoteJid, { text: `🎉 Guilda *${nomeGuilda}* ${emblema} criada! Liderada por @${numeroLimpo}.`, mentions: [userLid] });
    }

    if (subComando === "entrar") {
      const nomeGuilda = args.slice(1).join(" ").trim();
      if (!nomeGuilda || !guildas[nomeGuilda]) return await socket.sendMessage(remoteJid, { text: "❌ Guilda informada não existe." });

      const temGuilda = jogador.guilda && jogador.guilda !== "Sem Guilda 🛡️" && jogador.guilda !== "Sem Guilda";
      if (temGuilda) return await socket.sendMessage(remoteJid, { text: "❌ Você precisa sair da sua guilda atual primeiro." });

      jogador.guilda = nomeGuilda;
      guildas[nomeGuilda].membros.push(numeroLimpo);

      salvarJSON(dbPath, bancoRPG);
      salvarJSON(guildaPath, guildas);

      return await socket.sendMessage(remoteJid, { text: `🛡️ @${numeroLimpo} aliou-se à guilda *${nomeGuilda}*!`, mentions: [userLid] });
    }

    const gNome = jogador.guilda || "Sem Guilda 🛡️";
    if (gNome === "Sem Guilda 🛡️" || !guildas[gNome]) {
      return await socket.sendMessage(remoteJid, {
        text: `🏰 *SISTEMA DE GUILDAS*\n───────────────────────────\n• *${PREFIX}guilda criar [Emoji] [Nome]*\n• *${PREFIX}guilda entrar [Nome]*`
      });
    }

    const info = guildas[gNome];
    return await socket.sendMessage(remoteJid, {
      text: `🏰 *GUILDA:* ${info.nome} ${info.emblema}\n👑 Líder: @${info.lider}\n👥 Membros: ${info.membros.length}`,
      mentions: [info.lider + "@s.whatsapp.net"]
    });
  }
};
