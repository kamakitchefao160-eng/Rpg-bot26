import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PREFIX } from "../../../config.js"; // CORRIGIDO: 3 níveis para a raiz!

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pastaDatabase = path.resolve(__dirname, "../../../banco de dados");

const dbPath = path.join(pastaDatabase, "rpg-usuarios.json");
const guildaPath = path.join(pastaDatabase, "guildas.json");

function lerJSON(caminho) {
  if (!fs.existsSync(caminho)) {
    try { fs.writeFileSync(caminho, JSON.stringify({}, null, 2)); } catch {}
    return {};
  }
  try { return JSON.parse(fs.readFileSync(caminho, "utf-8")); } catch { return {}; }
}

function salvarJSON(caminho, dados) {
  try { fs.writeFileSync(caminho, JSON.stringify(dados, null, 2)); return true; } catch { return false; }
}

export default {
  name: "guilda",
  description: "Gerenciamento completo de guilda",
  commands: ["guilda", "g", "guildas"],
  usage: `${PREFIX}guilda`,

  handle: async ({ args, socket, remoteJid, userLid }) => {
    const numeroLimpo = userLid.split("@")[0];
    const subComando = args[0]?.toLowerCase();

    let bancoRPG = lerJSON(dbPath);
    let guildas = lerJSON(guildaPath);

    if (!bancoRPG[numeroLimpo]) {
      return await socket.sendMessage(remoteJid, { text: "❌ Você precisa ter um perfil criado primeiro!" });
    }

    const jogador = bancoRPG[numeroLimpo];

    // ==========================================
    // SUBCOMANDO: LISTAR GUILDAS GLOBAIS
    // ==========================================
    if (subComando === "lista" || subComando === "listar" || subComando === "todas" || subComando === "globais") {
      const listaGuildas = Object.values(guildas);
      if (listaGuildas.length === 0) {
        return await socket.sendMessage(remoteJid, { text: "🏰 Nenhuma guilda criada ainda! Crie a sua usando */guilda criar*." });
      }

      let texto = `🏰 *GUILDAS REGISTRADAS* 🏰\n\n`;
      listaGuildas.forEach((g, idx) => {
        texto += `${idx + 1}. ${g.emblema || "🛡️"} *${g.nome}*\n   👑 Líder: @${g.lider}\n   👥 Membros: ${g.membros.length}\n   🏆 Pontos de Guerra: ${g.pontosGuerra || 0}\n─────────────────────────\n`;
      });

      return await socket.sendMessage(remoteJid, { text: texto, mentions: listaGuildas.map(g => `${g.lider}@s.whatsapp.net`) });
    }

    // ==========================================
    // SUBCOMANDO: RANKING
    // ==========================================
    if (subComando === "rank" || subComando === "ranking") {
      const listaGuildas = Object.values(guildas);
      if (listaGuildas.length === 0) return await socket.sendMessage(remoteJid, { text: "🏰 Sem guildas no ranking." });

      const ordenadas = listaGuildas.sort((a, b) => (b.pontosGuerra || 0) - (a.pontosGuerra || 0));
      let textoRank = `🏆 *RANKING DE GUILDAS (GUERRA)* 🏆\n\n`;
      ordenadas.forEach((g, index) => {
        let medalha = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "⚔️";
        textoRank += `${medalha} *${index + 1}º* ${g.emblema || "🛡️"} *${g.nome}*\n   👥 Membros: ${g.membros.length} | 🏆 Pontos: ${g.pontosGuerra || 0}\n\n`;
      });

      return await socket.sendMessage(remoteJid, { text: textoRank });
    }

    // ==========================================
    // SUBCOMANDO: CRIAR
    // ==========================================
    if (subComando === "criar") {
      const emblema = args[1];
      const nomeGuilda = args.slice(2).join(" ").trim();

      if (!emblema || !nomeGuilda) {
        return await socket.sendMessage(remoteJid, { text: `⚠️ Uso: *${PREFIX}guilda criar [Emoji] [Nome]*` });
      }

      const temGuilda = jogador.guilda && jogador.guilda !== "Sem Guilda 🛡️" && jogador.guilda !== "Sem Guilda" && jogador.guilda.trim() !== "";
      if (temGuilda) return await socket.sendMessage(remoteJid, { text: "❌ Você já está em uma guilda!" });

      const guildaExiste = Object.keys(guildas).some(nome => nome.toLowerCase() === nomeGuilda.toLowerCase());
      if (guildaExiste) return await socket.sendMessage(remoteJid, { text: "❌ Nome de guilda já registrado!" });

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

      return await socket.sendMessage(remoteJid, {
        text: `🎉 *GUILDA CRIADA COM SUCESSO!* 🛡️\n\n🏰 Nome: ${nomeGuilda}\n👑 Líder: @${numeroLimpo}`,
        mentions: [userLid]
      });
    }

    // ==========================================
    // SUBCOMANDO: ENTRAR
    // ==========================================
    if (subComando === "entrar") {
      const nomeGuilda = args.slice(1).join(" ");
      if (!nomeGuilda || !guildas[nomeGuilda]) return await socket.sendMessage(remoteJid, { text: "❌ Guilda não encontrada." });

      const temGuilda = jogador.guilda && jogador.guilda !== "Sem Guilda 🛡️" && jogador.guilda !== "Sem Guilda";
      if (temGuilda) return await socket.sendMessage(remoteJid, { text: "❌ Você já está em uma guilda." });

      jogador.guilda = nomeGuilda;
      guildas[nomeGuilda].membros.push(numeroLimpo);

      salvarJSON(dbPath, bancoRPG);
      salvarJSON(guildaPath, guildas);

      return await socket.sendMessage(remoteJid, {
        text: `🛡️ @${numeroLimpo} entrou na guilda *${nomeGuilda}*!`,
        mentions: [userLid]
      });
    }

    // ==========================================
    // SUBCOMANDO: SAIR
    // ==========================================
    if (subComando === "sair") {
      const gAtual = jogador.guilda;
      if (!gAtual || gAtual === "Sem Guilda 🛡️" || !guildas[gAtual]) return await socket.sendMessage(remoteJid, { text: "❌ Sem guilda ativa." });

      const infoG = guildas[gAtual];
      if (infoG.lider === numeroLimpo) {
        infoG.membros.forEach(m => { if (bancoRPG[m]) bancoRPG[m].guilda = "Sem Guilda 🛡️"; });
        delete guildas[gAtual];
        salvarJSON(guildaPath, guildas);
        salvarJSON(dbPath, bancoRPG);
        return await socket.sendMessage(remoteJid, { text: `📢 Guilda *${gAtual}* foi desfeita pelo líder.` });
      } else {
        infoG.membros = infoG.membros.filter(m => m !== numeroLimpo);
        jogador.guilda = "Sem Guilda 🛡️";
        salvarJSON(guildaPath, guildas);
        salvarJSON(dbPath, bancoRPG);
        return await socket.sendMessage(remoteJid, { text: `🏃‍♂️ @${numeroLimpo} saiu da guilda.` });
      }
    }

    // ==========================================
    // EXIBIÇÃO PADRÃO
    // ==========================================
    const gNome = jogador.guilda || "Sem Guilda 🛡️";
    if (gNome === "Sem Guilda 🛡️" || !guildas[gNome]) {
      return await socket.sendMessage(remoteJid, {
        text: `🛡️ *CENTRAL DE GUILDAS*\n\n• *${PREFIX}guilda criar [Emoji] [Nome]*\n• *${PREFIX}guilda entrar [Nome]*\n• *${PREFIX}guilda lista*\n• *${PREFIX}guilda rank*`
      });
    }

    const info = guildas[gNome];
    const membrosStr = info.membros.map(m => `  ⚔️ • @${m}`).join("\n");

    return await socket.sendMessage(remoteJid, {
      text: `🏰 *GUILDA: ${info.nome}* ${info.emblema}\n\n👑 Líder: @${info.lider}\n🏆 Pontos de Guerra: ${info.pontosGuerra || 0}\n👥 Membros (${info.membros.length}):\n${membrosStr}`,
      mentions: info.membros.map(m => `${m}@s.whatsapp.net`)
    });
  }
};
