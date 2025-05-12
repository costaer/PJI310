# PJI310
Projeto integrador segundo semestre de 2025 - Univesp

# Criação de controle financeiro no sistema de Cesta Básica RB Alimentos.

## Integrantes
Elder Rodrigues da Costa <br>
Francisco Cleiton Magalhães Lopes Junior <br>
Gabriel Banhos Neto <br>
Gabriele Peruque Santos <br>
Karina Silva Nascimento <br>
Marcor Gonçalves Santos <br>
Tatiane de Sena Payao <br> <br>
**UNIVERSIDADE VIRTUAL DO ESTADO DE SÃO PAULO**

# Estoque de Cestas Básicas

Este projeto é uma aplicação web para controle de estoque de cestas básicas. Ele permite cadastrar produtos, montar cestas, visualizar o estoque e acessar o histórico de cestas montadas. A aplicação utiliza um banco de dados SQLite para gerenciar as informações.

## Estrutura do Projeto

```
estoque-cestas
├── database/
│   └── database.sqlite      # Banco de dados SQLite com todas as informações do sistema
├── public/
│   ├── index.html           # Página principal da aplicação (interface do usuário)
│   ├── style.css            # Estilos visuais da aplicação (layout, cores, tabelas, etc.)
│   ├── script.js            # Lógica JavaScript do lado do cliente (interação, requisições, etc.)
│   └── historico/           # Pasta onde ficam salvos os arquivos TXT gerados de cada cesta montada
│       └── *.txt            # Arquivos TXT detalhando cada cesta montada
├── server/
│   ├── server.js            # Inicialização do servidor Express e criação das tabelas do banco
│   └── routes.js            # Definição das rotas da API (cadastro, montagem, histórico, etc.)
├── package.json             # Configuração do projeto Node.js e dependências
├── package-lock.json        # Detalhes das dependências instaladas
└── README.md                # Documentação do projeto (este arquivo)
```

- **database/**: Armazena o banco de dados SQLite utilizado pela aplicação.
- **public/**: Contém todos os arquivos acessados pelo navegador (HTML, CSS, JS) e a pasta `historico` com os arquivos TXT das cestas.
- **server/**: Código do backend Node.js, responsável pela API, regras de negócio e manipulação do banco de dados.
- **package.json / package-lock.json**: Gerenciamento de dependências do Node.js.
- **README.md**: Documentação detalhada do projeto.

---

## Funcionalidades

- **Cadastrar Produtos**: Permite adicionar novos produtos ao estoque.
- **Montar Cestas**: Possibilita a montagem de cestas do tipo pequena ou grande, gerando um arquivo TXT com os detalhes.
- **Visualizar Estoque**: Exibe todos os produtos cadastrados, organizados e agrupados.
- **Acessar Histórico**: Mostra o histórico de cestas montadas, agrupadas por mês.

## Funcionalidades Detalhadas

### 1. Cadastro de Produtos

- Permite adicionar novos produtos ao estoque.
- Campos obrigatórios: nome do produto, quantidade, data de compra, data de validade e preço.
- O campo de preço aceita apenas valores maiores que zero e é formatado automaticamente.
- A data de compra não pode ser maior que o dia atual.
- O nome do produto é selecionado a partir de uma lista pré-definida para evitar erros de digitação.
- Após o cadastro, o estoque é atualizado automaticamente na tela.

### 2. Montagem de Cestas

- Permite montar cestas do tipo **Pequena** ou **Grande**.
- O sistema verifica se há todos os itens necessários no estoque para o tipo de cesta escolhido.
- Caso falte algum item, o sistema informa quais estão faltando (em ordem alfabética) tanto em um alerta quanto na tela.
- Se todos os itens estiverem disponíveis, a cesta é montada, os produtos são baixados do estoque e um arquivo TXT é gerado com os detalhes da cesta (itens, quantidades, preços e códigos).
- O nome do arquivo TXT inclui a data, o tipo da cesta e o valor total.
- O histórico e o estoque são atualizados automaticamente após a montagem.

### 3. Visualização do Estoque

- Exibe todos os produtos cadastrados em uma tabela organizada.
- Mostra: código, nome, quantidade, data de compra, data de validade e preço.
- Produtos próximos do vencimento (até 30 dias) são destacados em vermelho.
- A tabela é atualizada automaticamente após qualquer alteração no estoque (cadastro ou montagem de cesta).

### 4. Histórico de Cestas

- Exibe todas as cestas montadas, agrupadas por mês/ano.
- Para cada cesta, mostra: nome do arquivo TXT (com link para download), tipo da cesta, data de montagem e valor total.
- Permite baixar o arquivo TXT gerado no momento da montagem da cesta.
- O histórico é atualizado automaticamente após a montagem de uma nova cesta.

---

## Como instalar e rodar o projeto

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/seu-repositorio.git
   cd estoque-cestas
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor:**
   ```bash
   node server/server.js
   ```

4. **Acesse no navegador:**
   ```
   http://localhost:3000
   ```

---

Esses passos garantem que qualquer pessoa consiga rodar o sistema localmente usando apenas o Node.js e o npm.