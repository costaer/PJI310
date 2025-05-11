// =======================
// #region IMPORTAÇÕES E CONFIGURAÇÃO
// =======================

// Importa os módulos necessários
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// #endregion

// =======================
// #region MIDDLEWARES
// =======================

// Middleware para processar JSON e formulários
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Define o diretório público para servir arquivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '../public')));

// Middleware para configurar CORS (permite requisições de outros domínios)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// #endregion

// =======================
// #region BANCO DE DADOS: CRIAÇÃO E CONEXÃO
// =======================

// Conexão com o banco de dados SQLite
const db = new sqlite3.Database(
    path.join(__dirname, '../database/database.sqlite'),
    (err) => {
        if (err) {
            console.error('Erro ao conectar ao banco de dados:', err.message);
        } else {
            console.log('Conectado ao banco de dados SQLite.');
        }
    }
);

// Criação das tabelas no banco de dados, caso não existam
db.serialize(() => {
    // Tabela de produtos
    db.run(`
        CREATE TABLE IF NOT EXISTS produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            quantidade INTEGER NOT NULL,
            data_compra TEXT NOT NULL,
            data_validade TEXT NOT NULL,
            preco REAL NOT NULL,
            codigo TEXT NOT NULL
        )
    `, (err) => {
        if (err) console.error('Erro ao criar tabela produtos:', err.message);
        else console.log('Tabela produtos criada/verificada.');
    });

    // Tabela de histórico de cestas
    db.run(`
        CREATE TABLE IF NOT EXISTS historico (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_arquivo TEXT NOT NULL,
            data_montagem TEXT NOT NULL,
            preco_total REAL NOT NULL,
            tipo TEXT NOT NULL
        )
    `, (err) => {
        if (err) console.error('Erro ao criar tabela historico:', err.message);
        else console.log('Tabela historico criada/verificada.');
    });

    // Tabela de itens das cestas
    db.run(`
        CREATE TABLE IF NOT EXISTS itens_cesta (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_cesta INTEGER NOT NULL,
            nome TEXT NOT NULL,
            quantidade INTEGER NOT NULL,
            preco_unitario REAL NOT NULL,
            codigo_produto TEXT NOT NULL,
            FOREIGN KEY (id_cesta) REFERENCES historico(id)
        )
    `, (err) => {
        if (err) console.error('Erro ao criar tabela itens_cesta:', err.message);
        else console.log('Tabela itens_cesta criada/verificada.');
    });
});

// #endregion

// =======================
// #region ROTAS DA APLICAÇÃO
// =======================

// Importa as rotas definidas no arquivo routes.js
const routes = require('./routes');
app.use('/api', routes);

// #endregion

// =======================
// #region INICIALIZAÇÃO DO SERVIDOR
// =======================

// Inicia o servidor na porta definida
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

// #endregion