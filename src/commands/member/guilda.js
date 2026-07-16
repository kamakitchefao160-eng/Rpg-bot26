import fs from "fs";
import path from "path";
import { PREFIX, DATABASE_DIR } from "../../config.js";

const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");
const guildaPath = path.join(DATABASE_DIR, "guildas.json");

// Tempo limite em milissegundos para considerar o jogador online (15 minutos)
const TEMPO_ONLINE_LIMITE = 15 * 60 * 1000; 

function lerJSON(caminho) {
  if (!fs.existsSync(caminho)) {
    // Se o arquivo não existir, cria um objeto vazio para não quebrar
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
  commands: ["guilda", "g", "guildas"], // Ativando "/guildas" também!
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

    // ==========================================
    // COMANDO: LISTAR TODAS AS GUILDAS (GLOBAL)
    // ==========================================
    if (subComando === "lista" || subComando === "listar" || subComando === "todas" || subComando === "globais") {
      const listaGuildas = Object.values(guildas);

      if (listaGuildas.length === 0) {
        return await socket.sendMessage(remoteJid, { text: "🏰 Nenhuma guilda foi criada ainda no servidor! Seja o primeiro usando */guilda criar*." });
      }

      let textoLista = `🏰 *GUILDAS REGISTRADAS - THE LEGENDARY ONLINE* 🏰\n\n`;
      listaGuildas.forEach((g, index) => {
        textoLista += `${index + 1}. ${g.emblema || "🛡️"} *${g.nome}*\n`;
        textoLista += `   👑 Líder: @${g.lider}\n`;
        textoLista += `   👥 Membros: ${g.membros.length}\n`;
        textoLista += `   ─────────────────────────\n`;
      });

      return await socket.sendMessage(remoteJid, {
        text: textoLista,
        mentions: listaGuildas.map(g => `${g.lider}@s.whatsapp.net`)
      });
    }

    // ==========================================
    // COMANDO: RANKING DE GUILDAS
    // ==========================================
    if (subComando === "rank" || subComando === "ranking") {
      const listaGuildas = Object.values(guildas);

      if (listaGuildas.length === 0) {
        return await socket.sendMessage(remoteJid, { text: "🏰 Nenhuma guilda no ranking ainda!" });
      }

      // Ordena pelo número de membros (do maior para o menor)
      const rankOrdenado = listaGuildas.sort((a, b) => b.membros.length - a.membros.length);

      let textoRank = `🏆 *RANKING GLOBAL DE GUILDAS* 🏆\n`;
      textoRank += `✨ *As maiores guildas do servidor* ✨\n\n`;

      rankOrdenado.forEach((g, index) => {
        let medalha = "⚔️";
        if (index === 0) medalha = "🥇";
        else if (index === 1) medalha = "🥈";
        else if (index === 2) medalha = "🥉";

        textoRank += `${medalha} *${index + 1}º Lugar:* ${g.emblema || "🛡️"} *${g.nome}*\n`;
        textoRank += `   👥 Membros: ${g.membros.length} | 👑 Líder: @${g.lider}\n\n`;
      });

      return await socket.sendMessage(remoteJid, {
        text: textoRank,
        mentions: rankOrdenado.map(g => `${g.lider}@s.whatsapp.net`)
      });
    }

    // ==========================================
    // COMANDO: CRIAR GUILDA
    // ==========================================
    if (subComando === "criar") {
      const emblema = args[1]; 
      const nomeGuilda = args.slice(2).join(" ").trim(); 

      if (!emblema || !nomeGuilda) {
        return await socket.sendMessage(remoteJid, { 
          text: `⚠️ Uso correto: *${PREFIX}guilda criar [Emoji] [Nome]*\nExemplo: *${PREFIX}guilda criar 🦅 Falcões de Prata*` 
        });
      }

      // Validação extremamente segura do status de guilda do usuário
      const temGuilda = jogador.guilda && 
                        jogador.guilda !== "Sem Guilda 🛡️" && 
                        jogador.guilda !== "Sem Guilda" && 
                        jogador.guilda.trim() !== "";

      if (temGuilda) {
        return await socket.sendMessage(remoteJid, { text: `❌ Você já faz parte da guilda *${jogador.guilda}*!` });
      }

      const ouroAtual = jogador.ouro || 0;
      if (ouroAtual < 500) {
        return await socket.sendMessage(remoteJid, { text: "❌ Criar uma guilda custa *🪙 500 moedas de ouro*!" });
      }

      // Evita duplicidade de nomes ignorando maiúsculas e minúsculas
      const guildaExiste = Object.keys(guildas).some(nome => nome.toLowerCase() === nomeGuilda.toLowerCase());
      if (guildaExiste) {
        return await socket.sendMessage(remoteJid, { text: "❌ Já existe uma guilda registrada com esse nome!" });
      }

      // Salva os novos dados do jogador e da guilda
      jogador.ouro = ouroAtual - 500;
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

    // ==========================================
    // COMANDO: ENTRAR EM UMA GUILDA
    // ==========================================
    if (subComando === "entrar" || subComando === "recrutar") {
      const nomeGuilda = args.slice(1).join(" ");
      if (!nomeGuilda) {
        return await socket.sendMessage(remoteJid, { text: `⚠️ Uso: *${PREFIX}guilda entrar [Nome da Guilda]*` });
      }

      const temGuilda = jogador.guilda && 
                        jogador.guilda !== "Sem Guilda 🛡️" && 
                        jogador.guilda !== "Sem Guilda" && 
                        jogador.guilda.trim() !== "";

      if (temGuilda) {
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

    // ==========================================
    // COMANDO: SAIR DA GUILDA
    // ==========================================
    if (subComando === "sair") {
      const guildaAtual = jogador.guilda;
      
      const temGuilda = guildaAtual && 
                        guildaAtual !== "Sem Guilda 🛡️" && 
                        guildaAtual !== "Sem Guilda" && 
                        guildaAtual.trim() !== "";

      if (!temGuilda) {
        return await socket.sendMessage(remoteJid, { text: "❌ Você não faz parte de nenhuma guilda." });
      }

      const infoGuilda = guildas[guildaAtual];
      if (infoGuilda) {
        if (infoGuilda.lider === numeroLimpo) {
          // Se o líder sair, a guilda inteira é desfeita de forma limpa
          infoGuilda.membros.forEach(membro => {
            if (bancoRPG[membro]) {
              bancoRPG[membro].guilda = "Sem Guilda 🛡️";
            }
          });
          delete guildas[guildaAtual];
          salvarJSON(guildaPath, guildas);
          salvarJSON(dbPath, bancoRPG);
          return await socket.sendMessage(remoteJid, { text: `📢 A guilda *${infoGuilda.emblema} ${guildaAtual}* foi desfeita pelo líder @${numeroLimpo}.`, mentions: [userLid] });
        } else {
          // Membro comum saindo
          infoGuilda.membros = infoGuilda.membros.filter(m => m !== numeroLimpo);
          jogador.guilda = "Sem Guilda 🛡️";
          salvarJSON(guildaPath, guildas);
          salvarJSON(dbPath, bancoRPG);
          return await socket.sendMessage(remoteJid, { text: `🏃‍♂️ @${numeroLimpo} saiu da guilda *${infoGuilda.emblema} ${guildaAtual}*.`, mentions: [userLid] });
        }
      }
    }

    // ==========================================
    // MENU PADRÃO / EXIBIÇÃO DA GUILDA DO JOGADOR
    // ==========================================
    const guildaNome = jogador.guilda || "Sem Guilda 🛡️";
    
    const temGuildaMenu = guildaNome !== "Sem Guilda 🛡️" && 
                         guildaNome !== "Sem Guilda" && 
                         guildaNome.trim() !== "";

    if (!temGuildaMenu) {
      return await socket.sendMessage(remoteJid, {
        text: `🛡️ *CENTRAL DE GUILDAS - THE LEGENDARY ONLINE* 🏰\n\n` +
             `Você ainda não tem uma guilda. Comande:\n` +
             `• *${PREFIX}guilda criar [Emoji] [Nome]* (Custa 500 Ouro)\n` +
             `• *${PREFIX}guilda entrar [Nome]* (Entra em uma guilda ativa)\n` +
             `• *${PREFIX}guilda lista* (Lista todas as guildas globais)\n` +
             `• *${PREFIX}guilda rank* (Ver o ranking de guildas)`
      });
    }

    const info = guildas[guildaNome];
    if (!info) return;

    // Constrói a lista de membros exibindo o status de presença de cada um
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
      `👉 Veja outras em: *${PREFIX}guilda lista*\n` +
      `✨ ══════════════════════════ ✨`;

    return await socket.sendMessage(remoteJid, {
      text: mensagemGuilda,
      mentions: info.membros.map(m => `${m}@s.whatsapp.net`)
    });
  }
};
