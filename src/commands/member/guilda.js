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
  try { 
    return JSON.parse(fs.readFileSync(caminho, "utf-8")); 
  } catch { 
    return {}; 
  }
}

function salvarJSON(caminho, dados) {
  try { 
    fs.writeFileSync(caminho, JSON.stringify(dados, null, 2)); 
    return true; 
  } catch { 
    return false; 
  }
}

export default {
  name: "guilda",
  description: "Gerenciamento de Guildas do RPG",
  commands: ["guilda", "g", "guildas"],
  usage: `${PREFIX}guilda`,

  handle: async ({ args, socket, remoteJid, userLid }) => {
    const isGroup = remoteJid.endsWith("@g.us");
    if (!isGroup) return socket.sendMessage(remoteJid, { text: "❌ Este comando só pode ser usado em grupo." });

    const numeroLimpo = userLid.split("@")[0];
    const subComando = args[0]?.toLowerCase();

    let bancoRPG = lerJSON(dbPath);
    let guildas = lerJSON(guildaPath);

    // Verifica se o usuário tem um registro no RPG
    if (!bancoRPG[numeroLimpo]) {
      return await socket.sendMessage(remoteJid, { text: "❌ Crie o seu perfil de RPG primeiro para usar o sistema de guildas!" });
    }

    const jogador = bancoRPG[numeroLimpo];

    // COMANDO: criar
    if (subComando === "criar") {
      const emblema = args[1];
      const nomeGuilda = args.slice(2).join(" ").trim();

      if (!emblema || !nomeGuilda) {
        return await socket.sendMessage(remoteJid, { 
          text: `⚠️ *Uso correto:* \`${PREFIX}guilda criar [Emoji] [Nome da Guilda]\`\n\n*Exemplo:* \`${PREFIX}guilda criar 🛡️ Cavaleiros\`` 
        });
      }

      const temGuilda = jogador.guilda && jogador.guilda !== "Sem Guilda 🛡️" && jogador.guilda !== "Sem Guilda";
      if (temGuilda) {
        return await socket.sendMessage(remoteJid, { text: `❌ Você já pertence à guilda *${jogador.guilda}*! Saia dela antes de criar uma nova.` });
      }

      const custo = 500;
      const saldoAtual = jogador.ouro || 0;
      if (saldoAtual < custo) {
        return await socket.sendMessage(remoteJid, { text: `❌ Você precisa de pelo menos *${custo} de Ouro* para fundar uma Guilda! Seu saldo atual: *${saldoAtual}*` });
      }

      // Verifica se o nome já está em uso
      const existe = Object.keys(guildas).some(g => g.toLowerCase() === nomeGuilda.toLowerCase());
      if (existe) {
        return await socket.sendMessage(remoteJid, { text: "❌ Já existe uma guilda registrada com esse nome. Escolha outro!" });
      }

      // Desconta o valor e atualiza a guilda do jogador
      jogador.ouro = saldoAtual - custo;
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
        text: `🎉 *GUILDA CRIADA!* 🎉\n───────────────────────────\n🏰 A guilda *${nomeGuilda}* ${emblema} foi fundada com sucesso!\n👑 Líder: @${numeroLimpo}\n💰 Custo: -500 Ouro\n───────────────────────────\nSeus amigos podem entrar usando:\n👉 \`${PREFIX}guilda entrar ${nomeGuilda}\``, 
        mentions: [userLid] 
      });
    }

    // COMANDO: entrar
    if (subComando === "entrar") {
      const nomeGuilda = args.slice(1).join(" ").trim();
      if (!nomeGuilda) {
        return await socket.sendMessage(remoteJid, { text: `⚠️ Uso correto: \`${PREFIX}guilda entrar [Nome da Guilda]\`` });
      }

      // Procura a guilda ignorando maiúsculas/minúsculas
      const chaveGuilda = Object.keys(guildas).find(g => g.toLowerCase() === nomeGuilda.toLowerCase());
      if (!chaveGuilda) {
        return await socket.sendMessage(remoteJid, { text: "❌ Essa guilda não foi encontrada. Verifique o nome digitado!" });
      }

      const temGuilda = jogador.guilda && jogador.guilda !== "Sem Guilda 🛡️" && jogador.guilda !== "Sem Guilda";
      if (temGuilda) {
        return await socket.sendMessage(remoteJid, { text: `❌ Você já está na guilda *${jogador.guilda}*. Digite \`${PREFIX}guilda sair\` antes de tentar entrar em outra.` });
      }

      jogador.guilda = chaveGuilda;
      if (!guildas[chaveGuilda].membros.includes(numeroLimpo)) {
        guildas[chaveGuilda].membros.push(numeroLimpo);
      }

      salvarJSON(dbPath, bancoRPG);
      salvarJSON(guildaPath, guildas);

      return await socket.sendMessage(remoteJid, { 
        text: `🛡️ @${numeroLimpo} agora é o mais novo membro aliado à guilda *${chaveGuilda}* ${guildas[chaveGuilda].emblema}!`, 
        mentions: [userLid] 
      });
    }

    // COMANDO: sair
    if (subComando === "sair") {
      const gNome = jogador.guilda;
      const temGuilda = gNome && gNome !== "Sem Guilda 🛡️" && gNome !== "Sem Guilda";
      if (!temGuilda || !guildas[gNome]) {
        return await socket.sendMessage(remoteJid, { text: "❌ Você não está em nenhuma guilda no momento." });
      }

      const info = guildas[gNome];

      if (info.lider === numeroLimpo) {
        // Se o líder sair, a guilda é desfeita e todos os membros ficam sem guilda
        for (const membro of info.membros) {
          if (bancoRPG[membro]) {
            bancoRPG[membro].guilda = "Sem Guilda";
          }
        }
        delete guildas[gNome];
        
        salvarJSON(dbPath, bancoRPG);
        salvarJSON(guildaPath, guildas);

        return await socket.sendMessage(remoteJid, { text: `🚨 O líder @${numeroLimpo} desfez a guilda *${gNome}*. Todos os membros agora estão sem guilda!`, mentions: [userLid] });
      } else {
        // Membro comum saindo
        info.membros = info.membros.filter(m => m !== numeroLimpo);
        jogador.guilda = "Sem Guilda";

        salvarJSON(dbPath, bancoRPG);
        salvarJSON(guildaPath, guildas);

        return await socket.sendMessage(remoteJid, { text: `🏃 @${numeroLimpo} abandonou a guilda *${gNome}*.`, mentions: [userLid] });
      }
    }

    // INFORMAÇÕES GERAIS DA GUILDA DO JOGADOR
    const gNome = jogador.guilda || "Sem Guilda";
    if (gNome === "Sem Guilda" || gNome === "Sem Guilda 🛡️" || !guildas[gNome]) {
      return await socket.sendMessage(remoteJid, {
        text: `🏰 *CENTRAL DE GUILDAS - THE LEGENDARY RPG* 🏰\n───────────────────────────\nVocê não possui alianças ativas.\n\n*Ações Disponíveis:*\n• \`${PREFIX}guilda criar [Emoji] [Nome]\` *(Custo: 500 Ouro)*\n• \`${PREFIX}guilda entrar [Nome da Guilda]\` *(Juntar-se)*`
      });
    }

    const info = guildas[gNome];
    const mentores = info.membros.map(m => m + "@s.whatsapp.net");
    mentores.push(info.lider + "@s.whatsapp.net");

    let listaMembros = info.membros.map((m, index) => `${index + 1}. @${m}`).join("\n");

    return await socket.sendMessage(remoteJid, {
      text: `🏰 *GUILDA:* ${info.nome} ${info.emblema}\n───────────────────────────\n👑 *Líder:* @${info.lider}\n⭐ *Pontos de Guerra:* ${info.pontosGuerra || 0}\n👥 *Membros (${info.membros.length}):*\n${listaMembros}\n───────────────────────────\n💡 Para sair, digite: \`${PREFIX}guilda sair\``,
      mentions: mentores
    });
  }
};
