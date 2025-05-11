// Este arquivo contém o código JavaScript que gerencia a lógica da aplicação.

// #region Cadastro de Produto
// Lista de produtos permitidos para cadastro
const produtosPermitidos = [
    'Arroz', 'Feijão', 'Óleo', 'Açúcar', 'Café moído', 'Sal', 
    'Extrato de tomate', 'Vinagre', 'Bolacha recheada', 'Bolacha salgada', 
    'Macarrão Espaguete', 'Macarrão parafuso', 'Macarrão instantâneo', 
    'Farinha de trigo', 'Farinha temperada', 'Achocolatado em pó', 'Leite', 
    'Goiabada', 'Suco em pó', 'Mistura para bolo', 'Tempero', 'Sardinha', 
    'Creme dental', 'Papel higiênico', 'Sabonete', 'Milharina'
];
// #endregion

// #region Controle de Abas
document.addEventListener('DOMContentLoaded', () => {
    // Seleciona os botões das abas e os conteúdos correspondentes
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const campoPreco = document.getElementById('produto-preco');

    // Formatar preço enquanto o usuário digita
    campoPreco.addEventListener('input', (e) => {
        const apenasNumeros = e.target.value.replace(/\D/g, ''); // Remove caracteres não numéricos
        const valorFloat = (parseInt(apenasNumeros, 10) / 100).toFixed(2).replace('.', ','); // Formata como moeda
        e.target.value = `R$ ${valorFloat}`; // Atualiza o campo com o valor formatado
    });

    // Garantir valor padrão ao perder o foco
    campoPreco.addEventListener('blur', () => {
        if (!campoPreco.value || campoPreco.value === 'R$ ') {
            campoPreco.value = 'R$ 0,00'; // Define o valor padrão
        }
    });

    // Função para alternar entre as abas
    function showTab(tabId) {
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
        }
    }

    // Adiciona eventos de clique nos botões das abas
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab'); // Obtém o ID da aba
            showTab(tabId); // Mostra a aba correspondente
        });
    });

    // Verifica a URL ao carregar a página
    const initialTab = window.location.hash.replace('#', '') || 'cadastrar-produto';
    showTab(initialTab);

    // Lida com o botão "voltar" do navegador
    window.addEventListener('popstate', () => {
        const currentTab = window.location.hash.replace('#', '') || 'cadastrar-produto';
        showTab(currentTab);
    });

    // #region Visualizar Estoque
    // Função para buscar e exibir os produtos no estoque
    function visualizarEstoque() {
        fetch('/api/estoque') // Faz uma requisição GET para a rota do estoque
            .then(response => response.json())
            .then(data => {
                const tabelaBody = document.querySelector('#estoque-tabela tbody'); // Seleciona o corpo da tabela
                tabelaBody.innerHTML = ''; // Limpa a tabela antes de preenchê-la

                // Itera sobre os produtos retornados e cria as linhas da tabela
                data.forEach(produto => {
                    const row = document.createElement('tr'); // Cria uma nova linha para a tabela

                    // Adiciona a classe "expirando" para itens próximos do vencimento
                    if (produto.expirando) {
                        row.classList.add('expirando'); // Classe para estilizar produtos próximos do vencimento
                    }

                    // Preenche as colunas da tabela com os dados do produto
                    row.innerHTML = `
                        <td>${produto.codigo}</td> <!-- Código do produto -->
                        <td>${produto.nome}</td> <!-- Nome do produto -->
                        <td>${produto.quantidade}</td> <!-- Quantidade disponível -->
                        <td>${produto.data_compra}</td> <!-- Data de compra -->
                        <td>${produto.data_validade}</td> <!-- Data de validade -->
                        <td>R$ ${produto.preco}</td> <!-- Preço formatado -->
                    `;

                    tabelaBody.appendChild(row); // Adiciona a linha à tabela
                });
            })
            .catch(error => console.error('Erro ao visualizar estoque:', error)); // Exibe erros no console
    }

    // Chama a função para exibir o estoque ao carregar a página
    visualizarEstoque();
    // #endregion

    // #region Montar Cesta
    // Captura o envio do formulário de montar cesta
    document.getElementById('montar-cesta-form').addEventListener('submit', (e) => {
        e.preventDefault(); // Impede o comportamento padrão do formulário

        // Obtém o tipo de cesta selecionado
        const tipo = document.querySelector('input[name="tipo-cesta"]:checked').value;

        // Chama a função para montar a cesta
        montarCesta(tipo);
    });

    // Função para montar cesta
    function montarCesta(tipo) {
        fetch('/api/cestas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tipo }) // Envia o tipo de cesta para o backend
        })
        .then(response => response.json())
        .then(data => {
            if (response.ok) {
                console.log(`Cesta montada com sucesso: ${data.message}`);
                alert(data.message || 'Cesta montada com sucesso!');
            } else {
                console.warn(`Erro ao montar a cesta: ${data.message}`);
                if (data.missingItems) {
                    alert(`Não é possível montar a cesta. Os seguintes itens estão faltando ou com quantidade insuficiente:\n\n${data.missingItems.join('\n')}`);
                } else {
                    alert(data.message || 'Erro ao montar a cesta.');
                }
            }
        })
        .catch(error => console.error('Erro ao montar cesta:', error)); // Exibe erros no console
    }
    // #endregion

    // #region Histórico de Cestas
    // Função para acessar o histórico de cestas montadas
    function acessarHistorico() {
        fetch('/api/historico') // Faz uma requisição GET para a rota do histórico
        .then(response => response.json())
        .then(data => {
            const lista = document.getElementById('historico-lista'); // Seleciona a lista do histórico
            lista.innerHTML = ''; // Limpa a lista antes de preenchê-la

            // Itera sobre as cestas retornadas e cria os itens da lista
            data.forEach(cesta => {
                const item = document.createElement('li');
                item.innerHTML = `
                    <a href="/historico/${cesta.nome_arquivo}" download>${cesta.nome_arquivo}</a>
                    - Data: ${cesta.data_montagem}
                    - Preço Total: R$ ${cesta.preco_total.toFixed(2)}
                `;
                lista.appendChild(item); // Adiciona o item à lista
            });
        })
        .catch(error => console.error('Erro ao acessar histórico:', error)); // Exibe erros no console
    }
    // #endregion
});