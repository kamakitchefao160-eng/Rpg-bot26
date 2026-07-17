import fs from "fs";
import path from "path";
import { PREFIX, DATABASE_DIR } from "../../config.js";

const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");

export const BATALHAS_ATIVAS = new Map();

// 🎮 TABELA COMPLETA DE HABILIDADES POR CLASSE
export const HAB_CLASSES = {
  "Guerreiro": {
    p1: { nome: "👊 Golpe de Espada", danoBase: 25 },
    p2: { nome: "💥 Impacto de Escudo", danoBase: 38 },
    p3: { nome: "🛡️ Fortaleza de Aço", escudoBase: 40 }
  },
  "Mago": {
    p1: { nome: "✨ Seta de Energia", danoBase: 22 },
    p2: { nome: "🔥 Explosão de Fogo", danoBase: 45 },
    p3: { nome: "🛡️ Barreira Arcana", escudoBase: 35 }
  },
  "Assassino": {
    p1: { nome: "🗡️ Apunhalada", danoBase: 26 },
    p2: { nome: "⚡ Ataque Furtivo", danoBase: 48 },
    p3: { nome: "💨 Passos de Sombra", escudoBase: 30 }
  },
  "Arqueiro": {
    p1: { nome: "🏹 Tiro Certeiro", danoBase: 24 },
    p2: { nome: "💥 Disparo Perfurante", danoBase: 42 },
    p3: { nome: "👟 Recuo Ágil", escudoBase: 30 }
  },
  "Samurai": {
    p1: { nome: "⚔️ Corte Iaido", danoBase: 26 },
    p2: { nome: "⚡ Golpe de Vento", danoBase: 43 },
    p3: { nome: "🛡️ Postura do Fluxo", escudoBase: 35 }
  },
  "Sacerdote / Clérigo": {
    p1: { nome: "☀️ Luz Punitiva", danoBase: 18 },
    p2: { nome: "✨ Julgamento Sagrado", danoBase: 35 },
    p3: { nome: "💚 Prece de Cura", curaBase: 35 }
  },
  "Paladino": {
    p1: { nome: "🔨 Golpe da Justiça", danoBase: 22 },
    p2: { nome: "💥 Martelo Divino", danoBase: 36 },
    p3: { nome: "🛡️ Proteção Sagrada", escudoBase: 40 }
  },
  "Necromante": {
    p1: { nome: "💀 Toque Sombrio", danoBase: 20 },
    p2: { nome: "🔮 Explosão de Almas", danoBase: 41 },
    p3: { nome: "🩸 Dreno de Vida", curaBase: 25 }
  },
  "Ninja": {
    p1: { nome: "🎯 Shuriken Veloz", danoBase: 22 },
    p2: { nome: "🔥 Jutsu de Fogo", danoBase: 44 },
    p3: { nome: "🪵 Substituição", escudoBase: 35 }
  },
  "Ladino / Larápio": {
    p1: { nome: "🗡️ Corte Rápido", danoBase: 23 },
    p2: { nome: "🎰 Golpe de Sorte", danoBase: 46 },
    p3: { nome: "💨 Bomba de Fumaça", escudoBase: 30 }
  },
  "Bardo": {
    p1: { nome: "🎵 Acorde Disruptivo", danoBase: 19 },
    p2: { nome: "⚡ Acorde do Trovão", danoBase: 38 },
    p3: { nome: "🛡️ Balada Protetora", escudoBase: 35 }
  },
  "Bárbaro": {
    p1: { nome: "🪓 Golpe de Machado", danoBase: 27 },
    p2: { nome: "😡 Ataque Furioso", danoBase: 50 },
    p3: { nome: "🥩 Grito de Guerra", escudoBase: 30 }
  },
  "Monge": {
    p1: { nome: "👊 Palma Espiritual", danoBase: 24 },
    p2: { nome: "⚡ Combo de Chutes", danoBase: 42 },
    p3: { nome: "🧘 Meditação Zen", curaBase: 30 }
  },
  "Alquimista": {
    p1: { nome: "🧪 Frasco de Ácido", danoBase: 21 },
    p2: { nome: "💥 Elixir Volátil", danoBase: 43 },
    p3: { nome: "🛡️ Poção de Ferro", escudoBase: 35 }
  },
  "Cavaleiro Rúnico": {
    p1: { nome: "⚔️ Lâmina Rúnica", danoBase: 25 },
    p2: { nome: "⚡ Impacto Elemental", danoBase: 40 },
    p3: { nome: "🛡️ Runa Protetora", escudoBase: 38 }
  },
  "Druida": {
    p1: { nome: "🌿 Raízes Sufocantes", danoBase: 20 },
    p2: { nome: "🐻 Ira da Natureza", danoBase: 39 },
    p3: { nome: "🌸 Forma de Urso", escudoBase: 35 }
  },
  "Lanceiro": {
    p1: { nome: "🔱 Estocada Linear", danoBase: 25 },
    p2: { nome: "💥 Salto Devastador", danoBase: 46 },
    p3: { nome: "🛡️ Guarda Impenetrável", escudoBase: 35 }
  },
  "Invocador (Summoner)": {
    p1: { nome: "🦅 Ataque do Familiar", danoBase: 22 },
    p2: { nome: "💥 Fúria das Feras", danoBase: 40 },
    p3: { nome: "🛡️ Escudo de Pedra", escudoBase: 35 }
  },
  "Atirador de Elite (Sniper)": {
    p1: { nome: "🔫 Disparo Preciso", danoBase: 26 },
    p2: { nome: "💣 Tiro de Alta Calibragem", danoBase: 52 },
    p3: { nome: "👟 Camuflagem", escudoBase: 25 }
  },
  "Berserker": {
    p1: { nome: "⚔️ Talho Frenético", danoBase: 28 },
    p2: { nome: "🔴 Execução Sangrenta", danoBase: 55 },
    p3: { nome: "🛡️ Vontade Indomável", escudoBase: 25 }
  },
  "Cavaleiro da Morte": {
    p1: { nome: "💀 Golpe Profano", danoBase: 26 },
    p2: { nome: "⛓️ Atração Sombria", danoBase: 45 },
    p3: { nome: "🛡️ Escudo de Ossos", escudoBase: 38 }
  },
  "Bruxo": {
    p1: { nome: "🔮 Rajada Mística", danoBase: 23 },
    p2: { nome: "🔥 Chama do Caos", danoBase: 46 },
    p3: { nome: "🩸 Pacto Sombrio", curaBase: 28 }
  },
  "Feiticeiro": {
    p1: { nome: "⚡ Centelha Arcana", danoBase: 22 },
    p2: { nome: "❄️ Chuva de Meteoros", danoBase: 48 },
    p3: { nome: "🛡️ Escudo Elemental", escudoBase: 32 }
  },
  "Caçador de Recompensas": {
    p1: { nome: "🏹 Disparo de Rastreio", danoBase: 24 },
    p2: { nome: "⛓️ Armadilha de Aço", danoBase: 43 },
    p3: { nome: "👟 Evasão Tática", escudoBase: 30 }
  },
  "Pirata": {
    p1: { nome: "⚔️ Talho de Sabre", danoBase: 23 },
    p2: { nome: "🔫 Tiro de Garrucha", danoBase: 44 },
    p3: { nome: "🥃 Gole de Rum", curaBase: 30 }
  },
  "Mosqueteiro": {
    p1: { nome: "⚔️ Estocada de Florete", danoBase: 25 },
    p2: { nome: "🔫 Tiro de Precisão", danoBase: 47 },
    p3: { nome: "💨 Esquiva Elegante", escudoBase: 28 }
  },
  "Espadachim": {
    p1: { nome: "⚔️ Corte Cruzado", danoBase: 24 },
    p2: { nome: "⚡ Avanço Veloz", danoBase: 43 },
    p3: { nome: "🛡️ Defesa Ágil", escudoBase: 35 }
  },
  "Xamã": {
    p1: { nome: "⚡ Choque Estático", danoBase: 20 },
    p2: { nome: "🌪️ Fúria dos Elementos", danoBase: 42 },
    p3: { nome: "💚 Totem de Cura", curaBase: 32 }
  },
  "Domador de Feras": {
    p1: { nome: "🐾 Comando de Ataque", danoBase: 21 },
    p2: { nome: "🐺 Mordida de Lobo", danoBase: 43 },
    p3: { nome: "🛡️ Companheiro Protetor", escudoBase: 35 }
  },
  "Ilusionista": {
    p1: { nome: "👁️ Pscicose", danoBase: 19 },
    p2: { nome: "🔮 Explosão de Espelhos", danoBase: 40 },
    p3: { nome: "👥 Clone de Sombras", escudoBase: 38 }
  },
  "Cavaleiro Sagrado": {
    p1: { nome: "⚔️ Espada da Justiça", danoBase: 24 },
    p2: { nome: "☀️ Julgamento Solar", danoBase: 41 },
    p3: { nome: "🛡️ Aegis Sagrado", escudoBase: 42 }
  },
  "Guardião da Floresta": {
    p1: { nome: "🏹 Flecha Envenenada", danoBase: 22 },
    p2: { nome: "🐻 Investida da Fera", danoBase: 42 },
    p3: { nome: "🌿 Bênção de Gaia", curaBase: 34 }
  },
  "Pugilista": {
    p1: { nome: "👊 Direto de Esquerda", danoBase: 25 },
    p2: { nome: "⚡ Cruzado Devastador", danoBase: 48 },
    p3: { nome: "🛡️ Guarda Certeira", escudoBase: 30 }
  },
  "Mestre de Armas": {
    p1: { nome: "⚔️ Combinação Mortal", danoBase: 26 },
    p2: { nome: "💥 Arremesso de Lança", danoBase: 47 },
    p3: { nome: "🛡️ Bloqueio Perfeito", escudoBase: 35 }
  },
  "Clérigo Sombrio": {
    p1: { nome: "💀 Praga de Dor", danoBase: 21 },
    p2: { nome: "🔮 Corrupção da Alma", danoBase: 42 },
    p3: { nome: "🩸 Dízimo de Vida", curaBase: 30 }
  },
  "Geomante": {
    p1: { nome: "🪨 Projétil de Pedra", danoBase: 22 },
    p2: { nome: "🌋 Fenda Terrestre", danoBase: 44 },
    p3: { nome: "🛡️ Armadura de Cristal", escudoBase: 38 }
  },
  "Pirotecnista": {
    p1: { nome: "🧨 Pavio Curto", danoBase: 23 },
    p2: { nome: "🔥 Grande Show (Explosão)", danoBase: 49 },
    p3: { nome: "💨 Cortina de Fumaça", escudoBase: 28 }
  },
  "Cronomante": {
    p1: { nome: "⌛ Distorção Temporal", danoBase: 20 },
    p2: { nome: "⚡ Colapso do Espaço", danoBase: 43 },
    p3: { nome: "🔄 Retorno de Tempo", curaBase: 35 }
  },
  "Inquisidor": {
    p1: { nome: "🔨 Golpe Purificador", danoBase: 24 },
    p2: { nome: "🔥 Fogo do Julgamento", danoBase: 45 },
    p3: { nome: "🛡️ Fé Inabalável", escudoBase: 36 }
  },
  "Algoz": {
    p1: { nome: "🗡️ Corte de Precisão", danoBase: 27 },
    p2: { nome: "🔴 Execução Furtiva", danoBase: 53 },
    p3: { nome: "💨 Desaparecer", escudoBase: 25 }
  }
};

// 🧬 TABELA COMPLETA DE ATRIBUTOS POR RAÇA
export const RACAS_RPG = {
  "Humano": { hpBonus: 0, danoBonus: 5 },
  "Elfo": { hpBonus: 0, danoBonus: 3, criticoBonus: 10 },
  "Oni (Demônio Oriental)": { hpBonus: 15, danoBonus: 5 },
  "Meio-Fera": { hpBonus: 5, danoBonus: 4 },
  "Anão": { hpBonus: 25, danoBonus: 0 },
  "Morto-Vivo": { hpBonus: 10, danoBonus: 3 },
  "Vampiro": { hpBonus: 0, danoBonus: 6 },
  "Anjo Caído": { hpBonus: 5, danoBonus: 7 },
  "Fada": { hpBonus: -10, danoBonus: 2 },
  "Sereia / Tritão": { hpBonus: 10, danoBonus: 3 },
  "Goblin": { hpBonus: -15, danoBonus: 1 },
  "Orc": { hpBonus: 30, danoBonus: 2 },
  "Ciborgue / Autômato": { hpBonus: 20, danoBonus: 4 },
  "Espírito / Fantasma": { hpBonus: 0, danoBonus: 3 },
  "Draconato (Meio-Dragão)": { hpBonus: 15, danoBonus: 6 },
  "Elfo Negro (Drow)": { hpBonus: 0, danoBonus: 8 },
  "Slime Humanóide": { hpBonus: 35, danoBonus: -5 },
  "Metamorfo": { hpBonus: 5, danoBonus: 5 },
  "Titã (Gigante)": { hpBonus: 50, danoBonus: 10 },
  "Ser Estelar": { hpBonus: 10, danoBonus: 10 },
  "Centauro": { hpBonus: 15, danoBonus: 5 },
  "Minotauro": { hpBonus: 25, danoBonus: 7 },
  "Lobisomem": { hpBonus: 20, danoBonus: 8 },
  "Nefalim": { hpBonus: 15, danoBonus: 8 },
  "Kitsune": { hpBonus: 5, danoBonus: 4 },
  "Lizardfolk (Homem-Lagarto)": { hpBonus: 20, danoBonus: 3 },
  "Gárgula": { hpBonus: 30, danoBonus: 2 },
  "Sylph (Espírito do Ar)": { hpBonus: 0, danoBonus: 3 },
  "Undine (Espírito da Água)": { hpBonus: 10, danoBonus: 2 },
  "Salamandra (Espírito do Fogo)": { hpBonus: 5, danoBonus: 10 }
};

function lerJSON(caminho) {
  try { return JSON.parse(fs.readFileSync(caminho, "utf-8")); } catch { return {}; }
}

function salvarJSON(caminho, dados) {
  try { fs.writeFileSync(caminho, JSON.stringify(dados, null, 2)); return true; } catch { return false; }
}

export default {
  name: "duelo",
  description: "Duelo de RPG utilizando classes e raças integradas",
  commands: ["lutar", "duelo", "atacar"],
  usage: `${PREFIX}duelo @jogador`,

  handle: async ({ socket, remoteJid, userLid, args, mentions, message }) => {
    const isGroup = remoteJid.endsWith("@g.us");
    if (!isGroup) return socket.sendMessage(remoteJid, { text: "❌ Este comando só pode ser usado em grupo." });

    const jidUsuario = userLid || remoteJid;
    const jogadorId = jidUsuario.split("@")[0];

    // 1. PRIMEIRA CHECAGEM: Se já existe uma batalha ativa, processa o turno primeiro!
    if (BATALHAS_ATIVAS.has(remoteJid)) {
      const luta = BATALHAS_ATIVAS.get(remoteJid);
      
      if (jogadorId !== luta.vezId) return;

      const escolha = parseInt(args[0]);
      if (!escolha || escolha < 1 || escolha > 3) {
        return socket.sendMessage(remoteJid, { text: "❌ Escolha inválida! Digite: 1, 2 ou 3." });
      }

      clearTimeout(luta.timer);

      let atacante = luta.jogador1.id === luta.vezId ? luta.jogador1 : luta.jogador2;
      let defensor = luta.jogador1.id === luta.vezId ? luta.jogador2 : luta.jogador1;

      let msgTurno = `⚔️ *AÇÃO NA ARENA* ⚔️\n───────────────────────────\n`;
      const golpesClasse = HAB_CLASSES[atacante.classe] || HAB_CLASSES["Guerreiro"];
      const passivaRacaAtacante = RACAS_RPG[atacante.raca] || { danoBonus: 0, criticoBonus: 0 };

      if (escolha === 3) {
        const p3 = golpesClasse.p3;
        if (p3.curaBase) {
          atacante.hp = Math.min(atacante.hpMax, atacante.hp + p3.curaBase);
          msgTurno += `✨ *${atacante.nome}* usou *${p3.nome}* e recuperou *${p3.curaBase} HP*!\n`;
        } else {
          atacante.escudo = Math.min(200, atacante.escudo + p3.escudoBase);
          msgTurno += `🛡️ *${atacante.nome}* ativou *${p3.nome}* ganhando *${p3.escudoBase} de Escudo*!\n`;
        }
      } else {
        const golpe = escolha === 1 ? golpesClasse.p1 : golpesClasse.p2;
        const sorteio = Math.random() * 100;
        let danoFinal = golpe.danoBase + (passivaRacaAtacante.danoBonus || 0);

        if (sorteio <= 12) {
          danoFinal = 0;
          msgTurno += `💨 *${atacante.nome}* tentou usar *${golpe.nome}*, mas errou o golpe!\n`;
        } else if (sorteio <= 35) {
          danoFinal = Math.floor(danoFinal * 0.6);
          msgTurno += `💥 *DE RASPÃO!* *${atacante.nome}* aplicou *${golpe.nome}* e causou *${danoFinal} de dano*.\n`;
        } else if (sorteio <= (85 - (passivaRacaAtacante.criticoBonus || 0))) {
          msgTurno += `⚔️ *ACERTO!* O golpe *${golpe.nome}* causou *${danoFinal} de dano*.\n`;
        } else {
          danoFinal = Math.floor(danoFinal * 1.5);
          msgTurno += `⚡ *🚨 GOLPE CRÍTICO!* *${atacante.nome}* usou *${golpe.nome}* causando *${danoFinal} de dano*!\n`;
        }

        if (danoFinal > 0) {
          if (defensor.escudo > 0) {
            if (defensor.escudo >= danoFinal) {
              defensor.escudo -= danoFinal;
              msgTurno += `🛡️ O escudo de *${defensor.nome}* absorveu o impacto! (Restante: ${defensor.escudo})\n`;
              danoFinal = 0;
            } else {
              danoFinal -= defensor.escudo;
              msgTurno += `🛡️ O escudo de *${defensor.nome}* estilhaçou amortecendo *${defensor.escudo}* de dano!\n`;
              defensor.escudo = 0;
            }
          }
          defensor.hp = Math.max(0, defensor.hp - danoFinal);
        }
      }

      if (defensor.hp <= 0) {
        msgTurno += `\n💀 *${defensor.nome}* foi derrotado por *${atacante.nome}*!\n🏆 *VENCEDOR:* *${atacante.nome}*! (+150 Ouro, +1 Vitória)`;
        BATALHAS_ATIVAS.delete(remoteJid);

        let bancoRPG = lerJSON(dbPath);
        if (bancoRPG[atacante.id]) {
          bancoRPG[atacante.id].ouro = (bancoRPG[atacante.id].ouro || 0) + 150;
          bancoRPG[atacante.id].vitorias = (bancoRPG[atacante.id].vitorias || 0) + 1;
          bancoRPG[atacante.id].kills = (bancoRPG[atacante.id].kills || 0) + 1;
          salvarJSON(dbPath, bancoRPG);
        }
        if (bancoRPG[defensor.id]) {
          bancoRPG[defensor.id].derrotas = (bancoRPG[defensor.id].derrotas || 0) + 1;
          salvarJSON(dbPath, bancoRPG);
        }
        return socket.sendMessage(remoteJid, { text: msgTurno });
      }

      luta.vezId = defensor.id;
      luta.turnoAtual++;

      const proxClasse = HAB_CLASSES[defensor.classe] || HAB_CLASSES["Guerreiro"];
      let painel = `${msgTurno}\n───────────────────────────\n⏳ *TURNO ${luta.turnoAtual} — VEZ DE @${defensor.id}*\n`;
      painel += `❤️ *${luta.jogador1.nome}:* ${luta.jogador1.hp}/${luta.jogador1.hpMax} HP | 🛡️ Escudo: ${luta.jogador1.escudo}\n`;
      painel += `❤️ *${luta.jogador2.nome}:* ${luta.jogador2.hp}/${luta.jogador2.hpMax} HP | 🛡️ Escudo: ${luta.jogador2.escudo}\n───────────────────────────\n`;
      painel += `Escolha seu próximo movimento:\n`;
      painel += `👉 *1* - ${proxClasse.p1.nome}\n`;
      painel += `👉 *2* - ${proxClasse.p2.nome}\n`;
      painel += `👉 *3* - ${proxClasse.p3.nome || proxClasse.p3.escudoBase ? proxClasse.p3.nome : "Fortaleza de Aço"}`;

      luta.timer = setTimeout(() => {
        socket.sendMessage(remoteJid, { text: `⏱️ Turno esgotado! @${defensor.id} demorou demais e perdeu por inatividade.` });
        BATALHAS_ATIVAS.delete(remoteJid);
      }, 30000);

      return socket.sendMessage(remoteJid, { text: painel, mentions: [luta.jogador1.id + "@s.whatsapp.net", luta.jogador2.id + "@s.whatsapp.net"] });
    }

    // 2. SEGUNDA CHECAGEM: Detecção aprimorada do alvo
    let alvoJid = mentions?.[0] || 
                  message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                  message.message?.extendedTextMessage?.contextInfo?.participant;

    if (!alvoJid) {
      return socket.sendMessage(remoteJid, { text: `❌ Mencione um oponente válido para desafiar! Ex: \`${PREFIX}duelo @jogador\`` });
    }

    const defensorId = alvoJid.split("@")[0];
    if (jogadorId === defensorId) {
      return socket.sendMessage(remoteJid, { text: "❌ Você não pode desafiar a si mesmo." });
    }

    let bancoRPG = lerJSON(dbPath);
    const p1 = bancoRPG[jogadorId];
    const p2 = bancoRPG[defensorId];

    if (!p1 || !p2) {
      return socket.sendMessage(remoteJid, { text: "❌ Ambos os jogadores precisam ter um perfil de RPG ativo para duelar." });
    }

    const classeP1 = p1.classe && p1.classe !== "Não definida" ? p1.classe : "Guerreiro";
    const classeP2 = p2.classe && p2.classe !== "Não definida" ? p2.classe : "Guerreiro";
    const racaP1 = p1.raca && p1.raca !== "Não definida" ? p1.raca : "Humano";
    const racaP2 = p2.raca && p2.raca !== "Não definida" ? p2.raca : "Humano";

    const hpP1 = 200 + (RACAS_RPG[racaP1]?.hpBonus || 0);
    const hpP2 = 200 + (RACAS_RPG[racaP2]?.hpBonus || 0);

    const novaLuta = {
      vezId: jogadorId,
      turnoAtual: 1,
      jogador1: { id: jogadorId, nome: p1.nomeOficial || "Jogador 1", hp: hpP1, hpMax: hpP1, escudo: 100, classe: classeP1, raca: racaP1 },
      jogador2: { id: defensorId, nome: p2.nomeOficial || "Jogador 2", hp: hpP2, hpMax: hpP2, escudo: 100, classe: classeP2, raca: racaP2 },
      timer: null
    };

    BATALHAS_ATIVAS.set(remoteJid, novaLuta);

    const golpe1 = HAB_CLASSES[classeP1] || HAB_CLASSES["Guerreiro"];
    let inicio = `⚔️ *O DUELO FOI INICIADO!* ⚔️\n───────────────────────────\n🔥 @${jogadorId} desafiou @${defensorId}!\n\n`;
    inicio += `👤 *${novaLuta.jogador1.nome}* [Classe: ${classeP1} | Raça: ${racaP1}]\n`;
    inicio += `👤 *${novaLuta.jogador2.nome}* [Classe: ${classeP2} | Raça: ${racaP2}]\n\n`;
    inicio += `💖 Ambos começam com Vida customizada e *🛡️ 100 de Escudo*!\n───────────────────────────\n`;
    inicio += `⏳ Vez de @${jogadorId}. Selecione a sua ação digitando apenas o número:\n`;
    inicio += `👉 *1* - ${golpe1.p1.nome}\n`;
    inicio += `👉 *2* - ${golpe1.p2.nome}\n`;
    inicio += `👉 *3* - ${golpe1.p3.nome}\n───────────────────────────\n⏱️ Você tem 30 segundos!`;

    novaLuta.timer = setTimeout(() => {
      socket.sendMessage(remoteJid, { text: `⏱️ O duelo entre @${jogadorId} e @${defensorId} foi cancelado por falta de atividade.` });
      BATALHAS_ATIVAS.delete(remoteJid);
    }, 30000);

    return socket.sendMessage(remoteJid, { text: inicio, mentions: [jogadorId + "@s.whatsapp.net", defensorId + "@s.whatsapp.net"] });
  }
};
