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
  }
  return { pais: "Desconhecido 🌐", idioma: "Não Identificado 🌐" };
}

// Retorna a patente do Free Fire baseada em Kills
function obterPatente(kills) {
  const k = kills || 0;
  if (k < 5) return "🟫 Bronze I";
  if (k < 10) return "🟫 Bronze II";
  if (k < 15) return "🟫 Bronze III";
  
  if (k < 23) return "⬜ Prata I";
  if (k < 31) return "⬜ Prata II";
  if (k < 40) return "⬜ Prata III";
  
  if (k < 50) return "🟨 Ouro I";
  if (k < 60) return "🟨 Ouro II";
  if (k < 70) return "🟨 Ouro III";
  if (k < 80) return "🟨 Ouro IV";
  
  if (k < 92) return "🟦 Platina I";
  if (k < 104) return "🟦 Platina II";
  if (k < 116) return "🟦 Platina III";
  if (k < 130) return "🟦 Platina IV";
  
  if (k < 147) return "💎 Diamante I";
  if (k < 164) return "💎 Diamante II";
  if (k < 181) return "💎 Diamante III";
  if (k < 200) return "💎 Diamante IV";
  
  if (k < 220) return "🔴 Mestre ⭐️";
  if (k < 240) return "🔴 Mestre ⭐️⭐️";
  if (k < 260) return "🔴 Mestre ⭐️⭐️⭐️";
  if (k < 280) return "🔴 Mestre ⭐️⭐️⭐️⭐️";
  if (k < 300) return "🔴 Mestre ⭐️⭐️⭐️⭐️⭐️";
  
  if (k < 320) return "🔥 Elite ⭐️";
  if (k < 340) return "🔥 Elite ⭐️⭐️";
  if (k < 360) return "🔥 Elite ⭐️⭐️⭐️";
  if (k < 380) return "🔥 Elite ⭐️⭐️⭐️⭐️";
  if (k < 400) return "🔥 Elite ⭐️⭐️⭐️⭐️⭐️";
  
  return "👑 Desafiante";
}

export default {
  name: "perfil",
  description: "Mostra sua ficha com sua Patente e estatísticas de guilda",
  commands: ["perfil", "ficha"],
  usage: `${PREFIX}perfil`,
  
  handle: async ({ socket, remoteJid, userLid }) => {
    const numeroLimpo = userLid.split("@")[0];
    const { pais, idioma } = obterInformacaoPais(numeroLimpo);

    let bancoRPG = {};
    if (fs.existsSync(dbPath)) {
      try { bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8")); } catch { bancoRPG = {}; }
    }

    let ehNovoUsuario = false;

    if (!bancoRPG[numeroLimpo]) {
      ehNovoUsuario = true;
      bancoRPG[numeroLimpo] = {
        nomeOficial: `Lutador_${numeroLimpo.slice(-4)}`,
        raca: "Não definida", 
        classe: "Não definida", 
        habilidadeAtiva: "Nenhuma",
        titulo: "🌱 Aventureiro Novato",
        arma: "Nenhuma",
        moldura: "Nenhuma",
        consumivel: "Nenhum",
        montaria: "Nenhuma",
        ouro: 200, 
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

    // Atualiza tempo de jogo ativo
    const agora = Date.now();
    const sessaoAtual = agora - (dados.ultimoAcesso || agora);
    dados.tempoAtivo = (dados.tempoAtivo || 0) + sessaoAtual;
    dados.ultimoAcesso = agora;
    fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));

    if (ehNovoUsuario) {
      const msgBoasVindas = `👋 *BEM-VINDO AO THE LEGENDARY ONLINE!* 🎉\n\n` +
        `Você acaba de receber:\n` +
        `🪙 *+200 Moedas de Ouro* de graça!\n\n` +
        `👉 Escolha sua primeira especialidade sem pagar nada:\n` +
        `• Escolher Classe: *${PREFIX}classe [Guerreiro/Mago/Arqueiro]*\n` +
        `• Escolher Raça: *${PREFIX}raca [Humano/Elfo/Orc]*`;
        
      await socket.sendMessage(remoteJid, { text: msgBoasVindas, mentions: [userLid] });
    }

    const mochilaVisivel = dados.inventario && dados.inventario.length > 0 
      ? dados.inventario.map(item => `  📦 ${item}`).join("\n") 
      : "   📦 Sua mochila está vazia no momento.";

    const patenteDisplay = obterPatente(dados.kills);

    const mensagemFicha = `✨ ═════ 🌎 *THE LEGENDARY ONLINE* 🌎 ═════ ✨
👋 Olá @${numeroLimpo}! Bem-vindo ao seu painel:

👑 *DADOS DO HERÓI*
🏆 *Patente:* ${patenteDisplay}
👤 *Nome:* ${dados.nomeOficial}
🧬 *Raça:* ${dados.raca || "Não definida"}
⚔️ *Classe:* ${dados.classe || "Não definida"}
🔥 *Habilidade:* ${dados.habilidadeAtiva || "Nenhuma"}
🏰 *Guilda:* ${dados.guilda || "Sem Guilda 🛡️"}

📊 *ESTATÍSTICAS DE COMBATE (KILLS & BATTLES)*
⚔️ *Lutas Totais:* ${(dados.vitorias || 0) + (dados.derrotas || 0)}
💀 *Vitórias:* ${dados.vitorias || 0}
❌ *Derrotas:* ${dados.derrotas || 0}
🎯 *Abates (Kills):* ${dados.kills || 0}

🌎 *SESSÃO*
🌍 *País:* ${pais}
🗣️ *Idioma:* ${idioma}

🪙 *FINANÇAS*
💰 *Saldo:* 🪙 *${dados.ouro || 0}* ouro

🎒 *MOCHILA*
${mochilaVisivel}

⚡ _Desafie inimigos usando ${PREFIX}lutar!_
══════════════════════════════`;

    await socket.sendMessage(remoteJid, {
      text: mensagemFicha,
      mentions: [userLid]
    });
  }
};
