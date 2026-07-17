import fs from "fs";
import path from "path";
import { PREFIX, DATABASE_DIR } from "../../config.js";

const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");

// ⚔️ TABELA INTERNA DE HABILIDADES/ATRIBUTOS DE CLASSES
const HAB_CLASSES = {
  "Guerreiro": { danoBase: 25 }, "Mago": { danoBase: 22 }, "Assassino": { danoBase: 26 },
  "Arqueiro": { danoBase: 24 }, "Samurai": { danoBase: 26 }, "Sacerdote / Clérigo": { danoBase: 18 },
  "Paladino": { danoBase: 22 }, "Necromante": { danoBase: 20 }, "Ninja": { danoBase: 22 },
  "Ladino / Larápio": { danoBase: 23 }, "Bardo": { danoBase: 19 }, "Bárbaro": { danoBase: 27 },
  "Monge": { danoBase: 24 }, "Alquimista": { danoBase: 21 }, "Cavaleiro Rúnico": { danoBase: 25 },
  "Druida": { danoBase: 20 }, "Lanceiro": { danoBase: 25 }, "Invocador (Summoner)": { danoBase: 22 },
  "Atirador de Elite (Sniper)": { danoBase: 26 }, "Berserker": { danoBase: 28 }, "Cavaleiro da Morte": { danoBase: 26 },
  "Bruxo": { danoBase: 23 }, "Feiticeiro": { danoBase: 22 }, "Caçador de Recompensas": { danoBase: 24 },
  "Pirata": { danoBase: 23 }, "Mosqueteiro": { danoBase: 25 }, "Espadachim": { danoBase: 24 },
  "Xamã": { danoBase: 20 }, "Domador de Feras": { danoBase: 21 }, "Ilusionista": { danoBase: 19 },
  "Cavaleiro Sagrado": { danoBase: 24 }, "Guardião da Floresta": { danoBase: 22 }, "Pugilista": { danoBase: 25 },
  "Mestre de Armas": { danoBase: 26 }, "Clérigo Sombrio": { danoBase: 21 }, "Geomante": { danoBase: 22 },
  "Pirotecnista": { danoBase: 23 }, "Cronomante": { danoBase: 20 }, "Inquisidor": { danoBase: 24 },
  "Algoz": { danoBase: 27 }
};

// 🧬 TABELA INTERNA DE BÔNUS DE RAÇA
const RACAS_RPG = {
  "Humano": { hpBonus: 0, danoBonus: 5 }, "Elfo": { hpBonus: 0, danoBonus: 3 }, "Oni (Demônio Oriental)": { hpBonus: 15, danoBonus: 5 },
  "Meio-Fera": { hpBonus: 5, danoBonus: 4 }, "Anão": { hpBonus: 25, danoBonus: 0 }, "Morto-Vivo": { hpBonus: 10, danoBonus: 3 },
  "Vampiro": { hpBonus: 0, danoBonus: 6 }, "Anjo Caído": { hpBonus: 5, danoBonus: 7 }, "Fada": { hpBonus: -10, danoBonus: 2 },
  "Sereia / Tritão": { hpBonus: 10, danoBonus: 3 }, "Goblin": { hpBonus: -15, danoBonus: 1 }, "Orc": { hpBonus: 30, danoBonus: 2 },
  "Ciborgue / Autômato": { hpBonus: 20, danoBonus: 4 }, "Espírito / Fantasma": { hpBonus: 0, danoBonus: 3 }, "Draconato (Meio-Dragão)": { hpBonus: 15, danoBonus: 6 },
  "Elfo Negro (Drow)": { hpBonus: 0, danoBonus: 8 }, "Slime Humanóide": { hpBonus: 35, danoBonus: -5 }, "Metamorfo": { hpBonus: 5, danoBonus: 5 },
  "Titã (Gigante)": { hpBonus: 50, danoBonus: 10 }, "Ser Estelar": { hpBonus: 10, danoBonus: 10 }, "Centauro": { hpBonus: 15, danoBonus: 5 },
  "Minotauro": { hpBonus: 25, danoBonus: 7 }, "Lobisomem": { hpBonus: 20, danoBonus: 8 }, "Nefalim": { hpBonus: 15, danoBonus: 8 },
  "Kitsune": { hpBonus: 5, danoBonus: 4 }, "Lizardfolk (Homem-Lagarto)": { hpBonus: 20, danoBonus: 3 }, "Gárgula": { hpBonus: 30, danoBonus: 2 },
  "Sylph (Espírito do Ar)": { hpBonus: 0, danoBonus: 3 }, "Undine (Espírito da Água)": { hpBonus: 10, danoBonus: 2 }, "Salamandra (Espírito do Fogo)": { hpBonus: 5, danoBonus: 10 }
};

// 👹 LISTA EXPANDIDA COM 30 MONSTROS E CHEFES DIFÍCEIS
const MONSTROS_DIFICEIS = [
  { nome: "Quimera de Fogo 🦁🔥", hp: 220, dano: 25 },
  { nome: "Lorde Vampiro Valerius 🧛‍♂️", hp: 250, dano: 28 },
  { nome: "Golem de Obsidiana 🗿", hp: 320, dano: 20 },
  { nome: "Cérbero dos Portões 🐕‍🦺🔥", hp: 240, dano: 26 },
  { nome: "Necromante Ancião 🧙‍♂️💀", hp: 210, dano: 30 },
  { nome: "Dragão Vermelho Ancião 🐉", hp: 350, dano: 35 },
  { nome: "Hydra das Cavernas 🐍", hp: 300, dano: 24 },
  { nome: "Banshee Lamentadora 👻", hp: 180, dano: 32 },
  { nome: "Minotauro Berserker 🐂", hp: 280, dano: 27 },
  { nome: "Leviatã dos Mares 🐋", hp: 340, dano: 26 },
  { nome: "Lich Imortal 👑💀", hp: 230, dano: 34 },
  { nome: "Demônio dos Portões do Caos 👺", hp: 290, dano: 31 },
  { nome: "Espectro da Peste 🦠", hp: 200, dano: 29 },
  { nome: "Guerreiro Caído do Purgatório ⚔️", hp: 260, dano: 28 },
  { nome: "Colosso de Pedra Rúnica 🧱", hp: 360, dano: 18 },
  { nome: "Beholder Vigilante 👁️", hp: 220, dano: 33 },
  { nome: "Verme da Areia Gigante 🐛", hp: 310, dano: 23 },
  { nome: "Aranha Viúva Negra Titânica 🕷️", hp: 215, dano: 30 },
  { nome: "Ciclope Esmagador 👁️🪨", hp: 330, dano: 27 },
  { nome: "Anjo Corrompido 👼🖤", hp: 250, dano: 32 },
  { nome: "Elemental da Tempestade ⚡", hp: 230, dano: 30 },
  { nome: "General Orc de Sangue 🐗", hp: 290, dano: 29 },
  { nome: "Ent Milenar Corrompido 🌲", hp: 380, dano: 20 },
  { nome: "Manticora das Estepes 🦂", hp: 240, dano: 28 },
  { nome: "Sombra Devoradora de Almas 🌑", hp: 190, dano: 35 },
  { nome: "Basilisco de Olhar de Pedra 🦎", hp: 260, dano: 27 },
  { nome: "Gorgona Cabelo de Serpente 👩‍🐍", hp: 225, dano: 31 },
  { nome: "Rei dos Goblins de Ferro 👑 Goblin", hp: 270, dano: 25 },
  { nome: "Quetzalcoatl Cósmico 🐍✨", hp: 280, dano: 32 },
  { nome: "Avatar do Vazio 👾", hp: 400, dano: 38 }
];

export default {
  name: "aventura",
  description: "Explore mapas perigosos para enfrentar chefes e upar seu Passe de Batalha (Limite: 3 por dia)",
  commands: ["aventura", "explorar", "pve"],
  usage: `${PREFIX}aventura`,

  handle: async ({ socket, remoteJid, userLid }) => {
    const isGroup = remoteJid.endsWith("@g.us");
    if (!isGroup) return socket.sendMessage(remoteJid, { text: "❌ Este comando só pode ser usado em grupos." });

    const jogadorId = userLid.split("@")[0];

    if (!fs.existsSync(dbPath)) {
      return socket.sendMessage(remoteJid, { text: "❌ O banco de dados de RPG não foi localizado." });
    }

    let bancoRPG = {};
    try {
      bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    } catch {
      return socket.sendMessage(remoteJid, { text: "❌ Erro crítico ao processar os dados do servidor." });
    }

    const player = bancoRPG[jogadorId];
    if (!player) {
      return socket.sendMessage(remoteJid, { text: `❌ Você não possui um personagem! Digite \`${PREFIX}perfil\` para registrar.` });
    }

    // Gerenciador de limite diário básico
    const hoje = new Date().toISOString().slice(0, 10);
    if (!player.limitesDiarios) player.limitesDiarios = {};
    if (player.limitesDiarios.data !== hoje) {
      player.limitesDiarios.data = Date.now().toString(); // Reseta para nova data se for diferente
      player.limitesDiarios.aventuras = 0;
    }

    if (player.limitesDiarios.aventuras >= 3) {
      return socket.sendMessage(remoteJid, { 
        text: `⚠️ *LIMITE ATINGIDO!* @${jogadorId}, você já usou suas 3 explorações hoje. Descanse na taverna até amanhã!`,
        mentions: [userLid]
      });
    }

    // Seleção do Chefe/Monstro aleatório
    const monstro = MONSTROS_DIFICEIS[Math.floor(Math.random() * MONSTROS_DIFICEIS.length)];
    
    // Processamento de atributos baseados em Raça e Classe do Jogador
    const pClasse = player.classe && player.classe !== "Não definida" ? player.classe : "Guerreiro";
    const pRaca = player.raca && player.raca !== "Não definida" ? player.raca : "Humano";

    const passivaRaca = RACAS_RPG[pRaca] || { hpBonus: 0, danoBonus: 0 };
    const passivaClasse = HAB_CLASSES[pClasse] || { danoBase: 25 };

    let playerHp = 220 + (passivaRaca.hpBonus || 0); // HP buffado para aguentar os monstros mais fortes
    let playerHpMax = playerHp;
    let danoBaseJogador = passivaClasse.danoBase + (passivaRaca.danoBonus || 0);

    let monstroHp = monstro.hp;

    let logBatalha = `╔══════ ❖ ══════╗\n`;
    logBatalha += `   🗺️  *EXPLORAÇÃO DE ELITE* 🗺️\n`;
    logBatalha += `╚══════ ❖ ══════╝\n\n`;
    logBatalha += `⚔️ @${jogadorId} adentrou masmorras profundas e encontrou: *${monstro.nome}*!\n`;
    logBatalha += `📊 *Seu Status:* ${playerHp} HP | *Classe:* ${pClasse}\n`;
    logBatalha += `───────────────────────────\n\n`;

    let turno = 1;
    // Batalha simulada em turnos estendida para suportar monstros de alto HP
    while (playerHp > 0 && monstroHp > 0 && turno <= 10) {
      // Turno do Jogador
      let danoCritico = Math.random() > 0.85 ? 1.5 : 1;
      let danoPlayer = Math.floor((Math.random() * 15 + danoBaseJogador) * danoCritico);
      monstroHp -= danoPlayer;
      
      logBatalha += `💥 *T${turno} (Você):* Golpeou com fúria causando ${danoCritico > 1 ? "⚡ *CRÍTICO* " : ""}*${danoPlayer} de dano*.\n`;

      if (monstroHp <= 0) break;

      // Turno do Monstro Boss
      let danoMonstro = Math.floor(Math.random() * 12 + monstro.dano);
      playerHp -= danoMonstro;
      logBatalha += `👹 *T${turno} (${monstro.nome.split(" ")[0]}):* Contra-atacou aplicando *${danoMonstro} de dano*.\n\n`;
      
      turno++;
    }

    logBatalha += `───────────────────────────\n\n`;

    // Consequências da exploração
    if (monstroHp <= 0) {
      const ouroSorteado = Math.floor(Math.random() * (120 - 45 + 1)) + 45;
      
      player.ouro = (player.ouro || 0) + ouroSorteado;
      player.nivel_passe = player.nivel_passe || 1;
      
      // PROGRESSÃO DO PASSE DE BATALHA (+15 XP)
      player.xp_passe = (player.xp_passe || 0) + 15;
      
      // Exemplo básico de UP de nível se acumular mais de 100 de XP
      if (player.xp_passe >= 100) {
        player.xp_passe -= 100;
        player.nivel_passe += 1;
        logBatalha += `🎉 *UP! SEU PASSE DE BATALHA SUBIU PARA O NÍVEL ${player.nivel_passe}!* 🎉\n\n`;
      }

      player.limitesDiarios.aventuras += 1;
      
      logBatalha += `🏆 *VITÓRIA HEROICA!*\n`;
      logBatalha += `💀 O *${monstro.nome}* foi dizimado!\n`;
      logBatalha += `💰 *Recompensa:* 🪙 +${ouroSorteado} Ouros\n`;
      logBatalha += `🎫 *Passe de Batalha:* +15 XP obtidos\n`;
    } else {
      player.limitesDiarios.aventuras += 1;
      logBatalha += `💀 *DERROTA E FUGA!*\n`;
      logBatalha += `O *${monstro.nome}* desferiu um ataque devastador. Você recuou gastando poções de fuga.\n`;
      logBatalha += `💡 _Tente comprar novos equipamentos ou trocar de classe para ficar mais forte!_\n`;
    }

    logBatalha += `\n📊 *Explorações diárias:* ${player.limitesDiarios.aventuras}/3`;

    fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));

    return socket.sendMessage(remoteJid, { text: logBatalha, mentions: [userLid] });
  }
};
