// Importa os módulos necessários
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para processar JSON e formulários
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Define o diretório público para servir arquivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '../public')));

// Conexão com o banco de dados SQLite
const db = new sqlite3.Database(path.join(__dirname, '../database/database.sqlite'), (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
    }
});

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
            preco_total REAL NOT NULL
        )
    `, (err) => {
        if (err) console.error('Erro ao criar tabela historico:', err.message);
        else console.log('Tabela historico criada/verificada.');
    });
});

// Importa as rotas definidas no arquivo routes.js
const routes = require('./routes');
app.use('/api', routes);

// Inicia o servidor na porta definida
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

// Middleware para configurar CORS (permite requisições de outros domínios)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});