// Este arquivo contém o código JavaScript que gerencia a lógica da aplicação.

// =======================
// #region CONTROLE DE ABAS
// =======================

/**
 * Alterna entre as abas da interface, salva a aba ativa no localStorage
 * e atualiza a URL para permitir navegação via botão voltar/avançar.
 * @param {string} tabId - O ID da aba a ser exibida.
 */
function showTab(tabId) {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // Remove a classe "active" de todas as abas e conteúdos
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    // Adiciona a classe "active" na aba e no conteúdo correspondente
    const activeButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
    const activeContent = document.getElementById(tabId);

    if (activeButton && activeContent) {
        activeButton.classList.add('active');
        activeContent.classList.add('active');
        // Atualiza a URL sem recarregar a página
        history.pushState(null, '', `#${tabId}`);
        // Salva aba ativa no localStorage
        localStorage.setItem('abaAtiva', tabId);
    }
}

/**
 * Inicializa o controle de abas ao carregar a página.
 * Restaura a aba ativa do localStorage ou usa a padrão.
 */
function inicializarAbas() {
    const tabButtons = document.querySelectorAll('.tab-button');
    // Adiciona eventos de clique nos botões das abas
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            showTab(tabId);
        });
    });

    // Verifica a URL ao carregar a página
    const initialTab = window.location.hash.replace('#', '') || localStorage.getItem('abaAtiva') || 'cadastrar-produto';
    showTab(initialTab);

    // Lida com o botão "voltar" do navegador
    window.addEventListener('popstate', () => {
        const currentTab = window.location.hash.replace('#', '') || 'cadastrar-produto';
        showTab(currentTab);
    });
}
// #endregion

// =======================
// #region CADASTRO DE PRODUTO
// =======================

/**
 * Lista de produtos permitidos para cadastro.
 */
const produtosPermitidos = [
    'Arroz', 'Feijão', 'Óleo', 'Açúcar', 'Café moído', 'Sal', 
    'Extrato de tomate', 'Vinagre', 'Bolacha recheada', 'Bolacha salgada', 
    'Macarrão Espaguete', 'Macarrão parafuso', 'Macarrão instantâneo', 
    'Farinha de trigo', 'Farinha temperada', 'Achocolatado em pó', 'Leite', 
    'Goiabada', 'Suco em pó', 'Mistura para bolo', 'Tempero', 'Sardinha', 
    'Creme dental', 'Papel higiênico', 'Sabonete', 'Milharina'
];

/**
 * Inicializa o formulário de cadastro de produto, incluindo formatação do campo de preço.
 */
function inicializarCadastroProduto() {
    const campoPreco = document.getElementById('produto-preco');
    if (!campoPreco) return;

    // Formatar preço enquanto o usuário digita
    campoPreco.addEventListener('input', (e) => {
        const apenasNumeros = e.target.value.replace(/\D/g, '');
        const valorFloat = (parseInt(apenasNumeros, 10) / 100).toFixed(2).replace('.', ',');
        e.target.value = `R$ ${valorFloat}`;
    });

    // Valor padrão ao perder o foco
    campoPreco.addEventListener('blur', () => {
        if (!campoPreco.value || campoPreco.value === 'R$ ') {
            campoPreco.value = 'R$ 0,00';
        }
    });

    // Configura a data de hoje no campo de data de compra
    const campoDataCompra = document.getElementById('produto-data-compra');
    function setarDataHoje() {
        if (campoDataCompra) {
            const hoje = new Date();
            const yyyy = hoje.getFullYear();
            const mm = String(hoje.getMonth() + 1).padStart(2, '0');
            const dd = String(hoje.getDate()).padStart(2, '0');
            const dataHoje = `${yyyy}-${mm}-${dd}`;
            campoDataCompra.value = dataHoje;
            campoDataCompra.max = dataHoje; // Impede datas futuras
        }
    }
    setarDataHoje();

    const form = document.getElementById('cadastrar-produto-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const nome = document.getElementById('produto-nome').value;
            const quantidade = document.getElementById('produto-quantidade').value;
            const dataCompra = document.getElementById('produto-data-compra').value;
            const dataValidade = document.getElementById('produto-data-validade').value;
            let preco = document.getElementById('produto-preco').value.replace('R$', '').replace(',', '.').trim();

            const hoje = new Date();
            const dataCompraObj = new Date(dataCompra);
            if (dataCompraObj > hoje) {
                alert('A data de compra não pode ser maior que o dia atual!');
                return;
            }

            if (!nome || !quantidade || !dataCompra || !dataValidade || !preco) {
                alert('Preencha todos os campos!');
                return;
            }

            // Validação para impedir preço zero
            if (Number(preco) <= 0) {
                alert('O valor do produto deve ser maior que zero!');
                return;
            }

            fetch('/api/produtos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, quantidade, dataCompra, dataValidade, preco })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert('Erro ao cadastrar produto: ' + data.error);
                } else {
                    alert('Produto cadastrado com sucesso!');
                    form.reset();
                    setarDataHoje(); // <-- Aqui garante que a data de compra volta para hoje
                    visualizarEstoque(); // Atualiza a tabela de estoque automaticamente
                }
            })
            .catch(error => {
                alert('Erro ao cadastrar produto!');
                console.error(error);
            });
        });
    }
}
// #endregion

// =======================
// #region MONTAR CESTA
// =======================

/**
 * Envia o tipo de cesta para o servidor, exibe o resultado e mantém a aba ativa.
 * @param {string} tipo - Tipo da cesta ('pequena' ou 'grande').
 */
function montarCesta(tipo) {
    fetch('/api/cestas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo })
    })
    .then(response => response.json())
    .then(data => {
        if (data.missingItems) {
            alert(`Itens faltando: ${data.missingItems.join(', ')}`);
            // Exibe na tela também
            const resultado = document.getElementById('resultado-montagem');
            resultado.innerHTML = `
                <div style="color: red; font-weight: bold;">
                    Não é possível montar a cesta.<br>
                    Itens faltando:<br>
                    <ul>
                        ${data.missingItems.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            `;
        } else {
            alert(data.message || 'Cesta montada com sucesso!');
            // Exibe o link em um campo específico
            const resultado = document.getElementById('resultado-montagem');
            resultado.innerHTML = `
                <p>Cesta criada! Clique para visualizar os itens ou gerar o arquivo:</p>
                <button id="ver-cesta" data-cesta="${data.id_cesta}">Ver detalhes da cesta</button>
            `;
            document.getElementById('ver-cesta').onclick = function() {
                mostrarDetalhesCesta(data.id_cesta);
            };
            // Mantém a aba de montagem ativa
            showTab('montar-cesta');
            visualizarEstoque(); // Atualiza a tabela de estoque automaticamente
            acessarHistorico();  // Atualiza o histórico automaticamente
        }
    })
    .catch(error => console.error('Erro ao montar cesta:', error));
}

/**
 * Inicializa o formulário de montagem de cesta.
 */
function inicializarMontarCesta() {
    const montarCestaForm = document.getElementById('montar-cesta-form');
    if (montarCestaForm) {
        montarCestaForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const tipo = document.querySelector('input[name="tipo-cesta"]:checked')?.value;
            if (!tipo) {
                alert('Selecione o tipo de cesta!');
                return;
            }
            montarCesta(tipo);
        });
    }
}

/**
 * Busca e exibe os detalhes dos itens de uma cesta montada.
 * @param {number} idCesta - ID da cesta.
 */
function mostrarDetalhesCesta(idCesta) {
    fetch(`/api/cestas/${idCesta}/itens`)
        .then(response => response.json())
        .then(itens => {
            const resultado = document.getElementById('resultado-montagem');
            if (!itens.length) {
                resultado.innerHTML = '<p>Nenhum item encontrado para esta cesta.</p>';
                return;
            }
            let tabela = `
                <table>
                    <tr>
                        <th>Nome</th>
                        <th>Quantidade</th>
                        <th>Preço Unitário</th>
                        <th>Código</th>
                    </tr>
            `;
            itens.forEach(item => {
                tabela += `
                    <tr>
                        <td>${item.nome}</td>
                        <td>${item.quantidade}</td>
                        <td>R$ ${parseFloat(item.preco_unitario).toFixed(2).replace('.', ',')}</td>
                        <td>${item.codigo_produto}</td>
                    </tr>
                `;
            });
            tabela += '</table>';
            tabela += `<button onclick="baixarTxtCesta(${idCesta})">Gerar TXT da cesta</button>`;
            resultado.innerHTML = tabela;
        })
        .catch(error => console.error('Erro ao buscar itens da cesta:', error));
}

/**
 * Gera e baixa o arquivo TXT da cesta consultando o backend.
 * @param {number} idCesta - ID da cesta.
 */
function baixarTxtCesta(idCesta) {
    // Busca o nome do arquivo da cesta pelo id
    fetch(`/api/historico`)
        .then(response => response.json())
        .then(agrupado => {
            let nomeArquivo = null;
            Object.values(agrupado).forEach(lista => {
                lista.forEach(cesta => {
                    if (cesta.id === idCesta) {
                        nomeArquivo = cesta.nome_arquivo;
                    }
                });
            });
            if (nomeArquivo) {
                window.open(`/historico/${nomeArquivo}`, '_blank');
            } else {
                alert('Arquivo não encontrado para esta cesta.');
            }
        })
        .catch(() => alert('Erro ao localizar o arquivo da cesta.'));
}
// #endregion

// =======================
// #region VISUALIZAR ESTOQUE
// =======================

/**
 * Busca e exibe os produtos no estoque na tabela da interface.
 */
function visualizarEstoque() {
    fetch('/api/estoque')
        .then(response => response.json())
        .then(data => {
            const tabelaBody = document.querySelector('#estoque-tabela tbody');
            if (!tabelaBody) return;
            tabelaBody.innerHTML = '';
            data.forEach(produto => {
                const row = document.createElement('tr');
                if (produto.expirando) row.classList.add('expirando');
                row.innerHTML = `
                    <td>${produto.codigo}</td>
                    <td>${produto.nome}</td>
                    <td>${produto.quantidade}</td>
                    <td>${produto.data_compra}</td>
                    <td>${produto.data_validade}</td>
                    <td>R$ ${produto.preco}</td>
                `;
                tabelaBody.appendChild(row);
            });
        })
        .catch(error => console.error('Erro ao visualizar estoque:', error));
}
// #endregion

// =======================
// #region HISTÓRICO DE CESTAS
// =======================

/**
 * Busca e exibe o histórico de cestas montadas agrupadas por mês/ano.
 */
function acessarHistorico() {
    fetch('/api/historico')
        .then(response => response.json())
        .then(agrupado => {
            const lista = document.getElementById('historico-lista');
            if (!lista) return;
            lista.innerHTML = '';
            Object.keys(agrupado).forEach(mesAno => {
                const titulo = document.createElement('h3');
                titulo.textContent = `Mês: ${mesAno}`;
                lista.appendChild(titulo);
                const tabela = document.createElement('table');
                tabela.innerHTML = `
                    <tr>
                        <th>Arquivo</th>
                        <th>Tipo</th>
                        <th>Data</th>
                        <th>Valor</th>
                    </tr>
                `;
                agrupado[mesAno].forEach(cesta => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><a href="/historico/${cesta.nome_arquivo}" download>${cesta.nome_arquivo}</a></td>
                        <td>${cesta.tipo || '-'}</td>
                        <td>${new Date(cesta.data_montagem).toLocaleString('pt-BR')}</td>
                        <td>R$ ${parseFloat(cesta.preco_total).toFixed(2).replace('.', ',')}</td>
                    `;
                    tabela.appendChild(tr);
                });
                lista.appendChild(tabela);
            });
        })
        .catch(error => console.error('Erro ao acessar histórico:', error));
}
// #endregion

// =======================
// #region INICIALIZAÇÃO GLOBAL
// =======================

/**
 * Inicializa todas as funcionalidades ao carregar a página.
 */
document.addEventListener('DOMContentLoaded', () => {
    inicializarAbas();
    inicializarCadastroProduto();
    inicializarMontarCesta();
    visualizarEstoque();
    acessarHistorico();
});
// #endregion