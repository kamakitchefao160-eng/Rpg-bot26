import fs from "fs";
import path from "path";
import { PREFIX } from "../../config.js";
import { isGroup } from "../../utils/index.js";
import { ITENS_LOJA } from "./loja.js"; // Importa a lista do arquivo loja.js

const dbPath = path.resolve("banco de dados", "rpg-usuarios.json");

export default {
  name: "comprar",
  description: "Compra um item da loja usando seu ID",
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

    // Se não digitar o ID ou o ID não existir na loja
    if (!idItem || !ITENS_LOJA[idItem]) {
      return sendErrorReply(`❌ ID inválido! Digite *!loja* para ver os números corretos dos itens.`);
    }

    const itemEscolhido = ITENS_LOJA[idItem];
    const dadosUsuario = bancoRPG[numeroLimpo];

    // Validação de Saldo
    if (dadosUsuario.ouro < itemEscolhido.preco) {
      return sendErrorReply(`❌ Saldo insuficiente! O item custa 🪙 ${itemEscolhido.preco} moedas, mas você só tem 🪙 ${dadosUsuario.ouro}.`);
    }

    // Processamento: Remove o ouro e adiciona no inventário correto
    dadosUsuario.ouro -= itemEscolhido.preco;
    dadosUsuario[itemEscolhido.tipo] = itemEscolhido.nome;

    // Customizações especiais por item se você quiser (como mudar dados do personagem)
    if (idItem === "1") {
      dadosUsuario.titulo = "🌸 Guardiã da Primavera 🌸";
      dadosUsuario.personagem = "Sayuri Kinoshita";
      dadosUsuario.raca = "Elfo";
      dadosUsuario.classe = "Arqueira";
    }

    // Salva tudo no banco JSON
    fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));

    await socket.sendMessage(remoteJid, {
      text: `🎉 *COMPRA CONCLUÍDA!* 🎉\n\n👤 @${dadosUsuario.nomeOficial} comprou:\n📦 *${itemEscolhido.nome}*\n\n🪙 Saldo restante: ${dadosUsuario.ouro} moedas.\nDigite *!perfil* para ver seu inventário!`
    }, { mentions: [userLid] });
  }
};
