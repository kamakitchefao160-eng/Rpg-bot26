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
  name: "raca",
  description: "Escolha a sua raça de RPG",
  commands: ["raca", "definirraca", "setraca"],
  usage: "/raca [Nome da Raça]",

  handle: async ({ socket, remoteJid, userLid, args }) => {
    const jogadorId = userLid.split("@")[0];
    const escolha = args.join(" ").trim();

    if (!escolha) {
      return socket.sendMessage(remoteJid, { text: "🧬 *Digite uma raça válida!* Exemplo: `/raca Humano` ou `/raca Elfo`" });
    }

    // Lista simplificada para validação (deve bater com as chaves do duelo)
    const racasValidas = [
      "Humano", "Elfo", "Oni (Demônio Oriental)", "Meio-Fera", "Anão", "Morto-Vivo", 
      "Vampiro", "Anjo Caído", "Fada", "Sereia / Tritão", "Goblin", "Orc", 
      "Ciborgue / Autômato", "Espírito / Fantasma", "Draconato (Meio-Dragão)", "Elfo Negro (Drow)", 
      "Slime Humanóide", "Metamorfo", "Titã (Gigante)", "Ser Estelar", "Centauro", 
      "Minotauro", "Lobisomem", "Nefalim", "Kitsune", "Lizardfolk (Homem-Lagarto)", 
      "Gárgula", "Sylph (Espírito do Ar)", "Undine (Espírito da Água)", "Salamandra (Espírito do Fogo)"
    ];

    const racaEncontrada = racasValidas.find(r => r.toLowerCase() === escolha.toLowerCase());

    if (!racaEncontrada) {
      return socket.sendMessage(remoteJid, { text: "❌ Essa raça não existe no jogo! Verifique a ortografia." });
    }

    let banco = lerJSON(dbPath);

    if (!banco[jogadorId]) {
      banco[jogadorId] = { personagem: `Lutador_${jogadorId.slice(-4)}`, ouro: 200, exp: 0, vitorias: 0, derrotas: 0 };
    }

    banco[jogadorId].raca = racaEncontrada;
    salvarJSON(dbPath, banco);

    return socket.sendMessage(remoteJid, { text: `🧬 **Sucesso!** Sua raça agora é **${racaEncontrada}**! Seu perfil foi atualizado.` });
  }
};
