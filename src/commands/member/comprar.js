import fs from "fs";
import path from "path";
import { PREFIX } from "../../config.js";
import { isGroup } from "../../utils/index.js";
import { ITENS_LOJA } from "./loja.js";

const dbPath = path.resolve("banco de dados", "rpg-usuarios.json");

export default {
  name: "comprar",
  description: "Compra uma raça, classe ou item da loja",
  commands: ["comprar"],
  usage: `${PREFIX}comprar [número]`,

  handle: async ({ args, socket, remoteJid, userLid, sendErrorReply }) => {
    if (!isGroup(remoteJid)) return sendErrorReply("Este comando só pode ser usado em grupo.");

    const numeroLimpo = userLid.split("@")[0];

    let bancoRPG = {};
    if (fs.existsSync(dbPath)) {
      bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    }

    if (!bancoRPG[numeroLimpo]) {
      return sendErrorReply("❌ Você precisa digitar *!perfil* primeiro para iniciar sua jornada!");
    }

    const idItem = args[0];
    if (!idItem || !ITENS_LOJA[idItem]) {
      return sendErrorReply(`❌ ID inválido! Digite *!loja* para ver os números corretos.`);
    }

    const itemEscolhido = ITENS_LOJA[idItem];
    const dadosUsuario = bancoRPG[numeroLimpo];

    if (!dadosUsuario.inventario) dadosUsuario.inventario = [];

    // 🚨 TRAVA ANTI-REPETIÇÃO: Se o item já estiver no inventário permanente, dá ERRO!
    if (itemEscolhido.tipo !== "consumivel" && dadosUsuario.inventario.includes(itemEscolhido.nome)) {
      return sendErrorReply(`❌ Erro: Você já possui permanentemente a opção *${itemEscolhido.nome}* no seu inventário! Não é possível comprar repetido.`);
    }

    // 🌟 LÓGICA DE GRATUIDADE PARA O INICIANTE
    let precoFinal = itemEscolhido.preco;

    if (itemEscolhido.tipo === "raca" && dadosUsuario.raca.includes("Ainda não escolheu")) {
      precoFinal = 0; // Primeira raça é grátis!
    }
    if (itemEscolhido.tipo === "classe" && dadosUsuario.classe.includes("Ainda não escolheu")) {
      precoFinal = 0; // Primeira classe é grátis!
    }

    // Validação de saldo (mantendo as 200 moedas iniciais intactas se for grátis)
    if (dadosUsuario.ouro < precoFinal) {
      return sendErrorReply(`❌ Saldo insuficiente! Custo: 🪙 ${precoFinal} moedas. Você possui: 🪙 ${dadosUsuario.ouro}.`);
    }

    // Processa o pagamento e insere no inventário permanente
    dadosUsuario.ouro -= precoFinal;

    if (itemEscolhido.tipo === "consumivel") {
      dadosUsuario.consumivel = itemEscolhido.nome;
    } else {
      dadosUsuario.inventario.push(itemEscolhido.nome); // Salva de forma permanente no inventário
    }

    // Equipa e aplica as mudanças visuais na ficha na hora
    if (itemEscolhido.tipo === "raca") dadosUsuario.raca = itemEscolhido.nome;
    if (itemEscolhido.tipo === "classe") dadosUsuario.classe = itemEscolhido.nome;
    if (itemEscolhido.tipo === "titulo") dadosUsuario.titulo = itemEscolhido.nome;
    if (itemEscolhido.tipo === "montaria") dadosUsuario.montaria = itemEscolhido.nome;
    if (itemEscolhido.tipo === "moldura") dadosUsuario.moldura = itemEscolhido.nome;

    // Salva tudo no arquivo de texto JSON permanentemente
    fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));

    const msgSucesso = precoFinal === 0 
      ? `🎉 *ESCOLHA INICIAL GRÁTIS SALVA!* 🎉\n\n👤 @${dadosUsuario.nomeOficial} definiu permanentemente:\n📦 *${itemEscolhido.nome}* (🪙 Grátis)\n\nSeu saldo inicial de 🪙 ${dadosUsuario.ouro} moedas continuou intacto!`
      : `🎉 *COMPRA PERMANENTE CONCLUÍDA!* 🎉\n\n👤 @${dadosUsuario.nomeOficial} adquiriu:\n📦 *${itemEscolhido.nome}*\n\n🪙 Saldo restante: ${dadosUsuario.ouro} moedas.`;

    await socket.sendMessage(remoteJid, { text: msgSucesso }, { mentions: [userLid] });
  }
};
