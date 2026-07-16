import fs from "fs";
import path from "path";
import { PREFIX } from "../../config.js";
import { ITENS_LOJA } from "./loja.js"; // Importa os itens cadastrados na sua loja

const dbPath = path.join(process.cwd(), "banco de dados", "rpg-usuarios.json");

function lerJSON(caminho) {
  if (!fs.existsSync(caminho)) return {};
  try { return JSON.parse(fs.readFileSync(caminho, "utf-8")); } catch { return {}; }
}

function salvarJSON(caminho, dados) {
  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2));
}

export default {
  name: "comprar",
  description: "Compre raças, classes, títulos e cosméticos da Loja usando seu ouro",
  commands: ["comprar", "buy"],
  usage: `${PREFIX}comprar [ID]`,

  handle: async ({ args, socket, remoteJid, userLid }) => {
    const numeroLimpo = userLid.split("@")[0];
    const idItem = args[0];

    if (!idItem) {
      return await socket.sendMessage(remoteJid, { text: `⚠️ Uso correto: *${PREFIX}comprar [ID]*\nExemplo: *${PREFIX}comprar 2* (para comprar Elfo)` });
    }

    const item = ITENS_LOJA[idItem];
    if (!item) {
      return await socket.sendMessage(remoteJid, { text: "❌ Item ou ID não encontrado na loja! Verifique os números em */loja*." });
    }

    let bancoRPG = lerJSON(dbPath);
    if (!bancoRPG[numeroLimpo]) {
      return await socket.sendMessage(remoteJid, { text: "❌ Você precisa ter um perfil criado primeiro! Digite */perfil*." });
    }

    const jogador = bancoRPG[numeroLimpo];
    const saldo = jogador.ouro || 0;

    // Inicializa arrays de segurança caso não existam
    if (!jogador.racasCompradas) jogador.racasCompradas = [jogador.raca || "Humano"];
    if (!jogador.classesCompradas) jogador.classesCompradas = [jogador.classe || "Guerreiro"];
    if (!jogador.inventario) jogador.inventario = [];

    // Verificações dependendo do tipo do item
    if (item.tipo === "raca") {
      if (jogador.racasCompradas.includes(item.nome)) {
        return await socket.sendMessage(remoteJid, { text: `❌ Você já possui a raça *${item.nome}* desbloqueada!` });
      }
    } else if (item.tipo === "classe") {
      if (jogador.classesCompradas.includes(item.nome)) {
        return await socket.sendMessage(remoteJid, { text: `❌ Você já possui a classe *${item.nome}* desbloqueada!` });
      }
    } else {
      // Itens comuns do inventário (Títulos, Montarias, Cosméticos, Molduras, etc.)
      if (jogador.inventario.includes(item.nome)) {
        return await socket.sendMessage(remoteJid, { text: `❌ Você já possui o item *${item.nome}* no seu inventário!` });
      }
    }

    // Verifica se tem ouro suficiente
    if (saldo < item.preco) {
      return await socket.sendMessage(remoteJid, { 
        text: `❌ Ouro insuficiente! Você precisa de 🪙 *${item.preco}* moedas para comprar *${item.nome}* (Seu saldo: 🪙 ${saldo}).` 
      });
    }

    // Processa o pagamento
    jogador.ouro -= item.preco;

    // Entrega o produto
    if (item.tipo === "raca") {
      jogador.racasCompradas.push(item.nome);
      jogador.raca = item.nome; // Equipado automaticamente
    } else if (item.tipo === "classe") {
      jogador.classesCompradas.push(item.nome);
      jogador.classe = item.nome; // Equipada automaticamente
    } else {
      jogador.inventario.push(item.nome);
    }

    salvarJSON(dbPath, bancoRPG);

    return await socket.sendMessage(remoteJid, {
      text: `🎉 *COMPRA REALIZADA COM SUCESSO!* 🛒\n\n🛍️ *Adquirido:* ${item.nome}\n🪙 *Custo:* -${item.preco} Ouro\n💰 *Saldo Atual:* 🪙 ${jogador.ouro.toLocaleString('pt-BR')} moedas.\n\n_As mudanças já foram aplicadas ao seu perfil!_`
    });
  }
};
