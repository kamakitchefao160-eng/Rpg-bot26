import fs from "node:fs";
import path from "node:path";
import { DATABASE_DIR } from "../../config.js";
import { RACAS_RPG } from "../../utils/racas.js"; // Suas raças

const dbPath = path.join(DATABASE_DIR, "rpg-usuarios.json");

export default {
  name: "presente",
  description: "Presenteia outro jogador com uma raça, classe ou item",
  commands: ["presente", "presentear", "dar"],
  usage: "/presente @jogador [Nome da Raça/Classe/Item]",

  handle: async ({ socket, remoteJid, userLid, args, mentions, sendErrorReply }) => {
    const remetenteId = userLid.split("@")[0];

    // Validação 1: Verificar se marcou alguém
    if (!mentions || mentions.length === 0) {
      return sendErrorReply("❌ Marque quem vai receber o presente! Ex: `/presente @amigo Oni`");
    }

    const destinatarioId = mentions[0].split("@")[0];
    if (remetenteId === destinatarioId) {
      return sendErrorReply("❌ Você não pode dar um presente para si mesmo!");
    }

    // Remove a menção dos argumentos para pegar o nome do item/raça puro
    // Ex: args era ["@5511...", "Oni"], juntando o resto fica "Oni"
    const presenteNome = args.slice(1).join(" ");
    if (!presenteNome) {
      return sendErrorReply("❌ Digite o que deseja presentear! Ex: `/presente @amigo Oni`");
    }

    if (!fs.existsSync(dbPath)) return sendErrorReply("❌ Banco de dados não encontrado!");

    let bancoRPG = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    const remetente = bancoRPG[remetenteId];
    const destinatario = bancoRPG[destinatarioId];

    if (!remetente) return sendErrorReply("❌ Crie sua conta primeiro!");
    if (!destinatario) return sendErrorReply("❌ O destinatário não tem uma conta no RPG ainda.");

    // Garante as arrays no JSON
    if (!remetente.racasCompradas) remetente.racasCompradas = [remetente.raca || "Humano"];
    if (!destinatario.racasCompradas) destinatario.racasCompradas = [destinatario.raca || "Humano"];

    // 🔍 REGRA DE NEGÓCIO: Vamos verificar se é uma Raça válida
    // Se o usuário digitou "3" ou "Oni", tratamos para identificar o Oni
    let racaSelecionada = presenteNome.trim();
    if (racaSelecionada === "3" || racaSelecionada.toLowerCase() === "oni") {
      racaSelecionada = "Oni";
    }

    if (!RACAS_RPG[racaSelecionada]) {
      return sendErrorReply(`❌ A raça ou item *${racaSelecionada}* não foi encontrada no jogo!`);
    }

    // Validação 2: O remetente possui essa raça comprada para poder presentear?
    if (!remetente.racasCompradas.includes(racaSelecionada)) {
      return sendErrorReply(`❌ Você não possui a raça *${racaSelecionada}* liberada para poder presentear alguém!`);
    }

    // Validação 3: O destinatário já tem?
    if (destinatario.racasCompradas.includes(racaSelecionada)) {
      return sendErrorReply(`❌ Esse jogador já possui a raça *${racaSelecionada}* desbloqueada.`);
    }

    // Transfere o direito da raça (remove de quem envia se quiser que seja exclusivo, ou apenas adiciona no outro)
    // Vamos adicionar no inventário de quem recebe:
    destinatario.racasCompradas.push(racaSelecionada);
    
    // Opcional: Se quiser tirar de quem enviou, descomente a linha abaixo:
    // remetente.racasCompradas = remetente.racasCompradas.filter(r => r !== racaSelecionada);

    fs.writeFileSync(dbPath, JSON.stringify(bancoRPG, null, 2));

    await socket.sendMessage(remoteJid, {
      text: `🎁 *PRESENTE ENVIADO!* 🌹\n\n🎉 *${remetente.nomeOficial}* enviou a raça *${racaSelecionada}* de presente para *${destinatario.nomeOficial}*!\n\n✅ Agora ela está disponível no menu de trocas do destinatário!`,
      mentions: [userLid, mentions[0]]
    });
  }
};
