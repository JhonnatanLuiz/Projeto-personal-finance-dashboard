# Changelog

Todas as mudanças notáveis deste projeto serão documentadas aqui.

O formato segue (inspirado em) Keep a Changelog e Semantic Versioning (SemVer).

## [1.0.0] - 2025-08-22
### Adicionado
- Estrutura inicial HTML/CSS/JS
- CRUD de transações com modal separado de edição
- Persistência via LocalStorage
- Gráfico de despesas por categoria (Chart.js)
- Gráfico de evolução mensal (receitas, despesas, saldo)
- Filtros por mês e ano
- Exportação JSON e CSV
- Importação de JSON com validação básica
- Undo de remoção com Toast
- Toasts de feedback
- Tema claro/escuro persistente
- Paletas de cor e múltiplos tipos de gráfico (despesas e tendência)
- Download de imagens dos gráficos (PNG)
- Responsividade (collapse de filtros, ajustes mobile)

### Alterado
- Refatoração para unificar funções de atualização de UI
- Melhorias de acessibilidade

### Correções
- Erros de edição e duplicações de funções durante refatorações
- Aplicação imediata de paletas sem recarregar
- Tema escuro não alternava corretamente

### Segurança
- Escape básico de HTML em campos de usuário

---
## Próximas versões (planejado)
- Campo de busca
- Exportar PDF
- Subtotais por categoria
- Testes automatizados
