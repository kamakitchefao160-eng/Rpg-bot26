import fs from "fs";
import path from "path";
import { PREFIX, DATABASE_DIR } from "../../config.js";
// Importa a lista oficial de itens diretamente do seu arquivo de loja
import { ITENS_LOJA } from "./loja.js"; 

const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");
const ofertasDbPath = path.join(DATABASE_DIR, "ofertas.json");

function lerJSON(caminho) {
  try { return JSON.parse(fs.readFileSync(caminho, "utf-8")); } catch { return {}; }
}
function salvarJSON(caminho, dados) {
  try { fs.writeFileSync(caminho, JSON.stringify(dados, null, 2)); } catch {}
}

// 🔀 Função para gerar códigos únicos de oferta (Ex: OFR-K9B2)
function gerarCodigoOferta() {
  const caracteres = "ABCDEFGHJKLMNOPQRSTUVWXYZ0123456789";
  let codigo = "OFR-";
  for (let i = 0; i < 4; i++) {
    codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return codigo;
}

// ⏳ LOOP AUTOMÁTICO DE OFERTAS (5 EM 5 MINUTOS)
let loopIniciado = false;
function iniciarLoopOfertas(socket, remoteJid) {
  // Garante que o loop só inicie se for disparado de dentro de um grupo válido
  if (loopIniciado || !remoteJid.endsWith("@g.us")) return;
  loopIniciado = true;

  setInterval(async () => {
    let ofertasAtivas = lerJSON(ofertasDbPath);
    
    // Fallback de segurança caso ITENS_LOJA não seja carregado devidamente
    const listaItens = ITENS_LOJA ? (Array.isArray(ITENS_LOJA) ? ITENS_LOJA : Object.values(ITENS_LOJA)) : [];
    if (listaItens.length === 0) return;

    const itemOriginal = listaItens[Math.floor(Math.random() * listaItens.length)];

    // Aplica um desconto dinâmico aleatório de 15% a 35%
    const porcentagemDesconto = Math.floor(Math.random() * (35 - 15 + 1)) + 15;
    const precoComDesconto = Math.max(10, Math.floor(itemOriginal.preco * (1 - porcentagemDesconto / 100)));

    const novoCodigo = gerarCodigoOferta();
    const tempoExpiracao = Date.now() + 60 * 60 * 1000; // Válido por 1 hora

    ofertasAtivas[novoCodigo] = {
      nome: itemOriginal.nome,
      precoOriginal: itemOriginal.preco,
      precoOferta: precoComDesconto,
      tipo: itemOriginal.tipo || "item",
      expiraEm: tempoExpiracao
    };
    salvarJSON(ofertasDbPath, ofertasAtivas);

    // Mapeamento de emojis por categoria
    const emojis = { raca: "🧬", classe: "🛡️", titulo: "🏅", montaria: "🐎", chapeu: "🎩", acessorio: "📿", moldura: "🖼️", cosmetico: "✨" };
    const emojiTipo = emojis[itemOriginal.tipo] || "📦";

    // 📢 Template visual formatado enviado dinamicamente ao grupo onde o comando rodou
    const bannerOferta = `⚡ ═════ 🏷️ *PROMOÇÃO RELÂMPAGO* 🏷️ ═════ ⚡\n\n` +
      `🟢 *Mercador:* _"Olha o que acabou de chegar da caravana comercial com desconto único!"_\n\n` +
      `${emojiTipo} *Produto:* **${itemOriginal.nome}**\n` +
      `🗂️ *Categoria:* _${(itemOriginal.tipo || "ITEM").toUpperCase()}_\n` +
      `❌ *Preço Comum:* ~~🪙 ${itemOriginal.preco} Ouros~~\n` +
      `🔥 *PREÇO NA OFERTA:* 🪙 **${precoComDesconto} Ouros** _(-${porcentagemDesconto}%)_\n\n` +
      `⏱️ *Validade:* Este código expira em exatamente 1 hora!\n` +
      `───────────────────────────\n` +
      `🛒 *Para resgatar agora mesmo, digite:* \n` +
      `👉 \`${PREFIX}oferta comprar ${novoCodigo}\`\n\n` +
      `💡 _Novas barganhas surgem no chat a cada 5 minutos!_`;

    try {
      await socket.sendMessage(remoteJid, { text: bannerOferta });
    } catch (e) {
      console.log("Erro ao disparar oferta periódica: ", e.message);
    }
  }, 5 * 60 * 1000); // Executa a cada 5 minutos
}

export default {
  name: "oferta",
  description: "Sistema automatizado de importação e compra de promoções da Loja",
  commands: ["oferta", "ofertas", "compraroferta"],
  usage: `${PREFIX}oferta comprar [CÓDIGO]`,

  handle: async ({ socket, remoteJid, userLid, args }) => {
    // Validação instantânea de grupo
    if (!remoteJid.endsWith("@g.us")) {
      return socket.sendMessage(remoteJid, { 
        text: "❌ *Este comando só pode ser utilizado dentro de um grupo oficial do RPG!*" 
      });
    }

    // Liga o motor de anúncios automáticos usando o JID dinâmico e seguro do grupo
    iniciarLoopOfertas(socket, remoteJid);

    const numeroLimpo = userLid.split("@")[0];
    const acao = args[0]?.toLowerCase();
    const codigoInformado = args[1]?.toUpperCase();

    let bancoRPG = lerJSON(dbPath);
    let ofertasAtivas = lerJSON(ofertasDbPath);

    const dados = bancoRPG[numeroLimpo];
    if (!dados) return socket.sendMessage(remoteJid, { text: "❌ Crie seu perfil primeiro." });

    // Exibe instrução básica caso o jogador utilize o comando incorretamente
    if (!acao || acao !== "comprar") {
      return socket.sendMessage(remoteJid, { 
        text: `💡 *Use os códigos gerados nos anúncios recentes do grupo!* \nExemplo: \`${PREFIX}oferta comprar OFR-A1B2\`` 
      });
    }

    // Verifica a existência do código informado
    if (!codigoInformado || !ofertasAtivas[codigoInformado]) {
      return socket.sendMessage(remoteJid, { text: "❌ *Esta oferta não existe ou já foi coletada por outro herói.*" });
    }

    const infoOferta = ofertasAtivas[codigoInformado];

    // Verifica se a promoção expirou
    if (Date.now() > infoOferta.expiraEm) {
      delete ofertasAtivas[codigoInformado];
      salvarJSON(ofertasDbPath, ofertasAtivas);
      return socket.sendMessage(remoteJid, { text: "⏰ *Tarde demais! Essa promoção perdeu a validade e expirou.*" });
    }

    // Valida o saldo de ouro do jogador
    if ((dados.ouro || 0) < infoOferta.precoOferta) {
      return socket.sendMessage(remoteJid, { text: `❌ Saldo insuficiente! Você precisa de 🪙 *${infoOferta.precoOferta}* ouros.` });
    }

    // Consome os ouros do jogador
    dados.ouro -= infoOferta.precoOferta;

    // Vincula a posse do item de acordo com a categoria
    if (infoOferta.tipo === "raca") {
      if (!dados.racasCompradas) dados.racasCompradas = [dados.raca || "Humano"];
      if (!dados.racasCompradas.includes(infoOferta.nome)) dados.racasCompradas.push(infoOferta.nome);
    } else if (infoOferta.tipo === "classe") {
      if (!dados.classesCompradas) dados.classesCompradas = [dados.classe || "Guerreiro"];
      if (!dados.classesCompradas.includes(infoOferta.nome)) dados.classesCompradas.push(infoOferta.nome);
    } else if (infoOferta.tipo === "moldura") {
      dados.moldura = infoOferta.nome;
    } else {
      if (!dados.inventario) dados.inventario = [];
      dados.inventario.push(infoOferta.nome);
    }

    // Deleta o código usado para evitar compras duplicadas
    delete ofertasAtivas[codigoInformado];

    salvarJSON(dbPath, bancoRPG);
    salvarJSON(ofertasDbPath, ofertasAtivas);

    return socket.sendMessage(remoteJid, {
      text: `🎉 *PECHINCHA CONCLUÍDA!* 🎉\n\n📦 Adquirido: **${infoOferta.nome}**\n🪙 Custo Deduzido: *-${infoOferta.precoOferta} Ouros*\n\n✅ Modificação gravada com êxito! Digite \`/perfil\` para conferir seu novo patrimônio.`
    });
  }
};
