// Time Flow - Sistema de Gerenciamento de Tempo de Separação
document.addEventListener('DOMContentLoaded', function() {
    console.log('Time Flow - Sistema de Gerenciamento de Tempo de Separação v1.0');
    console.log('Inicializando sistema...');
    
    inicializarOperadores();
    carregarHistorico();
    
    // Configurar navegação por abas
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remover classe ativa de todas as abas
            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Adicionar classe ativa à aba clicada
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            // Atualizar tabelas se necessário
            if (tabId === 'order-history') {
                carregarHistorico();
            } else if (tabId === 'new-order') {
                atualizarPedidosAtivos();
            } else if (tabId === 'statistics') {
                atualizarEstatisticas();
            }
        });
    });
    
    // Eventos dos botões principais
    document.getElementById('start-timer').onclick = iniciarSeparacao;
    
    // Eventos de filtro
    document.getElementById('search-orders').addEventListener('input', carregarHistorico);
    document.getElementById('filter-status').addEventListener('change', carregarHistorico);
    document.getElementById('filter-user').addEventListener('change', carregarHistorico);
    
    // Eventos de filtro para estatísticas
    document.getElementById('stats-period').addEventListener('change', atualizarEstatisticas);
    document.getElementById('stats-user').addEventListener('change', atualizarEstatisticas);
    
    // Eventos de configuração
    document.getElementById('save-user').onclick = adicionarOperador;
    document.getElementById('export-data').onclick = exportarCSV;
    document.getElementById('clear-data').onclick = function() {
        if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
            localStorage.removeItem('historico-pedidos');
            localStorage.removeItem('pedidos-ativos');
            alert('Histórico de pedidos foi removido com sucesso.');
            carregarHistorico();
            atualizarPedidosAtivos();
            atualizarEstatisticas();
        }
    };
    
    // Evento de mudança de operador
    document.getElementById('user-select').addEventListener('change', function() {
        const operadorAnterior = localStorage.getItem('operador-atual');
        const novoOperador = this.value;
        
        localStorage.setItem('operador-atual', novoOperador);
        console.log(`Operador alterado: ${operadorAnterior} -> ${novoOperador}`);
        
        // Atualizar lista de pedidos ativos para o novo operador
        atualizarPedidosAtivos();
    });
    
    // Inicializar pedidos ativos
    atualizarPedidosAtivos();
    
    // Inicializar estatísticas
    atualizarEstatisticas();
});

// Variáveis globais para controle
let pedidosAtivos = {};  // Objeto para armazenar múltiplos pedidos ativos
let cronometros = {};    // Objeto para armazenar os cronômetros

// Função para inicializar operadores
function inicializarOperadores() {
    // Recuperar operadores ou criar lista padrão
    let operadores = JSON.parse(localStorage.getItem('operadores') || '[]');
    if (operadores.length === 0) {
        operadores = ['Operador 1'];
        localStorage.setItem('operadores', JSON.stringify(operadores));
    }
    
    // Definir operador atual se não existir
    if (!localStorage.getItem('operador-atual')) {
        localStorage.setItem('operador-atual', operadores[0]);
    }
    
    // Preencher todos os selects e listas de operadores
    atualizarInterfaceOperadores();
}

// Função para atualizar interface com operadores
function atualizarInterfaceOperadores() {
    const operadores = JSON.parse(localStorage.getItem('operadores') || '[]');
    const operadorAtual = localStorage.getItem('operador-atual');
    
    // Seletor principal de operador
    const selectOperador = document.getElementById('user-select');
    selectOperador.innerHTML = '';
    
    // Filtro de operador no histórico
    const filterUser = document.getElementById('filter-user');
    filterUser.innerHTML = '<option value="all">Todos Operadores</option>';
    
    // Filtro de operador nas estatísticas
    const statsUser = document.getElementById('stats-user');
    if (statsUser) { // Verificar se existe
        statsUser.innerHTML = '<option value="all">Todos Operadores</option>';
    }
    
    // Lista de operadores nas configurações
    const usersList = document.getElementById('users-list');
    usersList.innerHTML = '';
    
    // Preencher todos os elementos com operadores
    operadores.forEach(operador => {
        // Seletor principal
        const option = document.createElement('option');
        option.value = operador;
        option.textContent = operador;
        if (operador === operadorAtual) {
            option.selected = true;
        }
        selectOperador.appendChild(option);
        
        // Filtro de histórico
        const filterOption = document.createElement('option');
        filterOption.value = operador;
        filterOption.textContent = operador;
        filterUser.appendChild(filterOption);
        
        // Filtro de estatísticas
        if (statsUser) {
            const statsOption = document.createElement('option');
            statsOption.value = operador;
            statsOption.textContent = operador;
            statsUser.appendChild(statsOption);
        }
        
        // Lista de configurações
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        li.style.padding = '8px 0';
        li.style.borderBottom = '1px solid #eee';
        
        const userName = document.createElement('span');
        userName.textContent = operador;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Remover';
        deleteBtn.className = 'btn btn-danger';
        deleteBtn.style.padding = '5px 10px';
        deleteBtn.style.fontSize = '14px';
        
        deleteBtn.addEventListener('click', () => {
            if (operadores.length <= 1) {
                alert('Não é possível remover todos os operadores. Deve haver pelo menos um.');
                return;
            }
            
            if (confirm(`Tem certeza que deseja remover o operador "${operador}"?`)) {
                removerOperador(operador);
            }
        });
        
        li.appendChild(userName);
        li.appendChild(deleteBtn);
        usersList.appendChild(li);
    });
}

// Função para adicionar um novo operador
function adicionarOperador() {
    const novoOperador = document.getElementById('add-user').value.trim();
    
    if (!novoOperador) {
        alert('Por favor, digite um nome para o operador.');
        return;
    }
    
    const operadores = JSON.parse(localStorage.getItem('operadores') || '[]');
    
    // Verificar se já existe
    if (operadores.includes(novoOperador)) {
        alert('Este operador já existe.');
        return;
    }
    
    // Adicionar e salvar
    operadores.push(novoOperador);
    localStorage.setItem('operadores', JSON.stringify(operadores));
    
    // Limpar campo e atualizar interface
    document.getElementById('add-user').value = '';
    atualizarInterfaceOperadores();
    
    console.log('Operador adicionado:', novoOperador);
}

// Função para remover um operador
function removerOperador(operador) {
    let operadores = JSON.parse(localStorage.getItem('operadores') || '[]');
    
    // Remover da lista
    operadores = operadores.filter(op => op !== operador);
    localStorage.setItem('operadores', JSON.stringify(operadores));
    
    // Se o operador atual foi removido, selecionar outro
    if (localStorage.getItem('operador-atual') === operador) {
        localStorage.setItem('operador-atual', operadores[0]);
    }
    
    // Atualizar interface
    atualizarInterfaceOperadores();
    carregarHistorico();
    atualizarPedidosAtivos();
    
    console.log('Operador removido:', operador);
}

// Função para iniciar separação
function iniciarSeparacao() {
    console.log('Iniciando separação');
    
    // Obter operador atual
    const operadorAtual = localStorage.getItem('operador-atual');
    
    // Verificar se já existe pedido ativo para este operador
    const pedidosAtivosAtuais = JSON.parse(localStorage.getItem('pedidos-ativos') || '{}');
    if (pedidosAtivosAtuais[operadorAtual]) {
        alert(`O operador "${operadorAtual}" já possui um pedido em separação. Finalize o pedido atual antes de iniciar um novo.`);
        return;
    }
    
    // Obter dados do formulário
    const idPedido = document.getElementById('order-id').value.trim();
    if (!idPedido) {
        alert('Por favor, informe o número do pedido.');
        return;
    }
    
    // Verificar se já existe um pedido com esse ID
    const historico = JSON.parse(localStorage.getItem('historico-pedidos') || '[]');
    const pedidoExistente = historico.some(p => p.id === idPedido);
    
    // Verificar se já existe um pedido ativo com esse ID
    let pedidoAtivoExistente = false;
    Object.values(pedidosAtivosAtuais).forEach(pedido => {
        if (pedido.id === idPedido) {
            pedidoAtivoExistente = true;
        }
    });
    
    if (pedidoExistente || pedidoAtivoExistente) {
        alert('Já existe um pedido com este número. Por favor, use um número diferente.');
        return;
    }
    
    // Criar novo pedido (sem referência à prioridade)
    const novoPedido = {
        id: idPedido,
        inicio: new Date().toISOString(),
        itens: document.getElementById('order-items').value,
        prioridade: 'normal', // valor padrão
        notas: document.getElementById('order-notes').value,
        operador: operadorAtual,
        tempoInicial: Date.now(),
        tempoPausado: 0,
        isPausado: false
    };
    
    // Salvar pedido ativo
    pedidosAtivosAtuais[operadorAtual] = novoPedido;
    localStorage.setItem('pedidos-ativos', JSON.stringify(pedidosAtivosAtuais));
    
    // Limpar formulário
    document.getElementById('order-id').value = '';
    document.getElementById('order-items').value = '1';
    document.getElementById('order-notes').value = '';
    
    // Atualizar interface
    atualizarPedidosAtivos();
    
    console.log('Pedido iniciado:', novoPedido);
}

// Modificar a função resetarFormulario para remover referência à prioridade
function resetarFormulario() {
    // Limpar estado
    pedidoAtivo = null;
    cronometro = null;
    isPausado = false;
    
    // Resetar interface
    document.getElementById('active-order').style.display = 'none';
    document.getElementById('timer-display').textContent = '00:00:00';
    
    // Habilitar formulário
    document.getElementById('order-id').disabled = false;
    document.getElementById('order-items').disabled = false;
    document.getElementById('order-notes').disabled = false;
    document.getElementById('start-timer').disabled = false;
    
    // Limpar campos
    document.getElementById('order-id').value = '';
    document.getElementById('order-items').value = '1';
    document.getElementById('order-notes').value = '';
    document.getElementById('completion-notes').value = '';
    
    // Resetar botões
    document.getElementById('pause-timer').style.display = 'inline-block';
    document.getElementById('resume-timer').style.display = 'none';
}

// Modificar a função atualizarPedidosAtivos para remover referências visuais à prioridade
function atualizarPedidosAtivos() {
    // Recuperar pedidos ativos
    const pedidosAtivosAtuais = JSON.parse(localStorage.getItem('pedidos-ativos') || '{}');
    const operadorAtual = localStorage.getItem('operador-atual');
    
    // Localizar o container correto
    const container = document.getElementById('active-orders-container') || document.getElementById('pedidos-ativos-container');
    
    if (!container) {
        console.error('Container de pedidos ativos não encontrado');
        return;
    }
    
    // Limpar container
    container.innerHTML = '';
    
    // Se não houver pedidos ativos para o operador atual, mostrar mensagem
    if (!pedidosAtivosAtuais[operadorAtual]) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <p>Nenhum pedido em andamento</p>
        `;
        container.appendChild(emptyState);
        return;
    }
    
    // Mostrar pedido ativo do operador atual
    const pedido = pedidosAtivosAtuais[operadorAtual];
    
    // Criar card para o pedido
    const card = document.createElement('div');
    card.className = 'active-order-card';
    
    card.innerHTML = `
        <h2>Pedido em Separação: <span>${pedido.id}</span></h2>
        <div style="margin-bottom: 15px;">
            <p><strong>Operador:</strong> ${pedido.operador}</p>
            <p><strong>Itens:</strong> ${pedido.itens}</p>
            <p><strong>Início:</strong> ${new Date(pedido.inicio).toLocaleString()}</p>
        </div>
        <div class="timer-display" id="timer-${pedido.id}">00:00:00</div>
        <div class="timer-controls">
            <button id="pause-${pedido.id}" class="btn btn-warning" style="${pedido.isPausado ? 'display:none;' : ''}">Pausar</button>
            <button id="resume-${pedido.id}" class="btn btn-primary" style="${pedido.isPausado ? '' : 'display:none;'}">Retomar</button>
            <button id="complete-${pedido.id}" class="btn btn-success">Finalizar Separação</button>
            <button id="cancel-${pedido.id}" class="btn btn-danger">Cancelar</button>
        </div>
        <div class="form-group" style="margin-top: 15px;">
            <label for="completion-notes-${pedido.id}">Notas de Finalização:</label>
            <textarea id="completion-notes-${pedido.id}" class="form-control" rows="2" placeholder="Alguma observação sobre a separação..."></textarea>
        </div>
    `;
    
    container.appendChild(card);
    
    // Adicionar eventos aos botões
    document.getElementById(`pause-${pedido.id}`).addEventListener('click', () => pausarCronometro(pedido.id));
    document.getElementById(`resume-${pedido.id}`).addEventListener('click', () => retomarCronometro(pedido.id));
    document.getElementById(`complete-${pedido.id}`).addEventListener('click', () => finalizarSeparacao(pedido.id));
    document.getElementById(`cancel-${pedido.id}`).addEventListener('click', () => cancelarSeparacao(pedido.id));
    
    // Iniciar cronômetro
    console.log('Iniciando cronômetro para pedido:', pedido.id);
    iniciarCronometro(pedido.id);
}


// Função para iniciar cronômetro
function iniciarCronometro(pedidoId) {
    // Recuperar pedidos ativos
    const pedidosAtivosAtuais = JSON.parse(localStorage.getItem('pedidos-ativos') || '{}');
    const operadorAtual = localStorage.getItem('operador-atual');
    
    if (!pedidosAtivosAtuais[operadorAtual] || pedidosAtivosAtuais[operadorAtual].id !== pedidoId) {
        return; // Não é o pedido do operador atual
    }
    
    const pedido = pedidosAtivosAtuais[operadorAtual];
    
    // Limpar intervalo anterior se existir
    if (cronometros[pedidoId]) {
        clearInterval(cronometros[pedidoId]);
    }
    
    // Função para atualizar o display
    const atualizarDisplay = () => {
        const display = document.getElementById(`timer-${pedidoId}`);
        if (!display) return;
        
        // Recalcular tempo decorrido
        const pedidosAtualizados = JSON.parse(localStorage.getItem('pedidos-ativos') || '{}');
        const operador = localStorage.getItem('operador-atual');
        
        if (!pedidosAtualizados[operador] || pedidosAtualizados[operador].id !== pedidoId) {
            clearInterval(cronometros[pedidoId]);
            return;
        }
        
        const pedidoAtual = pedidosAtualizados[operador];
        
        let tempoDecorrido;
        if (pedidoAtual.isPausado) {
            tempoDecorrido = pedidoAtual.tempoPausado;
        } else {
            tempoDecorrido = Date.now() - pedidoAtual.tempoInicial;
        }
        
        display.textContent = formatarTempo(tempoDecorrido);
    };
    
    // Atualizar imediatamente e iniciar intervalo
    atualizarDisplay();
    cronometros[pedidoId] = setInterval(atualizarDisplay, 1000);
}

// Função para pausar cronômetro
function pausarCronometro(pedidoId) {
    // Recuperar pedidos ativos
    const pedidosAtivosAtuais = JSON.parse(localStorage.getItem('pedidos-ativos') || '{}');
    const operadorAtual = localStorage.getItem('operador-atual');
    
    if (!pedidosAtivosAtuais[operadorAtual] || pedidosAtivosAtuais[operadorAtual].id !== pedidoId) {
        return; // Não é o pedido do operador atual
    }
    
    const pedido = pedidosAtivosAtuais[operadorAtual];
    
    // Verificar se já está pausado
    if (pedido.isPausado) return;
    
    // Calcular tempo decorrido até agora
    const tempoPausado = Date.now() - pedido.tempoInicial;
    
    // Atualizar estado
    pedido.isPausado = true;
    pedido.tempoPausado = tempoPausado;
    
    // Salvar alterações
    pedidosAtivosAtuais[operadorAtual] = pedido;
    localStorage.setItem('pedidos-ativos', JSON.stringify(pedidosAtivosAtuais));
    
    // Atualizar interface
    document.getElementById(`pause-${pedidoId}`).style.display = 'none';
    document.getElementById(`resume-${pedidoId}`).style.display = 'inline-block';
    
    console.log('Cronômetro pausado:', pedidoId);
}

// Função para retomar cronômetro
function retomarCronometro(pedidoId) {
    // Recuperar pedidos ativos
    const pedidosAtivosAtuais = JSON.parse(localStorage.getItem('pedidos-ativos') || '{}');
    const operadorAtual = localStorage.getItem('operador-atual');
    
    if (!pedidosAtivosAtuais[operadorAtual] || pedidosAtivosAtuais[operadorAtual].id !== pedidoId) {
        return; // Não é o pedido do operador atual
    }
    
    const pedido = pedidosAtivosAtuais[operadorAtual];
    
    // Verificar se está pausado
    if (!pedido.isPausado) return;
    
    // Ajustar tempo inicial para considerar a pausa
    pedido.tempoInicial = Date.now() - pedido.tempoPausado;
    pedido.isPausado = false;
    
    // Salvar alterações
    pedidosAtivosAtuais[operadorAtual] = pedido;
    localStorage.setItem('pedidos-ativos', JSON.stringify(pedidosAtivosAtuais));
    
    // Atualizar interface
    document.getElementById(`resume-${pedidoId}`).style.display = 'none';
    document.getElementById(`pause-${pedidoId}`).style.display = 'inline-block';
    
    console.log('Cronômetro retomado:', pedidoId);
}

// Função para finalizar separação
function finalizarSeparacao(pedidoId) {
    // Recuperar pedidos ativos
    const pedidosAtivosAtuais = JSON.parse(localStorage.getItem('pedidos-ativos') || '{}');
    const operadorAtual = localStorage.getItem('operador-atual');
    
    if (!pedidosAtivosAtuais[operadorAtual] || pedidosAtivosAtuais[operadorAtual].id !== pedidoId) {
        return; // Não é o pedido do operador atual
    }
    
    const pedido = pedidosAtivosAtuais[operadorAtual];
    
    // Calcular tempo total
    let tempoTotal;
    if (pedido.isPausado) {
        tempoTotal = pedido.tempoPausado;
    } else {
        tempoTotal = Date.now() - pedido.tempoInicial;
    }
    
    // Obter notas de finalização
    const notasFinalizacao = document.getElementById(`completion-notes-${pedidoId}`).value;
    
    // Criar registro para o histórico
    const historico = JSON.parse(localStorage.getItem('historico-pedidos') || '[]');
    
    const pedidoFinalizado = {
        id: pedido.id,
        inicio: pedido.inicio,
        fim: new Date().toISOString(),
        itens: pedido.itens,
        prioridade: pedido.prioridade,
        tempo: tempoTotal,
        status: 'completed',
        notas: pedido.notas,
        notasFinalizacao: notasFinalizacao,
        operador: pedido.operador
    };
    
    // Adicionar ao histórico
    historico.push(pedidoFinalizado);
    localStorage.setItem('historico-pedidos', JSON.stringify(historico));
    
    // Remover dos pedidos ativos
    delete pedidosAtivosAtuais[operadorAtual];
    localStorage.setItem('pedidos-ativos', JSON.stringify(pedidosAtivosAtuais));
    
    // Limpar cronômetro
    if (cronometros[pedidoId]) {
        clearInterval(cronometros[pedidoId]);
        delete cronometros[pedidoId];
    }
    
    // Atualizar interface
    atualizarPedidosAtivos();
    
    alert('Pedido finalizado com sucesso!');
    console.log('Pedido finalizado:', pedidoFinalizado);
}

// Função para cancelar separação
function cancelarSeparacao(pedidoId) {
    // Recuperar pedidos ativos
    const pedidosAtivosAtuais = JSON.parse(localStorage.getItem('pedidos-ativos') || '{}');
    const operadorAtual = localStorage.getItem('operador-atual');
    
    if (!pedidosAtivosAtuais[operadorAtual] || pedidosAtivosAtuais[operadorAtual].id !== pedidoId) {
        return; // Não é o pedido do operador atual
    }
    
    if (!confirm('Tem certeza que deseja cancelar este pedido?')) {
        return;
    }
    
    const pedido = pedidosAtivosAtuais[operadorAtual];
    
    // Calcular tempo parcial
    let tempoParcial;
    if (pedido.isPausado) {
        tempoParcial = pedido.tempoPausado;
    } else {
        tempoParcial = Date.now() - pedido.tempoInicial;
    }
    
    // Obter notas de finalização
    const notasFinalizacao = document.getElementById(`completion-notes-${pedidoId}`).value;
    
    // Criar registro para o histórico
    const historico = JSON.parse(localStorage.getItem('historico-pedidos') || '[]');
    
    const pedidoCancelado = {
        id: pedido.id,
        inicio: pedido.inicio,
        fim: new Date().toISOString(),
        itens: pedido.itens,
        prioridade: pedido.prioridade,
        tempo: tempoParcial,
        status: 'canceled',
        notas: pedido.notas,
        notasFinalizacao: notasFinalizacao,
        operador: pedido.operador
    };
    
    // Adicionar ao histórico
    historico.push(pedidoCancelado);
    localStorage.setItem('historico-pedidos', JSON.stringify(historico));
    
    // Remover dos pedidos ativos
    delete pedidosAtivosAtuais[operadorAtual];
    localStorage.setItem('pedidos-ativos', JSON.stringify(pedidosAtivosAtuais));
    
    // Limpar cronômetro
    if (cronometros[pedidoId]) {
        clearInterval(cronometros[pedidoId]);
        delete cronometros[pedidoId];
    }
    
    // Atualizar interface
    atualizarPedidosAtivos();
    
    alert('Pedido cancelado!');
    console.log('Pedido cancelado:', pedidoCancelado);
}

// Função para carregar e mostrar o histórico
function carregarHistorico() {
    const historico = JSON.parse(localStorage.getItem('historico-pedidos') || '[]');
    const tableBody = document.getElementById('orders-table-body');
    
    if (!tableBody) {
        console.error('Element orders-table-body not found');
        return;
    }
    
    tableBody.innerHTML = '';
    
    // Obter filtros
    const searchTerm = document.getElementById('search-orders').value.toLowerCase();
    const statusFilter = document.getElementById('filter-status').value;
    const userFilter = document.getElementById('filter-user').value;
    
    // Aplicar filtros
    const pedidosFiltrados = historico.filter(pedido => {
        const matchesSearch = pedido.id.toLowerCase().includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || pedido.status === statusFilter;
        const matchesUser = userFilter === 'all' || pedido.operador === userFilter;
        
        return matchesSearch && matchesStatus && matchesUser;
    });
    
    // Ordenar por data (mais recente primeiro)
    const pedidosOrdenados = pedidosFiltrados.sort((a, b) => new Date(b.inicio) - new Date(a.inicio));
    
    // Criar linhas da tabela
    pedidosOrdenados.forEach(pedido => {
        const row = document.createElement('tr');
        
        // Formatar status
        let statusClass = '';
        let statusText = '';
        
        if (pedido.status === 'completed') {
            statusClass = 'badge-success';
            statusText = 'Finalizado';
        } else if (pedido.status === 'canceled') {
            statusClass = 'badge-danger';
            statusText = 'Cancelado';
        } else {
            statusClass = 'badge-warning';
            statusText = 'Em Andamento';
        }
        
        // Formatar prioridade
        let priorityText = 'Normal';
        if (pedido.prioridade === 'high') {
            priorityText = 'Alta';
        } else if (pedido.prioridade === 'urgent') {
            priorityText = 'Urgente';
        }
        
        // Formatar datas
        const dataInicio = new Date(pedido.inicio);
        const dataFormatada = dataInicio.toLocaleDateString() + ' ' + 
                              dataInicio.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
        
        // Formatar duração
        const duracao = formatarTempo(pedido.tempo);
        
        row.innerHTML = `
            <td>${pedido.id}</td>
            <td>${pedido.itens}</td>
            <td>${priorityText}</td>
            <td>${dataFormatada}</td>
            <td>${duracao}</td>
            <td>${pedido.operador}</td>
            <td><span class="badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="btn btn-primary view-order" data-id="${pedido.id}" style="padding: 5px 10px; font-size: 14px;">Detalhes</button>
            </td>
        `;
        
        // Adicionar evento para visualizar detalhes
        const viewButton = row.querySelector('.view-order');
        viewButton.addEventListener('click', () => visualizarDetalhesPedido(pedido));
        
        tableBody.appendChild(row);
    });
    
    console.log(`Histórico carregado: ${pedidosOrdenados.length} pedidos`);
}

// Função para visualizar detalhes de um pedido
// Função para atualizar as estatísticas
function atualizarEstatisticas() {
    // Recuperar pedidos do histórico
    const historico = JSON.parse(localStorage.getItem('historico-pedidos') || '[]');
    
    // Obter filtros
    const periodo = document.getElementById('stats-period').value;
    const userFilter = document.getElementById('stats-user').value;
    
    // Filtrar pedidos
    const pedidosFiltrados = historico.filter(pedido => {
        // Filtrar apenas pedidos concluídos
        const statusMatch = pedido.status === 'completed';
        
        // Filtrar por operador
        const userMatch = userFilter === 'all' || pedido.operador === userFilter;
        
        // Filtrar por período
        let periodoMatch = true;
        if (periodo !== 'all') {
            const dataHoje = new Date();
            const dataPedido = new Date(pedido.inicio);
            
            if (periodo === 'day') {
                // Hoje: mesmo dia, mês e ano
                periodoMatch = dataPedido.getDate() === dataHoje.getDate() &&
                               dataPedido.getMonth() === dataHoje.getMonth() &&
                               dataPedido.getFullYear() === dataHoje.getFullYear();
            } else if (periodo === 'week') {
                // Esta semana: últimos 7 dias
                const umaSemanaAtras = new Date(dataHoje);
                umaSemanaAtras.setDate(dataHoje.getDate() - 7);
                periodoMatch = dataPedido >= umaSemanaAtras;
            } else if (periodo === 'month') {
                // Este mês: mesmos mês e ano
                periodoMatch = dataPedido.getMonth() === dataHoje.getMonth() && 
                               dataPedido.getFullYear() === dataHoje.getFullYear();
            }
        }
        
        return statusMatch && userMatch && periodoMatch;
    });
    
    // Calcular estatísticas
    const totalPedidos = pedidosFiltrados.length;
    let tempoTotal = 0;
    
    pedidosFiltrados.forEach(pedido => {
        tempoTotal += pedido.tempo || 0;
    });
    
    const tempoMedio = totalPedidos > 0 ? Math.floor(tempoTotal / totalPedidos) : 0;
    
    // Calcular pedidos por hora
    let pedidosPorHora = 0;
    if (totalPedidos > 0 && tempoTotal > 0) {
        const horasTotal = tempoTotal / (1000 * 60 * 60);
        pedidosPorHora = totalPedidos / horasTotal;
    }
    
    // Atualizar elementos
    document.getElementById('total-orders').textContent = totalPedidos;
    document.getElementById('average-time').textContent = formatarTempo(tempoMedio);
    document.getElementById('orders-per-hour').textContent = pedidosPorHora.toFixed(1);
    
    // Criar gráfico
    criarGraficoEstatisticas(pedidosFiltrados);
    
    console.log(`Estatísticas atualizadas: ${totalPedidos} pedidos, tempo médio de ${formatarTempo(tempoMedio)}`);
}

// Função para criar gráfico de estatísticas
function criarGraficoEstatisticas(pedidos) {
    // Verificar se a biblioteca Chart.js está disponível
    if (typeof Chart === 'undefined') {
        console.error('Chart.js não está disponível!');
        return;
    }
    
    // Elemento canvas para o gráfico
    const ctx = document.getElementById('times-chart');
    if (!ctx) {
        console.error('Canvas para gráfico não encontrado!');
        return;
    }
    
    // Destruir gráfico anterior se existir
    if (window.estatisticasChart) {
        window.estatisticasChart.destroy();
    }
    
    // Se não há dados, limpar canvas
    if (pedidos.length === 0) {
        ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
        return;
    }
    
    // Processar dados por dia
    const dadosPorDia = {};
    const dadosPorOperador = {};
    
    pedidos.forEach(pedido => {
        // Agrupar por dia
        const data = new Date(pedido.inicio);
        const dataKey = `${data.getDate()}/${data.getMonth() + 1}/${data.getFullYear()}`;
        
        if (!dadosPorDia[dataKey]) {
            dadosPorDia[dataKey] = {
                count: 0,
                totalTempo: 0
            };
        }
        
        dadosPorDia[dataKey].count += 1;
        dadosPorDia[dataKey].totalTempo += pedido.tempo;
        
        // Agrupar por operador
        if (!dadosPorOperador[pedido.operador]) {
            dadosPorOperador[pedido.operador] = {
                count: 0,
                totalTempo: 0
            };
        }
        
        dadosPorOperador[pedido.operador].count += 1;
        dadosPorOperador[pedido.operador].totalTempo += pedido.tempo;
    });
    
    // Preparar dados para o gráfico
    const dias = Object.keys(dadosPorDia).sort((a, b) => {
        const [diaA, mesA, anoA] = a.split('/').map(Number);
        const [diaB, mesB, anoB] = b.split('/').map(Number);
        return new Date(anoA, mesA - 1, diaA) - new Date(anoB, mesB - 1, diaB);
    });
    
    const temposMedios = dias.map(dia => {
        return (dadosPorDia[dia].totalTempo / dadosPorDia[dia].count / 1000 / 60).toFixed(1); // Minutos
    });
    
    const quantidades = dias.map(dia => dadosPorDia[dia].count);
    
    // Criar gráfico de duplo eixo Y com as cores do tema
    window.estatisticasChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dias,
            datasets: [
                {
                    label: 'Tempo Médio (min)',
                    data: temposMedios,
                    backgroundColor: 'rgba(0, 168, 80, 0.5)',  // Verde claro
                    borderColor: 'rgba(0, 168, 80, 1)',
                    borderWidth: 1,
                    yAxisID: 'y-axis-1'
                },
                {
                    label: 'Número de Pedidos',
                    data: quantidades,
                    backgroundColor: 'rgba(245, 197, 24, 0.5)', // Amarelo
                    borderColor: 'rgba(245, 197, 24, 1)',
                    borderWidth: 1,
                    type: 'line',
                    yAxisID: 'y-axis-2'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                yAxes: [
                    {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        id: 'y-axis-1',
                        scaleLabel: {
                            display: true,
                            labelString: 'Tempo Médio (min)'
                        }
                    },
                    {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        id: 'y-axis-2',
                        gridLines: {
                            drawOnChartArea: false
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Número de Pedidos'
                        }
                    }
                ]
            }
        }
    });
    
    // Criar segundo gráfico: desempenho por operador
    const operadores = Object.keys(dadosPorOperador);
    
    // Se temos estatísticas por operador e existe um elemento para o gráfico
    if (operadores.length > 0 && document.getElementById('operator-chart')) {
        // Destruir gráfico anterior se existir
        if (window.operadoresChart) {
            window.operadoresChart.destroy();
        }
        
        // Calcular tempo médio por operador (em minutos)
        const tempoMedioPorOperador = operadores.map(op => {
            return (dadosPorOperador[op].totalTempo / dadosPorOperador[op].count / 1000 / 60).toFixed(1);
        });
        
        // Calcular total de pedidos por operador
        const pedidosPorOperador = operadores.map(op => dadosPorOperador[op].count);
        
        // Criar gráfico com as cores do tema
        window.operadoresChart = new Chart(document.getElementById('operator-chart'), {
            type: 'bar',
            data: {
                labels: operadores,
                datasets: [
                    {
                        label: 'Tempo Médio (min)',
                        data: tempoMedioPorOperador,
                        backgroundColor: 'rgba(0, 77, 64, 0.5)',  // Verde escuro
                        borderColor: 'rgba(0, 77, 64, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Total de Pedidos',
                        data: pedidosPorOperador,
                        backgroundColor: 'rgba(245, 197, 24, 0.5)', // Amarelo
                        borderColor: 'rgba(245, 197, 24, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        }
                    }]
                }
            }
        });
    }
}

// Função para exportar dados para CSV
function exportarCSV() {
    const historico = JSON.parse(localStorage.getItem('historico-pedidos') || '[]');
    
    if (historico.length === 0) {
        alert('Não há dados para exportar.');
        return;
    }
    
    // Cabeçalho do CSV
    let csvContent = 'ID Pedido,Itens,Prioridade,Operador,Início,Fim,Duração (ms),Status,Observações,Notas de Finalização\n';
    
    // Adicionar linhas
    historico.forEach(pedido => {
        // Função para escapar valores com vírgulas ou aspas
        const escapar = (texto) => {
            if (texto === null || texto === undefined) return '';
            const str = String(texto);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };
        
        // Mapear valores
        const prioridadeMap = {
            'normal': 'Normal',
            'high': 'Alta',
            'urgent': 'Urgente'
        };
        
        const statusMap = {
            'completed': 'Finalizado',
            'canceled': 'Cancelado',
            'active': 'Em Andamento'
        };
        
        // Formatar datas
        const dataInicio = new Date(pedido.inicio).toLocaleString();
        const dataFim = pedido.fim ? new Date(pedido.fim).toLocaleString() : '';
        
        // Criar linha
        const linha = [
            escapar(pedido.id),
            escapar(pedido.itens),
            escapar(prioridadeMap[pedido.prioridade] || pedido.prioridade),
            escapar(pedido.operador),
            escapar(dataInicio),
            escapar(dataFim),
            escapar(pedido.tempo),
            escapar(statusMap[pedido.status] || pedido.status),
            escapar(pedido.notas),
            escapar(pedido.notasFinalizacao)
        ].join(',');
        
        csvContent += linha + '\n';
    });
    
    // Criar arquivo para download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `timeflow-exportacao-${new Date().toISOString().slice(0,10)}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Função auxiliar para formatar o tempo
function formatarTempo(milisegundos) {
    if (!milisegundos) return '00:00:00';
    
    const segundos = Math.floor(milisegundos / 1000);
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segsRestantes = segundos % 60;
    
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segsRestantes).padStart(2, '0')}`;
}

// Função para visualizar detalhes de um pedido
    // Formatar datas
    const dataInicio = new Date(pedido.inicio);
    const inicioFormatado = dataInicio.toLocaleDateString() + ' ' + dataInicio.toLocaleTimeString();
    
    let fimFormatado = 'N/A';
    if (pedido.fim) {
        const dataFim = new Date(pedido.fim);
        fimFormatado = dataFim.toLocaleDateString() + ' ' + dataFim.toLocaleTimeString();
    }
    
    // Formatar status
    let statusText = 'Em Andamento';
    if (pedido.status === 'completed') {
        statusText = 'Finalizado';
    } else if (pedido.status === 'canceled') {
        statusText = 'Cancelado';
    }
    
    // Formatar prioridade
    let priorityText = 'Normal';
    if (pedido.prioridade === 'high') {
        priorityText = 'Alta';
    } else if (pedido.prioridade === 'urgent') {
        priorityText = 'Urgente';
    }
    
    // Criar modal
    const modalHTML = `
        <div class="modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;">
            <div class="modal-content" style="background-color: white; width: 80%; max-width: 600px; padding: 20px; border-radius: 8px; max-height: 90vh; overflow-y: auto;">
                <h2 style="margin-bottom: 20px; color: var(--primary-color);">Detalhes do Pedido: ${pedido.id}</h2>
                <div style="margin-bottom: 15px;">
                    <p><strong>Status:</strong> ${statusText}</p>
                    <p><strong>Operador:</strong> ${pedido.operador}</p>
                    <p><strong>Número de Itens:</strong> ${pedido.itens}</p>
                    <p><strong>Prioridade:</strong> ${priorityText}</p>
                    <p><strong>Início:</strong> ${inicioFormatado}</p>
                    <p><strong>Fim:</strong> ${fimFormatado}</p>
                    <p><strong>Duração Total:</strong> ${formatarTempo(pedido.tempo)}</p>
                </div>
                <div style="margin-bottom: 15px;">
                    <h3 style="color: var(--primary-color);">Observações Iniciais:</h3>
                    <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${pedido.notas || 'Nenhuma observação'}</p>
                </div>
                <div style="margin-bottom: 20px;">
                    <h3 style="color: var(--primary-color);">Notas de Finalização:</h3>
                    <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${pedido.notasFinalizacao || 'Nenhuma nota'}</p>
                </div>
                <button id="close-modal" class="btn btn-primary" style="width: 100%;">Fechar</button>
            </div>
        </div>
    `;
    
    // Adicionar ao DOM
    const modalElement = document.createElement('div');
    modalElement.innerHTML = modalHTML;
    document.body.appendChild(modalElement);
    
    // Evento para fechar
    document.getElementById('close-modal').addEventListener('click', () => {
        document.body.removeChild(modalElement);
    });
// Funções para captura automática de logs da impressora

// Caminho configurável para o diretório de logs da impressora
let diretorioMonitorado = '';
let intervaloMonitoramento = null;
let monitoramentoAtivo = false;

// Inicializar monitoramento automático
function inicializarMonitoramentoAutomatico() {
    console.log('Inicializando monitoramento automático de logs');
    
    // Adicionar elementos de interface para configuração
    adicionarInterfaceConfiguracao();
    
    // Verificar se há configuração salva
    carregarConfiguracaoMonitoramento();
    
    // Se existe configuração anterior, iniciar monitoramento
    if (diretorioMonitorado && monitoramentoAtivo) {
        iniciarMonitoramento();
    }
}

// Adicionar interface para configuração
function adicionarInterfaceConfiguracao() {
    // Localizar o container de controles da impressora
    const printerControls = document.querySelector('.printer-controls');
    if (!printerControls) return;
    
    // Adicionar seção de monitoramento automático
    const monitorSection = document.createElement('div');
    monitorSection.className = 'monitoring-section';
    monitorSection.innerHTML = `
        <h3 style="margin-top: 15px; margin-bottom: 10px; color: var(--primary-color);">Monitoramento Automático</h3>
        <div class="form-group">
            <label for="printer-directory">Diretório de logs da impressora:</label>
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                <input type="text" id="printer-directory" class="form-control" placeholder="Ex: C:\\Logs\\Impressora">
                <button id="browse-directory" class="btn btn-secondary">Procurar...</button>
            </div>
            <div class="form-check" style="margin-top: 10px;">
                <input type="checkbox" id="auto-monitoring" class="form-check-input">
                <label for="auto-monitoring" class="form-check-label">Ativar monitoramento automático</label>
            </div>
            <div style="margin-top: 10px;">
                <label for="monitoring-interval">Intervalo de verificação:</label>
                <select id="monitoring-interval" class="form-control">
                    <option value="5">A cada 5 segundos</option>
                    <option value="15">A cada 15 segundos</option>
                    <option value="30" selected>A cada 30 segundos</option>
                    <option value="60">A cada 1 minuto</option>
                    <option value="300">A cada 5 minutos</option>
                </select>
            </div>
        </div>
        <div class="monitoring-status" style="margin-top: 10px; padding: 8px; border-radius: 4px; background-color: #f5f5f5;">
            <p>Status: <span id="monitoring-status-text">Inativo</span></p>
            <div id="monitoring-indicator" style="display: none;">
                <div class="loading-indicator" style="margin-right: 5px;"></div>
                <span>Monitorando logs...</span>
            </div>
        </div>
        <button id="save-monitoring" class="btn btn-primary" style="margin-top: 10px;">Salvar Configurações</button>
    `;
    
    // Inserir após o botão de importar e antes dos outros controles
    const importButton = document.getElementById('import-log');
    if (importButton && importButton.parentNode) {
        const parentNode = importButton.parentNode.parentNode;
        parentNode.parentNode.insertBefore(monitorSection, parentNode.nextSibling);
    } else {
        printerControls.appendChild(monitorSection);
    }
    
    // Adicionar eventos aos elementos
    document.getElementById('browse-directory').addEventListener('click', selecionarDiretorio);
    document.getElementById('save-monitoring').addEventListener('click', salvarConfiguracaoMonitoramento);
    document.getElementById('auto-monitoring').addEventListener('change', function() {
        // Habilitar/desabilitar campos relacionados
        const ativo = this.checked;
        document.getElementById('monitoring-interval').disabled = !ativo;
        document.getElementById('printer-directory').disabled = !ativo;
        document.getElementById('browse-directory').disabled = !ativo;
    });
}

// Função para simular a seleção de diretório (em aplicação web real, isso seria restrito)
function selecionarDiretorio() {
    // Em uma aplicação web normal, não podemos acessar o sistema de arquivos diretamente
    // Esta é uma simulação para demonstração
    
    // Simular diálogo de seleção de diretório
    alert('Em um ambiente de produção, aqui seria exibido um diálogo para selecionar o diretório.');
    
    // Simular diretório selecionado
    const diretorios = [
        'C:\\Logs\\Impressora',
        'D:\\Sistema\\PrintLogs',
        'C:\\Users\\Admin\\Documents\\Logs',
        '/var/log/printer',
        '/usr/local/printer/logs'
    ];
    
    const diretorioSelecionado = diretorios[Math.floor(Math.random() * diretorios.length)];
    document.getElementById('printer-directory').value = diretorioSelecionado;
}

// Salvar configuração de monitoramento
function salvarConfiguracaoMonitoramento() {
    // Capturar valores da interface
    const diretorio = document.getElementById('printer-directory').value.trim();
    const ativo = document.getElementById('auto-monitoring').checked;
    const intervalo = parseInt(document.getElementById('monitoring-interval').value);
    
    // Validar diretório se monitoramento estiver ativo
    if (ativo && !diretorio) {
        alert('Por favor, informe o diretório de logs da impressora.');
        return;
    }
    
    // Salvar configuração
    diretorioMonitorado = diretorio;
    monitoramentoAtivo = ativo;
    
    // Salvar no localStorage
    const config = {
        diretorio,
        ativo,
        intervalo
    };
    localStorage.setItem('timeflow-printer-monitoring', JSON.stringify(config));
    
    // Parar monitoramento existente
    if (intervaloMonitoramento) {
        clearInterval(intervaloMonitoramento);
        intervaloMonitoramento = null;
    }
    
    // Iniciar monitoramento se ativo
    if (ativo) {
        iniciarMonitoramento();
        alert('Monitoramento automático ativado com sucesso!');
    } else {
        pararMonitoramento();
        alert('Configurações salvas. Monitoramento automático está desativado.');
    }
}

// Carregar configuração de monitoramento
function carregarConfiguracaoMonitoramento() {
    const configSalva = localStorage.getItem('timeflow-printer-monitoring');
    if (!configSalva) return;
    
    try {
        const config = JSON.parse(configSalva);
        
        // Atualizar variáveis
        diretorioMonitorado = config.diretorio || '';
        monitoramentoAtivo = config.ativo || false;
        
        // Atualizar interface
        document.getElementById('printer-directory').value = diretorioMonitorado;
        document.getElementById('auto-monitoring').checked = monitoramentoAtivo;
        
        if (config.intervalo) {
            const selectIntervalo = document.getElementById('monitoring-interval');
            for (let i = 0; i < selectIntervalo.options.length; i++) {
                if (parseInt(selectIntervalo.options[i].value) === config.intervalo) {
                    selectIntervalo.selectedIndex = i;
                    break;
                }
            }
        }
        
        // Habilitar/desabilitar campos
        document.getElementById('monitoring-interval').disabled = !monitoramentoAtivo;
        document.getElementById('printer-directory').disabled = !monitoramentoAtivo;
        document.getElementById('browse-directory').disabled = !monitoramentoAtivo;
        
        console.log('Configuração de monitoramento carregada:', config);
    } catch (e) {
        console.error('Erro ao carregar configuração de monitoramento:', e);
    }
}

// Iniciar monitoramento automático
function iniciarMonitoramento() {
    // Verificar se já existe monitoramento ativo
    if (intervaloMonitoramento) {
        clearInterval(intervaloMonitoramento);
    }
    
    // Obter intervalo configurado
    const intervalo = parseInt(document.getElementById('monitoring-interval').value);
    
    // Atualizar status na interface
    atualizarStatusMonitoramento(true);
    
    // Executar primeira verificação imediatamente
    verificarNovosLogs();
    
    // Configurar verificação periódica
    intervaloMonitoramento = setInterval(verificarNovosLogs, intervalo * 1000);
    
    console.log(`Monitoramento iniciado: verificando a cada ${intervalo} segundos`);
}

// Parar monitoramento
function pararMonitoramento() {
    if (intervaloMonitoramento) {
        clearInterval(intervaloMonitoramento);
        intervaloMonitoramento = null;
    }
    
    // Atualizar status na interface
    atualizarStatusMonitoramento(false);
    
    console.log('Monitoramento automático parado');
}

// Atualizar indicadores de status na interface
function atualizarStatusMonitoramento(ativo) {
    const statusText = document.getElementById('monitoring-status-text');
    const indicator = document.getElementById('monitoring-indicator');
    
    if (ativo) {
        statusText.textContent = 'Ativo';
        statusText.style.color = 'var(--success-color)';
        indicator.style.display = 'flex';
    } else {
        statusText.textContent = 'Inativo';
        statusText.style.color = 'var(--text-secondary)';
        indicator.style.display = 'none';
    }
}

// Verificar novos logs
function verificarNovosLogs() {
    console.log(`Verificando novos logs no diretório: ${diretorioMonitorado}`);
    
    // Em uma aplicação real, faríamos uma requisição para um serviço backend
    // que verificaria o diretório no servidor e retornaria novos arquivos
    
    // Simulação para demonstração
    const temNovoLog = Math.random() > 0.5; // 50% de chance de ter novo log
    
    if (temNovoLog) {
        console.log('Novos logs encontrados!');
        
        // Simular conteúdo do log
        gerarLogSimulado();
    } else {
        console.log('Nenhum novo log encontrado nesta verificação');
    }
    
    // Atualizar hora da última verificação
    atualizarHoraUltimaAtualizacao();
}

// Gerar log simulado para demonstração
function gerarLogSimulado() {
    // Criar dados de pedido simulados
    const qtdPedidos = Math.floor(Math.random() * 3) + 1; // 1-3 pedidos
    
    let conteudoLog = '';
    for (let i = 0; i < qtdPedidos; i++) {
        const idPedido = `A${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        const itens = Math.floor(Math.random() * 20) + 1;
        const cliente = ['João Silva', 'Maria Oliveira', 'Carlos Santos', 'Ana Lima', 'Pedro Costa'][Math.floor(Math.random() * 5)];
        
        // Criar linha de log no formato que o sistema pode interpretar
        conteudoLog += `[${new Date().toISOString()}] IMPRESSÃO - pedido: ${idPedido}, itens: ${itens}, cliente: ${cliente}\n`;
    }
    
    // Processar o log simulado
    processarLogImpressora(conteudoLog);
    
    // Incrementar contador de novos pedidos
    contadorNovosPedidos += qtdPedidos;
    atualizarContadorAba();
}

// Adicionar à função de inicialização existente
function inicializarPedidosImpressora() {
    console.log('Inicializando funcionalidade de Pedidos Impressora');
    
    // Código existente...
    carregarPedidosImpressora();
    
    document.getElementById('import-log').addEventListener('click', importarLogImpressora);
    
    document.getElementById('refresh-interval').addEventListener('change', function() {
        const intervalo = parseInt(this.value);
        configurarAtualizacaoAutomatica(intervalo);
    });
    
    document.getElementById('search-printer-orders').addEventListener('input', filtrarPedidosImpressora);
    document.getElementById('printer-order-status').addEventListener('change', filtrarPedidosImpressora);
    
    adicionarContadorAba();
    
    // Inicializar monitoramento automático
    inicializarMonitoramentoAutomatico();
}

// Adicione este código ao seu arquivo script.js

// Endpoint para receber dados do monitor de arquivos
function inicializarEndpointMonitor() {
    // Registrar evento de mensagem para comunicação com o monitor externo
    window.addEventListener('message', receberDadosDoMonitor);
    
    // Verificar se há mensagens via localStorage (método alternativo)
    verificarMensagensLocalStorage();
    
    console.log('Endpoint para monitor de arquivos inicializado');
    
    // Para testes, adicione esta linha no console:
    // window.postMessage({type: 'printer-orders', action: 'new-log', data: {pedidos: [{id: 'TEST123', itens: 5, origem: 'Monitor Windows'}]}}, '*');
}

// Receber dados via evento de mensagem
function receberDadosDoMonitor(event) {
    // Verificar origem da mensagem (em produção, seria mais restrito)
    const dados = event.data;
    
    // Verificar se é uma mensagem de pedidos da impressora
    if (dados && dados.type === 'printer-orders') {
        console.log('Dados recebidos do monitor externo:', dados);
        
        if (dados.action === 'new-log' && dados.data && dados.data.pedidos) {
            processarPedidosDoMonitor(dados.data.pedidos);
        }
    }
}

// Verificar mensagens deixadas via localStorage
function verificarMensagensLocalStorage() {
    const mensagem = localStorage.getItem('timeflow-monitor-message');
    if (mensagem) {
        try {
            const dados = JSON.parse(mensagem);
            console.log('Mensagem do monitor via localStorage:', dados);
            if (dados.pedidos && Array.isArray(dados.pedidos)) {
                processarPedidosDoMonitor(dados.pedidos);
            }
            localStorage.removeItem('timeflow-monitor-message');
        } catch (e) {
            console.error('Erro ao processar mensagem do monitor:', e);
        }
    }
    setTimeout(verificarMensagensLocalStorage, 5000);
}

function processarPedidosDoMonitor(novoPedidos) {
    if (!Array.isArray(novoPedidos) || novoPedidos.length === 0) return;
    pedidosImpressora = JSON.parse(localStorage.getItem('timeflow-printer-orders') || '[]');
    let pedidosAdicionados = 0;
    
    // Adicionar novos pedidos
    novoPedidos.forEach(pedido => {
        // Verificar se o pedido já existe
        if (!pedidosImpressora.some(p => p.id === pedido.id)) {
            const novoPedido = {
                id: pedido.id,
                dataHora: pedido.dataHora || new Date().toISOString(),
                itens: pedido.itens || 1,
                origem: pedido.origem || 'Monitor Windows',
                status: 'pending',
                logOriginal: pedido.logOriginal || `Pedido recebido do monitor: ${pedido.id}`
            };
            
            // Adicionar à lista
            pedidosImpressora.push(novoPedido);
            pedidosAdicionados++;
        }
    });
    
    // Se houve novos pedidos, atualizar
    if (pedidosAdicionados > 0) {
        salvarPedidosImpressora();
        contadorNovosPedidos += pedidosAdicionados;
        atualizarContadorAba();
        atualizarTabelaPedidosImpressora();
        atualizarHoraUltimaAtualizacao();
        
        console.log(`${pedidosAdicionados} novos pedidos adicionados pelo monitor`);
    }
}
// Adicionar à inicialização
document.addEventListener('DOMContentLoaded', function() {
    inicializarEndpointMonitor();
});