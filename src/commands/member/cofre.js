import fs from "fs";
import path from "path";
import { PREFIX } from "../../config.js";
import { ITENS_LOJA } from "./loja.js"; 

const dbPath = path.join(process.cwd(), "banco de dados", "rpg-usuarios.json");

// Dicionário para mapear itens de eventos, passe ou recompensas que não estão na loja padrão
const ITENS_EXTRAS_EVENTO = {
  "katana evolutiva lvl 1 (raríssimo)": "arma",
  "katana evolutiva (padrão)": "arma",
  "katana evolutiva (upgrade)": "arma",
  "katana evolutiva (fogo)": "arma",
  "katana evolutiva (trovão)": "arma",
  "katana evolutiva (vácuo)": "arma",
  "katana evolutiva celestial (imperial)": "arma",
  "katana lendária": "arma",
  "espada antiga": "arma",
  "cajado do infinito": "arma",
  "caixa suprema x1": "consumivel",
  "caixa suprema x2": "consumivel",
  "caixa suprema x3": "consumivel",
  "caixa suprema x4": "consumivel",
  "caixa suprema cósmica x5": "consumivel",
  "caixa de armas suprema": "consumivel",
  "emblema lendário de cerejeira": "emblema",
  "emblema cerejeira x2": "emblema",
  "emblema cerejeira x5": "emblema",
  "emblema cerejeira x8": "emblema",
  "emblema cerejeira x10": "emblema",
  "emblema cerejeira x15": "emblema"
};

export default {
  name: "cofre",
  description: "Mostra todos os seus pertences organizados por categorias",
  commands: ["cofre", "inventario", "mochila", "bag"],
  usage: `${PREFIX}cofre`,

  handle: async ({ socket, remoteJid, userLid }) => {
    const numeroLimpo = userLid.split("@")[0];

    let bancoRPG = {};
    if (fs.existsSync(dbPath)) {
      try { bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8")); } catch { bancoRPG = {}; }
    }

    const dados = bancoRPG[numeroLimpo];
    if (!dados) return socket.sendMessage(remoteJid, { text: "❌ Crie seu perfil primeiro." });

    const inventario = dados.inventario || [];
    const racasCompradas = dados.racasCompradas || [];
    const classesCompradas = dados.classesCompradas || [];

    // Arrays de separação visual do cofre
    const racas = [...racasCompradas].map(r => `🧬 Raça: ${r}`);
    const classes = [...classesCompradas].map(c => `🛡️ Classe: ${c}`);
    const titulos = [];
    const montarias = [];
    const chapeus = [];
    const acessorios = [];
    const molduras = [];
    const cosmeticos = [];
    const armasEOutros = [];

    // Se o usuário tiver itens equipados atualmente nas propriedades diretas, adiciona ao topo da lista da categoria
    if (dados.titulo) titulos.push(`🏅 ${dados.titulo} *(Equipado)*`);
    if (dados.moldura) molduras.push(`🖼️ ${dados.moldura} *(Equipada)*`);
    if (dados.arma) armasEOutros.push(`⚔️ ${dados.arma} *(Equipada)*`);

    // Varre o inventário geral e distribui conforme o tipo da loja ou extras
    inventario.forEach(item => {
      const nomeMinusculo = item.toLowerCase().trim();
      
      // Remove tags extras de busca para bater com a loja
      const itemLoja = Object.values(ITENS_LOJA).find(i => i.nome.toLowerCase().trim() === nomeMinusculo);
      const tipoDefinido = itemLoja ? itemLoja.tipo : ITENS_EXTRAS_EVENTO[nomeMinusculo];

      // Evita duplicar se já estiver listado como equipado direto
      if (item === dados.titulo || item === dados.moldura || item === dados.arma) return;

      if (tipoDefinido === "titulo") titulos.push(`🏅 ${item}`);
      else if (tipoDefinido === "montaria") montarias.push(`🐎 ${item}`);
      else if (tipoDefinido === "chapeu") chapeus.push(`🎩 ${item}`);
      else if (tipoDefinido === "acessorio") acessorios.push(`📿 ${item}`);
      else if (tipoDefinido === "moldura") molduras.push(`🖼️ ${item}`);
      else if (tipoDefinido === "cosmetico") cosmeticos.push(`✨ ${item}`);
      else if (tipoDefinido === "arma") armasEOutros.push(`⚔️ ${item}`);
      else if (tipoDefinido === "emblema") armasEOutros.push(`🌸 ${item}`);
      else armasEOutros.push(`📦 ${item}`);
    });

    // Construção do layout do Painel do Cofre
    let corpoCofre = `╔═════ ❖ ═════╗\n`;
    corpoCofre += `   📦  *COFRE DO AVENTUREIRO* 📦\n`;
    corpoCofre += `╚═════ ❖ ═════╝\n\n`;
    corpoCofre += `👤 *Guerreiro:* @${numeroLimpo}\n`;
    corpoCofre += `⚔️ *Kills Contabilizadas:* ${dados.kills || 0}\n`;
    corpoCofre += `🎫 *Passe de Batalha:* Nível ${dados.nivel_passe || 1}\n`;
    corpoCofre += `🪙 *Bolsa de Ouro:* 🪙 *${(dados.ouro || 0).toLocaleString('pt-BR')}*\n`;
    corpoCofre += `📜 ═══════════════════ 📜\n\n`;

    // 🧬 Linhagens Desbloqueadas
    corpoCofre += `🧬 *RAÇAS DESBLOQUEADAS*:\n`;
    corpoCofre += racas.length > 0 ? racas.map(i => `  • ${i}`).join("\n") + "\n" : "  _Nenhuma raça extra adquirida._\n";
    corpoCofre += `\n`;

    // 🛡️ Vocações de Combate
    corpoCofre += `🛡️ *CLASSES DESBLOQUEADAS*:\n`;
    corpoCofre += classes.length > 0 ? classes.map(i => `  • ${i}`).join("\n") + "\n" : "  _Nenhuma classe extra adquirida._\n";
    corpoCofre += `\n`;

    // ⚔️ Arsenal, Artefatos e Itens da Loja
    corpoCofre += `⚔️ *ARSENAL & RECURSOS ESPECIAIS*:\n`;
    corpoCofre += armasEOutros.length > 0 ? armasEOutros.map(i => `  • ${i}`).join("\n") + "\n" : "  _Nenhum artefato bélico guardado._\n";
    corpoCofre += `\n`;

    // 🐎 Estábulo
    corpoCofre += `🐎 *ESTÁBULO DE MONTARIAS*:\n`;
    corpoCofre += montarias.length > 0 ? montarias.map(i => `  • ${i}`).join("\n") + "\n" : "  _Nenhuma fera domada._\n";
    corpoCofre += `\n`;

    // 🎩 Adornos de Cabeça
    corpoCofre += `🎩 *ELMOS & CHAPÉUS*:\n`;
    corpoCofre += chapeus.length > 0 ? chapeus.map(i => `  • ${i}`).join("\n") + "\n" : "  _Nenhum elmo guardado._\n";
    corpoCofre += `\n`;

    // 📿 Relíquias e Joias
    corpoCofre += `📿 *RELÍQUIAS & ACESSÓRIOS*:\n`;
    corpoCofre += acessorios.length > 0 ? acessorios.map(i => `  • ${i}`).join("\n") + "\n" : "  _Nenhum amuleto ou capa guardada._\n";
    corpoCofre += `\n`;

    // 🖼️ Molduras de Perfil
    corpoCofre += `🖼️ *MOLDURAS DE PERFIL*:\n`;
    corpoCofre += molduras.length > 0 ? molduras.map(i => `  • ${i}`).join("\n") + "\n" : "  _Nenhuma moldura adquirida._\n";
    corpoCofre += `\n`;

    // ✨ Efeitos Visuais e Cosméticos
    corpoCofre += `✨ *AURAS & COSMÉTICOS*:\n`;
    corpoCofre += cosmeticos.length > 0 ? cosmeticos.map(i => `  • ${i}`).join("\n") + "\n" : "  _Nenhum rastro ou efeito equipado._\n";
    corpoCofre += `\n`;

    // 🏅 Alcunhas de Glória
    corpoCofre += `🏅 *TÍTULOS DE GLÓRIA*:\n`;
    corpoCofre += titulos.length > 0 ? titulos.map(i => `  • ${i}`).join("\n") + "\n" : "  _Nenhum título honorífico._\n";

    corpoCofre += `\n📜 ═══════════════════ 📜\n🎮 _Equipe seus pertences e exiba seu poder aos outros aventureiros!_`;

    return socket.sendMessage(remoteJid, { text: corpoCofre, mentions: [userLid] });
  }
};
