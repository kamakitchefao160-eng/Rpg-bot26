import fs from "fs";
import path from "path";
import { PREFIX } from "../../config.js";
import { isGroup } from "../../utils/index.js";
import { ITENS_LOJA } from "./loja.js";

const dbPath = path.resolve("banco de dados", "rpg-usuarios.json");

export default {
  name: "comprar",
  description: "Compra um item ou classe da loja de forma permanente",
  commands: ["comprar"],
  usage: `${PREFIX}comprar [número]`,

  handle: async ({ args, socket, remoteJid, userLid, sendErrorReply }) => {
    if (!isGroup(remoteJid)) {
      return sendErrorReply("Este comando só pode ser usado em grupo.");
    }

    const numeroLimpo = userLid.split("@")[0];

    let bancoRPG = {};
    if (fs.existsSync(dbPath)) {
      bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    }

    if (!bancoRPG[numeroLimpo]) {
      return sendErrorReply("❌ Você precisa digitar *!perfil* primeiro para criar sua conta no RPG!");
    }

    const idItem = args[0];

    if (!idItem || !ITENS_LOJA[idItem]) {
      return sendErrorReply(`❌ ID inválido! Digite *!loja* para ver os números corretos dos itens.`);
    }

    const itemEscolhido = ITENS_LOJA[idItem];
    const dadosUsuario = bancoRPG[numeroLimpo];

    // Garante que a lista de inventário permanente exista
    if (!dadosUsuario.inventario) {
      dadosUsuario.inventario = [];
    }

    // Verifica se o jogador já possui esse item permanentemente (menos consumíveis)
    if (itemEscolhido.tipo !== "consumivel" && dadosUsuario.inventario.includes(itemEscolhido.nome)) {
      return sendErrorReply(`❌ Você já possui *${itemEscolhido.nome}* no seu inventário permanente! Use *!equipar ${itemEscolhido.nome}* para usar.`);
    }

    // Validação de Saldo
    if (dadosUsuario.ouro < itemEscolhido.preco) {
      return sendErrorReply(`❌ Saldo insuficiente! Custo: 🪙 ${itemEscolhido.preco} moedas. Seu saldo: 🪙 ${dadosUsuario.ouro}.`);
    }

    // Processamento do pagamento
    dadosUsuario.ouro -= itemEscolhido.preco;

    // Adiciona ao inventário permanente
    if (itemEscolhido.tipo === "consumivel") {
      // Se for consumível (como poção), acumula o texto ou quantidade
      dadosUsuario.consumivel = itemEscolhido.nome;
    } else {
      dadosUsuario.inventario.push(itemEscolhido.nome);
    }

    // Se for a primeira compra de Raça ou Classe, já deixa equipado direto para facilitar
    if (itemEscolhido.tipo === "raca") dadosUsuario.raca = itemEscolhido.nome;
    if (itemEscolhido.tipo === "classe") dadosUsuario.classe = itemEscolhido.nome;
    if (itemEscolhido.tipo === "titulo") dadosUsuario.titulo = itemEscolhido.nome;
    if (itemEscolhido.tipo === "montaria") dadosUsuario.montaria = itemEscolhido.nome;
    if (itemEscolhido.tipo === "moldura") dadosUsuario.moldura = itemEscolhido.nome;

    // Salva tudo de forma permanente no arquivo JSON
    fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));

    await socket.sendMessage(remoteJid, {
      text: `🎉 *COMPRA CONCLUÍDA E SALVA!* 🎉\n\n👤 @${dadosUsuario.nomeOficial} adquiriu permanentemente:\n📦 *${itemEscolhido.nome}*\n\n🪙 Saldo restante: ${dadosUsuario.ouro} moedas.\n\n💡 _Dica: Se comprou uma raça/classe reserva, mude quando quiser digitando *!equipar [Nome]*!_`
    }, { mentions: [userLid] });
  }
};
