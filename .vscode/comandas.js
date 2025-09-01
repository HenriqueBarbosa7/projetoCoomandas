// ---------- Inicialização ----------
let comandas = JSON.parse(localStorage.getItem('comandasAbertas')) || [];
let vendas = JSON.parse(localStorage.getItem('vendasComandas')) || [];
let comandasFechadas = JSON.parse(localStorage.getItem('comandasFechadas')) || [];

// ---------- Atualizar select de categorias ----------
function atualizarCategorias() {
  const selectCategoria = document.getElementById('selectCategoria');
  if (!selectCategoria) return;

  const produtos = JSON.parse(localStorage.getItem('produtos')) || [];
  const categorias = [...new Set(produtos.map(p => p.categoria))];

  selectCategoria.innerHTML = '<option value="">Selecione a categoria</option>';
  categorias.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    selectCategoria.appendChild(option);
  });

  atualizarProdutosPorCategoriaSelecionada();
}

// ---------- Atualizar produtos por categoria ----------
function atualizarProdutosPorCategoriaSelecionada() {
  const selectProduto = document.getElementById('selectProduto');
  const selectCategoria = document.getElementById('selectCategoria');
  if (!selectProduto || !selectCategoria) return;

  const categoriaSelecionada = selectCategoria.value;
  const produtos = JSON.parse(localStorage.getItem('produtos')) || [];
  const produtosFiltrados = categoriaSelecionada ? produtos.filter(p => p.categoria === categoriaSelecionada) : [];

  selectProduto.innerHTML = '<option value="">Selecione o produto</option>';
  produtosFiltrados.forEach(p => {
    const option = document.createElement('option');
    option.value = p.nome;
    option.textContent = `${p.nome} (${p.quantidade} ${p.unidade})`;
    selectProduto.appendChild(option);
  });
}

// ---------- Abrir nova comanda ----------
function abrirComanda() {
  const nomeCliente = document.getElementById('nomeCliente').value.trim();
  if (!nomeCliente) {
    alert('Digite o nome do cliente!');
    return;
  }

  comandas.push({ cliente: nomeCliente, produtos: [], total: 0 });
  document.getElementById('nomeCliente').value = '';
  atualizarListaComandas();
}

// ---------- Atualizar select de comandas abertas ----------
function atualizarSelectComandasAbertas() {
  const select = document.getElementById('selectComandaAberta');
  select.innerHTML = '<option value="">Selecione a comanda</option>';
  comandas.forEach((c, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = c.cliente;
    select.appendChild(option);
  });
}

// ---------- Adicionar produto na comanda ----------
function adicionarProdutoNaComandaSelecionada() {
  const selectComanda = document.getElementById('selectComandaAberta');
  const indexComanda = parseInt(selectComanda.value, 10);
  const selectProduto = document.getElementById('selectProduto');
  const nomeProduto = selectProduto.value;
  const quantidade = parseFloat(document.getElementById('quantidadeVenda').value);

  if (isNaN(indexComanda) || !comandas[indexComanda] || !nomeProduto || isNaN(quantidade) || quantidade <= 0) {
    alert('Selecione a comanda, o produto e digite uma quantidade válida!');
    return;
  }

  const produtos = JSON.parse(localStorage.getItem('produtos')) || [];
  const produto = produtos.find(p => p.nome === nomeProduto);
  if (!produto) return;

  if (quantidade > produto.quantidade) {
    alert(`Estoque insuficiente! Estoque atual: ${produto.quantidade} ${produto.unidade}`);
    return;
  }

  // Dar baixa no estoque
  produto.quantidade -= quantidade;
  localStorage.setItem('produtos', JSON.stringify(produtos));

  // Adicionar na comanda selecionada
  const comanda = comandas[indexComanda];
  const subtotal = quantidade * produto.preco;
  comanda.produtos.push({
    nome: produto.nome,
    quantidade,
    unidade: produto.unidade,
    preco: produto.preco,
    subtotal
  });
  comanda.total += subtotal;

  document.getElementById('quantidadeVenda').value = '';
  atualizarListaComandas();

  // Registrar venda
  vendas.push({
    produto: produto.nome,
    quantidade,
    preco: produto.preco,
    unidade: produto.unidade,
    data: new Date().toISOString() // formato ISO para confiabilidade
  });
  localStorage.setItem('vendasComandas', JSON.stringify(vendas));
}

// ---------- Atualizar lista de comandas abertas ----------
function atualizarListaComandas() {
  const lista = document.getElementById('listaComandas');
  lista.innerHTML = '';

  comandas.forEach((c, index) => {
    const div = document.createElement('div');
    div.className = 'comanda-card';

    let produtosHTML = '<ul>';
    c.produtos.forEach(p => {
      produtosHTML += `<li>${p.nome} - ${p.quantidade} ${p.unidade} x R$${p.preco.toFixed(2)} = R$${p.subtotal.toFixed(2)}</li>`;
    });
    produtosHTML += '</ul>';

    div.innerHTML = `
      <h3>Cliente: ${c.cliente}</h3>
      ${produtosHTML}
      <p><strong>Total:</strong> R$ ${c.total.toFixed(2)}</p>
      <button onclick="fecharComanda(${index})">Fechar Comanda</button>
      <button onclick="excluirComanda(${index})">Excluir</button>
    `;

    lista.appendChild(div);
  });

  atualizarSelectComandasAbertas();
  atualizarTotalVendido();
  atualizarHistoricoFechadas();

  localStorage.setItem('comandasAbertas', JSON.stringify(comandas));
}

// ---------- Fechar comanda ----------
function fecharComanda(index) {
  const comanda = comandas[index];
  if (!comanda) return;

  const paga = confirm(`O cliente ${comanda.cliente} já PAGOU a comanda?`);
  comanda.status = paga ? "PAGA ✅" : "PENDENTE ❌";
  comanda.dataFechamento = new Date().toISOString();

  comandasFechadas.push(comanda);
  localStorage.setItem('comandasFechadas', JSON.stringify(comandasFechadas));

  comandas.splice(index, 1);
  atualizarListaComandas();
}

// ---------- Excluir comanda aberta ----------
function excluirComanda(index) {
  if (confirm('Deseja excluir esta comanda?')) {
    comandas.splice(index, 1);
    atualizarListaComandas();
  }
}

// ---------- Histórico de comandas fechadas ----------
function atualizarHistoricoFechadas() {
  const lista = document.getElementById('listaComandasFechadas');
  lista.innerHTML = '';

  comandasFechadas.forEach(c => {
    const div = document.createElement('div');
    div.className = 'comanda-fechada';
    div.innerHTML = `
      <p><strong>${c.cliente}</strong> - Total: R$ ${c.total.toFixed(2)} - Status: ${c.status}<br>
      <small>Fechada em: ${new Date(c.dataFechamento).toLocaleString()}</small></p>
    `;
    lista.appendChild(div);
  });
}

// ---------- Limpar histórico ----------
function limparHistorico() {
  if (confirm('Deseja limpar todo o histórico de comandas fechadas e vendas diárias?')) {
    comandasFechadas = [];
    vendas = [];
    localStorage.removeItem('comandasFechadas');
    localStorage.removeItem('vendasComandas');
    atualizarHistoricoFechadas();
    atualizarTotalVendido();
  }
}

// ---------- Atualizar total vendido diário ----------
function atualizarTotalVendido() {
  let total = 0;
  const hoje = new Date();
  const diaHoje = hoje.getDate();
  const mesHoje = hoje.getMonth();
  const anoHoje = hoje.getFullYear();

  vendas.forEach(v => {
    const dataVenda = new Date(v.data);
    if (
      dataVenda.getDate() === diaHoje &&
      dataVenda.getMonth() === mesHoje &&
      dataVenda.getFullYear() === anoHoje
    ) {
      total += v.preco * v.quantidade;
    }
  });

  document.getElementById('totalVendidoHoje').textContent = total.toFixed(2);
}

// ---------- Relatório de vendas diário ----------
function gerarRelatorioDiario() {
  const hoje = new Date();
  const diaHoje = hoje.getDate();
  const mesHoje = hoje.getMonth();
  const anoHoje = hoje.getFullYear();

  let conteudo = '=== Relatório de Vendas Diárias ===\n\n';
  let total = 0;

  vendas.forEach(v => {
    const dataVenda = new Date(v.data);
    if (
      dataVenda.getDate() === diaHoje &&
      dataVenda.getMonth() === mesHoje &&
      dataVenda.getFullYear() === anoHoje
    ) {
      conteudo += `${v.produto} - ${v.quantidade} ${v.unidade} x R$${v.preco.toFixed(2)} = R$${(v.preco*v.quantidade).toFixed(2)}\n`;
      total += v.preco * v.quantidade;
    }
  });

  conteudo += `\nTotal vendido hoje: R$${total.toFixed(2)}`;

  const printWindow = window.open('', '', 'width=600,height=600');
  printWindow.document.write('<pre>' + conteudo + '</pre>');
  printWindow.document.close();
  printWindow.print();
}

// ---------- Inicializar ----------
window.addEventListener('DOMContentLoaded', () => {
  atualizarCategorias();
  atualizarListaComandas();
  atualizarHistoricoFechadas();

  const btnImprimir = document.getElementById('btnImprimirRelatorio');
  if (btnImprimir) {
    btnImprimir.addEventListener('click', gerarRelatorioDiario);
  }
});
