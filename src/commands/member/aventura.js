import fs from "fs";
import path from "path";
import { PREFIX, DATABASE_DIR } from "../../config.js";

const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");

export const AVENTURAS_ATIVAS = new Map();

const HAB_CLASSES = {
  "Guerreiro": { p1: { nome: "👊 Golpe de Espada", danoBase: 25 }, p2: { nome: "💥 Impacto de Escudo", danoBase: 38 }, p3: { nome: "🛡️ Fortaleza de Aço", escudoBase: 40 } },
  "Mago": { p1: { nome: "✨ Seta de Energia", danoBase: 22 }, p2: { nome: "🔥 Explosão de Fogo", danoBase: 45 }, p3: { nome: "🛡️ Barreira Arcana", escudoBase: 35 } },
  "Assassino": { p1: { nome: "🗡️ Apunhalada", danoBase: 26 }, p2: { nome: "⚡ Ataque Furtivo", danoBase: 48 }, p3: { nome: "💨 Passos de Sombra", escudoBase: 30 } },
  "Arqueiro": { p1: { nome: "🏹 Tiro Certeiro", danoBase: 24 }, p2: { nome: "💥 Disparo Perfurante", danoBase: 42 }, p3: { nome: "👟 Recuo Ágil", escudoBase: 30 } },
  "Samurai": { p1: { nome: "⚔️ Corte Iaido", danoBase: 26 }, p2: { nome: "⚡ Golpe de Vento", danoBase: 43 }, p3: { nome: "🛡️ Postura do Fluxo", escudoBase: 35 } },
  "Sacerdote / Clérigo": { p1: { nome: "☀️ Luz Punitiva", danoBase: 18 }, p2: { nome: "✨ Julgamento Sagrado", danoBase: 35 }, p3: { nome: "💚 Prece de Cura", curaBase: 35 } },
  "Paladino": { p1: { nome: "🔨 Golpe da Justiça", danoBase: 22 }, p2: { nome: "💥 Martelo Divino", danoBase: 36 }, p3: { nome: "🛡️ Proteção Sagrada", escudoBase: 40 } },
  "Necromante": { p1: { nome: "💀 Toque Sombrio", danoBase: 20 }, p2: { nome: "🔮 Explosão de Almas", danoBase: 41 }, p3: { nome: "🩸 Dreno de Vida", curaBase: 25 } },
  "Ninja": { p1: { nome: "🎯 Shuriken Veloz", danoBase: 22 }, p2: { nome: "🔥 Jutsu de Fogo", danoBase: 44 }, p3: { nome: "🪵 Substituição", escudoBase: 35 } },
  "Ladino / Larápio": { p1: { nome: "🗡️ Corte Rápido", danoBase: 23 }, p2: { nome: "🎰 Golpe de Sorte", danoBase: 46 }, p3: { nome: "💨 Bomba de Fumaça", escudoBase: 30 } }
};

const RACAS_RPG = {
  "Humano": { hpBonus: 0, danoBonus: 5 }, "Elfo": { hpBonus: 0, danoBonus: 3 }, "Oni (Demônio Oriental)": { hpBonus: 15, danoBonus: 5 },
  "Meio-Fera": { hpBonus: 5, danoBonus: 4 }, "Anão": { hpBonus: 25, danoBonus: 0 }, "Morto-Vivo": { hpBonus: 10, danoBonus: 3 },
  "Vampiro": { hpBonus: 0, danoBonus: 6 }, "Anjo Caído": { hpBonus: 5, danoBonus: 7 }, "Fada": { hpBonus: -10, danoBonus: 2 },
  "Orc": { hpBonus: 30, danoBonus: 2 }
};

const MONSTROS_DIFICEIS = [
  { nome: "Quimera de Fogo 🦁🔥", hp: 220, dano: 25 },
  { nome: "Lorde Vampiro Valerius 🧛‍♂️", hp: 250, dano: 28 },
  { nome: "Golem de Obsidiana 🗿", hp: 320, dano: 20 },
  { nome: "Cérbero dos Portões 🐕‍🦺🔥", hp: 240, dano: 26 },
  { nome: "Dragão Vermelho Ancião 🐉", hp: 350, dano: 35 },
  { nome: "Minotauro Berserker 🐂", hp: 280, dano: 27 },
  { nome: "Leviatã dos Mares 🐋", hp: 340, dano: 26 }
];

function lerJSON(caminho) {
  try { return JSON.parse(fs.readFileSync(caminho, "utf-8")); } catch { return {}; }
}

function salvarJSON(caminho, dados) {
  try { fs.writeFileSync(caminho, JSON.stringify(dados, null, 2)); return true; } catch { return false; }
}

export default {
  name: "aventura",
  description: "Explore masmorras ativamente jogando em turnos contra chefes",
  commands: ["aventura", "explorar", "pve"],
  usage: `${PREFIX}aventura ou digitar 1, 2, 3 no seu turno`,

  handle: async ({ socket, remoteJid, userLid, args }) => {
    const isGroup = remoteJid.endsWith("@g.us");
    if (!isGroup) return socket.sendMessage(remoteJid, { text: "❌ Este comando só pode ser usado em grupos." });

    const jogadorId = (userLid || remoteJid)?.split("@")[0];

    // FASE INTERATIVA (PRODUÇÃO DE TURNOS)
    if (AVENTURAS_ATIVAS.has(remoteJid)) {
      const aventura = AVENTURAS_ATIVAS.get(remoteJid);
      if (jogadorId !== aventura.jogador.id) return;

      const escolha = parseInt(args[0]);
      if (!escolha || escolha < 1 || escolha > 3) {
        return socket.sendMessage(remoteJid, { text: "❌ Escolha inválida! Digite apenas: 1, 2 ou 3." });
      }

      clearTimeout(aventura.timer);
      let jog = aventura.jogador;
      let boss = aventura.monstro;
      let msgTurno = `⚔️ *TURNO ${aventura.turnoAtual} — SUA AÇÃO* ⚔️\n───────────────────────────\n`;

      const golpesClasse = HAB_CLASSES[jog.classe] || HAB_CLASSES["Guerreiro"];
      const passivaRaca = RACAS_RPG[jog.raca] || { danoBonus: 0 };

      if (escolha === 3) {
        const p3 = golpesClasse.p3;
        if (p3.curaBase) {
          jog.hp = Math.min(jog.hpMax, jog.hp + p3.curaBase);
          msgTurno += `✨ *${jog.nomeOficial}* usou *${p3.nome}* e curou *${p3.curaBase} HP*!\n`;
        } else {
          jog.escudo = Math.min(200, jog.escudo + p3.escudoBase);
          msgTurno += `🛡️ *${jog.nomeOficial}* usou *${p3.nome}* e obteve *${p3.escudoBase} de Escudo*!\n`;
        }
      } else {
        const golpe = escolha === 1 ? golpesClasse.p1 : golpesClasse.p2;
        let danoFinal = golpe.danoBase + (passivaRaca.danoBonus || 0);
        let sorteio = Math.random() * 100;

        if (sorteio <= 10) {
          danoFinal = 0;
          msgTurno += `💨 *${jog.nomeOficial}* errou o ataque! O chefe esquivou!\n`;
        } else if (sorteio >= 85) {
          danoFinal = Math.floor(danoFinal * 1.5);
          msgTurno += `⚡ *🚨 CRÍTICO!* O golpe *${golpe.nome}* causou *${danoFinal} de dano*!\n`;
        } else {
          msgTurno += `💥 *${jog.nomeOficial}* causou *${danoFinal} de dano* no chefe com *${golpe.nome}*.\n`;
        }
        boss.hp = Math.max(0, boss.hp - danoFinal);
      }

      // Vitória
      if (boss.hp <= 0) {
        AVENTURAS_ATIVAS.delete(remoteJid);
        let bancoRPG = lerJSON(dbPath);
        const ouroSorteado = Math.floor(Math.random() * (120 - 45 + 1)) + 45;

        if (bancoRPG[jog.id]) {
          bancoRPG[jog.id].ouro = (bancoRPG[jog.id].ouro || 0) + ouroSorteado;
          bancoRPG[jog.id].xp_passe = (bancoRPG[jog.id].xp_passe || 0) + 15;
          bancoRPG[jog.id].limitesDiarios.aventuras += 1;

          if (bancoRPG[jog.id].xp_passe >= 100) {
            bancoRPG[jog.id].xp_passe -= 100;
            bancoRPG[jog.id].nivel_passe = (bancoRPG[jog.id].nivel_passe || 1) + 1;
            msgTurno += `\n🎉 *UP! SEU PASSE DE BATALHA SUBIU PARA O NÍVEL ${bancoRPG[jog.id].nivel_passe}!* 🎉\n`;
          }
          salvarJSON(dbPath, bancoRPG);
          msgTurno += `\n📊 *Aventuras hoje:* ${bancoRPG[jog.id].limitesDiarios.aventuras}/3\n`;
        }

        msgTurno += `\n🏆 *VITÓRIA HEROICA!*\n💀 O *${boss.nome}* desmoronou!\n💰 Ouro: 🪙 +${ouroSorteado}\n🎫 Passe: +15 XP`;
        return socket.sendMessage(remoteJid, { text: msgTurno });
      }

      // Contra-ataque do Chefe
      let danoBoss = Math.floor(Math.random() * 10 + boss.dano);
      if (jog.escudo > 0) {
        if (jog.escudo >= danoBoss) {
          jog.escudo -= danoBoss;
          msgTurno += `👹 *Boss:* Bateu no seu escudo! (Restante: ${jog.escudo} Blindagem)\n`;
          danoBoss = 0;
        } else {
          danoBoss -= jog.escudo;
          msgTurno += `🛡️ *Defesa rompida!* O chefe quebrou seu escudo e tirou *${danoBoss}* do seu HP.\n`;
          jog.escudo = 0;
        }
      } else {
        msgTurno += `👹 *Boss:* Desferiu um golpe pesado tirando *${danoBoss} de HP*.\n`;
      }

      jog.hp = Math.max(0, jog.hp - danoBoss);

      // Derrota
      if (jog.hp <= 0) {
        AVENTURAS_ATIVAS.delete(remoteJid);
        let bancoRPG = lerJSON(dbPath);
        if (bancoRPG[jog.id]) {
          bancoRPG[jog.id].limitesDiarios.aventuras += 1;
          salvarJSON(dbPath, bancoRPG);
          msgTurno += `\n📊 *Aventuras hoje:* ${bancoRPG[jog.id].limitesDiarios.aventuras}/3\n`;
        }
        msgTurno += `\n💀 *DERROTA!* Você desmaiou e perdeu a exploração.`;
        return socket.sendMessage(remoteJid, { text: msgTurno });
      }

      aventura.turnoAtual++;
      let painel = `${msgTurno}\n───────────────────────────\n⏳ *VEZ DE ${jog.nomeOficial} — TURNO ${aventura.turnoAtual}*\n`;
      painel += `❤️ *Seu HP:* ${jog.hp}/${jog.hpMax} | 🛡️ Escudo: ${jog.escudo}\n`;
      painel += `👾 *HP do Boss:* ${boss.hp} HP\n───────────────────────────\n`;
      painel += `Digite o número da ação:\n`;
      painel += `👉 *1* - ${golpesClasse.p1.nome}\n`;
      painel += `👉 *2* - ${golpesClasse.p2.nome}\n`;
      painel += `👉 *3* - ${golpesClasse.p3.nome}\n`;

      aventura.timer = setTimeout(() => {
        socket.sendMessage(remoteJid, { text: `⏱️ Tempo esgotado! A masmorra desmoronou.` });
        AVENTURAS_ATIVAS.delete(remoteJid);
      }, 30000);

      return socket.sendMessage(remoteJid, { text: painel });
    }

    // INICIAR NOVA AVENTURA
    let bancoRPG = lerJSON(dbPath);
    const player = bancoRPG[jogadorId];

    if (!player) return socket.sendMessage(remoteJid, { text: `❌ Use *${PREFIX}perfil* primeiro.` });

    const hoje = new Date().toISOString().slice(0, 10);
    if (!player.limitesDiarios) player.limitesDiarios = {};
    if (player.limitesDiarios.data !== hoje) {
      player.limitesDiarios.data = hoje;
      player.limitesDiarios.aventuras = 0;
    }

    if (player.limitesDiarios.aventuras >= 3) {
      return socket.sendMessage(remoteJid, { text: `⚠️ *LIMITE ATINGIDO (3/3)!* Volte amanhã.` });
    }

    const monstroSorteado = MONSTROS_DIFICEIS[Math.floor(Math.random() * MONSTROS_DIFICEIS.length)];
    const pClasse = player.classe && player.classe !== "Não definida" ? player.classe : "Guerreiro";
    const pRaca = player.raca && player.raca !== "Não definida" ? player.raca : "Humano";

    const passivaRaca = RACAS_RPG[pRaca] || { hpBonus: 0 };
    let hpCalculado = 220 + (passivaRaca.hpBonus || 0);

    const novaAventura = {
      turnoAtual: 1,
      jogador: { id: jogadorId, nomeOficial: player.nomeOficial, hp: hpCalculado, hpMax: hpCalculado, escudo: 100, classe: pClasse, raca: pRaca },
      monstro: { ...monstroSorteado },
      timer: null
    };

    AVENTURAS_ATIVAS.set(remoteJid, novaAventura);
    const golpesClasse = HAB_CLASSES[pClasse] || HAB_CLASSES["Guerreiro"];

    let painelInicial = `╔══════ ❖ ══════╗\n   🗺️  *EXPLORAÇÃO POR TURNOS* \n╚══════ ❖ ══════╝\n\n`;
    painelInicial += `⚔️ *${player.nomeOficial}* encontrou: *${novaAventura.monstro.nome}*!\n`;
    painelInicial += `❤️ *Seu HP:* ${novaAventura.jogador.hp} | 🛡️ *Escudo:* 100\n───────────────────────────\n`;
    painelInicial += `⏳ Envie apenas o número da sua ação:\n`;
    painelInicial += `👉 *1* - ${golpesClasse.p1.nome}\n`;
    painelInicial += `👉 *2* - ${golpesClasse.p2.nome}\n`;
    painelInicial += `👉 *3* - ${golpesClasse.p3.nome}\n───────────────────────────\n⏱️ Reaja em até 30 segundos!`;

    novaAventura.timer = setTimeout(() => {
      socket.sendMessage(remoteJid, { text: `⏱️ Aventura cancelada por inatividade.` });
      AVENTURAS_ATIVAS.delete(remoteJid);
    }, 30000);

    return socket.sendMessage(remoteJid, { text: painelInicial, mentions: [userLid] });
  }
};
