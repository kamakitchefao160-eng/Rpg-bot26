class SistemaLeilao {
    constructor() {
        this.itensLeiloados = new Map(); // Armazena os itens ativos (ID -> Dados)
        self.taxaAnuncio = 500;
        self.incrementoMinimo = 200;
        self.proibidos = ["raca", "classes", "raças", "classe"];
    }

    verificarHorarioLeilao() {
        const agora = new Date();
        const diaDaSemana = agora.getDay(); // 5 = Sexta, 6 = Sábado
        const horaAtual = agora.getHours();

        // Sexta-feira a partir das 19h
        if (diaDaSemana === 5 && horaAtual >= 19) {
            return { aberto: true, status: "Aberto (Sexta-feira)" };
        }
        // Sábado a partir das 18h
        if (diaDaSemana === 6 && horaAtual >= 18) {
            return { aberto: true, status: "Aberto (Sábado)" };
        }

        return { aberto: false, status: "Fechado" };
    }

    menuLeilao(jogador) {
        const { aberto } = this.verificarHorarioLeilao();
        
        let layout = [];
        layout.push("⚖️ ═══════════════════════ ⚖️");
        layout.push("🏛️  **CÂMARA DE LEILÕES** 🏛️");
        layout.push("⚖️ ═══════════════════════ ⚖️");

        if (aberto) {
            layout.push(`🟢 **Status:** ABERTO // 📦 **Slots Ocupados:** [ ${this.itensLeiloados.size} / 10 ]\n`);
            
            if (this.itensLeiloados.size === 0) {
                layout.push("*Nenhum item sendo leiloado no momento.*\n");
            } else {
                let idx = 1;
                this.itensLeiloados.forEach((dados, id) => {
                    layout.push(`[${String(idx).padStart(2, '0')}] 👑 **${dados.item}** (${dados.tipo.toUpperCase()})`);
                    layout.push(`├─ 👤 Vendedor: \`${dados.dono}\``);
                    layout.push(`├─ 💰 Lance Atual: 🪙 ${dados.lanceAtual} moedas`);
                    layout.push(`├─ 👤 Último Licitante: \`${dados.ultimoLicitante}\``);
                    layout.push(`└─ ⚡ Próximo Lance Mínimo: **${dados.lanceMinimoProximo} moedas**\n`);
                    idx++;
                });
            }

            layout.push("─────────────────────────");
            layout.push(`🎒 **Seu Cofre:** 🪙 ${jogador.moedas} moedas`);
            layout.push("✍️ O que deseja fazer?\n");
            layout.push("👉 `/leiloar [nome_do_item] [preco_inicial]` - Paga 500 moedas de taxa.");
            layout.push("👉 `/lance [ID] [valor]` - Dá um lance (Mínimo +200 moedas).");
        } else {
            layout.push("🔴 **Status:** FECHADO\n");
            layout.push("🔒 *O mercado de lances está trancado no momento.*\n");
            layout.push("📅 **Próximas Aberturas:**");
            layout.push("└─ 📅 **Sexta-feira:** Às 19:00h");
            layout.push("└─ 📅 **Sábado:** Às 18:00h\n");
            layout.push(`💰 *Taxa de anúncio:* 🪙 ${this.taxaAnuncio} moedas`);
            layout.push("🚫 *Itens proibidos:* Raças e Classes.");
        }

        return layout.join("\n");
    }

    leiloarItem(jogador, nomeItem, tipoItem, precoInicial) {
        const { aberto } = this.verificarHorarioLeilao();
        if (!aberto) return "❌ O leilão está fechado! Abre sextas às 19h e sábados às 18h.";
        if (this.itensLeiloados.size >= 10) return "❌ O mercado de leilões está lotado! (Máx 10 itens).";
        
        if (this.proibidos.includes(tipoItem.toLowerCase())) {
            return `❌ Erro: Itens do tipo ${tipoItem.toUpperCase()} não podem ser leiloados!`;
        }

        if (jogador.moedas < this.taxaAnuncio) {
            return `❌ Você precisa de ${this.taxaAnuncio} moedas para a taxa de anúncio.`;
        }

        jogador.moedas -= this.taxaAnuncio;
        const idLeilao = this.itensLeiloados.size + 1;

        this.itensLeiloados.set(idLeilao, {
            dono: jogador.nome,
            item: nomeItem,
            tipo: tipoItem,
            lanceAtual: precoInicial,
            ultimoLicitante: "Nenhum",
            lanceMinimoProximo: precoInicial + this.incrementoMinimo
        });

        return `✨ **Item Anunciado!** '${nomeItem}' está no leilão [ID: ${idLeilao}]. Taxa de 500G cobrada.`;
    }

    darLance(jogador, idLeilao, valorLance) {
        const { aberto } = this.verificarHorarioLeilao();
        if (!aberto) return "❌ O leilão já fechou!";
        if (!this.itensLeiloados.has(idLeilao)) return "❌ ID de leilão inválido.";

        const item = this.itensLeiloados.get(idLeilao);

        if (jogador.nome === item.dono) return "❌ Você não pode dar lance no seu próprio item!";
        if (valorLance < item.lanceMinimoProximo) return `❌ Lance mínimo necessário: ${item.lanceMinimoProximo} moedas.`;
        if (jogador.moedas < valorLance) return "❌ Você não tem moedas suficientes.";

        item.lanceAtual = valorLance;
        item.ultimoLicitante = jogador.nome;
        item.lanceMinimoProximo = valorLance + this.incrementoMinimo;

        return `⚔️ **LANCE ACEITO!** ${jogador.nome} deu um lance de 🪙 ${valorLance} no item '${item.item}'!`;
    }
}

module.exports = SistemaLeilao;
