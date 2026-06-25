import fs from "fs";
import path from "path";
import { PREFIX } from "../../config.js";
import { isGroup } from "../../utils/index.js";

const dbPath = path.resolve("banco de dados", "rpg-usuarios.json");

// Itens disponíveis para compra e seus respectivos preços em ouro
const ITENS_LOJA = {
  "1": { nome: "Arco Longo: Sopro da Primavera", preco: 200, tipo: "arma" },
  "2": { nome: "Brisa de Sakura", preco: 150, tipo: "moldura" },
  "3": { nome: "Elixir do Shogun (XP Duplo)", preco: 50, tipo: "consumivel" },
  "4": { nome: "Vassoura Voadora Mística", preco: 500, tipo: "montaria" }
};

export default {
  name: "comprar",
  description: "Compra itens para o seu perfil de RPG",
  commands: ["comprar", "shop", "loja"],
  usage: `${PREFIX}comprar [número do item]`,

  handle: async ({ args, socket, remoteJid, userLid, sendErrorReply }) => {
    if (!isGroup(remoteJid)) {
      return sendErrorReply("Este comando só pode ser usado em grupo.");
    }

    const numeroLimpo = userLid.split("@")[0];

    // Carrega o banco de dados
    let bancoRPG = {};
    if (fs.existsSync(dbPath)) {
      bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    }

    // Se o usuário não estiver no banco (nunca deu !perfil), cria o registro dele
    if (!bancoRPG[numeroLimpo]) {
      return sendErrorReply("❌ Você precisa digitar *!perfil* primeiro para criar sua conta no RPG!");
    }

    const idItem = args[0];

    // Se não digitar o número do item, mostra o catálogo da loja
    if (!idItem || !ITENS_LOJA[idItem]) {
      let textoLoja = `🛒 *LOJA DO RPG SAKURA* 🛒\n\n Seu Saldo Atual: 🪙 ${bancoRPG[numeroLimpo].ouro} moedas\n\nDigite *!comprar [Número]* para comprar:\n\n`;
      
      for (const [id, item] of Object.entries(ITENS_LOJA)) {
        textoLoja += `*${id}* - ${item.nome}\n• Custo: 🪙 ${item.preco} moedas de ouro\n\n`;
      }
      
      return await socket.sendMessage(remoteJid, { text: textoLoja });
    }

    const itemEscolhido = ITENS_LOJA[idItem];
    const dadosUsuario = bancoRPG[numeroLimpo];

    // Verifica se o jogador tem ouro suficiente
    if (dadosUsuario.ouro < itemEscolhido.preco) {
      return sendErrorReply(`❌ Ouro insuficiente! Você precisa de 🪙 ${itemEscolhido.preco} moedas, mas só tem 🪙 ${dadosUsuario.ouro}.`);
    }

    // Deduz o valor e equipa o item no inventário correspondente ao tipo
    dadosUsuario.ouro -= itemEscolhido.preco;
    dadosUsuario[itemEscolhido.tipo] = itemEscolhido.nome;

    // Se for a primeira compra de itens épicos, podemos mudar o título do personagem de brincadeira:
    if (idItem === "1") {
      dadosUsuario.titulo = "🌸 Guardiã da Primavera 🌸";
      dadosUsuario.personagem = "Sayuri Kinoshita";
      dadosUsuario.raca = "Elfo";
      dadosUsuario.classe = "Arqueira";
    }

    // Salva as alterações no arquivo JSON
    fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));

    await socket.sendMessage(remoteJid, {
      text: `🎉 *COMPRA REALIZADA COM SUCESSO!* 🎉\n\n👤 @${dadosUsuario.nomeOficial} adquiriu:\n📦 *${itemEscolhido.nome}*\n\nSeu novo saldo é de: 🪙 ${dadosUsuario.ouro} moedas de ouro.\nDigite *!perfil* para ver suas novas conquistas!`
    }, { mentions: [userLid] });
  }
};

