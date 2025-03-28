document.addEventListener('DOMContentLoaded', function() {
    console.log('Time Flow - Login v1.0');
    
    // Adicionar efeito de foco aos campos de entrada
    const inputFields = document.querySelectorAll('input');
    inputFields.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        input.addEventListener('blur', function() {
            if (this.value === '') {
                this.parentElement.classList.remove('focused');
            }
        });
        // Verificar se o campo já tem valor
        if (input.value !== '') {
            input.parentElement.classList.add('focused');
        }
    });
    
    // Verificar se há usuário salvo no localStorage
    const rememberedUser = localStorage.getItem('timeflow-remembered-user');
    if (rememberedUser) {
        document.getElementById('username').value = rememberedUser;
        document.getElementById('remember').checked = true;
        // Adicionar classe para campos preenchidos
        document.getElementById('username').parentElement.classList.add('focused');
    }
    
    // Gerenciar modal de registro
    const registerLink = document.getElementById('register-link');
    const registerModal = document.getElementById('register-modal');
    const closeModal = document.querySelector('.close-modal');
    
    registerLink.addEventListener('click', function(e) {
        e.preventDefault();
        registerModal.style.display = 'flex';
    });
    
    closeModal.addEventListener('click', function() {
        registerModal.style.display = 'none';
    });
    
    window.addEventListener('click', function(e) {
        if (e.target === registerModal) {
            registerModal.style.display = 'none';
        }
    });
    
    // Gerenciar formulário de login
    const loginButton = document.getElementById('login-button');
    
    loginButton.addEventListener('click', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember').checked;
        
        if (!username || !password) {
            showAlert('Por favor, preencha todos os campos.');
            return;
        }
        
        // Verificar credenciais (simulado)
        if (verificarCredenciais(username, password)) {
            // Salvar usuário se "lembrar" estiver marcado
            if (remember) {
                localStorage.setItem('timeflow-remembered-user', username);
            } else {
                localStorage.removeItem('timeflow-remembered-user');
            }
            
            // Salvar status de login e redirecionar
            localStorage.setItem('timeflow-logged-in', 'true');
            localStorage.setItem('timeflow-user', username);
            
            // Redirecionar para a página principal
            window.location.href = 'index.html';
        } else {
            showAlert('Usuário ou senha incorretos.');
        }
    });
    
    // Gerenciar formulário de solicitação de acesso
    const submitRequestButton = document.querySelector('.submit-request-button');
    
    submitRequestButton.addEventListener('click', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const role = document.getElementById('register-role').value;
        
        if (!name || !email || !role) {
            showAlert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        
        // Simular envio de solicitação
        showAlert('Solicitação enviada com sucesso! Em breve entraremos em contato.', 'success');
        registerModal.style.display = 'none';
        
        // Limpar formulário
        document.getElementById('register-name').value = '';
        document.getElementById('register-email').value = '';
        document.getElementById('register-role').value = '';
        document.getElementById('register-message').value = '';
    });
});

// Função para verificar credenciais (simulado para demonstração)
function verificarCredenciais(username, password) {
    // Em um ambiente real, isso seria feito com uma API
    
    // Lista de usuários simulados para demonstração
    const usuarios = [
        { usuario: 'admin', senha: 'admin123' },
        { usuario: 'operador1', senha: 'op1234' },
        { usuario: 'supervisor', senha: 'super123' }
    ];
    
    return usuarios.some(user => 
        user.usuario === username && user.senha === password
    );
}

// Função para mostrar mensagens de alerta
function showAlert(message, type = 'error') {
    // Verificar se já existe um alerta e removê-lo
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // Criar elemento de alerta
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    // Adicionar ao DOM
    document.querySelector('.login-card').appendChild(alert);
    
    // Estilizar o alerta
    alert.style.backgroundColor = type === 'error' ? '#f8d7da' : '#d4edda';
    alert.style.color = type === 'error' ? '#721c24' : '#155724';
    alert.style.padding = '10px 15px';
    alert.style.borderRadius = '6px';
    alert.style.marginTop = '20px';
    alert.style.fontSize = '0.9rem';
    alert.style.textAlign = 'center';
    
    // Remover após 5 segundos
    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transition = 'opacity 0.5s';
        
        setTimeout(() => {
            alert.remove();
        }, 500);
    }, 5000);
}

// Verificação de proteção contra inatividade
function iniciarVerificacaoSessao() {
    // Verificar se o usuário está logado
    if (localStorage.getItem('timeflow-logged-in') === 'true') {
        // Última atividade (timestamp atual)
        let ultimaAtividade = Date.now();
        
        // Atualizar timestamp em interações do usuário
        document.addEventListener('click', () => ultimaAtividade = Date.now());
        document.addEventListener('keypress', () => ultimaAtividade = Date.now());
        
        // Verificar inatividade a cada minuto
        setInterval(() => {
            const tempoInativo = Date.now() - ultimaAtividade;
            const limiteInatividade = 30 * 60 * 1000; // 30 minutos
            
            if (tempoInativo > limiteInatividade) {
                // Encerrar sessão por inatividade
                localStorage.removeItem('timeflow-logged-in');
                alert('Sua sessão expirou por inatividade. Por favor, faça login novamente.');
                window.location.href = 'login.html';
            }
        }, 60000);
    }
}