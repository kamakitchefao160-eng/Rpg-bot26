import fs from "fs";
import path from "path";
import { PREFIX, DATABASE_DIR } from "../../config.js";

const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");
const guildaPath = path.join(DATABASE_DIR, "guildas.json");

// Tempo limite em milissegundos para considerar o jogador online (15 minutos)
const TEMPO_ONLINE_LIMITE = 15 * 60 * 1000; 

function lerJSON(caminho) {
  if (!fs.existsSync(caminho)) return {};
  try { return JSON.parse(fs.readFileSync(caminho, "utf-8")); } catch { return {}; }
}

function salvarJSON(caminho, dados) {
  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2));
}

// Função para verificar se o jogador está online com base no último acesso dele
function obterStatusOnline(jogadorDados) {
  if (!jogadorDados || !jogadorDados.ultimoAcesso) return "🔴 Off";
  const agora = Date.now();
  const diferenca = agora - jogadorDados.ultimoAcesso;
  return diferenca < TEMPO_ONLINE_LIMITE ? "🟢 On" : "🔴 Off";
}

export default {
  name: "guilda",
  description: "Crie ou gerencie sua guilda no The Legendary Online com status dos membros",
  commands: ["guilda", "g"],
  usage: `${PREFIX}guilda`,

  handle: async ({ args, socket, remoteJid, userLid }) => {
    const numeroLimpo = userLid.split("@")[0];
    const subComando = args[0]?.toLowerCase();

    let bancoRPG = lerJSON(dbPath);
    let guildas = lerJSON(guildaPath);

    if (!bancoRPG[numeroLimpo]) {
      return await socket.sendMessage(remoteJid, { text: "❌ Você precisa ter um perfil criado primeiro! Digite */perfil*." });
    }

    const jogador = bancoRPG[numeroLimpo];

    // COMANDO: CRIAR GUILDA (Uso: /guilda criar [Emblema/Emoji] [Nome da Guilda])
    // Exemplo: /guilda criar 🦁 Os Leões da Alvorada
    if (subComando === "criar") {
      const emblema = args[1]; // O primeiro argumento após "criar" vira o emblema
      const nomeGuilda = args.slice(2).join(" "); // O resto vira o nome

      if (!emblema || !nomeGuilda) {
        return await socket.sendMessage(remoteJid, { 
          text: `⚠️ Uso correto: *${PREFIX}guilda criar [Emoji/Emblema] [Nome da Guilda]*\nExemplo: *${PREFIX}guilda criar 🦅 Falcões de Prata*` 
        });
      }

      if (jogador.guilda && jogador.guilda !== "Sem Guilda 🛡️") {
        return await socket.sendMessage(remoteJid, { text: "❌ Você já faz parte de uma guilda!" });
      }

      if ((jogador.ouro || 0) < 500) {
        return await socket.sendMessage(remoteJid, { text: "❌ Criar uma guilda custa *🪙 500 moedas de ouro*!" });
      }

      if (guildas[nomeGuilda]) {
        return await socket.sendMessage(remoteJid, { text: "❌ Já existe uma guilda registrada com esse nome!" });
      }

      // Desconta ouro e cria a guilda
      jogador.ouro -= 500;
      jogador.guilda = nomeGuilda;

      guildas[nomeGuilda] = {
        nome: nomeGuilda,
        emblema: emblema,
        lider: numeroLimpo,
        membros: [numeroLimpo]
      };

      salvarJSON(dbPath, bancoRPG);
      salvarJSON(guildaPath, guildas);

      return await socket.sendMessage(remoteJid, {
        text: `🎉 *GUILDA CRIADA COM SUCESSO!* 🛡️\n\n🏰 *Nome:* ${nomeGuilda}\n✨ *Emblema:* ${emblema}\n👑 *Líder:* @${numeroLimpo}\n🪙 *Custo de criação:* -500 Ouro.`,
        mentions: [userLid]
      });
    }

    // COMANDO: ENTRAR EM UMA GUILDA
    if (subComando === "entrar" || subComando === "recrutar") {
      const nomeGuilda = args.slice(1).join(" ");
      if (!nomeGuilda) {
        return await socket.sendMessage(remoteJid, { text: `⚠️ Uso: *${PREFIX}guilda entrar [Nome da Guilda]*` });
      }

      if (jogador.guilda && jogador.guilda !== "Sem Guilda 🛡️") {
        return await socket.sendMessage(remoteJid, { text: "❌ Você já está em uma guilda! Saia dela primeiro usando */guilda sair*." });
      }

      if (!guildas[nomeGuilda]) {
        return await socket.sendMessage(remoteJid, { text: "❌ Essa guilda não existe!" });
      }

      jogador.guilda = nomeGuilda;
      guildas[nomeGuilda].membros.push(numeroLimpo);

      salvarJSON(dbPath, bancoRPG);
      salvarJSON(guildaPath, guildas);

      return await socket.sendMessage(remoteJid, {
        text: `🛡️ @${numeroLimpo} agora faz parte da guilda *${guildas[nomeGuilda].emblema} ${nomeGuilda}*! Seja bem-vindo!`,
        mentions: [userLid]
      });
    }

    // COMANDO: SAIR DA GUILDA
    if (subComando === "sair") {
      const guildaAtual = jogador.guilda;
      if (!guildaAtual || guildaAtual === "Sem Guilda 🛡️") {
        return await socket.sendMessage(remoteJid, { text: "❌ Você não faz parte de nenhuma guilda." });
      }

      const infoGuilda = guildas[guildaAtual];
      if (infoGuilda) {
        if (infoGuilda.lider === numeroLimpo) {
          // Líder deleta a guilda
          infoGuilda.membros.forEach(membro => {
            if (bancoRPG[membro]) bancoRPG[membro].guilda = "Sem Guilda 🛡️";
          });
          delete guildas[guildaAtual];
          salvarJSON(guildaPath, guildas);
          salvarJSON(dbPath, bancoRPG);
          return await socket.sendMessage(remoteJid, { text: `📢 A guilda *${infoGuilda.emblema} ${guildaAtual}* foi desfeita pelo líder @${numeroLimpo}.`, mentions: [userLid] });
        } else {
          // Apenas sai da guilda
          infoGuilda.membros = infoGuilda.membros.filter(m => m !== numeroLimpo);
          jogador.guilda = "Sem Guilda 🛡️";
          salvarJSON(guildaPath, guildas);
          salvarJSON(dbPath, bancoRPG);
          return await socket.sendMessage(remoteJid, { text: `🏃‍♂️ @${numeroLimpo} saiu da guilda *${infoGuilda.emblema} ${guildaAtual}*.`, mentions: [userLid] });
        }
      }
    }

    // MENU PADRÃO / EXIBIÇÃO DE INFORMAÇÕES DA GUILDA
    const guildaNome = jogador.guilda || "Sem Guilda 🛡️";
    if (guildaNome === "Sem Guilda 🛡️") {
      return await socket.sendMessage(remoteJid, {
        text: `🛡️ *CENTRAL DE GUILDAS - THE LEGENDARY ONLINE* 🏰\n\n` +
             `Você ainda não tem uma guilda. Comande:\n` +
             `• *${PREFIX}guilda criar [Emoji] [Nome]* (Custa 500 Ouro)\n` +
             `• *${PREFIX}guilda entrar [Nome]* (Entra em uma guilda ativa)`
      });
    }

    const info = guildas[guildaNome];
    if (!info) return;

    // Constrói a lista de membros mostrando se cada um está Ativo (🟢) ou Inativo (🔴)
    const listaMembrosStatus = info.membros.map(membro => {
      const dadosMembro = bancoRPG[membro];
      const statusOnline = obterStatusOnline(dadosMembro);
      const tagLider = membro === info.lider ? "👑 (Líder)" : "⚔️ (Membro)";
      return `  ${statusOnline} • @${membro} ${tagLider}`;
    }).join("\n");

    const mensagemGuilda = `🏰 *GUILDA: ${info.nome}* ${info.emblema || "🛡️"}\n` +
      `✨ ══════════════════════════ ✨\n\n` +
      `👑 *Líder:* @${info.lider}\n` +
      `👥 *Integrantes (${info.membros.length}):*\n` +
      `${listaMembrosStatus}\n\n` +
      `👉 Para sair, digite: *${PREFIX}guilda sair*\n` +
      `✨ ══════════════════════════ ✨`;

    return await socket.sendMessage(remoteJid, {
      text: mensagemGuilda,
      mentions: info.membros.map(m => `${m}@s.whatsapp.net`)
    });
  }
};
