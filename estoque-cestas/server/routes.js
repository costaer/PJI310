// =======================
// #region IMPORTAÇÕES E CONFIGURAÇÃO
// =======================

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

// #endregion

// =======================
// #region CADASTRO DE PRODUTO
// =======================

/**
 * Rota para cadastrar produtos.
 * Recebe os dados do produto via POST e insere no banco de dados.
 */
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

// #endregion

// =======================
// #region MONTAR CESTA
// =======================

/**
 * Rota para montar cestas.
 * Recebe o tipo de cesta via POST, verifica o estoque, atualiza o banco,
 * salva o histórico e os itens da cesta, e gera um arquivo TXT.
 */
router.post('/cestas', (req, res) => {
    const { tipo } = req.body;
    console.log(`Recebido pedido para montar cesta do tipo: ${tipo}`);

    if (!tipo || (tipo !== 'pequena' && tipo !== 'grande')) {
        return res.status(400).json({ message: 'Tipo de cesta inválido!' });
    }

    // Define os itens necessários para cada tipo de cesta
    const itensNecessarios = tipo === 'pequena'
        ? ['Arroz', 'Feijão', 'Óleo', 'Açúcar', 'Café moído', 'Sal', 'Extrato de tomate', 'Bolacha recheada', 'Macarrão Espaguete', 'Farinha de trigo', 'Farinha temperada', 'Goiabada', 'Suco em pó', 'Sardinha', 'Creme dental', 'Papel higiênico', 'Sabonete', 'Milharina', 'Tempero']
        : ['Arroz', 'Feijão', 'Óleo', 'Açúcar', 'Café moído', 'Sal', 'Extrato de tomate', 'Vinagre', 'Bolacha recheada', 'Bolacha salgada', 'Macarrão Espaguete', 'Macarrão parafuso', 'Macarrão instantâneo', 'Farinha de trigo', 'Farinha temperada', 'Achocolatado em pó', 'Leite', 'Goiabada', 'Suco em pó', 'Mistura para bolo', 'Tempero', 'Sardinha', 'Creme dental', 'Papel higiênico', 'Sabonete'];

    // Busca os produtos necessários no estoque, ordenando pela validade
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

        // Seleciona os produtos necessários e verifica se há quantidade suficiente
        itensNecessarios.forEach(item => {
            let quantidadeRestante = 1;
            const produtos = rows.filter(produto => produto.nome === item);

            if (produtos.length === 0 || produtos.reduce((acc, p) => acc + p.quantidade, 0) < quantidadeRestante) {
                itensFaltantes.push(item);
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

        // Se faltar algum item, retorna erro
        if (itensFaltantes.length > 0) {
            itensFaltantes.sort((a, b) => a.localeCompare(b)); // Ordena alfabeticamente
            return res.status(400).json({
                message: 'Não é possível montar a cesta. Alguns itens estão faltando.',
                missingItems: itensFaltantes
            });
        }

        // Atualiza o estoque removendo ou decrementando os produtos usados
        const updatePromises = produtosSelecionados.map(produto => {
            return new Promise((resolve, reject) => {
                const novaQuantidade = produto.quantidade - produto.usado;
                if (novaQuantidade === 0) {
                    db.run(`DELETE FROM produtos WHERE id = ?`, [produto.id], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                } else {
                    db.run(
                        `UPDATE produtos SET quantidade = ? WHERE id = ?`,
                        [novaQuantidade, produto.id],
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                }
            });
        });

        Promise.all(updatePromises)
            .then(() => {
                const agora = new Date();
                // Ajuste para GMT-3 (Brasília)
                const horaBrasilia = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000 - 3 * 60 * 60000);
                const pad = n => n.toString().padStart(2, '0');
                const dataHoraLocal = `${horaBrasilia.getFullYear()}-${pad(horaBrasilia.getMonth() + 1)}-${pad(horaBrasilia.getDate())}_${pad(horaBrasilia.getHours())}-${pad(horaBrasilia.getMinutes())}-${pad(horaBrasilia.getSeconds())}`;
                const tipoCesta = tipo.charAt(0).toUpperCase() + tipo.slice(1); // Ex: Pequena ou Grande
                const nomeArquivo = `${dataHoraLocal}_${tipoCesta}_R$${precoTotal.toFixed(2).replace('.', ',')}.txt`;
                const caminhoArquivo = path.join(__dirname, `../public/historico/${nomeArquivo}`);

                // Garante que a pasta historico existe
                const historicoDir = path.join(__dirname, '../public/historico');
                if (!fs.existsSync(historicoDir)) {
                    fs.mkdirSync(historicoDir, { recursive: true });
                }

                // Cabeçalho da tabela
                let conteudoArquivo = 
                    'Nome'.padEnd(25) +
                    'Qtd'.padStart(5) +
                    'Preço Unit.'.padStart(15) +
                    'Código'.padStart(25) + '\n' +
                    '-'.repeat(70) + '\n';

                // Linhas dos produtos
                produtosSelecionados.forEach(produto => {
                    const precoNum = Number(produto.preco);
                    conteudoArquivo +=
                        produto.nome.padEnd(25) +
                        String(produto.usado).padStart(5) +
                        ('R$ ' + precoNum.toFixed(2)).padStart(15) +
                        produto.codigo.padStart(25) + '\n';
                });

                conteudoArquivo += '\n' + '-'.repeat(70) + '\n';
                conteudoArquivo += `Valor Total: R$ ${precoTotal.toFixed(2)}`;

                fs.writeFileSync(caminhoArquivo, conteudoArquivo);

                // Garante que a coluna 'tipo' existe na tabela historico
                db.run(`ALTER TABLE historico ADD COLUMN tipo TEXT`, [], (err) => {
                    // Se der erro porque já existe, ignora
                    // Se não der erro, a coluna foi criada
                    // Agora pode inserir normalmente no historico
                    db.run(
                        `INSERT INTO historico (nome_arquivo, data_montagem, preco_total, tipo) VALUES (?, ?, ?, ?)`,
                        [nomeArquivo, new Date().toISOString(), precoTotal, tipoCesta],
                        function(err) {
                            if (err) {
                                console.error('Erro ao salvar histórico:', err.message);
                                return res.status(500).json({ message: 'Erro ao salvar histórico.' });
                            }

                            const idCesta = this.lastID;
                            // Insere os itens da cesta na tabela itens_cesta
                            const insertItem = db.prepare(`
                                INSERT INTO itens_cesta (id_cesta, nome, quantidade, preco_unitario, codigo_produto)
                                VALUES (?, ?, ?, ?, ?)
                            `);
                            produtosSelecionados.forEach(produto => {
                                insertItem.run(idCesta, produto.nome, produto.usado, produto.preco, produto.codigo);
                            });
                            insertItem.finalize();

                            res.status(200).json({
                                message: `Cesta do tipo "${tipo}" montada com sucesso!`,
                                totalPrice: precoTotal.toFixed(2),
                                id_cesta: idCesta,
                                file: nomeArquivo
                            });
                        }
                    );
                });
            })
            .catch(err => {
                console.error('Erro ao atualizar estoque:', err.message);
                res.status(500).json({ message: 'Erro ao atualizar estoque.' });
            });
    });
});

/**
 * Rota para consultar os itens de uma cesta pelo ID.
 * Retorna todos os itens que compõem uma cesta específica.
 */
router.get('/cestas/:id/itens', (req, res) => {
    const idCesta = req.params.id;
    db.all(
        `SELECT nome, quantidade, preco_unitario, codigo_produto FROM itens_cesta WHERE id_cesta = ?`,
        [idCesta],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao buscar itens da cesta.' });
            }
            res.json(rows);
        }
    );
});

// #endregion

// =======================
// #region VISUALIZAR ESTOQUE
// =======================

/**
 * Rota para visualizar o estoque.
 * Retorna todos os produtos cadastrados no banco de dados, destacando os próximos do vencimento.
 */
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

// #endregion

// =======================
// #region HISTÓRICO DE CESTAS
// =======================

/**
 * Rota para acessar o histórico de cestas montadas.
 * Retorna o histórico de cestas salvas no banco de dados, agrupadas por mês/ano.
 */
router.get('/historico', (req, res) => {
    const sql = 'SELECT * FROM historico ORDER BY data_montagem DESC';
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar histórico:', err.message);
            return res.status(500).json({ error: err.message });
        }
        // Agrupa por mês/ano
        const agrupado = {};
        rows.forEach(cesta => {
            const data = new Date(cesta.data_montagem);
            const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;
            if (!agrupado[mesAno]) agrupado[mesAno] = [];
            agrupado[mesAno].push(cesta);
        });
        res.status(200).json(agrupado);
    });
});

// #endregion

module.exports = router;