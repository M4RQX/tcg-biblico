# TCG Bíblico — MVP Hot-Seat

Trading card game digital com tema bíblico, mecânica inspirada no Pokémon TCG, respeitando a tradição das Testemunhas de Jeová.

> **Estado: MVP.** Hot-seat local (2 jogadores no mesmo browser). 10 cartas, baralhos pré-construídos (Apóstolos vs Filisteus). Próximas iterações: IA, deck builder, multiplayer.

## Como correr

```bash
npm install
npm run dev      # http://localhost:5173
npm run test     # corre os testes do motor (Vitest)
npm run build    # build de produção
```

## Restrições teológicas

1. **Jeová NÃO é uma carta** jogável. Aparece nas costas das cartas em hebraico (יהוה) como tetragrama, conforme a Tradução do Novo Mundo.
2. **Jesus é uma carta única e especial** (mecânica de sacrifício/ressurreição). Reservado para iteração futura.
3. **Recurso chama-se "Energia"** — nunca "Fé"/"Espírito Santo" como recurso.
4. **Sem magia, ocultismo, ou apostasia** como facções.
5. **Adversários são povos históricos**: Egipto, Filisteus, Babilónia, Canaã, Roma. (MVP só inclui Filisteus.)

## Regras (resumo)

- **Baralho**: 60 cartas, mínimo 1 Básico, máximo 4 cópias.
- **Mão inicial**: 7 cartas (mulligan se sem Básico).
- **Talentos**: 6 cartas viradas. Levantas 1 quando destróis um Fiel adversário.
- **Energia**: anexa 1 por turno a um Fiel teu.
- **Turno**: Aurora (compras 1) → Acção (jogar cartas, promover, anexar energia) → Confronto (atacar termina o turno).
- **Promoção**: Fiel Básico em jogo há ≥ 1 turno pode ser promovido (Simão→Pedro, David Pastor→Rei). HP perdido e energia transferem-se.
- **Vitória**: 6 Talentos colhidos OU adversário sem Fiéis OU adversário sem baralho.

## Cartas do MVP

| Apóstolos                                | Filisteus              |
| ---------------------------------------- | ---------------------- |
| Simão, Pescador → Pedro, Impetuoso       | Golias de Gate         |
| David, Pastor de Belém → David, Rei      | Soldado Filisteu       |
| Oração Fervorosa (Bênção)                |                        |
| Tradução do Novo Mundo PT-PT (Estrutura) |                        |

Matchup temático: Reis fortes contra Filisteus (David vs Golias). A Funda do David Pastor faz 80 contra Gigantes; com fraqueza Filisteus→Reis (×2), Golias cai num ataque.

## Arquitetura

```
src/
├── engine/         # motor puro (sem React/DOM)
│   ├── types.ts
│   ├── engine.ts   # createInitialState + applyAction
│   └── __tests__/  # Vitest
├── data/           # cartas + baralhos
├── store/          # Zustand (UI wrapper)
└── ui/             # React (Card, Game, Menu)
```

O motor é puro — reutilizável num servidor Node para multiplayer futuro via WebSockets sem reescrever a lógica.

## Tom

Respeitoso da fé mas com personalidade. A carta *Tradução do Novo Mundo (Edição Portugal)* tem a piada do "tu/vós" vs "você/vocês" — o efeito é imune a cartas com "você" no texto. Esse é o tom certo: fiel, com humor afectuoso.
