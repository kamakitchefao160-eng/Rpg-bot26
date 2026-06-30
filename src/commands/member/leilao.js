# -*- coding: utf-8 -*-
import datetime

class ItemCofre:
    def __init__(self, nome, tipo):
        self.nome = nome
        self.tipo = tipo  # 'chapeu', 'acessorio', 'moldura', 'montaria', 'raca', 'classe'

class Jogador:
    def __init__(self, nome, moedas_iniciais=0):
        self.nome = nome
        self.moedas = moedas_iniciais
        self.cofre = {}  # nome_item: ItemCofre

    def adicionar_ao_cofre(self, item):
        self.cofre[item.nome.lower()] = item

    def remover_do_cofre(self, nome_item):
        return self.cofre.pop(nome_item.lower(), None)

class SistemaLeilao:
    def __init__(self):
        self.itens_leiloados = {}  # ID: dados_leilao
        self.taxa_anuncio = 500
        self.incremento_minimo = 200
        self.proibidos = ["raca", "classes", "raças", "classe"]

    def verificar_horario_leilao(self, data_hora_teste=None):
        """
        Verifica se o leilão está aberto.
        Sexta-feira a partir das 19h.
        Sábado a partir das 18h.
        Permite passar data_hora_teste para simulações.
        """
        agora = data_hora_teste if data_hora_teste else datetime.datetime.now()
        dia_da_semana = agora.weekday()  # 4 = Sexta, 5 = Sábado
        hora_atual = agora.hour

        if dia_da_semana == 4 and hora_atual >= 19:
            return True, "Aberto (Sexta-feira)"
        elif dia_da_semana == 5 and hora_atual >= 18:
            return True, "Aberto (Sábado)"
        
        return False, "Fechado"

    def menu_leilao(self, jogador, data_hora_teste=None):
        """Gera a interface visual do comando /leilão"""
        aberto, status_str = self.verificar_horario_leilao(data_hora_teste)
        
        layout = []
        layout.append("⚖️ ═══════════════════════ ⚖️")
        layout.append("🏛️  **CÂMARA DE LEILÕES** 🏛️")
        layout.append("⚖️ ═══════════════════════ ⚖️")
        
        if aberto:
            layout.append(f"🟢 **Status:** ABERTO // 📦 **Slots Ocupados:** [ {len(self.itens_leiloados)} / 10 ]\n")
            if not self.itens_leiloados:
                layout.append("*Nenhum item sendo leiloado no momento.*\n")
            else:
                for idx, (id_item, dados) in enumerate(self.itens_leiloados.items(), 1):
                    layout.append(f"[{idx:02d}] 👑 **{dados['item']}** ({dados['tipo'].capitalize()})")
                    layout.append(f"├─ 👤 Vendedor: `{dados['dono']}`")
                    layout.append(f"├─ 💰 Lance Atual: 🪙 {dados['lance_atual']} moedas")
                    layout.append(f"├─ 👤 Último Licitante: `{dados['ultimo_licitante']}`")
                    layout.append(f"└─ ⚡ Próximo Lance Mínimo: **{dados['lance_minimo_proximo']} moedas**\n")
            
            layout.append("─────────────────────────")
            layout.append(f"🎒 **Seu Cofre:** 🪙 {jogador.moedas} moedas")
            layout.append("✍️ O que deseja fazer?\n")
            layout.append("👉 `/leiloar [nome_do_item] [preco_inicial]` - Paga 500 moedas de taxa (Retira do seu cofre).")
            layout.append("👉 `/lance [ID] [valor]` - Dá um lance (Mínimo +200 moedas do lance atual).")
        else:
            layout.append("🔴 **Status:** FECHADO\n")
            layout.append("🔒 *O mercado de lances está trancado no momento.*\n")
            layout.append("📅 **Próximas Aberturas:**")
            layout.append("└─ 📅 **Sexta-feira:** Às 19:00h")
            layout.append("└─ 📅 **Sábado:** Às 18:00h\n")
            layout.append(f"💰 *Taxa de anúncio:* 🪙 {self.taxa_anuncio} moedas")
            layout.append("🚫 *Itens proibidos:* Raças e Classes (Apenas Chapéus, Acessórios, Molduras e Montarias).")
            
        return "\n".join(layout)

    def leiloar_item(self, jogador, nome_item, preco_inicial, data_hora_teste=None):
        """Executa o comando /leiloar"""
        aberto, _ = self.verificar_horario_leilao(data_hora_teste)
        if not aberto:
            return "❌ O leilão está fechado! Abre sextas às 19h e sábados às 18h."

        if len(self.itens_leiloados) >= 10:
            return "❌ O mercado de leilões está lotado! (Máximo 10 itens simultâneos)."

        # Verificar se o item existe no cofre do jogador
        item_chave = nome_item.lower()
        if item_chave not in jogador.cofre:
            return f"❌ Você não possui o item '{nome_item}' no seu cofre para leiloar."

        item_objeto = jogador.cofre[item_chave]

        # Restrição de Raças e Classes
        if item_objeto.tipo in self.proibidos:
            return f"❌ Erro: O item '{item_objeto.nome}' é do tipo {item_objeto.tipo.upper()}. Raças e Classes não podem ser leiloadas!"

        # Verificar moedas para a taxa
        if jogador.moedas < self.taxa_anuncio:
            return f"❌ Você precisa de {self.taxa_anuncio} moedas para pagar a taxa de anúncio."

        # Processar taxas e movimentação de itens
        jogador.moedas -= self.taxa_anuncio
        jogador.remover_do_cofre(nome_item)

        id_leilao = len(self.itens_leiloados) + 1
        self.itens_leiloados[id_leilao] = {
            "dono": jogador.nome,
            "item": item_objeto.nome,
            "tipo": item_objeto.tipo,
            "lance_atual": preco_inicial,
            "ultimo_licitante": "Nenhum",
            "lance_minimo_proximo": preco_inicial + self.incremento_minimo
        }

        return f"✨ **Item Anunciado!** '{item_objeto.nome}' foi removido do seu cofre e colocado no leilão [ID: {id_leilao}]. Taxa de 500G cobrada."

    def dar_lance(self, jogador, id_leilao, valor_lance, data_hora_teste=None):
        """Executa o comando /lance"""
        aberto, _ = self.verificar_horario_leilao(data_hora_teste)
        if not aberto:
            return "❌ O leilão já fechou!"

        if id_leilao not in self.itens_leiloados:
            return "❌ ID de leilão inválido ou item já vendido."

        item_leiloado = self.itens_leiloados[id_leilao]

        if jogador.nome == item_leiloado["dono"]:
            return "❌ Você não pode dar lance no seu próprio item!"

        if valor_lance < item_leiloado["lance_minimo_proximo"]:
            return f"❌ Lance muito baixo! O próximo lance mínimo para este item é {item_leiloado['lance_minimo_proximo']} moedas."

        if jogador.moedas < valor_lance:
            return f"❌ Moedas insuficientes! Você tentou apostar {valor_lance} moedas, mas só tem {jogador.moedas}."

        # Se tudo estiver correto, atualiza o lance
        item_leiloado["lance_atual"] = valor_lance
        item_leiloado["ultimo_licitante"] = jogador.nome
        item_leiloado["lance_minimo_proximo"] = valor_lance + self.incremento_minimo

        return f"⚔️ **LANCE ACEITO!** {jogador.nome} deu um lance de 🪙 {valor_lance} no item '{item_leiloado['item']}'!"

# --- EXEMPLO DE USO ---
if __name__ == "__main__":
    print("Iniciando simulação do Sistema de Leilão...")
    
    # Criando o sistema e jogadores
    mercado = SistemaLeilao()
    p1 = Jogador("GuildMaster_X", moedas_iniciais=2000)
    p2 = Jogador("Player_Zoro", moedas_iniciais=15000)
    
    # Adicionando itens ao cofre de teste
    p1.adicionar_ao_cofre(ItemCofre("Amuleto de Mana Infinito", "acessorio"))
    p1.adicionar_ao_cofre(ItemCofre("Raca Elfo Sangrento", "raca"))
    
    # Simulando uma Sexta-feira às 20h00 (Leilão Aberto)
    data_aberto = datetime.datetime(2026, 7, 10, 20, 0)
    
    print("\n--- MENU INICIAL (ABERTO) ---")
    print(mercado.menu_leilao(p1, data_hora_teste=data_aberto))
    
    print("\n--- TENTANDO LEILOAR ITEM PROIBIDO (RAÇA) ---")
    print(mercado.leiloar_item(p1, "Raca Elfo Sangrento", 1000, data_hora_teste=data_aberto))
    
    print("\n--- ANUNCIANDO UM ACESSÓRIO VÁLIDO ---")
    print(mercado.leiloar_item(p1, "Amuleto de Mana Infinito", 5000, data_hora_teste=data_aberto))
    
    print("\n--- MENU APÓS ANÚNCIO ---")
    print(mercado.menu_leilao(p2, data_hora_teste=data_aberto))
    
    print("\n--- RECEBENDO UM LANCE VÁLIDO ---")
    print(mercado.dar_lance(p2, 1, 6000, data_hora_teste=data_aberto))
    
    print("\n--- MENU APÓS O LANCE ---")
    print(mercado.menu_leilao(p2, data_hora_teste=data_aberto))
