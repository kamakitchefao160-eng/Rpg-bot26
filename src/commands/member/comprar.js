import fs from "fs";
import path from "path";
import { PREFIX } from "../../config.js";
import { isGroup } from "../../utils/index.js";
import { ITENS_LOJA } from "./loja.js";

const dbPath = path.join(process.cwd(), "banco de dados", "rpg-usuarios.json");

export default {
  name: "comprar",
  description: "Compra uma raça, classe ou item da loja",
  commands: ["comprar", "buy"],
  usage: `${PREFIX}comprar [número]`,

  handle: async ({ args, socket, remoteJid, userLid, sendErrorReply }) => {
    if (!isGroup(remoteJid)) return sendErrorReply("Este comando só pode ser usado em grupo.");

    const numeroLimpo = userLid.split("@")[0];

    let bancoRPG = {};
    if (fs.existsSync(dbPath)) {
      bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    }

    if (!bancoRPG[numeroLimpo]) {
      return sendErrorReply(`❌ Você precisa digitar *${PREFIX}perfil* primeiro para iniciar sua jornada!`);
    }

    const idItem = args[0];
    if (!idItem || !ITENS_LOJA[idItem]) {
      return sendErrorReply(`❌ ID inválido! Digite *${PREFIX}loja* para ver os números corretos.`);
    }

    const itemEscolhido = ITENS_LOJA[idItem];
    const dadosUsuario = bancoRPG[numeroLimpo];

    // Inicialização segura das listas de controle histórico
    if (!dadosUsuario.inventario) dadosUsuario.inventario = [];
    if (!dadosUsuario.racasCompradas) dadosUsuario.racasCompradas = [dadosUsuario.raca || "Humano"];
    if (!dadosUsuario.classesCompradas) dadosUsuario.classesCompradas = [dadosUsuario.classe || "Guerreiro"];

    // 🚨 TRAVA DE SEGURANÇA SELETIVA (Bloqueia repetição apenas para Raças, Classes, Títulos, Montarias e Molduras)
    const itensPermanentes = ["raca", "classe", "titulo", "montaria", "moldura"];
    
    if (itensPermanentes.includes(itemEscolhido.tipo)) {
      if (itemEscolhido.tipo === "raca" && dadosUsuario.racasCompradas.includes(itemEscolhido.nome)) {
        return sendErrorReply(`❌ Você já possui a raça *${itemEscolhido.nome}* liberada no seu histórico!`);
      }
      if (itemEscolhido.tipo === "classe" && dadosUsuario.classesCompradas.includes(itemEscolhido.nome)) {
        return sendErrorReply(`❌ Você já possui a classe *${itemEscolhido.nome}* liberada no seu histórico!`);
      }
      if (["titulo", "montaria", "moldura"].includes(itemEscolhido.tipo) && dadosUsuario.inventario.includes(itemEscolhido.nome)) {
        return sendErrorReply(`❌ Você já possui o item cosmético *${itemEscolhido.nome}* na sua conta!`);
      }
    }

    // 🌟 LOGICA DE PREÇO (Custo 0 se o jogador possuir marcadores de criação vazios)
    let precoFinal = itemEscolhido.preco;
    if (itemEscolhido.tipo === "raca" && dadosUsuario.raca.includes("Ainda não escolheu")) precoFinal = 0;
    if (itemEscolhido.tipo === "classe" && dadosUsuario.classe.includes("Ainda não escolheu")) precoFinal = 0;

    // Verificação de caixa
    if (dadosUsuario.ouro < precoFinal) {
      return sendErrorReply(`❌ Saldo insuficiente! Custo: 🪙 ${precoFinal} moedas. Você possui: 🪙 ${dadosUsuario.ouro}.`);
    }

    // Efetua a transação de ouro
    dadosUsuario.ouro -= precoFinal;

    // Processa a inserção correta baseada no tipo de dados
    if (itemEscolhido.tipo === "raca") {
      dadosUsuario.racasCompradas.push(itemEscolhido.nome);
      dadosUsuario.raca = itemEscolhido.nome;
    } else if (itemEscolhido.tipo === "classe") {
      dadosUsuario.classesCompradas.push(itemEscolhido.nome);
      dadosUsuario.classe = itemEscolhido.nome;
    } else if (itemEscolhido.tipo === "consumivel") {
      // Itens de consumo ativo direto e entram também acumulados na mochila
      dadosUsuario.consumivel = itemEscolhido.nome;
      dadosUsuario.inventario.push(itemEscolhido.nome);
    } else {
      // Molduras, Títulos, Passes e Itens Raros entram direto na mochila
      dadosUsuario.inventario.push(itemEscolhido.nome);
      if (itemEscolhido.tipo === "titulo") dadosUsuario.titulo = itemEscolhido.nome;
      if (itemEscolhido.tipo === "montaria") dadosUsuario.montaria = itemEscolhido.nome;
      if (itemEscolhido.tipo === "moldura") dadosUsuario.moldura = itemEscolhido.nome;
    }

    // Salva permanentemente no banco .json do Termux
    fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));

    const msgSucesso = precoFinal === 0 
      ? `🎉 *ESCOLHA INICIAL GRÁTIS SALVA!* 🎉\n\n👤 @${dadosUsuario.nomeOficial} definiu permanentemente:\n📦 *${itemEscolhido.nome}* (🪙 Grátis)\n\nSeu saldo inicial de moedas continuou intacto!`
      : `🎉 *COMPRA CONCLUÍDA COM SUCESSO!* 🎉\n\n👤 @${dadosUsuario.nomeOficial} adquiriu:\n📦 *${itemEscolhido.nome}*\n\n🪙 Saldo restante: ${dadosUsuario.ouro} moedas de ouro.`;

    await socket.sendMessage(remoteJid, { text: msgSucesso }, { mentions: [userLid] });
  }
};
