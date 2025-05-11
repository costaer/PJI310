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
├── public
│   ├── index.html         # Estrutura HTML da aplicação
│   ├── style.css          # Estilos CSS da aplicação
│   └── script.js          # Lógica JavaScript da aplicação
├── database
│   └── database.sqlite    # Banco de dados SQLite
├── server
│   ├── server.js          # Ponto de entrada do servidor
│   ├── routes.js          # Definição das rotas da aplicação
│   └── database.js        # Configuração e conexão com o banco de dados
├── logs
│   └── app.log            # Arquivo de log para registrar eventos do sistema
├── tests
│   ├── test_routes.js     # Testes para as rotas da aplicação
│   └── test_database.js   # Testes para o banco de dados
├── package.json           # Configuração do npm
├── package-lock.json      # Detalhes das dependências instaladas
└── README.md              # Documentação do projeto
```

## Funcionalidades

- **Cadastrar Produtos**: Permite adicionar novos produtos ao estoque.
- **Montar Cestas**: Possibilita a montagem de cestas do tipo pequena ou grande, gerando um arquivo TXT com os detalhes.
- **Visualizar Estoque**: Exibe todos os produtos cadastrados, organizados e agrupados.
- **Acessar Histórico**: Mostra o histórico de cestas montadas, agrupadas por mês.

## Instalação

1. Clone o repositório:
   ```
   git clone <URL do repositório>
   cd estoque-cestas
   ```

2. Instale as dependências:
   ```
   npm install
   ```

## Execução

Para iniciar o servidor, execute o seguinte comando:
```
npm start
```

A aplicação estará disponível em `http://localhost:3000`.

## Dependências

- **express**: Para criar o servidor.
- **sqlite3**: Para interagir com o banco de dados SQLite.

## Contribuição

Sinta-se à vontade para contribuir com melhorias ou correções. Para isso, faça um fork do repositório e envie um pull request.