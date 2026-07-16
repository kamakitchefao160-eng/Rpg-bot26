// habilidades.js
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
