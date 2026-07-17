import fs from "fs";
import path from "path";
import { PREFIX, DATABASE_DIR } from "../../config.js";

const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");

// Função para gerar as premiações dinamicamente até o nível 50
function obterPremioNivel(nivel, ehElite) {
  if (nivel % 10 === 0) {
    return ehElite ? "⚔️ Katana Evolutiva (Upgrade)" : "👑 Caixa Suprema x2";
  }
  if (nivel % 5 === 0) {
    return ehElite ? "👒 Coroa do Caos" : "🌸 Emblema Cerejeira x5";
  }
  return ehElite ? `🪙 ${nivel * 100} Ouros` : `🪙 ${nivel * 30} Ouros`;
}

export default {
  name: "passe",
  description: "Gerencia seu Passe de Batalha Completo de 50 Níveis",
  commands: ["passe", "bp", "resgatar"],
  usage: `${PREFIX}passe [resgatar / elite]`,

  handle: async ({ socket, remoteJid, userLid, args }) => {
    const numeroLimpo = userLid.split("@")[0];
    let bancoRPG = {};
    if (fs.existsSync(dbPath)) {
      try { bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8")); } catch { bancoRPG = {}; }
    }

    const dados = bancoRPG[numeroLimpo];
    if (!dados) return socket.sendMessage(remoteJid, { text: "❌ Crie seu perfil primeiro." });

    // Instancia variáveis do passe
    if (dados.nivel_passe === undefined) dados.nivel_passe = 1;
    if (dados.xp_passe === undefined) dados.xp_passe = 0;
    if (dados.passe_elite === undefined) dados.passe_elite = false;
    if (dados.ultimo_nivel_resgatado === undefined) dados.ultimo_nivel_resgatado = 0;
    if (dados.emblemas_flor === undefined) dados.emblemas_flor = 0;

    const acao = args[0]?.toLowerCase();

    // COMPRAR ELITE
    if (acao === "elite") {
      if (dados.passe_elite) return socket.sendMessage(remoteJid, { text: "👑 Você já possui o Passe de Elite ativo!" });
      if ((dados.ouro || 0) < 5000) return socket.sendMessage(remoteJid, { text: "❌ O Passe de Elite custa 🪙 *5.000* ouros. Acumule mais riquezas!" });
      
      dados.ouro -= 5000;
      dados.passe_elite = true;
      fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));
      return socket.sendMessage(remoteJid, { text: "👑 *PASSE DE ELITE ATIVADO!* Recompensas extras e lendárias liberadas!" });
    }

    // RESGATAR RECOMPENSAS
    if (acao === "resgatar") {
      const nivelAtual = dados.nivel_passe;
      const ultimoResgate = dados.ultimo_nivel_resgatado;

      if (ultimoResgate >= nivelAtual) {
        return socket.sendMessage(remoteJid, { text: "📦 Você já coletou todos os prêmios disponíveis para o seu nível atual." });
      }

      let recompensasColetadas = [];
      if (!dados.inventario) dados.inventario = [];

      for (let i = ultimoResgate + 1; i <= nivelAtual; i++) {
        // Premio Grátis
        const premioGratis = obterPremioNivel(i, false);
        recompensasColetadas.push(`🆓 Nvl ${i}: ${premioGratis}`);
        if (premioGratis.includes("Ouros")) dados.ouro = (dados.ouro || 0) + (i * 30);
        else dados.inventario.push(premioGratis);

        // Premio Elite (Se tiver ativo)
        if (dados.passe_elite) {
          const premioElite = obterPremioNivel(i, true);
          recompensasColetadas.push(`👑 Elite Nvl ${i}: ${premioElite}`);
          if (premioElite.includes("Ouros")) dados.ouro = (dados.ouro || 0) + (i * 100);
          else dados.inventario.push(premioElite);
        }
      }

      dados.ultimo_nivel_resgatado = nivelAtual;
      fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));

      let msgResgate = `🎁 *PREMIAÇÕES RESGATADAS COM SUCESSO!*\n\n`;
      msgResgate += recompensasColetadas.join("\n");
      msgResgate += `\n\n🎒 Verifique seu ouros e itens coletados no \`/cofre\`.`;
      return socket.sendMessage(remoteJid, { text: msgResgate });
    }

    // PAINEL DE EXIBIÇÃO PRINCIPAL
    let painel = `🌸 ══════ 🏆 *PASSE CEREJEIRA (MAX: 50 NVL)* 🏆 ══════ 🌸\n\n`;
    painel += `👤 *Guerreiro:* @${numeroLimpo}\n`;
    painel += `📊 *Nível Atual:* **Nvl ${dados.nivel_passe}/50**\n`;
    painel += `✨ *XP do Passe:* [${dados.xp_passe}/100 XP]\n`;
    painel += `🎟️ *Status:* ${dados.passe_elite ? "👑 *ELITE*" : "🆓 *GRATUITO*"}\n`;
    painel += `📦 *Último Nível Coletado:* Nvl ${dados.ultimo_nivel_resgatado}\n`;
    painel += `───────────────────────────\n\n`;

    // Amostra rápida dos próximos níveis
    painel += `🎁 *PRÓXIMOS PRÊMIOS DA JORNADA:*\n`;
    for (let n = dados.nivel_passe; n <= Math.min(dados.nivel_passe + 3, 50); n++) {
      painel += `🔹 *Nível ${n}:*\n`;
      painel += `  🆓 Grátis: ${obterPremioNivel(n, false)}\n`;
      painel += `  👑 Elite: ${obterPremioNivel(n, true)}\n`;
    }

    painel += `\n───────────────────────────\n`;
    painel += `👉 Digite \`${PREFIX}passe resgatar\` para coletar seus prêmios pendentes!\n`;
    if (!dados.passe_elite) {
      painel += `👉 Digite \`${PREFIX}passe elite\` para comprar o Passe de Elite por 🪙 5.000 ouros.`;
    }

    return socket.sendMessage(remoteJid, { text: painel, mentions: [userLid] });
  }
};
