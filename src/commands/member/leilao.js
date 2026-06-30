// Banco de dados temporário em memória para guardar os leilões ativos
if (!global.sistemaLeilaoDados) {
    global.sistemaLeilaoDados = {
        itensLeiloados: new Map(),
        taxaAnuncio: 500,
        incrementoMinimo: 200,
        proibidos: ["raca", "classes", "raças", "classe"]
    };
}

function verificarHorarioLeilao() {
    const agora = new Date();
    const diaDaSemana = agora.getDay(); // 5 = Sexta, 6 = Sábado
    const horaAtual = agora.getHours();

    if (diaDaSemana === 5 && horaAtual >= 19) return { aberto: true };
    if (diaDaSemana === 6 && horaAtual >= 18) return { aberto: true };

    return { aberto: false };
}

// FORMATO COMPATÍVEL COM O CONTEXTO DO SEU BOT
const comandoLeilao = {
    name: 'leilao',
    aliases: ['leilão', 'lance', 'leiloar'],
    description: 'Sistema de Leilão Semanal',
    
    // Suporta tanto bots que chamam .run() quanto .execute()
    async run(sock, message, args, player) {
        await comandoLeilao.execute(sock, message, args, player);
    },

    async execute(sock, message, args, player) {
        // ID do chat atual
        const jid = message.key?.remoteJid || message.chat;
        if (!jid) return;

        const { aberto } = verificarHorarioLeilao();
        const dados = global.sistemaLeilaoDados;
        const subComando = args[0]?.toLowerCase();

        // Garante que o objeto do jogador exista para não quebrar o código
        const jogador = player || { nome: message.pushName || "Jogador", moedas: 1000 };

        // 1. /leilao leiloar [Nome] [Tipo] [Valor]
        if (subComando === 'leiloar') {
            if (!aberto) return sock.sendMessage(jid, { text: "❌ O leilão está fechado! Abre sextas às 19h e sábados às 18h." });
            if (dados.itensLeiloados.size >= 10) return sock.sendMessage(jid, { text: "❌ O mercado de leilões está lotado! (Máx 10 itens)." });

            const nomeItem = args[1];
            const tipoItem = args[2]?.toLowerCase();
            const precoInicial = parseInt(args[3]);

            if (!nomeItem || !tipoItem || isNaN(precoInicial)) {
                return sock.sendMessage(jid, { text: "❌ Use: `/leilao leiloar [Nome] [Tipo] [PreçoInicial]`\nExemplo: `/leilao leiloar Chapéu_Mágico chapeu 1000`" });
            }

            if (dados.proibidos.includes(tipoItem)) {
                return sock.sendMessage(jid, { text: `❌ Erro: Itens do tipo ${tipoItem.toUpperCase()} não podem ser leiloados!` });
            }

            if (jogador.moedas < dados.taxaAnuncio) {
                return sock.sendMessage(jid, { text: `❌ Você precisa de ${dados.taxaAnuncio} moedas para a taxa.` });
            }

            jogador.moedas -= dados.taxaAnuncio;
            const idLeilao = dados.itensLeiloados.size + 1;

            dados.itensLeiloados.set(idLeilao, {
                dono: jogador.nome,
                item: nomeItem,
                tipo: tipoItem,
                lanceAtual: precoInicial,
                ultimoLicitante: "Nenhum",
                lanceMinimoProximo: precoInicial + dados.incrementoMinimo
            });

            return sock.sendMessage(jid, { text: `✨ **Item Anunciado!** '${nomeItem}' está no leilão [ID: ${idLeilao}]. Taxa de 500G cobrada.` });
        }

        // 2. /leilao lance [ID] [Valor]
        if (subComando === 'lance') {
            if (!aberto) return sock.sendMessage(jid, { text: "❌ O leilão já fechou!" });
            
            const idLeilao = parseInt(args[1]);
            const valorLance = parseInt(args[2]);

            if (isNaN(idLeilao) || isNaN(valorLance)) {
                return sock.sendMessage(jid, { text: "❌ Use: `/leilao lance [ID] [Valor]`" });
            }

            if (!dados.itensLeiloados.has(idLeilao)) {
                return sock.sendMessage(jid, { text: "❌ ID de leilão inválido." });
            }

            const item = dados.itensLeiloados.get(idLeilao);

            if (jogador.nome === item.dono) return sock.sendMessage(jid, { text: "❌ Você não pode dar lance no seu próprio item!" });
            if (valorLance < item.lanceMinimoProximo) return sock.sendMessage(jid, { text: `❌ Lance mínimo necessário: ${item.lanceMinimoProximo} moedas.` });
            if (jogador.moedas < valorLance) return sock.sendMessage(jid, { text: "❌ Você não tem moedas suficientes." });

            item.lanceAtual = valorLance;
            item.ultimoLicitante = jogador.nome;
            item.lanceMinimoProximo = valorLance + dados.incrementoMinimo;

            return sock.sendMessage(jid, { text: `⚔️ **LANCE ACEITO!** ${jogador.nome} deu um lance de 🪙 ${valorLance} no item '${item.item}'!` });
        }

        // 3. MENU PRINCIPAL: /leilao
        let layout = [];
        layout.push("⚖️ ═══════════════════════ ⚖️");
        layout.push("🏛️  **CÂMARA DE LEILÕES** 🏛️");
        layout.push("⚖️ ═══════════════════════ ⚖️");

        if (aberto) {
            layout.push(`🟢 **Status:** ABERTO // 📦 **Slots Ocupados:** [ ${dados.itensLeiloados.size} / 10 ]\n`);
            
            if (dados.itensLeiloados.size === 0) {
                layout.push("*Nenhum item sendo leiloado no momento.*\n");
            } else {
                let idx = 1;
                dados.itensLeiloados.forEach((itemDados, id) => {
                    layout.push(`[${String(idx).padStart(2, '0')}] 👑 **${itemDados.item}** (${itemDados.tipo.toUpperCase()})`);
                    layout.push(`├─ 👤 Vendedor: \`${itemDados.dono}\``);
                    layout.push(`├─ 💰 Lance Atual: 🪙 ${itemDados.lanceAtual} moedas`);
                    layout.push(`├─ 👤 Último Licitante: \`${itemDados.ultimoLicitante}\``);
                    layout.push(`└─ ⚡ Próximo Lance Mínimo: **${itemDados.lanceMinimoProximo} moedas**\n`);
                    idx++;
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
            layout.push(`💰 *Taxa de anúncio:* 🪙 ${dados.taxaAnuncio} moedas`);
            layout.push("🚫 *Itens proibidos:* Raças e Classes.");
        }

        return sock.sendMessage(jid, { text: layout.join("\n") });
    }
};

export default comandoLeilao;
