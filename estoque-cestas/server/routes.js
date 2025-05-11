const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Conecta ao banco de dados SQLite
const db = new sqlite3.Database(path.join(__dirname, '../database/database.sqlite'), (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
    }
});

// Função utilitária para formatar preços no formato "R$ x,xx"
const formatarPreco = (preco) => parseFloat(preco).toFixed(2).replace('.', ',');

// Rota para cadastrar produtos
// Recebe os dados do produto via POST e insere no banco de dados
router.post('/produtos', (req, res) => {
    const { nome, quantidade, dataCompra, dataValidade, preco } = req.body;

    // Converte o preço para número e valida
    const precoNumerico = parseFloat(preco);
    if (isNaN(precoNumerico)) {
        console.error('Erro: Preço inválido.');
        return res.status(400).json({ error: 'Preço inválido.' });
    }

    // Gera um código único para o produto com base nos dados fornecidos
    const inicial = nome.charAt(0).toUpperCase();
    const validadeFormatada = dataValidade.slice(8, 10) + dataValidade.slice(5, 7);
    const compraFormatada = dataCompra.slice(8, 10) + dataCompra.slice(5, 7);
    const precoFormatado = formatarPreco(precoNumerico);
    const codigo = `${inicial}v${validadeFormatada}c${compraFormatada}vr${precoFormatado}`;

    // SQL para inserir o produto no banco de dados
    const sql = `
        INSERT INTO produtos (nome, quantidade, data_compra, data_validade, preco, codigo)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    // Executa a inserção no banco de dados
    db.run(sql, [nome, quantidade, dataCompra, dataValidade, precoNumerico, codigo], function(err) {
        if (err) {
            console.error('Erro ao salvar no banco de dados:', err.message);
            return res.status(500).json({ error: err.message });
        }

        // Retorna uma mensagem de sucesso com o ID do produto inserido
        res.status(201).json({ message: 'Produto cadastrado com sucesso!', id: this.lastID });
    });
});

// Rota para montar cestas
// Recebe o tipo de cesta via POST, verifica o estoque e gera um arquivo com os detalhes
router.post('/cestas', (req, res) => {
    const { tipo } = req.body;

    // Valida o tipo de cesta
    if (!tipo || (tipo !== 'pequena' && tipo !== 'grande')) {
        return res.status(400).json({ message: 'Tipo de cesta inválido!' });
    }

    // Define os itens necessários para cada tipo de cesta
    const itensNecessarios = tipo === 'pequena'
        ? ['Arroz', 'Feijão', 'Óleo', 'Açúcar', 'Café moído', 'Sal', 'Extrato de tomate', 'Bolacha recheada', 'Macarrão Espaguete', 'Farinha de trigo', 'Farinha temperada', 'Goiabada', 'Suco em pó', 'Sardinha', 'Creme dental', 'Papel higiênico', 'Sabonete', 'Milharina', 'Tempero']
        : ['Arroz', 'Feijão', 'Óleo', 'Açúcar', 'Café moído', 'Sal', 'Extrato de tomate', 'Vinagre', 'Bolacha recheada', 'Bolacha salgada', 'Macarrão Espaguete', 'Macarrão parafuso', 'Macarrão instantâneo', 'Farinha de trigo', 'Farinha temperada', 'Achocolatado em pó', 'Leite', 'Goiabada', 'Suco em pó', 'Mistura para bolo', 'Tempero', 'Sardinha', 'Creme dental', 'Papel higiênico', 'Sabonete'];

    // SQL para buscar os produtos necessários no estoque
    const sql = `
        SELECT id, nome, quantidade, data_validade, preco, codigo
        FROM produtos
        WHERE nome IN (${itensNecessarios.map(() => '?').join(', ')})
        ORDER BY julianday(data_validade) ASC
    `;

    db.all(sql, itensNecessarios, (err, rows) => {
        if (err) {
            console.error('Erro ao verificar estoque:', err.message);
            return res.status(500).json({ message: 'Erro ao verificar estoque.' });
        }

        const produtosSelecionados = [];
        const itensFaltantes = [];
        let precoTotal = 0;

        // Verifica se todos os itens necessários estão disponíveis no estoque
        itensNecessarios.forEach(item => {
            let quantidadeRestante = 1; // Precisamos de 1 unidade de cada item
            const produtos = rows.filter(produto => produto.nome === item);

            if (produtos.length === 0 || produtos.reduce((acc, p) => acc + p.quantidade, 0) < quantidadeRestante) {
                itensFaltantes.push(item); // Adiciona o item à lista de faltantes
            } else {
                produtos.forEach(produto => {
                    if (quantidadeRestante > 0) {
                        const usado = Math.min(produto.quantidade, quantidadeRestante);
                        produtosSelecionados.push({ ...produto, usado });
                        quantidadeRestante -= usado;
                        precoTotal += usado * produto.preco;
                    }
                });
            }
        });

        if (itensFaltantes.length > 0) {
            return res.status(400).json({
                message: 'Não é possível montar a cesta. Alguns itens estão faltando.',
                missingItems: itensFaltantes
            });
        }

        // Atualiza o estoque no banco de dados
        const updatePromises = produtosSelecionados.map(produto => {
            return new Promise((resolve, reject) => {
                const novaQuantidade = produto.quantidade - produto.usado;
                db.run(
                    `UPDATE produtos SET quantidade = ? WHERE id = ?`,
                    [novaQuantidade, produto.id],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        });

        Promise.all(updatePromises)
            .then(() => {
                res.status(200).json({
                    message: `Cesta do tipo "${tipo}" montada com sucesso!`,
                    totalPrice: precoTotal.toFixed(2),
                    items: produtosSelecionados
                });
            })
            .catch(err => {
                console.error('Erro ao atualizar estoque:', err.message);
                res.status(500).json({ message: 'Erro ao atualizar estoque.' });
            });
    });
});

// Rota para visualizar o estoque
// Retorna todos os produtos cadastrados no banco de dados
router.get('/estoque', (req, res) => {
    const sql = `
        SELECT id, nome, quantidade, data_compra, data_validade, preco, codigo,
        (julianday(data_validade) - julianday('now')) as dias_restantes
        FROM produtos
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar estoque:', err.message);
            return res.status(500).json({ error: err.message });
        }

        // Filtra os produtos que estão a 30 dias ou menos de vencer
        const produtosProximosValidade = rows.filter(produto => produto.dias_restantes <= 30);

        // Filtra os produtos que têm mais de 30 dias para vencer
        const produtosRestantes = rows.filter(produto => produto.dias_restantes > 30);

        // Ordena os produtos restantes em ordem alfabética pelo nome
        produtosRestantes.sort((a, b) => a.nome.localeCompare(b.nome));

        // Combina os produtos próximos do vencimento com os restantes
        const estoqueOrdenado = [...produtosProximosValidade, ...produtosRestantes];

        // Formata os preços e adiciona a propriedade "expirando" para os produtos próximos do vencimento
        const estoqueFormatado = estoqueOrdenado.map(produto => ({
            ...produto,
            preco: parseFloat(produto.preco).toFixed(2).replace('.', ','), // Formata o preço para R$ x,xx
            expirando: produto.dias_restantes <= 30 // Marca os itens próximos do vencimento
        }));

        res.status(200).json(estoqueFormatado);
    });
});

// Rota para acessar o histórico de cestas montadas
// Retorna o histórico de cestas salvas no banco de dados
router.get('/historico', (req, res) => {
    const sql = 'SELECT * FROM historico ORDER BY data_montagem DESC';

    // Executa a consulta no banco de dados
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar histórico:', err.message);
            return res.status(500).json({ error: err.message });
        }

        res.status(200).json(rows);
    });
});

module.exports = router;