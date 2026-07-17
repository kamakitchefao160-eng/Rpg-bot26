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

// Cache temporário simples para marcar quem está online (interagiu nas últimas 2 horas)
const usuariosAtivos = new Set();

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
  description: "Sistema completo de gerenciamento de Guildas e Alianças",
  commands: ["guilda", "g", "guildas"],
  usage: `${PREFIX}guilda`,

  handle: async ({ args, socket, remoteJid, userLid, mentions }) => {
    const isGroup = remoteJid.endsWith("@g.us");
    if (!isGroup) return socket.sendMessage(remoteJid, { text: "❌ *Este comando só pode ser usado em grupos.*" });

    const jidUsuario = userLid || remoteJid; 
    const numeroLimpo = jidUsuario.split("@")[0];
    
    // Marca o usuário atual como Online
    usuariosAtivos.add(numeroLimpo);

    let bancoRPG = lerJSON(dbPath);
    let guildas = lerJSON(guildaPath);
    let correio = lerJSON(correioPath);

    if (!bancoRPG[numeroLimpo]) {
      return socket.sendMessage(remoteJid, { text: "❌ *Crie seu perfil primeiro para entrar no sistema de alianças.*" });
    }

    const jogador = bancoRPG[numeroLimpo];
    const subComando = args[0]?.toLowerCase();

    // 🌟 1. LISTA DE GUILDAS EXISTENTES
    if (subComando === "lista" || subComando === "listar" || subComando === "entrar" && !args[1]) {
      const listaChaves = Object.keys(guildas);
      if (listaChaves.length === 0) {
        return socket.sendMessage(remoteJid, { text: "🏰 *Nenhuma guilda registrada no servidor até o momento.*" });
      }

      let txtLista = `🏰 *GUILDAS REGISTRADAS NO RPG* 🏰\n───────────────────────────\n`;
      listaChaves.forEach((g, idx) => {
        const info = guildas[g];
        txtLista += `*${idx + 1}.* ${info.emblema} *${info.nome}* — Membros: *${info.membros.length}*\n`;
      });
      txtLista += `───────────────────────────\n💡 *Para entrar, peça para o líder te convidar via:* \`${PREFIX}guilda convidar @jogador\``;
      return socket.sendMessage(remoteJid, { text: txtLista });
    }

    // 🌟 2. CRIAR GUILDA
    if (subComando === "criar") {
      const emblema = args[1];
      const nomeGuilda = args.slice(2).join(" ").trim();

      if (!emblema || !nomeGuilda) {
        return socket.sendMessage(remoteJid, { text: `⚠️ *Uso correto:* \`${PREFIX}guilda criar [Emoji] [Nome da Guilda]\`` });
      }

      if (jogador.guilda && jogador.guilda !== "Sem Guilda") {
        return socket.sendMessage(remoteJid, { text: `❌ *Você já faz parte da guilda* *${jogador.guilda}*!` });
      }

      const custo = 1000;
      if ((jogador.ouro || 0) < custo) {
        return socket.sendMessage(remoteJid, { text: `❌ *Você precisa de pelo menos* *🪙 ${custo} de Ouro*!` });
      }

      if (guildas[nomeGuilda]) {
        return socket.sendMessage(remoteJid, { text: "❌ *Uma guilda com este nome já existe.*" });
      }

      bancoRPG[numeroLimpo].ouro -= custo;
      bancoRPG[numeroLimpo].guilda = nomeGuilda;

      guildas[nomeGuilda] = {
        nome: nomeGuilda,
        emblema: emblema,
        lider: numeroLimpo,
        membros: [numeroLimpo],
        pontosGuerra: 0
      };

      salvarJSON(dbPath, bancoRPG);
      salvarJSON(guildaPath, guildas);

      return socket.sendMessage(remoteJid, {
        text: `🎉 *GUILDA FUNDADA!* 🎉\n───────────────────────────\n🏰 *Nome:* *${nomeGuilda}* ${emblema}\n👑 *Líder Executivo:* @${numeroLimpo}\n💰 *Taxa de criação:* *-1000 Ouro*\n───────────────────────────`,
        mentions: [jidUsuario]
      });
    }

    // 🌟 3. SISTEMA DE CONVITE (LÍDER ENVIA PRO CORREIO)
    if (subComando === "convidar" || subComando === "convite") {
      const gNome = jogador.guilda;
      if (!gNome || gNome === "Sem Guilda" || !guildas[gNome]) {
        return socket.sendMessage(remoteJid, { text: "❌ *Você não gerencia nenhuma guilda.*" });
      }

      if (guildas[gNome].lider !== numeroLimpo) {
        return socket.sendMessage(remoteJid, { text: "❌ *Apenas o Líder da guilda pode recrutar novos membros.*" });
      }

      if (!mentions || mentions.length === 0) {
        return socket.sendMessage(remoteJid, { text: "❌ *Marque o jogador que deseja convidar.*" });
      }

      const alvoId = mentions[0].split("@")[0];
      if (guildas[gNome].membros.includes(alvoId)) {
        return socket.sendMessage(remoteJid, { text: "❌ *Este jogador já está na sua guilda.*" });
      }

      if (!correio[alvoId]) correio[alvoId] = [];
      
      // Adiciona o convite na caixa de correio do destinatário
      correio[alvoId].push({
        tipo: "guilda",
        remetente: numeroLimpo,
        guilda: gNome,
        texto: `Você foi convidado para se juntar à guilda **${gNome}** ${guildas[gNome].emblema}.`
      });

      salvarJSON(correioPath, correio);

      return socket.sendMessage(remoteJid, {
        text: `📬 *CONVITE ENVIADO!* O convite para a guilda *${gNome}* foi postado na caixa de correio de @${alvoId}.`,
        mentions: [mentions[0]]
      });
    }

    // 🌟 4. REMOVER/EXPULSAR MEMBRO (APENAS LÍDER)
    if (subComando === "remover" || subComando === "expulsar") {
      const gNome = jogador.guilda;
      if (!gNome || gNome === "Sem Guilda" || !guildas[gNome]) {
        return socket.sendMessage(remoteJid, { text: "❌ *Você não possui guilda.*" });
      }

      if (guildas[gNome].lider !== numeroLimpo) {
        return socket.sendMessage(remoteJid, { text: "❌ *Comando restrito ao Líder da guilda.*" });
      }

      if (!mentions || mentions.length === 0) {
        return socket.sendMessage(remoteJid, { text: "❌ *Marque o membro que deseja expulsar.*" });
      }

      const alvoId = mentions[0].split("@")[0];
      if (alvoId === numeroLimpo) {
        return socket.sendMessage(remoteJid, { text: "❌ *Você não pode se remover. Use /guilda sair se deseja desmanchar a guilda.*" });
      }

      if (!guildas[gNome].membros.includes(alvoId)) {
        return socket.sendMessage(remoteJid, { text: "❌ *Este jogador não pertence à sua guilda.*" });
      }

      guildas[gNome].membros = guildas[gNome].membros.filter(m => m !== alvoId);
      if (bancoRPG[alvoId]) bancoRPG[alvoId].guilda = "Sem Guilda";

      salvarJSON(dbPath, bancoRPG);
      salvarJSON(guildaPath, guildas);

      return socket.sendMessage(remoteJid, {
        text: `🚨 *MEMBRO EXPULSO!* @${alvoId} foi removido da aliança por decisão do líder.`,
        mentions: [mentions[0]]
      });
    }

    // 🌟 5. SAIR DA GUILDA
    if (subComando === "sair") {
      const gNome = jogador.guilda;
      if (!gNome || gNome === "Sem Guilda" || !guildas[gNome]) {
        return socket.sendMessage(remoteJid, { text: "❌ *Você não está em nenhuma guilda.*" });
      }

      if (guildas[gNome].lider === numeroLimpo) {
        // Se o líder sair, deleta a guilda e limpa o registro de todos
        guildas[gNome].membros.forEach(m => {
          if (bancoRPG[m]) bancoRPG[m].guilda = "Sem Guilda";
        });
        delete guildas[gNome];
        salvarJSON(dbPath, bancoRPG);
        salvarJSON(guildaPath, guildas);
        return socket.sendMessage(remoteJid, { text: `💥 *A guilda ${gNome} foi completamente dissolvida pelo líder.*` });
      } else {
        guildas[gNome].membros = guildas[gNome].membros.filter(m => m !== numeroLimpo);
        bancoRPG[numeroLimpo].guilda = "Sem Guilda";
        salvarJSON(dbPath, bancoRPG);
        salvarJSON(guildaPath, guildas);
        return socket.sendMessage(remoteJid, { text: `🏃 *Você abandonou a guilda ${gNome}.*` });
      }
    }

    // 🌟 MENU PRINCIPAL / VISUALIZAÇÃO DA SUA GUILDA
    const minhaGuilda = jogador.guilda;
    if (!minhaGuilda || minhaGuilda === "Sem Guilda" || !guildas[minhaGuilda]) {
      return socket.sendMessage(remoteJid, {
        text: `🏰 *SISTEMA DE ALIANÇAS - RPG* 🏰\n───────────────────────────\n*Status:* Você está sem afiliação.\n\n*Ações:* \n• \`${PREFIX}guilda criar [Emoji] [Nome]\`\n• \`${PREFIX}guilda lista\` *(Ver corporações)*`
      });
    }

    const info = guildas[minhaGuilda];
    const listaMarcacoes = info.membros.map(m => m + "@s.whatsapp.net");

    let stringMembros = "";
    info.membros.forEach((m, i) => {
      const status = usuariosAtivos.has(m) ? "🟢 *On*" : "🔴 *Off*";
      const cargo = m === info.lider ? "👑 *Líder*" : "🛡️ *Membro*";
      stringMembros += `  *${i + 1}.* @${m} — ${cargo} [${status}]\n`;
    });

    return socket.sendMessage(remoteJid, {
      text: `🏰 *GUILDA:* *${info.nome}* ${info.emblema}\n───────────────────────────\n⭐ *Pontos de Guerra:* *${info.pontosGuerra || 0}*\n👥 *Quadro de Integrantes (${info.membros.length}):*\n${stringMembros}\n───────────────────────────\n💡 *Painel Administrativo:*\n• Convide novos guerreiros: \`${PREFIX}guilda convidar @jogador\`\n• Desvincular-se da guilda: \`${PREFIX}guilda sair\``,
      mentions: listaMarcacoes
    });
  }
};
