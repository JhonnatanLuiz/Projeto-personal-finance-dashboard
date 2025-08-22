# Personal Finance Dashboard (Painel de Finanças Pessoais)

Aplicação web single-page (HTML/CSS/JS + Bootstrap + Chart.js) para gestão simples de finanças pessoais totalmente client‑side (LocalStorage). Permite registrar receitas e despesas, visualizar gráficos dinâmicos, exportar/importar dados e personalizar visualizações.

## 📌 Principais Recursos
- CRUD de transações (adição, edição em modal separado, remoção com desfazer/undo)
- Persistência em `localStorage`
- Campos: descrição, valor, tipo (receita/despesa), data, categoria
- Filtros por mês e ano (com colapso em telas pequenas)
- Resumo: saldo, total de receitas, total de despesas
- Gráfico de Despesas por Categoria (múltiplos tipos: rosca, pizza, barras, polar, radar + paletas)
- Gráfico de Evolução Mensal (linhas / barras / barras empilhadas / área empilhada) incluindo saldo
- Mudança dinâmica de tipos de gráfico e paletas (sem recarregar a página)
- Paletas: padrão, pastel, vibrante, monocromática
- Tema claro/escuro com persistência
- Exportação: JSON e CSV (com BOM para Excel)
- Importação segura de JSON (sanitização básica)
- Download de imagens (PNG) dos gráficos
- Undo de remoção com Toast (timeout configurado)
- Toasts contextuais (sucesso, erro, aviso)
- Responsividade aprimorada (mobile-first, collapse de filtros, ajuste automático de tabela)
- Segurança básica: escape de conteúdo de usuário (contra XSS simples)

## 🛠 Stack / Tecnologias
| Componente | Uso |
|------------|-----|
| HTML5 / CSS3 | Estrutura e estilo base |
| Bootstrap 5 | Layout responsivo, modais, toasts |
| Chart.js | Gráficos dinâmicos |
| JavaScript Vanilla | Lógica de aplicação |
| LocalStorage | Persistência offline |

## 📂 Estrutura Simplificada
```
├── dashboard.html          # Página principal
├── dashboard_style.css     # Estilos customizados (tema & responsividade)
├── dashboard_script.js     # Lógica (CRUD, gráficos, filtros, toasts)
├── README.md               # Documentação principal
├── LICENSE                 # Licença (MIT)
└── .gitignore              # Arquivos ignorados pelo Git
```

## 🚀 Como Usar (Local)
1. Clone ou baixe o repositório.
2. Abra `dashboard.html` diretamente no navegador (duplo clique) ou sirva com um servidor estático.
3. Comece a registrar transações.

### Servir opcionalmente (PowerShell)
```powershell
# Python simples
python -m http.server 8080
# Depois abra http://localhost:8080/dashboard.html
```

## 🔁 Fluxo de Uso
1. Clique em "Nova Transação" para adicionar.
2. Use os filtros (Mês/Ano) se quiser restringir visão.
3. Altere tipos/paletas dos gráficos via selects no cabeçalho dos cards.
4. Baixe JSON/CSV para backup. Use Importar para restaurar.
5. Troque para modo escuro no botão da navbar.
6. Remova lançamentos com opção de desfazer (toast).

## 🧩 Desenho de Código (Resumo)
- `transactions`: array de objetos `{ id, description, amount, type, category, date }`
- Funções centrais: `addTransaction`, `renderTransactionList`, `updateSummary`, `updateChart`, `updateMonthlyTrendChart`, `scheduleRemoveTransaction`, `showToast`
- Filtros: objeto `activeFilter { month, year }`
- Undo: `pendingRemovals` (Map) + timeout

## ⚠️ Limites Atuais / Considerações
- Sem autenticação (dados locais do navegador)
- Sem validação avançada de formato de arquivo além do JSON básico
- Não há multi-usuário / sincronização cloud
- Sem testes automatizados ainda

## 🗺 Roadmap Sugerido
| Prioridade | Item | Status |
|------------|------|--------|
| Alta | Campo de busca por descrição | Pendente |
| Média | Agrupar por categoria com subtotal expandível | Pendente |
| Média | Exportar PDF do dashboard | Pendente |
| Média | Testes unitários (Jest / Vitest + jsdom) | Pendente |
| Baixa | Internacionalização (i18n pt-BR/en-US) | Pendente |
| Baixa | PWA (instalável/offline com cache explicit) | Pendente |

## 🧪 Ideias de Testes Futuro
- Adição de transação válida / inválida
- Undo dentro do prazo vs após expirar
- Importação de JSON malformado
- Alteração de tipo de gráfico refletindo instanciação/destroy correta

## 🕶 Acessibilidade (A11y) Implementada
- Labels associados a inputs
- Botões com `aria-label` onde necessário
- Cores contrastadas no tema escuro
- Uso de semantic table para transações

## 🔐 Segurança Básica
- `escapeHTML` em campos exibidos
- Bloqueio de valores <= 0
- Sanitização simples na importação

## 💾 Estrutura de Dados Exemplo
```json
{
  "id": 1724329072000,
  "description": "Salário",
  "amount": 4500.00,
  "type": "income",
  "category": "Salário",
  "date": "2025-08-20T12:34:56.000Z"
}
```

## 📤 Exportação & Importação
| Ação | Formato | Notas |
|------|---------|-------|
| Exportar JSON | `.json` | Indentado (2 espaços) |
| Exportar CSV | `.csv` | Delimitador `;` + BOM UTF-8 |
| Importar JSON | `.json` | Substitui a lista atual após validação |

## 🎨 Paletas
- Padrão (cores fortes variadas)
- Pastel (tons suaves)
- Vibrante (altíssimo contraste)
- Monocromática (variações de um tom escuro)

## 🌙 Tema Escuro
Ativado via botão (ícone lua/sol) – persistido em `localStorage`.

## 🧾 Licença
Distribuído sob licença MIT – ver `LICENSE`.

## 🤝 Contribuindo
1. Faça um fork
2. Crie uma branch: `feat/minha-feature`
3. Commit: `git commit -m "feat: adiciona ..."`
4. Push: `git push origin feat/minha-feature`
5. Abra um Pull Request

### Convenção de Commits (Sugestão)
`feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`.

## 🗃 Git / Versionamento
Sugestão de primeira tag: `v1.0.0`.

## 🖼 Screenshots (Sugestão)
Crie uma pasta `docs/` e adicione capturas:
```
docs/
  dashboard-light.png
  dashboard-dark.png
```
Referencie-as no README.

## 🔄 Changelog (iniciar)
Veja `CHANGELOG.md` para histórico formal.

---
Se este projeto ajudou, considere dar uma ⭐ no repositório.
