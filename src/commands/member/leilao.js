import fs from "fs";
import path from "path";
import { PREFIX } from "../../config.js";
import { isGroup } from "../../utils/index.js";

const dbPath = path.join(process.cwd(), "banco de dados", "rpg-usuarios.json");
const leilaoPath = path.join(process.cwd(), "banco de dados", "leilao.json");

// Garante que o arquivo de leilão exista
if (!fs.existsSync(leilaoPath)) {
  fs.writeFileSync(leilaoPath, JSON.stringify({ itensLeiloados: [] }, null, 2), "utf-8");
}

function verificarHorarioLeilao() {
  const agora = new Date();
  const diaDaSemana = agora.getDay(); // 5 = Sexta, 6 = Sábado
  const horaAtual = agora.getHours();

  if ((diaDaSemana === 5 && horaAtual >= 19) || (diaDaSemana === 6 && horaAtual >= 18)) {
    return { aberto: true };
  }
  return { aberto: false };
}

export default {
  name: "leilao",
  description: "Sistema de Leilão Semanal de Itens do RPG",
  commands: ["leilao", "leilão", "lance", "leiloar"],
  usage: `${PREFIX}leilao`,

  handle: async ({ args, socket, remoteJid, userLid, sendErrorReply }) => {
    if (!isGroup(remoteJid)) return sendErrorReply("Este comando só pode ser usado em grupo.");

    const jogadorId = userLid.split("@")[0];
    const { aberto } = verificarHorarioLeilao();

    if (!fs.existsSync(dbPath)) return sendErrorReply("❌ Banco de dados offline.");
    let bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    let bancoLeilao = JSON.parse(fs.readFileSync(leilaoPath, "utf-8"));

    const player = bancoRPG[jogadorId];
    if (!player) return sendErrorReply(`❌ Crie sua conta primeiro digitando *${PREFIX}perfil*!`);

    const subComando = args[0]?.toLowerCase();
    const taxaAnuncio = 500;
    const incrementoMinimo = 200;
    const proibidos = ["raca", "classes", "raças", "classe"];

    // 1. SUBCOMANDO: LEILOAR
    if (subComando === "leiloar") {
      if (!aberto) return sendErrorReply("❌ O leilão está fechado! Abre sextas às 19h e sábados às 18h.");
      if (bancoLeilao.itensLeiloados.length >= 10) return sendErrorReply("❌ O mercado de leilões está lotado! (Máx 10 itens ativos).");

      const nomeItem = args[1];
      const tipoItem = args[2]?.toLowerCase();
      const precoInicial = parseInt(args[3]);

      if (!nomeItem || !tipoItem || isNaN(precoInicial)) {
        return sendErrorReply(`❌ Use: *${PREFIX}leilao leiloar [Nome] [Tipo] [PreçoInicial]*\nExemplo: *${PREFIX}leilao leiloar Coroa chapeu 1000*`);
      }

      if (proibidos.includes(tipoItem)) {
        return sendErrorReply(`❌ Erro: Itens do tipo ${tipoItem.toUpperCase()} não podem ser leiloados!`);
      }

      const carteira = player.ouro || 0;
      if (carteira < taxaAnuncio) {
        return sendErrorReply(`❌ Você precisa de 🪙 ${taxaAnuncio} moedas de ouro para pagar a taxa de anúncio.`);
      }

      // Desconta a taxa e cria o item
      player.ouro -= taxaAnuncio;
      const novoId = bancoLeilao.itensLeiloados.length + 1;

      bancoLeilao.itensLeiloados.push({
        id: novoId,
        donoJid: jogadorId,
        donoNome: player.nomeOficial || "Guerreiro",
        item: nomeItem,
        tipo: tipoItem,
        lanceAtual: precoInicial,
        ultimoLicitanteJid: null,
        ultimoLicitanteNome: "Nenhum",
        lanceMinimoProximo: precoInicial + incrementoMinimo
      });

      fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));
      fs.writeFileSync(leilaoPath, JSON.stringify(bancoLeilao, null, 2));

      return socket.sendMessage(remoteJid, { 
        text: `✨ *Item Anunciado!* '${nomeItem}' entrou no leilão [ID: ${novoId}]. 🪙 500G cobrados de taxa de anúncio.` 
      });
    }

    // 2. SUBCOMANDO: LANCE
    if (subComando === "lance") {
      if (!aberto) return sendErrorReply("❌ O leilão já fechou!");

      const idLeilao = parseInt(args[1]);
      const valorLance = parseInt(args[2]);

      if (isNaN(idLeilao) || isNaN(valorLance)) {
        return sendErrorReply(`❌ Use: *${PREFIX}leilao lance [ID] [Valor]*`);
      }

      const item = bancoLeilao.itensLeiloados.find(i => i.id === idLeilao);
      if (!item) return sendErrorReply("❌ ID de leilão inválido.");

      if (jogadorId === item.donoJid) return sendErrorReply("❌ Você não pode dar lance no seu próprio item!");
      if (valorLance < item.lanceMinimoProximo) return sendErrorReply(`❌ O lance mínimo para este item é 🪙 ${item.lanceMinimoProximo} moedas.`);
      
      const carteira = player.ouro || 0;
      if (carteira < valorLance) return sendErrorReply("❌ Saldo insuficiente em sua conta.");

      // Devolve o dinheiro para o último que deu lance
      if (item.ultimoLicitanteJid && bancoRPG[item.ultimoLicitanteJid]) {
        bancoRPG[item.ultimoLicitanteJid].ouro = (bancoRPG[item.ultimoLicitanteJid].ouro || 0) + item.lanceAtual;
      }

      // Desconta o lance do jogador atual
      player.ouro -= valorLance;
      
      item.lanceAtual = valorLance;
      item.ultimoLicitanteJid = jogadorId;
      item.ultimoLicitanteNome = player.nomeOficial || "Guerreiro";
      item.lanceMinimoProximo = valorLance + incrementoMinimo;

      fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));
      fs.writeFileSync(leilaoPath, JSON.stringify(bancoLeilao, null, 2));

      return socket.sendMessage(remoteJid, { 
        text: `⚔️ *LANCE ACEITO!* @${jogadorId} cobriu o lance para 🪙 *${valorLance}* no item *'${item.item}'*!` 
      }, { mentions: [userLid] });
    }

    // 3. MENU DO LEILÃO
    let layout = [];
    layout.push("⚖️ ═══════════════════════ ⚖️");
    layout.push("🏛️  *CÂMARA DE LEILÕES* 🏛️");
    layout.push("⚖️ ═══════════════════════ ⚖️");

    if (aberto) {
      layout.push(`🟢 *Status:* ABERTO // 📦 *Slots Ocupados:* [ ${bancoLeilao.itensLeiloados.length} / 10 ]\n`);
      
      if (bancoLeilao.itensLeiloados.length === 0) {
        layout.push("*Nenhum item sendo leiloado no momento.*\n");
      } else {
        bancoLeilao.itensLeiloados.forEach((item) => {
          layout.push(`[${String(item.id).padStart(2, "0")}] 👑 *${item.item}* (${item.tipo.toUpperCase()})`);
          layout.push(`├─ 👤 Vendedor: \`${item.donoNome}\``);
          layout.push(`├─ 💰 Lance Atual: 🪙 ${item.lanceAtual} moedas`);
          layout.push(`├─ 👤 Último Licitante: \`${item.ultimoLicitanteNome}\``);
          layout.push(`└─ ⚡ Próximo Lance Mínimo: *${item.lanceMinimoProximo} moedas*\n`);
        });
      }

      layout.push("─────────────────────────");
      layout.push(`🎒 *Seu Saldo:* 🪙 ${player.ouro || 0} moedas`);
      layout.push("✍️ O que deseja fazer?\n");
      layout.push(`👉 *${PREFIX}leilao leiloar [nome] [tipo] [preco]*\n_(Taxa de 500 moedas)_`);
      layout.push(`👉 *${PREFIX}leilao lance [ID] [valor]*`);
    } else {
      layout.push("🔴 *Status:* FECHADO\n");
      layout.push("🔒 _O mercado de lances está trancado no momento._\n");
      layout.push("📅 *Próximas Aberturas:*");
      layout.push("└─ 📅 *Sexta-feira:* Às 19:00h");
      layout.push("└─ 📅 *Sábado:* Às 18:00h\n");
      layout.push(`💰 *Taxa de anúncio:* 🪙 ${taxaAnuncio} moedas`);
      layout.push("🚫 *Itens proibidos:* Raças e Classes.");
    }

    return socket.sendMessage(remoteJid, { text: layout.join("\n") });
  }
};
