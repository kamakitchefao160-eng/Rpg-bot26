// 🛡️ PODERES ATIVOS DAS 20 CLASSES REESTRUTURADOS PARA O COMBATE INTERATIVO
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
  "Bardo (Músico Mágico)": {
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
  "Druida (Mago da Natureza)": {
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
  }
};

