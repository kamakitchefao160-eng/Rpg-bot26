import fs from "fs";
import path from "path";
import { PREFIX, DATABASE_DIR } from "../../config.js";

const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");

// 🔒 Trava de Segurança: ID do grupo oficial
const LINK_CONVITE_PERMITIDO = "CRLHW3gOqRvIfo6jD6aSR"; 

// 🎁 ESTRUTURA COMPLETA DE RECOMPENSAS (GRÁTIS E ELITE DE 1 A 50)
const RECOMPENSAS_PASSE = {
  1: { gratis: "🪙 100 Ouros", elite: "🪙 500 Ouros" },
  2: { gratis: "📦 Caixa de Suprimentos Comum", elite: "📦 Caixa Mítica de Armas" },
  3: { gratis: "🧪 Poção de Vida Pequena", elite: "🗡️ Espada de Aço Real" },
  4: { gratis: "🪙 150 Ouros", elite: "🪙 800 Ouros" },
  5: { gratis: "🌸 Emblema Cerejeira x2", elite: "👒 Coroa do Caos" },
  6: { gratis: "🧪 Poção de Mana Pequena", elite: "🛡️ Armadura de Placas Rara" },
  7: { gratis: "🪙 200 Ouros", elite: "🪙 1200 Ouros" },
  8: { gratis: "📦 Caixa de Ferro", elite: "📦 Caixa Lendária" },
  9: { gratis: "🛡️ Escudo de Madeira", elite: "🔮 Orbe do Feiticeiro" },
  10: { gratis: "👑 Caixa Suprema x1", elite: "⚔️ Katana Evolutiva (Upgrade)" },
  11: { gratis: "🪙 300 Ouros", elite: "🪙 1500 Ouros" },
  12: { gratis: "🧪 Poção de Vida Média", elite: "📦 Caixa de Joias Raras" },
  13: { gratis: "📦 Caixa de Ferro", elite: "🏹 Arco Composto Reforçado" },
  14: { gratis: "🪙 350 Ouros", elite: "🪙 2000 Ouros" },
  15: { gratis: "🌸 Emblema Cerejeira x5", elite: "👒 Tiara da Alvorada" },
  16: { gratis: "🧪 Poção de Mana Média", elite: "🥾 Botas da Velocidade Divina" },
  17: { gratis: "🪙 400 Ouros", elite: "🪙 2500 Ouros" },
  18: { gratis: "📦 Caixa de Bronze", elite: "📦 Caixa de Relíquias" },
  19: { gratis: "⚔️ Adaga de Cobre", elite: "🛡️ Escudo do Dragão" },
  20: { gratis: "👑 Caixa Suprema x2", elite: "⚔️ Katana Evolutiva (Fogo)" },
  21: { gratis: "🪙 500 Ouros", elite: "🪙 3000 Ouros" },
  22: { gratis: "🧪 Poção de Vida Grande", elite: "🔮 Pedra do Despertar" },
  23: { gratis: "📦 Caixa de Bronze", elite: "🗡️ Lança de Longinus" },
  24: { gratis: "🪙 600 Ouros", elite: "🪙 4000 Ouros" },
  25: { gratis: "🌸 Emblema Cerejeira x8", elite: "👒 Elmo do General Rúnico" },
  26: { gratis: "🧪 Poção de Mana Grande", elite: "🧥 Capa da Invisibilidade Shadow" },
  27: { gratis: "🪙 700 Ouros", elite: "🪙 5000 Ouros" },
  28: { gratis: "📦 Caixa de Prata", elite: "📦 Caixa Ancestral" },
  29: { gratis: "🏹 Arco de Caçador", elite: "🔨 Martelo de Thor (Réplica)" },
  30: { gratis: "👑 Caixa Suprema x3", elite: "⚔️ Katana Evolutiva (Trovão)" },
  31: { gratis: "🪙 850 Ouros", elite: "🪙 6000 Ouros" },
  32: { gratis: "🧪 Elixir da Força", elite: "🧪 Soro do Super Soldado" },
  33: { gratis: "📦 Caixa de Prata", elite: "🏹 Besta Apocalíptica" },
  34: { gratis: "🪙 1000 Ouros", elite: "🪙 7000 Ouros" },
  35: { gratis: "🌸 Emblema Cerejeira x10", elite: "👒 Diadema do Submundo" },
  36: { gratis: "🧪 Elixir da Agilidade", elite: "🛡️ Peitoral de Adamantium" },
  37: { gratis: "🪙 1200 Ouros", elite: "🪙 8000 Ouros" },
  38: { gratis: "📦 Caixa de Ouro", elite: "📦 Caixa Divina" },
  39: { gratis: "🛡️ Escudo de Cavaleiro", elite: "🗡️ Excalibur Brilhante" },
  40: { gratis: "👑 Caixa Suprema x4", elite: "⚔️ Katana Evolutiva (Vácuo)" },
  41: { gratis: "🪙 1500 Ouros", elite: "🪙 10000 Ouros" },
  42: { gratis: "🔮 Cristal Mágico Menor", elite: "🔮 Olho de Odin" },
  43: { gratis: "📦 Caixa de Ouro", elite: "🐉 Dragão Filhote (Pet)" },
  44: { gratis: "🪙 2000 Ouros", elite: "🪙 12000 Ouros" },
  45: { gratis: "🌸 Emblema Cerejeira x15", elite: "👒 Coroa Eterna do Vencedor" },
  46: { gratis: "🔮 Cristal Mágico Maior", elite: "🧥 Manto dos Reis Ancestrais" },
  47: { gratis: "🪙 3000 Ouros", elite: "🪙 15000 Ouros" },
  48: { gratis: "📦 Caixa Mítica", elite: "📦 Caixa do Vazio Infinito" },
  49: { gratis: "💍 Anel do Rei Negro", elite: "⚡ Manopla do Poder Cósmico" },
  50: { gratis: "👑 Caixa Suprema Cósmica x5", elite: "⚔️ Katana Evolutiva Celestial (IMPERIAL)" }
};

export default {
  name: "passe",
  description: "Gerencia seu Passe de Batalha Completo de 50 Níveis (Exclusivo do Grupo)",
  commands: ["passe", "bp", "resgatar"],
  usage: `${PREFIX}passe [resgatar / elite]`,

  handle: async ({ socket, remoteJid, userLid, args }) => {
    // 🌍 VERIFICAÇÃO EXCLUSIVA DE GRUPO
    try {
      const codigoGrupoAtual = await socket.groupInviteCode(remoteJid);
      if (codigoGrupoAtual !== LINK_CONVITE_PERMITIDO) {
        return socket.sendMessage(remoteJid, { 
          text: "❌ *Este comando é exclusivo do Grupo Oficial do The Legendary Online!*" 
        });
      }
    } catch {
      return socket.sendMessage(remoteJid, { 
        text: "❌ *Este comando só pode ser utilizado dentro do grupo oficial do RPG!*" 
      });
    }

    const numeroLimpo = userLid.split("@")[0];
    let bancoRPG = {};
    if (fs.existsSync(dbPath)) {
      try { bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8")); } catch { bancoRPG = {}; }
    }

    const dados = bancoRPG[numeroLimpo];
    if (!dados) return socket.sendMessage(remoteJid, { text: "❌ Crie seu perfil primeiro." });

    if (dados.nivel_passe === undefined) dados.nivel_passe = 1;
    if (dados.xp_passe === undefined) dados.xp_passe = 0;
    if (dados.passe_elite === undefined) dados.passe_elite = false;
    if (dados.ultimo_nivel_resgatado === undefined) dados.ultimo_nivel_resgatado = 0;

    // 🆙 PROGRESSÃO AUTOMÁTICA DE NÍVEL POR XP
    if (dados.xp_passe >= 100 && dados.nivel_passe < 50) {
      let niveisGanhos = Math.floor(dados.xp_passe / 100);
      dados.xp_passe = dados.xp_passe % 100;
      dados.nivel_passe = Math.min(dados.nivel_passe + niveisGanhos, 50);
      
      await socket.sendMessage(remoteJid, {
        text: `🎉 @${numeroLimpo} *SUBIU DE NÍVEL NO PASSE!* \n✨ Novo nível alcançado: *Nível ${dados.nivel_passe}*! Digite \`${PREFIX}passe resgatar\`.`,
        mentions: [userLid]
      });
      fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));
    }

    const acao = args[0]?.toLowerCase();

    // 💰 COMPRA DO UPGRADE ELITE POR 20K OUROS
    if (acao === "elite") {
      if (dados.passe_elite) return socket.sendMessage(remoteJid, { text: "👑 Você já possui o Passe de Elite ativo!" });
      if ((dados.ouro || 0) < 20000) return socket.sendMessage(remoteJid, { text: "❌ O upgrade do Passe de Elite custa 🪙 *20.000* ouros." });
      
      dados.ouro -= 20000;
      dados.passe_elite = true;
      fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));
      return socket.sendMessage(remoteJid, { text: "👑 *PASSE DE ELITE CONTRATADO POR 20.000 OUROS!* Trilhas de recompensas lendárias liberadas!" });
    }

    // RESGATAR AMBOS OS PRÊMIOS CASO SEJA ELITE
    if (acao === "resgatar") {
      const nivelAtual = dados.nivel_passe;
      const ultimoResgate = dados.ultimo_nivel_resgatado;

      if (ultimoResgate >= nivelAtual) {
        return socket.sendMessage(remoteJid, { text: "📦 Todos os prêmios liberados até o seu nível atual já foram resgatados." });
      }

      let recompensasColetadas = [];
      if (!dados.inventario) dados.inventario = [];

      for (let i = ultimoResgate + 1; i <= nivelAtual; i++) {
        const nivelPremios = RECOMPENSAS_PASSE[i];
        if (!nivelPremios) continue;

        // Trilha Grátis
        recompensasColetadas.push(`🆓 Nvl ${i} [GRÁTIS]: ${nivelPremios.gratis}`);
        if (nivelPremios.gratis.includes("Ouros")) {
          dados.ouro = (dados.ouro || 0) + parseInt(nivelPremios.gratis.replace(/[^0-9]/g, ""));
        } else {
          dados.inventario.push(nivelPremios.gratis);
        }

        // Trilha Elite (Só entrega se tiver pago os 20k)
        if (dados.passe_elite) {
          recompensasColetadas.push(`👑 Nvl ${i} [ELITE]: ${nivelPremios.elite}`);
          if (nivelPremios.elite.includes("Ouros")) {
            dados.ouro = (dados.ouro || 0) + parseInt(nivelPremios.elite.replace(/[^0-9]/g, ""));
          } else {
            dados.inventario.push(nivelPremios.elite);
          }
        }
      }

      dados.ultimo_nivel_resgatado = nivelAtual;
      fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));

      let msgResgate = `🎁 *RECOMPENSAS COLETADAS E ENVIADAS PARA A MOCHILA!*\n\n`;
      msgResgate += recompensasColetadas.join("\n");
      if (!dados.passe_elite) {
        msgResgate += `\n\n💡 _Dica: Se você comprar o Elite por 20.000 ouros, poderá coletar retroativamente os prêmios das caixas coroadas de todos os níveis passados!_`;
      }
      return socket.sendMessage(remoteJid, { text: msgResgate });
    }

    // PAINEL COM AS DUAS TRILHAS BEM SEPARADAS VISUALMENTE
    let painel = `🌸 ══════ 🏆 *PASSE CEREJEIRA (NÍVEL 1 AO 50)* 🏆 ══════ 🌸\n\n`;
    painel += `👤 *Guerreiro:* @${numeroLimpo}\n`;
    painel += `📊 *Nível Atual:* **Nível ${dados.nivel_passe} / 50**\n`;
    painel += `✨ *Experiência:* [${dados.xp_passe}/100 XP]\n`;
    painel += `🎟️ *Tipo de Acesso:* ${dados.passe_elite ? "👑 *ELITE MÁXIMO (20K)*" : "🆓 *TRILHA GRATUITA*"}\n`;
    painel += `📦 *Coletado Até:* Nvl ${dados.ultimo_nivel_resgatado}\n`;
    painel += `───────────────────────────\n\n`;

    painel += `🎁 *PRÓXIMAS RECOMPENSAS DISPONÍVEIS:*\n`;
    for (let n = dados.nivel_passe; n <= Math.min(dados.nivel_passe + 2, 50); n++) {
      const exibicao = RECOMPENSAS_PASSE[n];
      if (exibicao) {
        painel += `🔹 *ETAPA ${n}:*\n`;
        painel += `  🆓 [GRÁTIS]: ${exibicao.gratis}\n`;
        painel += `  👑 [ELITE]: ${exibicao.elite}\n`;
      }
    }

    painel += `\n───────────────────────────\n`;
    painel += `👉 Digite \`${PREFIX}passe resgatar\` para coletar seus itens da conta.\n`;
    if (!dados.passe_elite) {
      painel += `👉 Digite \`${PREFIX}passe elite\` para liberar os itens coroados por 🪙 20.000 ouros.`;
    }

    return socket.sendMessage(remoteJid, { text: painel, mentions: [userLid] });
  }
};
