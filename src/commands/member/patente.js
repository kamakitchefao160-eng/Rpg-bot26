import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PREFIX, DATABASE_DIR } from "../../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");

// 📊 TABELA DE PROGRESSÃO (Baseada exatamente no seu sistema de patentes do perfil)
const FASES_PATENTES = [
  { nome: "🟫 Bronze I", min: 0, max: 5 },
  { nome: "🟫 Bronze II", min: 5, max: 10 },
  { nome: "🟫 Bronze III", min: 10, max: 15 },
  { nome: "⬜ Prata I", min: 15, max: 23 },
  { nome: "⬜ Prata II", min: 23, max: 31 },
  { nome: "⬜ Prata III", min: 31, max: 40 },
  { nome: "🟨 Ouro I", min: 40, max: 50 },
  { nome: "🟨 Ouro II", min: 50, max: 60 },
  { nome: "🟨 Ouro III", min: 60, max: 70 },
  { nome: "🟨 Ouro IV", min: 70, max: 80 },
  { nome: "🟦 Platina I", min: 80, max: 92 },
  { nome: "🟦 Platina II", min: 92, max: 104 },
  { nome: "🟦 Platina III", min: 104, max: 116 },
  { nome: "🟦 Platina IV", min: 116, max: 130 },
  { nome: "💎 Diamante I", min: 130, max: 147 },
  { nome: "💎 Diamante II", min: 147, max: 164 },
  { nome: "💎 Diamante III", min: 164, max: 181 },
  { nome: "💎 Diamante IV", min: 181, max: 200 },
  { nome: "🔴 Mestre ⭐️", min: 200, max: 220 },
  { nome: "🔴 Mestre ⭐️⭐️", min: 220, max: 240 },
  { nome: "🔴 Mestre ⭐️⭐️⭐️", min: 240, max: 260 },
  { nome: "🔴 Mestre ⭐️⭐️⭐️⭐️", min: 260, max: 280 },
  { nome: "🔴 Mestre ⭐️⭐️⭐️⭐️⭐️", min: 280, max: 300 },
  { nome: "🔥 Elite ⭐️", min: 300, max: 320 },
  { nome: "🔥 Elite ⭐️⭐️", min: 320, max: 340 },
  { nome: "🔥 Elite ⭐️⭐️⭐️", min: 340, max: 360 },
  { nome: "🔥 Elite ⭐️⭐️⭐️⭐️", min: 360, max: 380 },
  { nome: "🔥 Elite ⭐️⭐️⭐️⭐️⭐️", min: 380, max: 400 },
  { nome: "👑 Desafiante", min: 400, max: Infinity }
];

function lerJSON(caminho) {
  try { return JSON.parse(fs.readFileSync(caminho, "utf-8")); } catch { return {}; }
}

// 🟩 Gera a barra gráfica proporcional ao nível atual da patente
function criarBarra(atual, minimo, maximo) {
  if (maximo === Infinity) return "██████████ 100%";
  const totalNecessario = maximo - minimo;
  const progressoAtual = atual - minimo;
  const porcentagem = Math.min(Math.floor((progressoAtual / totalNecessario) * 10), 10);
  
  let barra = "";
  for (let i = 0; i < 10; i++) {
    barra += i < porcentagem ? "█" : "░";
  }
  
  const realPorcento = Math.min(Math.floor((progressoAtual / totalNecessario) * 100), 100);
  return `${barra} ${realPorcento}%`;
}

export default {
  name: "patente",
  description: "Exibe o progresso detalhado de patente e kills necessárias para evoluir",
  commands: ["patente", "patentes", "subirpatente"],
  usage: `${PREFIX}patente`,

  handle: async ({ socket, remoteJid, userLid }) => {
    const numeroLimpo = userLid.split("@")[0];
    let bancoRPG = lerJSON(dbPath);

    const dados = bancoRPG[numeroLimpo];
    if (!dados) {
      return socket.sendMessage(remoteJid, { text: `❌ *Você não possui conta! Use* \`${PREFIX}perfil\` *para iniciar.*` });
    }

    const totalKills = dados.kills || 0;

    // Encontra a patente atual do usuário na tabela baseada nas regras de corte
    let indexAtual = FASES_PATENTES.findIndex(p => totalKills >= p.min && totalKills < p.max);
    if (indexAtual === -1 && totalKills >= 400) {
      indexAtual = FASES_PATENTES.length - 1; // Proteção para Desafiante
    }

    const patenteAtual = FASES_PATENTES[indexAtual];
    const proximaPatente = FASES_PATENTES[indexAtual + 1];

    let blocoEvolucao = "";
    if (proximaPatente && patenteAtual.max !== Infinity) {
      const killsFaltam = patenteAtual.max - totalKills;
      const barraGrafica = criarBarra(totalKills, patenteAtual.min, patenteAtual.max);

      blocoEvolucao += `📈 *Próximo Nível:* *${proximaPatente.nome}*\n`;
      blocoEvolucao += `🎯 *Progresso da Patente:* \`[${barraGrafica}]\`\n`;
      blocoEvolucao += `⚔️ *Requisito:* Faltam exatamente *${killsFaltam} kills* para subir!`;
    } else {
      blocoEvolucao += `🏆 *PATENTE MÁXIMA ATINGIDA!* Você é um *${patenteAtual.nome}* absoluto de elite!`;
    }

    let menu = `⚔️ ══════ ⚜️ *PROGRESSÃO MILITAR OFICIAL* ⚜️ ══════ ⚔️\n\n`;
    menu += `👤 *Guerreiro:* @${numeroLimpo}\n`;
    menu += `🎖️ *Patente Atual:* *${patenteAtual.nome}*\n`;
    menu += `💀 *Total de Abates:* *${totalKills} Kills*\n`;
    menu += `───────────────────────────\n`;
    menu += `${blocoEvolucao}\n`;
    menu += `───────────────────────────\n`;
    menu += `💡 _Continue acumulando abates nas suas jogadas diárias para subir no ranqueado!_`;

    return socket.sendMessage(remoteJid, { text: menu, mentions: [userLid] });
  }
};
