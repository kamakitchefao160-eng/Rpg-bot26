import fs from "node:fs";
import path from "node:path";
import { PREFIX, DATABASE_DIR } from "../../config.js";

const leilaoPath = path.join(DATABASE_DIR, "leilao.json");
const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");

const LINK_GRUPO_LEILAO = "https://chat.whatsapp.com/IkeYb1cF9e2Ji3pgbVbQDg";
const TAXA_FILA = 200;
const LIMITE_FILA = 12;

// Frases do leiloeiro para animar o chat
const frasesLeiloeiro = [
  "🗣️ Uma peça digna de reis! Quem vai dar o próximo lance?",
  "🗣️ Ouvi dizer que esse item pertenceu a um herói lendário! Quem dá mais?",
  "🗣️ Só isso? Esse item vale pelo menos o triplo! Cadê os ricos do grupo?",
  "🗣️ Vamos lá, aventureiros! Não deixem essa raridade escapar por tão pouco!",
  "🗣️ Um lance magnífico! Mas sei que vocês têm mais moedas guardadas!"
];

// Função para checar se o leilão está no horário permitido
function estaNoHorarioDoLeilao() {
  const agora = new Date();
  const dia = agora.getDay(); // 0: Domingo, 5: Sexta, 6: Sábado
  const hora = agora.getHours();
  const minuto = agora.getMinutes();

  // Sexta-feira a partir das 18:30
  if (dia === 5) {
    if (hora > 18 || (hora === 18 && minuto >= 30)) return true;
  }
  // Sábado a partir das 19:00
  if (dia === 6) {
    if (hora >= 19) return true;
  }
  return false;
}

// Executa o temporizador do "Dou-lhe uma, Dou-lhe duas..." de 10 em 10 segundos
async function iniciarCronometroMartelo(socket, remoteJid) {
  setTimeout(async () => {
    let leilao = JSON.parse(fs.readFileSync(leilaoPath, "utf-8"));
    if (!leilao.ativo || !leilao.maiorLicitante) return;

    if (leilao.etapaVenda === 0) {
      leilao.etapaVenda = 1;
      fs.writeFileSync(leilaoPath, JSON.stringify(leilao, null, 2));
      await socket.sendMessage(remoteJid, { 
        text: `🔨 *Dou-lhe uma!* por 🪙 *${leilao.lanceAtual}* moedas do @${leilao.maiorLicitante}!\n\n_${frasesLeiloeiro[Math.floor(Math.random() * frasesLeiloeiro.length)]}_`,
        mentions: [`${leilao.maiorLicitante}@s.whatsapp.net`]
      });
      iniciarCronometroMartelo(socket, remoteJid);
    } else if (leilao.etapaVenda === 1) {
      leilao.etapaVenda = 2;
      fs.writeFileSync(leilaoPath, JSON.stringify(leilao, null, 2));
      await socket.sendMessage(remoteJid, { 
        text: `🔨🔨 *Dou-lhe duas!* Alguém oferece mais que 🪙 *${leilao.lanceAtual}* antes do martelo bater?!`,
        mentions: [`${leilao.maiorLicitante}@s.whatsapp.net`]
      });
      iniciarCronometroMartelo(socket, remoteJid);
    } else if (leilao.etapaVenda === 2) {
      // VENDIDO!
      let bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
      const vencedor = leilao.maiorLicitante;
      const precoFinal = leilao.lanceAtual;

      if (bancoRPG[vencedor]) {
        bancoRPG[vencedor].ouro = Math.max(0, (bancoRPG[vencedor].ouro || 0) - precoFinal);
        if (!bancoRPG[vencedor].inventario) bancoRPG[vencedor].inventario = [];
        bancoRPG[vencedor].inventario.push(leilao.item);
      }
      if (bancoRPG[leilao.dono]) {
        bancoRPG[leilao.dono].ouro = (bancoRPG[leilao.dono].ouro || 0) + precoFinal;
      }

      fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));

      await socket.sendMessage(remoteJid, {
        text: `👨‍⚖️ *VENDIDO!* 🔨🔨🔨\n\n🎉 O item *${leilao.item.replace(/_/g, " ")}* foi arrematado por @${vencedor} pelo valor fantástico de 🪙 *${precoFinal}* moedas de ouro!\n\n_O item foi enviado para a mochila do vencedor._`,
        mentions: [`${vencedor}@s.whatsapp.net`]
      });

      // Limpa leilão atual e abre o próximo da fila se houver
      leilao.ativo = false;
      leilao.item = "";
      leilao.dono = "";
      leilao.lanceAtual = 0;
      leilao.maiorLicitante = "";
      leilao.etapaVenda = 0;

      if (leilao.filaItens.length > 0) {
        const proximo = leilao.filaItens.shift();
        leilao.ativo = true;
        leilao.item = proximo.item;
        leilao.dono = proximo.dono;
        leilao.lanceAtual = proximo.lanceInicial;
        
        await socket.sendMessage(remoteJid, {
          text: `📢 *PRÓXIMO ITEM DA FILA ENTRANDO EM LEILÃO!* 📢\n\n📦 *Item:* ${leilao.item.replace(/_/g, " ")}\n👤 *Vendedor:* @${leilao.dono}\n💰 *Lance Mínimo:* 🪙 ${leilao.lanceAtual} moedas`,
          mentions: [`${leilao.dono}@s.whatsapp.net`]
        });
      }
      fs.writeFileSync(leilaoPath, JSON.stringify(leilao, null, 2));
    }
  }, 10000); // 10 segundos por etapa
}

export default {
  name: "leilao",
  description: "Mercado de Leilão ativo sexta (18:30) e sábado (19:00). Permite listar itens durante a semana.",
  commands: ["leilao", "lance", "fila"],
  usage: `${PREFIX}leilao`,

  handle: async ({ args, socket, remoteJid, userLid }) => {
    let metadata;
    try {
      metadata = await socket.groupMetadata(remoteJid);
    } catch {
      return await socket.sendMessage(remoteJid, { text: "❌ Leilões só ocorrem no grupo oficial." });
    }

    const nomeGrupo = metadata.subject || "";
    if (!nomeGrupo.includes("Leilão") && !nomeGrupo.includes("leilao")) {
      return await socket.sendMessage(remoteJid, {
        text: `❌ *Acesso Negado!* Comando exclusivo do grupo de Leilão do *The Legendary Online*!\n\n🔗 Participe aqui: ${LINK_GRUPO_LEILAO}`
      });
    }

    let leilao = { ativo: false, item: "", dono: "", lanceAtual: 0, maiorLicitante: "", filaItens: [], etapaVenda: 0 };
    if (fs.existsSync(leilaoPath)) {
      try { leilao = JSON.parse(fs.readFileSync(leilaoPath, "utf-8")); } catch {}
    }

    let bancoRPG = {};
    if (fs.existsSync(dbPath)) {
      try { bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8")); } catch {}
    }

    const numeroLimpo = userLid.split("@")[0];
    const subComando = args[0]?.toLowerCase();

    // ==========================================
    // SISTEMA DE CADASTRO/FILA (DURANTE A SEMANA)
    // ==========================================
    if (subComando === "cadastrar" || subComando === "anunciar") {
      const item = args[1];
      const lanceInicial = parseInt(args[2]);

      if (!item || isNaN(lanceInicial) || lanceInicial <= 0) {
        return await socket.sendMessage(remoteJid, { 
          text: `⚠️ Uso: *${PREFIX}leilao cadastrar [item] [lance_inicial]*\nExemplo: *${PREFIX}leilao cadastrar Espada_Sombria 500*` 
        });
      }

      // Impedir anúncio de raças e classes
      const itemLower = item.toLowerCase();
      if (itemLower.includes("raça") || itemLower.includes("classe") || itemLower.includes("raca")) {
        return await socket.sendMessage(remoteJid, { text: "❌ Você não pode leiloar Raças ou Classes!" });
      }

      if (leilao.filaItens.length >= LIMITE_FILA) {
        return await socket.sendMessage(remoteJid, { text: `❌ A lista de leilões está lotada! Capacidade máxima de *${LIMITE_FILA}* itens atingida.` });
      }

      const saldo = bancoRPG[numeroLimpo]?.ouro || 0;
      if (saldo < TAXA_FILA) {
        return await socket.sendMessage(remoteJid, { text: `❌ Você precisa de 🪙 *${TAXA_FILA} moedas* de taxa para listar seu item no leilão de fim de semana!` });
      }

      // Cobra taxa de 200 moedas
      bancoRPG[numeroLimpo].ouro -= TAXA_FILA;
      leilao.filaItens.push({ item, dono: numeroLimpo, lanceInicial });

      fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));
      fs.writeFileSync(leilaoPath, JSON.stringify(leilao, null, 2));

      return await socket.sendMessage(remoteJid, {
        text: `✅ *ITEM LISTADO COM SUCESSO!* 🎉\n\n📦 *Item:* ${item.replace(/_/g, " ")}\n💰 *Mínimo:* 🪙 ${lanceInicial}\n🪙 *Taxa paga:* -${TAXA_FILA} moedas.\n\nSeu item foi adicionado à lista e será leiloado automaticamente na sexta (18:30) ou sábado (19:00)! Posição atual: *${leilao.filaItens.length}/${LIMITE_FILA}*`
      });
    }

    // ==========================================
    // VERIFICAÇÃO DE HORÁRIO DE LANCES E INÍCIOS
    // ==========================================
    const leilaoLiberado = estaNoHorarioDoLeilao();

    if (!leilaoLiberado && subComando !== "lista") {
      return await socket.sendMessage(remoteJid, {
        text: `📅 *Mercado Fechado!* Os lances e pregões de leilão ocorrem estritamente:\n\n• *Sextas-feiras:* A partir das *18:30*\n• *Sábados:* A partir das *19:00*\n\n👉 Use *${PREFIX}leilao cadastrar [item] [preço]* durante a semana pagando uma taxa de 200 moedas para garantir sua venda!`
      });
    }

    // VER FILA DE ESPERA
    if (subComando === "lista" || subComando === "fila") {
      if (leilao.filaItens.length === 0) {
        return await socket.sendMessage(remoteJid, { text: "📦 Nao há itens aguardando na fila de leilão no momento." });
      }
      const listaFila = leilao.filaItens.map((f, i) => `*${i + 1}.* ${f.item.replace(/_/g, " ")} (Dono: @${f.dono}) - Min: 🪙 ${f.lanceInicial}`).join("\n");
      return await socket.sendMessage(remoteJid, {
        text: `⚖️ *LISTA DE ESPERA DO LEILÃO (${leilao.filaItens.length}/${LIMITE_FILA}):*\n\n${listaFila}`,
        mentions: leilao.filaItens.map(f => `${f.dono}@s.whatsapp.net`)
      });
    }

    // LANCE
    if (subComando === "lance" || !subComando) {
      if (!leilao.ativo) {
        // Se houver itens na fila e estiver no horário, inicia o primeiro
        if (leilao.filaItens.length > 0) {
          const proximo = leilao.filaItens.shift();
          leilao.ativo = true;
          leilao.item = proximo.item;
          leilao.dono = proximo.dono;
          leilao.lanceAtual = proximo.lanceInicial;
          leilao.maiorLicitante = "";
          leilao.etapaVenda = 0;

          fs.writeFileSync(leilaoPath, JSON.stringify(leilao, null, 2));

          return await socket.sendMessage(remoteJid, {
            text: `📢 *ABRINDO O PREGÃO EM THE LEGENDARY!* 📢\n\n📦 *Item:* ${leilao.item.replace(/_/g, " ")}\n👤 *Vendedor:* @${leilao.dono}\n💰 *Lance Inicial:* 🪙 ${leilao.lanceAtual}`,
            mentions: [`${leilao.dono}@s.whatsapp.net`]
          });
        }
        return await socket.sendMessage(remoteJid, { text: "⚠️ Sem itens ativos ou na fila para leiloar." });
      }

      const valorLance = parseInt(args[1] || args[0]);

      if (isNaN(valorLance)) {
        return await socket.sendMessage(remoteJid, { text: `⚠️ Insira um valor numérico para o lance! Exemplo: *${PREFIX}lance 500*` });
      }

      if (valorLance <= leilao.lanceAtual) {
        return await socket.sendMessage(remoteJid, { text: `⚠️ Seu lance precisa superar o valor atual de *🪙 ${leilao.lanceAtual}*!` });
      }

      const saldoJogador = bancoRPG[numeroLimpo]?.ouro || 0;
      if (saldoJogador < valorLance) {
        return await socket.sendMessage(remoteJid, { text: `❌ Você não possui moedas de ouro suficientes! Saldo: 🪙 *${saldoJogador}*` });
      }

      // Atualiza o maior lance e RESETA a etapa do martelo de venda para dar mais 10s aos outros
      leilao.lanceAtual = valorLance;
      leilao.maiorLicitante = numeroLimpo;
      leilao.etapaVenda = 0; 
      fs.writeFileSync(leilaoPath, JSON.stringify(leilao, null, 2));

      await socket.sendMessage(remoteJid, {
        text: `📈 *LANCE COBERTO!*\n\n👤 *Aventureiro:* @${numeroLimpo}\n💰 *Novo Preço:* 🪙 *${valorLance}*!\n\n⏳ _A contagem regressiva de 10s reiniciou! Quem dá mais?_`,
        mentions: [userLid]
      });

      // Inicia a contagem de venda de 10 segundos
      iniciarCronometroMartelo(socket, remoteJid);
    }
  }
};
