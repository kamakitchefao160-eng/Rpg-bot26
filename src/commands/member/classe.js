import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pastaDatabase = path.resolve(__dirname, "../../../database");
const dbPath = path.join(pastaDatabase, "rpg-usuarios.json");

function lerJSON(caminho) {
  try { return JSON.parse(fs.readFileSync(caminho, "utf-8")); } catch { return {}; }
}
function salvarJSON(caminho, dados) {
  try { fs.writeFileSync(caminho, JSON.stringify(dados, null, 2)); return true; } catch { return false; }
}

export default {
  name: "classe",
  description: "Escolha a sua classe de RPG",
  commands: ["classe", "definirclasse", "setclasse"],
  usage: "/classe [Nome da Classe]",

  handle: async ({ socket, remoteJid, userLid, args }) => {
    const jogadorId = userLid.split("@")[0];
    const escolha = args.join(" ").trim();

    if (!escolha) {
      return socket.sendMessage(remoteJid, { text: "🔮 *Digite uma classe válida!* Exemplo: `/classe Guerreiro` ou `/classe Mago`" });
    }

    // Lista simplificada para validação (deve bater com as chaves do duelo)
    const classesValidas = [
      "Guerreiro", "Mago", "Assassino", "Arqueiro", "Samurai", "Sacerdote / Clérigo", 
      "Paladino", "Necromante", "Ninja", "Ladino / Larápio", "Bardo", "Bárbaro", 
      "Monge", "Alquimista", "Cavaleiro Rúnico", "Druida", "Lanceiro", "Invocador (Summoner)", 
      "Atirador de Elite (Sniper)", "Berserker", "Cavaleiro da Morte", "Bruxo", "Feiticeiro", 
      "Caçador de Recompensas", "Pirata", "Mosqueteiro", "Espadachim", "Xamã", "Domador de Feras", 
      "Ilusionista", "Cavaleiro Sagrado", "Guardião da Floresta", "Pugilista", "Mestre de Armas", 
      "Clérigo Sombrio", "Geomante", "Pirotecnista", "Cronomante", "Inquisidor", "Algoz"
    ];

    const classeEncontrada = classesValidas.find(c => c.toLowerCase() === escolha.toLowerCase());

    if (!classeEncontrada) {
      return socket.sendMessage(remoteJid, { text: "❌ Essa classe não existe no jogo! Verifique a ortografia." });
    }

    let banco = lerJSON(dbPath);

    // Se o usuário não existir no JSON, inicia a estrutura dele
    if (!banco[jogadorId]) {
      banco[jogadorId] = { personagem: `Lutador_${jogadorId.slice(-4)}`, ouro: 200, exp: 0, vitorias: 0, derrotas: 0 };
    }

    banco[jogadorId].classe = classeEncontrada;
    salvarJSON(dbPath, banco);

    return socket.sendMessage(remoteJid, { text: `✨ **Sucesso!** Você agora é um **${classeEncontrada}**! Seu perfil foi atualizado.` });
  }
};
