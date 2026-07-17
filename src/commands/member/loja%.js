import fs from "fs";
import path from "path";
import { PREFIX, DATABASE_DIR } from "../../config.js";

const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");

// Itens de elite e lendários com preços originais altos (quase 20k)
const ITENS_EVENTO = [
  { id: 1, nome: "⚔️ Katana Evolutiva (Padrão)", preco: 18500, categoria: "Arma" },
  { id: 2, nome: "🔮 Cajado do Infinito", preco: 22000, categoria: "Arma" },
  { id: 3, nome: "👑 Coroa do Caos", preco: 5500, categoria: "Chapéu" },
  { id: 4, nome: "👒 Chapéu FF Raro", preco: 2500, categoria: "Chapéu" },
  { id: 5, nome: "🐉 Dragão Ancião (Montaria)", preco: 24000, categoria: "Montaria" }
];

// Armazena temporariamente a porcentagem de desconto gerada para o usuário na sessão
const descontosSessao = new Map();

export default {
  name: "loja%",
  description: "Abre o evento de loja com desconto percentual aleatório em itens lendários",
  commands: ["loja%", "lojadesconto", "girardesconto"],
  usage: `${PREFIX}loja% [id do item]`,

  handle: async ({ socket, remoteJid, userLid, args }) => {
    const numeroLimpo = userLid.split("@")[0];
    
    let bancoRPG = {};
    if (fs.existsSync(dbPath)) {
      try { bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8")); } catch { bancoRPG = {}; }
    }

    const dados = bancoRPG[numeroLimpo];
    if (!dados) return socket.sendMessage(remoteJid, { text: "❌ Crie seu perfil primeiro usando /perfil" });

    // Se o usuário não tiver um desconto gerado para essa rodada, cria um de 10% a 90%
    if (!descontosSessao.has(numeroLimpo)) {
      const porcentagemGerada = Math.floor(Math.random() * 81) + 10; // 10% a 90%
      descontosSessao.set(numeroLimpo, porcentagemGerada);
    }
    const seuDesconto = descontosSessao.get(numeroLimpo);

    // SISTEMA DE COMPRA COM A PORCENTAGEM APLICADA
    if (args.length > 0) {
      const idItem = parseInt(args[0]);
      const itemSorteado = ITENS_EVENTO.find(i => i.id === idItem);

      if (!itemSorteado) {
        return socket.sendMessage(remoteJid, { text: "❌ ID inválido! Digite um ID da lista. Exemplo: `/loja% 1`" });
      }

      // Calcula o preço final subtraindo a porcentagem
      const precoFinal = Math.floor(itemSorteado.preco * (1 - seuDesconto / 100));
      const saldoOuro = dados.ouro || 0;

      if (saldoOuro < precoFinal) {
        return socket.sendMessage(remoteJid, { text: `❌ Você não tem ouros suficientes! Esse item com desconto custa 🪙 *${precoFinal}* ouros.` });
      }

      // Deduz o valor e empurra para a mochila
      dados.ouro = saldoOuro - precoFinal;
      if (!dados.inventario) dados.inventario = [];
      dados.inventario.push(itemSorteado.nome);

      // Limpa o desconto atual para que o próximo comando `/loja%` gere um novo valor
      descontosSessao.delete(numeroLimpo);
      fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));

      return socket.sendMessage(remoteJid, {
        text: `🛍️ *COMPRA REALIZADA NO EVENTO!*\n\nVocê garantiu *${itemSorteado.nome}* com incríveis *${seuDesconto}% de desconto* por 🪙 *${precoFinal}* ouros!\nO item foi enviado para seu \`/cofre\`.`
      });
    }

    // EXIBIÇÃO DA VITRINE COM AS PORCENTAGENS CALCULADAS
    let painelDesconto = `⚡ ══════ 🏷️ *LOJA DE DESCONTOS %* 🏷️ ══════ ⚡\n`;
    painelDesconto += `👤 *Guerreiro:* @${numeroLimpo}\n`;
    painelDesconto += `🍀 *Seu multiplicador de sorte:* 🔥 *${seuDesconto}% OFF*\n`;
    painelDesconto += `💰 *Seu Saldo:* 🪙 *${dados.ouro || 0}* ouros\n`;
    painelDesconto += `───────────────────────────\n\n`;
    painelDesconto += `🛒 *Vitrine de Ofertas (Digite ${PREFIX}loja% [ID] para comprar):*\n\n`;

    ITENS_EVENTO.forEach(item => {
      const valorComDesconto = Math.floor(item.preco * (1 - seuDesconto / 100));
      painelDesconto += `🆔 *[${item.id}]* — *${item.nome}*\n`;
      painelDesconto += `   Original: <s>🪙 ${item.preco}</s> -> *Com Desconto: 🪙 ${valorComDesconto} ouros*\n\n`;
    });

    painelDesconto += `───────────────────────────\n⚠️ _Seu desconto atual muda assim que você realizar uma compra!_`;

    return socket.sendMessage(remoteJid, { text: painelDesconto, mentions: [userLid] });
  }
};
