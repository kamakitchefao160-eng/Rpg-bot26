import fs from "fs";
import path from "path";
import { PREFIX, DATABASE_DIR } from "../../config.js";

const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");

const ITENS_EVENTO = [
  // ARMAS
  { id: 1, nome: "⚔️ Katana Evolutiva", preco: 18500, categoria: "Armas" },
  { id: 2, nome: "🔮 Cajado do Infinito", preco: 22000, categoria: "Armas" },
  { id: 3, nome: "🏹 Arco Artemis", preco: 12000, categoria: "Armas" },
  { id: 4, nome: "🔱 Tridente de Poseidon", preco: 19500, categoria: "Armas" },
  { id: 5, nome: "🪓 Machado de Ragnarok", preco: 16000, categoria: "Armas" },
  { id: 6, nome: "🗡️ Adaga de Assassino das Sombras", preco: 9500, categoria: "Armas" },
  // ARMADURAS E PROTEÇÕES
  { id: 7, nome: "🛡️ Escudo Aegis", preco: 14000, categoria: "Defesas" },
  { id: 8, nome: "👕 Armadura Netherite", preco: 25000, categoria: "Defesas" },
  { id: 9, nome: "🧥 Capa da Invisibilidade", preco: 11000, categoria: "Defesas" },
  // ACESSÓRIOS E CAPACETES
  { id: 10, nome: "👑 Coroa do Caos", preco: 5500, categoria: "Acessórios" },
  { id: 11, nome: "👒 Chapéu Angelical Raro", preco: 3500, categoria: "Acessórios" },
  { id: 12, nome: "💍 Anel da Imortalidade", preco: 15000, categoria: "Acessórios" },
  { id: 13, nome: "📿 Amuleto de Cthulhu", preco: 8800, categoria: "Acessórios" },
  { id: 14, nome: "🕶️ Óculos Ocultos", preco: 4200, categoria: "Acessórios" },
  // MONTARIAS E PETS
  { id: 15, nome: "🐉 Dragão Ancião", preco: 30000, categoria: "Montarias" },
  { id: 16, nome: "🦅 Pégaso Alado", preco: 21000, categoria: "Montarias" },
  { id: 17, nome: "🐺 Lobo da Neve", preco: 13500, categoria: "Montarias" },
  { id: 18, nome: "🦁 Leão Quimera", preco: 17500, categoria: "Montarias" },
  // CONSUMÍVEIS LENDÁRIOS
  { id: 19, nome: "🧪 Elixir Divino da Vida", preco: 5000, categoria: "Consumíveis" },
  { id: 20, nome: "📜 Pergaminho de Reset Total", preco: 7500, categoria: "Consumíveis" }
];

const descontosSessao = new Map();

export default {
  name: "loja",
  description: "Abre a vitrine de itens lendários com descontos customizados",
  commands: ["loja"],
  usage: `${PREFIX}loja desconto [id]`,

  handle: async ({ socket, remoteJid, userLid, args }) => {
    const numeroLimpo = userLid.split("@")[0];
    const subAcao = args[0]?.toLowerCase();

    let bancoRPG = {};
    if (fs.existsSync(dbPath)) {
      try { bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8")); } catch { bancoRPG = {}; }
    }

    const dados = bancoRPG[numeroLimpo];
    if (!dados) return socket.sendMessage(remoteJid, { text: "❌ *Crie seu perfil primeiro usando /perfil*" });

    if (!descontosSessao.has(numeroLimpo)) {
      const porcentagemGerada = Math.floor(Math.random() * 81) + 10; // 10% a 90%
      descontosSessao.set(numeroLimpo, porcentagemGerada);
    }
    const seuDesconto = descontosSessao.get(numeroLimpo);

    // SISTEMA DE COMPRA
    if (subAcao === "desconto" && args[1]) {
      const idItem = parseInt(args[1]);
      const itemSorteado = ITENS_EVENTO.find(i => i.id === idItem);

      if (!itemSorteado) {
        return socket.sendMessage(remoteJid, { text: "❌ *ID de item inválido! Escolha um ID válido de 1 a 20.*" });
      }

      const precoFinal = Math.floor(itemSorteado.preco * (1 - seuDesconto / 100));
      const saldoOuro = dados.ouro || 0;

      if (saldoOuro < precoFinal) {
        return socket.sendMessage(remoteJid, { text: `❌ *Você não tem ouro suficiente! Este item com desconto custa* *🪙 ${precoFinal}* *ouros.*` });
      }

      bancoRPG[numeroLimpo] = {
        ...bancoRPG[numeroLimpo],
        ouro: saldoOuro - precoFinal,
        inventario: [...(dados.inventario || []), itemSorteado.nome]
      };

      descontosSessao.delete(numeroLimpo);
      fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));

      return socket.sendMessage(remoteJid, {
        text: `🛍️ *COMPRA CONFIRMADA NO BAZAR!* 🛍️\n───────────────────────────\n📦 *Adquirido:* *${itemSorteado.nome}*\n🔥 *Desconto Aplicado:* *${seuDesconto}% OFF*\n💰 *Valor Pago:* *🪙 ${precoFinal} ouros*\n───────────────────────────\n📥 _O item foi adicionado em seu_ \`/cofre\` _com sucesso._`
      });
    }

    // EXIBIÇÃO FORMATADA
    let painel = `⚡ ══════ 🏷️ *BAZAR DE DESCONTOS LENDÁRIOS* 🏷️ ══════ ⚡\n\n`;
    painel += `👤 *Aventureiro:* @${numeroLimpo}\n`;
    painel += `🍀 *Seu Desconto Atual:* 🔥 *${seuDesconto}% OFF*\n`;
    painel += `💰 *Seu Ouro:* 🪙 *${dados.ouro || 0}*\n`;
    painel += `───────────────────────────\n`;
    painel += `🛒 *Para comprar digite:* \`${PREFIX}loja desconto [ID]\`\n`;
    painel += `───────────────────────────\n\n`;

    let categoriaAtual = "";
    ITENS_EVENTO.forEach(item => {
      if (categoriaAtual !== item.categoria) {
        categoriaAtual = item.categoria;
        painel += `🔹 *CATEGORIA: ${categoriaAtual.toUpperCase()}* 🔹\n`;
      }
      const precoComDesconto = Math.floor(item.preco * (1 - seuDesconto / 100));
      painel += `🆔 *[${item.id}]* — *${item.nome}*\n`;
      painel += `   *De:* ~~🪙 ${item.preco}~~ ➔ *Por:* *🪙 ${precoComDesconto} ouros*\n\n`;
    });

    painel += `───────────────────────────\n⚠️ *Aviso: Seu multiplicador de desconto mudará após efetuar qualquer compra.*`;

    return socket.sendMessage(remoteJid, { text: painel, mentions: [userLid] });
  }
};
