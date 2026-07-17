import fs from "fs";
import path from "path";
import { PREFIX, DATABASE_DIR, CUSTO_GIRO_ROYALE } from "../../config.js";

const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");

// Lista de prêmios com suas chances estimadas de drop (Peso)
const PREMIOS_ROYALE = [
  { nome: "💥 Katana Evolutiva lvl 1 (RARÍSSIMO)", peso: 2 },
  { nome: "🌸 Emblema Lendário de Cerejeira", peso: 8 },
  { nome: "👑 Caixa de Armas Suprema", peso: 15 },
  { nome: "🪙 1.500 Ouros Bônus", peso: 25 },
  { nome: "🛡️ Fragmento de Proteção x5", peso: 50 }
];

export default {
  name: "roleta",
  description: "Gira a roleta premiada para tentar obter a Katana Evolutiva",
  commands: ["roleta", "luckroyale", "girar"],
  usage: `${PREFIX}roleta`,

  handle: async ({ socket, remoteJid, userLid, args }) => {
    const numeroLimpo = userLid.split("@")[0];
    let bancoRPG = {};
    if (fs.existsSync(dbPath)) {
      try { bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8")); } catch { bancoRPG = {}; }
    }

    const dados = bancoRPG[numeroLimpo];
    if (!dados) return socket.sendMessage(remoteJid, { text: "❌ Crie seu perfil primeiro." });

    const ouroAtual = dados.ouro || 0;
    const custo = CUSTO_GIRO_ROYALE || 100;

    // Se o jogador digitar apenas "/roleta", mostra as premiações
    if (args.length === 0 || args[0] !== "girar") {
      let painelRoleta = `🎰 ══════ 💎 *LUCK ROYALE EVOLUTIVO* 💎 ══════ 🎰\n\n`;
      painelRoleta += `🔥 *PREMIAÇÃO MÁXIMA:* ⚔️ *Katana Evolutiva*\n\n`;
      painelRoleta += `📋 *Lista de Prêmios Correntes:*\n`;
      PREMIOS_ROYALE.forEach(p => {
        painelRoleta += `  • ${p.nome}\n`;
      });
      painelRoleta += `\n───────────────────────────\n`;
      painelRoleta += `🪙 *Custo por Giro:* 🪙 *${custo}* ouros\n`;
      painelRoleta += `👉 Digite \`${PREFIX}roleta girar\` para testar a sua sorte agora!`;
      return socket.sendMessage(remoteJid, { text: painelRoleta });
    }

    // Executando o giro
    if (ouroAtual < custo) {
      return socket.sendMessage(remoteJid, { text: `❌ Você não tem ouros suficientes. O giro custa 🪙 *${custo}* ouros.` });
    }

    // Algoritmo de sorteio baseado em peso
    const pesoTotal = PREMIOS_ROYALE.reduce((acc, p) => acc + p.peso, 0);
    let random = Math.random() * pesoTotal;
    let premioSorteado = PREMIOS_ROYALE[PREMIOS_ROYALE.length - 1].nome;

    for (const premio of PREMIOS_ROYALE) {
      if (random < premio.peso) {
        premioSorteado = premio.nome;
        break;
      }
      random -= premio.peso;
    }

    // Aplicando resultado
    dados.ouro = ouroAtual - custo;
    if (!dados.inventario) dados.inventario = [];
    dados.inventario.push(premioSorteado);

    // Se ganhar ouro de volta
    if (premioSorteado.includes("1.500 Ouros")) dados.ouro += 1500;
    // Se ganhar o emblema do passe
    if (premioSorteado.includes("Emblema")) dados.emblemas_flor = (dados.emblemas_flor || 0) + 1;

    fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));

    let resultadoMsg = `🎰 ═══ *ROLANDO A ROLETA...* ═══ 🎰\n\n`;
    resultadoMsg += `⚡ @${numeroLimpo} gastou 🪙 ${custo} ouros e o ponteiro parou em:\n`;
    resultadoMsg += `🎉 🎉 *${premioSorteado}* 🎉 🎉\n\n`;
    resultadoMsg += `📦 O prêmio foi enviado direto para a sua conta ou cofre!`;

    return socket.sendMessage(remoteJid, { text: resultadoMsg, mentions: [userLid] });
  }
};
