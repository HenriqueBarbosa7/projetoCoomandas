// ---------- Inicialização ----------
let produtos = JSON.parse(localStorage.getItem('produtos')) || [];
let movimentos = JSON.parse(localStorage.getItem('movimentos')) || [];

const tabelaEstoque = document.getElementById('tabelaEstoque');
const produtoMovimentoSelect = document.getElementById('produtoMovimento');
const historicoMovimentos = document.getElementById('historicoMovimentos');

// ---------- Função para atualizar tabela e select ----------
function atualizarEstoque() {
  // Atualiza tabela
  tabelaEstoque.innerHTML = '';
  produtos.forEach((produto, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${produto.nome}</td>
      <td>${produto.preco.toFixed(2)}</td>
      <td>${produto.quantidade}</td>
      <td>${produto.categoria}</td>
      <td>${produto.unidade}</td>
      <td>
        <button onclick="editarProduto(${index})">Editar</button>
        <button onclick="excluirProduto(${index})">Excluir</button>
      </td>
    `;
    tabelaEstoque.appendChild(tr);
  });

  // Atualiza select do card de movimentos
  produtoMovimentoSelect.innerHTML = '';
  produtos.forEach((produto, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = `${produto.nome} (${produto.quantidade} ${produto.unidade})`;
    produtoMovimentoSelect.appendChild(option);
  });

  // Atualiza histórico
  atualizarHistorico();

  // Salva no localStorage
  localStorage.setItem('produtos', JSON.stringify(produtos));

  // Verifica estoque baixo
  verificarEstoqueBaixo();
}

// ---------- Adicionar produto ----------
function adicionarProduto() {
  const nome = document.getElementById('nomeProduto').value.trim();
  const preco = parseFloat(document.getElementById('precoProduto').value);
  const quantidade = parseFloat(document.getElementById('quantidadeProduto').value);
  const categoria = document.getElementById('categoriaProduto').value;
  const unidade = document.getElementById('unidadeProduto').value;

  if (!nome || isNaN(preco) || isNaN(quantidade) || !categoria || !unidade) {
    alert('Preencha todos os campos corretamente!');
    return;
  }

  produtos.push({ nome, preco, quantidade, categoria, unidade });
  atualizarEstoque();

  // Limpar campos
  document.getElementById('nomeProduto').value = '';
  document.getElementById('precoProduto').value = '';
  document.getElementById('quantidadeProduto').value = '';
  document.getElementById('categoriaProduto').value = '';
  document.getElementById('unidadeProduto').value = 'unidade';
}

// ---------- Editar produto ----------
function editarProduto(index) {
  const produto = produtos[index];
  const novoNome = prompt('Editar nome:', produto.nome);
  if (novoNome !== null) produto.nome = novoNome;

  const novoPreco = parseFloat(prompt('Editar preço (R$):', produto.preco));
  if (!isNaN(novoPreco)) produto.preco = novoPreco;

  const novaQuantidade = parseFloat(prompt('Editar quantidade:', produto.quantidade));
  if (!isNaN(novaQuantidade)) produto.quantidade = novaQuantidade;

  const novaCategoria = prompt('Editar categoria:', produto.categoria);
  if (novaCategoria !== null) produto.categoria = novaCategoria;

  const novaUnidade = prompt('Editar unidade (unidade, dose, ml, l):', produto.unidade);
  if (novaUnidade !== null) produto.unidade = novaUnidade;

  atualizarEstoque();
}

// ---------- Excluir produto ----------
function excluirProduto(index) {
  if (confirm(`Deseja realmente excluir o produto "${produtos[index].nome}"?`)) {
    produtos.splice(index, 1);
    atualizarEstoque();
  }
}

// ---------- Limpar estoque ----------
function limparEstoque() {
  if (confirm('Deseja realmente limpar todo o estoque?')) {
    produtos = [];
    movimentos = [];
    localStorage.removeItem('produtos');
    localStorage.removeItem('movimentos');
    atualizarEstoque();
  }
}

// ---------- Registrar entrada/saída ----------
function registrarMovimento() {
  const index = parseInt(produtoMovimentoSelect.value);
  const quantidade = parseFloat(document.getElementById('quantidadeMovimento').value);
  const tipo = document.getElementById('tipoMovimento').value;

  if (isNaN(quantidade) || quantidade <= 0) {
    alert('Digite uma quantidade válida!');
    return;
  }

  if (tipo === 'entrada') {
    produtos[index].quantidade += quantidade;
  } else if (tipo === 'saida') {
    if (quantidade > produtos[index].quantidade) {
      alert('Não há quantidade suficiente no estoque!');
      return;
    }
    produtos[index].quantidade -= quantidade;
  }

  movimentos.push({
    produto: produtos[index].nome,
    quantidade,
    tipo,
    data: new Date().toLocaleString()
  });

  document.getElementById('quantidadeMovimento').value = '';
  atualizarEstoque();
}

// ---------- Atualizar histórico ----------
function atualizarHistorico() {
  historicoMovimentos.innerHTML = '';
  movimentos.slice().reverse().forEach(mov => {
    const li = document.createElement('li');
    li.textContent = `[${mov.data}] ${mov.tipo.toUpperCase()} - ${mov.produto}: ${mov.quantidade}`;
    historicoMovimentos.appendChild(li);
  });

  localStorage.setItem('movimentos', JSON.stringify(movimentos));
}

// ---------- Verificar estoque baixo ----------
function verificarEstoqueBaixo() {
  const produtosBaixo = produtos.filter(p => p.quantidade > 0 && p.quantidade <= 3);
  if (produtosBaixo.length) {
    let mensagem = 'Atenção! Estoque baixo dos produtos:\n';
    produtosBaixo.forEach(p => {
      mensagem += `- ${p.nome}: ${p.quantidade} ${p.unidade}\n`;
    });
    alert(mensagem);
  }
}

// ---------- Exportar/Importar dados ----------
function exportarDados() {
  const backup = {
    produtos: produtos,
    movimentos: movimentos
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_estoque_${new Date().toISOString()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importarDados() {
  const fileInput = document.getElementById('importFile');
  if (!fileInput.files.length) {
    alert('Selecione um arquivo JSON para importar!');
    return;
  }
  const file = fileInput.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const backup = JSON.parse(e.target.result);
      if (backup.produtos) produtos = backup.produtos;
      if (backup.movimentos) movimentos = backup.movimentos;
      localStorage.setItem('produtos', JSON.stringify(produtos));
      localStorage.setItem('movimentos', JSON.stringify(movimentos));
      alert('Dados importados com sucesso!');
      atualizarEstoque();
    } catch (err) {
      alert('Erro ao importar dados: arquivo inválido!');
    }
  };
  reader.readAsText(file);
}

// ---------- Inicializar ----------
atualizarEstoque();
