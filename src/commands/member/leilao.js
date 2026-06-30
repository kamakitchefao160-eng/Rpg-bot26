import fs from 'fs';
import path from 'path';

// Configuração dos caminhos dos arquivos JSON para salvar os dados
const pastaDados = path.resolve('./database');
const arquivoLeilao = path.join(pastaDados, 'leilao.json');
const arquivoPlayers = path.join(pastaDados, 'players.json');

// Garante que a pasta database e os arquivos existam
if (!fs.existsSync(pastaDados)) {
    fs.mkdirSync(pastaDados, { recursive: true });
}
if (!fs.existsSync(arquivoLeilao)) {
    fs.writeFileSync(arquivoLeilao, JSON.stringify({ itensLeiloados: [] }), 'utf-8');
}

function lerBanco(arquivo) {
    try {
        return JSON.parse(fs.readFileSync(arquivo, 'utf-8'));
    } catch {
        return {};
    }
}

function salvarBanco(arquivo, dados) {
    fs.writeFileSync(arquivo, JSON.stringify(dados, null, 2), 'utf-8');
}

function verificarHorarioLeilao() {
    const agora = new Date();
    const diaDaSemana = agora.getDay(); // 5 = Sexta, 6 = Sábado
    const horaAtual = agora.getHours();

    if ((diaDaSemana === 5 && horaAtual >= 19) || (diaDaSemana === 6 && horaAtual >= 18)) {
        return { aberto: true };
    }
    return { aberto: false };
}

// ==========================================
// PROPRIEDADES QUE O TAKESHI BOT EXIGE:
// ==========================================
export const commands = ['leilao', 'leilão', 'lance', 'leiloar']; 
export const description = 'Sistema de Leilão Semanal';

// Função de execução do comando
export async function run(sock, message, args) {
    const jid = message.key?.remoteJid || message.chat;
    if (!jid) return;

    const sender = message.key.participant || message.key.remoteJid;
    const { aberto } = verificarHorarioLeilao();
    
    const bancoLeilao = lerBanco(arquivoLeilao);
    const bancoPlayers = lerBanco(arquivoPlayers);

    if (!bancoPlayers[sender]) {
        bancoPlayers[sender] = { nome: message.pushName || "Jogador", moedas: 1000, cofre: [] };
        salvarBanco(arquivoPlayers, bancoPlayers);
    }
    
    const jogador = bancoPlayers[sender];
    const subComando = args[0]?.toLowerCase();

    const taxaAnuncio = 500;
    const incrementoMinimo = 200;
    const proibidos = ["raca", "classes", "raças", "classe"];

    // 1. SUBCOMANDO: leiloar
    if (subComando === 'leiloar') {
        if (!aberto) return sock.sendMessage(jid, { text: "❌ O leilão está fechado! Abre sextas às 19h e sábados às 18h." });
        if (bancoLeilao.itensLeiloados.length >= 10) return sock.sendMessage(jid, { text: "❌ O mercado de leilões está lotado! (Máx 10 itens ativos)." });

        const nomeItem = args[1];
        const tipoItem = args[2]?.toLowerCase();
        const precoInicial = parseInt(args[3]);

        if (!nomeItem || !tipoItem || isNaN(precoInicial)) {
            return sock.sendMessage(jid, { text: "❌ Use: `/leilao leiloar [Nome] [Tipo] [PreçoInicial]`\nExemplo: `/leilao leiloar Coroa chapeu 1000`" });
        }

        if (proibidos.includes(tipoItem)) {
            return sock.sendMessage(jid, { text: `❌ Erro: Itens do tipo ${tipoItem.toUpperCase()} não podem ser leiloados!` });
        }

        if (jogador.moedas < taxaAnuncio) {
            return sock.sendMessage(jid, { text: `❌ Você precisa de ${taxaAnuncio} moedas de ouro para pagar a taxa.` });
        }

        jogador.moedas -= taxaAnuncio;
        const novoId = bancoLeilao.itensLeiloados.length + 1;

        bancoLeilao.itensLeiloados.push({
            id: novoId,
            donoJid: sender,
            donoNome: jogador.nome,
            item: nomeItem,
            tipo: tipoItem,
            lanceAtual: precoInicial,
            ultimoLicitanteJid: null,
            ultimoLicitanteNome: "Nenhum",
            lanceMinimoProximo: precoInicial + incrementoMinimo
        });

        salvarBanco(arquivoPlayers, bancoPlayers);
        salvarBanco(arquivoLeilao, bancoLeilao);

        return sock.sendMessage(jid, { text: `✨ **Item Anunciado!** '${nomeItem}' entrou no leilão [ID: ${novoId}]. 500G cobrados de taxa.` });
    }

    // 2. SUBCOMANDO: lance
    if (subComando === 'lance') {
        if (!aberto) return sock.sendMessage(jid, { text: "❌ O leilão já fechou!" });

        const idLeilao = parseInt(args[1]);
        const valorLance = parseInt(args[2]);

        if (isNaN(idLeilao) || isNaN(valorLance)) {
            return sock.sendMessage(jid, { text: "❌ Use: `/leilao lance [ID] [Valor]`" });
        }

        const item = bancoLeilao.itensLeiloados.find(i => i.id === idLeilao);
        if (!item) return sock.sendMessage(jid, { text: "❌ ID de leilão inválido." });

        if (sender === item.donoJid) return sock.sendMessage(jid, { text: "❌ Você não pode dar lance no seu próprio item!" });
        if (valorLance < item.lanceMinimoProximo) return sock.sendMessage(jid, { text: `❌ O lance mínimo para este item é ${item.lanceMinimoProximo} moedas.` });
        if (jogador.moedas < valorLance) return sock.sendMessage(jid, { text: "❌ Saldo insuficiente." });

        if (item.ultimoLicitanteJid && bancoPlayers[item.ultimoLicitanteJid]) {
            bancoPlayers[item.ultimoLicitanteJid].moedas += item.lanceAtual;
        }

        jogador.moedas -= valorLance;
        
        item.lanceAtual = valorLance;
        item.ultimoLicitanteJid = sender;
        item.ultimoLicitanteNome = jogador.nome;
        item.lanceMinimoProximo = valorLance + incrementoMinimo;

        salvarBanco(arquivoPlayers, bancoPlayers);
        salvarBanco(arquivoLeilao, bancoLeilao);

        return sock.sendMessage(jid, { text: `⚔️ **LANCE ACEITO!** ${jogador.nome} cobriu o lance para 🪙 ${valorLance} no item '${item.item}'!` });
    }

    // 3. MENU PRINCIPAL
    let layout = [];
    layout.push("⚖️ ═══════════════════════ ⚖️");
    layout.push("🏛️  **CÂMARA DE LEILÕES** 🏛️");
    layout.push("⚖️ ═══════════════════════ ⚖️");

    if (aberto) {
        layout.push(`🟢 **Status:** ABERTO // 📦 **Slots Ocupados:** [ ${bancoLeilao.itensLeiloados.length} / 10 ]\n`);
        
        if (bancoLeilao.itensLeiloados.length === 0) {
            layout.push("*Nenhum item sendo leiloado no momento.*\n");
        } else {
            bancoLeilao.itensLeiloados.forEach((item) => {
                layout.push(`[${String(item.id).padStart(2, '0')}] 👑 **${item.item}** (${item.tipo.toUpperCase()})`);
                layout.push(`├─ 👤 Vendedor: \`${item.donoNome}\``);
                layout.push(`├─ 💰 Lance Atual: 🪙 ${item.lanceAtual} moedas`);
                layout.push(`├─ 👤 Último Licitante: \`${item.ultimoLicitanteNome}\``);
                layout.push(`└─ ⚡ Próximo Lance Mínimo: **${item.lanceMinimoProximo} moedas**\n`);
            });
        }

        layout.push("─────────────────────────");
        layout.push(`🎒 **Seu Saldo:** 🪙 ${jogador.moedas} moedas`);
        layout.push("✍️ O que deseja fazer?\n");
        layout.push("👉 `/leilao leiloar [nome] [tipo] [preco]`\n_(Taxa de 500 moedas)_");
        layout.push("👉 `/leilao lance [ID] [valor]`");
    } else {
        layout.push("🔴 **Status:** FECHADO\n");
        layout.push("🔒 *O mercado de lances está trancado no momento.*\n");
        layout.push("📅 **Próximas Aberturas:**");
        layout.push("└─ 📅 **Sexta-feira:** Às 19:00h");
        layout.push("└─ 📅 **Sábado:** Às 18:00h\n");
        layout.push(`💰 *Taxa de anúncio:* 🪙 ${taxaAnuncio} moedas`);
        layout.push("🚫 *Itens proibidos:* Raças e Classes.");
    }

    return sock.sendMessage(jid, { text: layout.join("\n") });
}
