import fs from "fs";
import path from "path";
import { PREFIX, DATABASE_DIR } from "../../config.js";

const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");

// Identifica País e Idioma pelo DDI
function obterInformacaoPais(numero) {
  if (numero.startsWith("55")) {
    return { pais: "Brasil 🇧🇷", idioma: "Português (Brasil) 🇧🇷" };
  } else if (numero.startsWith("351")) {
    return { pais: "Portugal 🇵🇹", idioma: "Português (Portugal) 🇵🇹" };
  } else if (numero.startsWith("1")) {
    return { pais: "Estados Unidos 🇺🇸", idioma: "Inglês (US) 🇺🇸" };
  } else if (numero.startsWith("34")) {
    return { pais: "Espanha 🇪🇸", idioma: "Espanhol 🇪🇸" };
  }
  return { pais: "Desconhecido 🌐", idioma: "Não Identificado 🌐" };
}

// Formata tempo de jogo (ms para horas/minutos)
function formatarTempoJogo(ms) {
  if (!ms || isNaN(ms)) return "0h 0m";
  const totalMinutos = Math.floor(ms / 60000);
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;
  return `${horas}h ${minutos}m`;
}

export default {
  name: "perfil",
  description: "Mostra sua ficha de herói atualizada",
  commands: ["perfil", "ficha"],
  usage: `${PREFIX}perfil`,
  
  handle: async ({ socket, remoteJid, userLid }) => {
    const numeroLimpo = userLid.split("@")[0];
    const { pais, idioma } = obterInformacaoPais(numeroLimpo);

    let bancoRPG = {};
    if (fs.existsSync(dbPath)) {
      try {
        bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
      } catch (e) {
        bancoRPG = {};
      }
    }

    let ehNovoUsuario = false;

    // Se o usuário não existir, registra ele com o bônus inicial de 200 moedas grátis!
    if (!bancoRPG[numeroLimpo]) {
      ehNovoUsuario = true;
      bancoRPG[numeroLimpo] = {
        nomeOficial: `Lutador_${numeroLimpo.slice(-4)}`,
        raca: "Não definida (Escolha uma de graça!)", 
        classe: "Não definida (Escolha uma de graça!)", 
        titulo: "🌱 Aventureiro Novato",
        arma: "Nenhuma",
        moldura: "Nenhuma",
        consumivel: "Nenhum",
        montaria: "Nenhuma",
        ouro: 200, // 200 moedas iniciais de graça
        inventario: [],
        vitorias: 0,
        derrotas: 0,
        kills: 0,
        guilda: "Sem Guilda 🛡️",
        tempoAtivo: 0,
        ultimoAcesso: Date.now()
      };
      
      if (!fs.existsSync(DATABASE_DIR)) {
        fs.mkdirSync(DATABASE_DIR, { recursive: true });
      }
      fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));
    }

    const dados = bancoRPG[numeroLimpo];

    // Atualiza o tempo acumulado da sessão de jogo ativa
    const agora = Date.now();
    const sessaoAtual = agora - (dados.ultimoAcesso || agora);
    dados.tempoAtivo = (dados.tempoAtivo || 0) + sessaoAtual;
    dados.ultimoAcesso = agora;

    fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));

    // Se for o primeiro acesso, envia um alerta de boas-vindas especial antes!
    if (ehNovoUsuario) {
      const mensagemBoasVindas = `👋 *BEM-VINDO AO THE LEGENDARY ONLINE!* 🎉\n\n` +
        `Notamos que esta é sua primeira vez jogando! Você acaba de receber:\n` +
        `🪙 *+200 Moedas de Ouro* de bônus inicial!\n` +
        `🧬 *1 Raça* de graça!\n` +
        `⚔️ *1 Classe* de graça!\n\n` +
        `Use os comandos do jogo para escolher suas especializações e começar sua jornada!`;
        
      await socket.sendMessage(remoteJid, { text: mensagemBoasVindas, mentions: [userLid] });
    }

    const mochilaVisivel = dados.inventario && dados.inventario.length > 0 
      ? dados.inventario.map(item => `  📦 ${item}`).join("\n") 
      : "   📦 Sua mochila está vazia no momento.";

    const mensagemFicha = `✨ ═════ 🌎 *THE LEGENDARY ONLINE* 🌎 ═════ ✨
👋 Olá @${numeroLimpo}! Bem-vindo à sua central do jogador:

👑 *FICHA DO AVENTUREIRO*
🌟 *Título:* ${dados.titulo || "🌱 Aventureiro Novato"}
👤 *Nome:* ${dados.nomeOficial}
🧬 *Raça:* ${dados.raca}
⚔️ *Classe:* ${dados.classe}
🛡️ *Guilda:* ${dados.guilda || "Sem Guilda 🛡️"}

📊 *ESTATÍSTICAS DE BATALHA (KILLS & BATTLES)*
⚔️ *Total de Lutas:* ${(dados.vitorias || 0) + (dados.derrotas || 0)}
🏆 *Vitórias:* ${dados.vitorias || 0}
💀 *Derrotas:* ${dados.derrotas || 0}
🎯 *Monstros Derrotados (Kills):* ${dados.kills || 0}
⏱️ *Tempo Ativo:* ${formatarTempoJogo(dados.tempoAtivo)}

🌎 *LOCALIZAÇÃO & CONEXÃO*
🌍 *Origem:* ${pais}
🗣️ *Idioma:* ${idioma}

🗡️ *EQUIPAMENTOS ATIVOS*
🛡️ *Arma:* ${dados.arma || "Nenhuma"}
🐎 *Montaria:* ${dados.montaria || "Nenhuma"}
🧪 *Consumível:* ${dados.consumivel || "Nenhum"}

🪙 *FINANÇAS*
💰 *Saldo:* 🪙 *${dados.ouro || dados.gold || 0}* moedas de ouro

🎒 *MOCHILA*
${mochilaVisivel}

⚡ _Explore horizontes usando ${PREFIX}aventura ou desafie inimigos com ${PREFIX}lutar!_
══════════════════════════════`;

    await socket.sendMessage(remoteJid, {
      text: mensagemFicha,
      mentions: [userLid]
    });
  }
};

