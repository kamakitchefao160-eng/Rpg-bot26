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

export default {
  name: "store",
  description: "Abre a loja de itens lendários do RPG",
  commands: ["store", "comprar"],
  usage: `${PREFIX}store comprar [id]`,

  handle: async ({ socket, remoteJid, userLid, args }) => {
    const numeroLimpo = userLid.split("@")[0];
    const subAcao = args[0]?.toLowerCase();

    let bancoRPG = {};
    if (fs.existsSync(dbPath)) {
      try { bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8")); } catch { bancoRPG = {}; }
    }

    const dados = bancoRPG[numeroLimpo];
    if (!dados) return socket.sendMessage(remoteJid, { text: `❌ *Crie seu perfil primeiro usando ${PREFIX}perfil*` });

    // SISTEMA DE COMPRA
    if ((subAcao === "comprar" || subAcao === "buy") && args[1]) {
      const idItem = parseInt(args[1]);
      const itemSorteado = ITENS_EVENTO.find(i => i.id === idItem);

      if (!itemSorteado) {
        return socket.sendMessage(remoteJid, { text: "❌ *ID de item inválido! Escolha um ID válido de 1 a 20.*" });
      }

      const precoFinal = itemSorteado.preco;
      const saldoOuro = dados.ouro || 0;

      if (saldoOuro < precoFinal) {
        return socket.sendMessage(remoteJid, { text: `❌ *Você não tem ouro suficiente! Este item custa* *🪙 ${precoFinal}* *ouros.*` });
      }

      bancoRPG[numeroLimpo].ouro = saldoOuro - precoFinal;
      bancoRPG[numeroLimpo].inventario = [...(dados.inventario || []), itemSorteado.nome];

      fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));

      return socket.sendMessage(remoteJid, {
        text: `🛍️ *COMPRA CONFIRMADA!* 🛍️\n───────────────────────────\n📦 *Adquirido:* *${itemSorteado.nome}*\n💰 *Valor Pago:* *🪙 ${precoFinal} ouros*\n───────────────────────────\n📥 _O item foi adicionado à sua mochila com sucesso! Confira em_ \`${PREFIX}perfil\``
      });
    }

    // EXIBIÇÃO FORMATADA DA LOJA
    let painel = `⚡ ══════ 🏷️ *LOJA LENDÁRIA ONLINE* 🏷️ ══════ ⚡\n\n`;
    painel += `👤 *Aventureiro:* @${numeroLimpo}\n`;
    painel += `💰 *Seu Ouro:* 🪙 *${dados.ouro || 0}*\n`;
    painel += `───────────────────────────\n`;
    painel += `🛒 *Para comprar digite:* \`${PREFIX}store comprar [ID]\`\n`;
    painel += `───────────────────────────\n\n`;

    let categoriaAtual = "";
    ITENS_EVENTO.forEach(item => {
      if (categoriaAtual !== item.categoria) {
        categoriaAtual = item.categoria;
        painel += `🔹 *CATEGORIA: ${categoriaAtual.toUpperCase()}* 🔹\n`;
      }
      painel += `🆔 *[${item.id}]* — *${item.nome}*\n`;
      painel += `   *Preço:* *🪙 ${item.preco} ouros*\n\n`;
    });

    painel += `───────────────────────────\n⚡ _Equipe seus itens comprados para melhorar seus atributos!_`;

    return socket.sendMessage(remoteJid, { text: painel, mentions: [userLid] });
  }
};
