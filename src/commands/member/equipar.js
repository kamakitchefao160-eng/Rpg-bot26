
import fs from "fs";
import path from "path";
import { PREFIX } from "../../config.js";
import { isGroup } from "../../utils/index.js"; 

let BATALHAS_ATIVAS = null;
try {
  const moduloLutar = await import("./lutar.js");
  if (moduloLutar && moduloLutar.BATALHAS_ATIVAS) {
    BATALHAS_ATIVAS = moduloLutar.BATALHAS_ATIVAS;
  }
} catch (e) {
  // Luta não carregada ou não implementada ainda
}

const dbPath = path.join(process.cwd(), "banco de dados", "rpg-usuarios.json");

export default {
  name: "equipar",
  description: "Equipa ou desequipa uma classe, raça, título ou moldura",
  commands: ["equipar", "use", "desequipar"],
  usage: `${PREFIX}equipar [Nome por extenso] ou ${PREFIX}equipar remover [titulo/moldura]`,

  handle: async ({ args, socket, remoteJid, userLid, sendErrorReply }) => {
    if (!isGroup(remoteJid)) return sendErrorReply("Este comando só pode ser usado em grupo.");
    
    const numeroLimpo = userLid.split("@")[0];
    const acao = args.join(" ").trim();

    if (!acao) return sendErrorReply(`❌ O que você deseja equipar? Ex: \`${PREFIX}equipar Samurai\` ou \`${PREFIX}equipar remover titulo\``);

    if (BATALHAS_ATIVAS && typeof BATALHAS_ATIVAS.has === "function" && BATALHAS_ATIVAS.has(remoteJid)) {
      return sendErrorReply("❌ Você não pode alterar seus equipamentos durante um combate ativo!");
    }

    if (!fs.existsSync(dbPath)) return sendErrorReply("❌ Banco de dados não encontrado.");
    let bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    const p = bancoRPG[numeroLimpo];

    if (!p) return sendErrorReply("❌ Você não possui uma conta criada.");

    if (acao.toLowerCase() === "remover titulo") {
      p.tituloEquipado = "";
      fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));
      return socket.sendMessage(remoteJid, { text: "🏅 Você desequipou seu título com sucesso!" });
    }
    if (acao.toLowerCase() === "remover moldura") {
      p.molduraEquipada = "";
      fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));
      return socket.sendMessage(remoteJid, { text: "🖼️ Você desequipou sua moldura!" });
    }

    const inventario = p.inventario || [];
    const classesCompradas = p.classesCompradas || [p.classe || "Nenhuma"];
    const racasCompradas = p.racasCompradas || [p.raca || "Humano"];

    if (classesCompradas.some(c => c.toLowerCase() === acao.toLowerCase())) {
      const nomeCorreto = classesCompradas.find(c => c.toLowerCase() === acao.toLowerCase());
      p.classe = nomeCorreto;
      fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));
      return socket.sendMessage(remoteJid, { text: `🛡️ Classe alterada! Você agora é um *${nomeCorreto}*.` });
    }

    if (racasCompradas.some(r => r.toLowerCase() === acao.toLowerCase())) {
      const nomeCorreto = racasCompradas.find(r => r.toLowerCase() === acao.toLowerCase());
      p.raca = nomeCorreto;
      fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));
      return socket.sendMessage(remoteJid, { text: `🧬 Raça alterada! Você agora se transformou em um *${nomeCorreto}*.` });
    }

    const itemNoInventario = inventario.find(i => i.toLowerCase().includes(acao.toLowerCase()));
    if (itemNoInventario) {
      if (itemNoInventario.includes("Sakura (Moldura)") || itemNoInventario.includes("Moldura")) {
        p.molduraEquipada = "🌸✨";
        fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));
        return socket.sendMessage(remoteJid, { text: "🖼️ Moldura equipada no seu perfil!" });
      } else {
        p.tituloEquipado = itemNoInventario;
        fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));
        return socket.sendMessage(remoteJid, { text: `🏅 Título equipado: *${itemNoInventario}*!` });
      }
    }

    return sendErrorReply("❌ Você não possui esse item comprado ou digitou o nome incorretamente. Lembre-se de digitar o nome por extenso.");
  }
};
