// Configurações
const API_BASE = 'http://localhost:3000/api';
let barbeiroData = null;
let horarioSelecionado = null;

// Horários disponíveis (9h às 18h, intervalos de 30min)
const HORARIOS_DISPONIVEIS = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
];

// Inicializar página
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando aplicação...');
    
    const slug = getSlugFromUrl();
    console.log('📍 Slug detectado:', slug);
    
    if (!slug) {
        showError('Link inválido! Verifique a URL.');
        return;
    }
    
    await carregarBarbeiro(slug);
    configurarEventos();
    definirDataMinima();
});

// Extrair slug da URL (para teste local, usar slug fixo)
function getSlugFromUrl() {
    // Para desenvolvimento local, retornar slug fixo
    // Em produção, seria: window.location.pathname.split('/')[1]
    return 'joao-barbeiro';
}

// Carregar dados do barbeiro
async function carregarBarbeiro(slug) {
    try {
        console.log('🔍 Carregando barbeiro:', slug);
        showLoading('Carregando dados...');
        
        const response = await fetch(`${API_BASE}/barbeiro/${slug}`);
        
        if (!response.ok) {
            throw new Error(`Barbeiro não encontrado (${response.status})`);
        }
        
        barbeiroData = await response.json();
        console.log('✅ Barbeiro carregado:', barbeiroData);
        
        // Atualizar interface
        document.getElementById('barbeiro-nome').textContent = 
            `Agendar com ${barbeiroData.nome}`;
        
        hideLoading();
        
    } catch (error) {
        console.error('❌ Erro ao carregar barbeiro:', error);
        showError('Erro ao carregar dados do barbeiro. Verifique se o link está correto.');
    }
}

// Configurar eventos
function configurarEventos() {
    const dataInput = document.getElementById('data-agendamento');
    const servicoSelect = document.getElementById('servico-select');
    const whatsappInput = document.getElementById('cliente-whatsapp');
    
    dataInput.addEventListener('change', carregarHorarios);
    servicoSelect.addEventListener('change', atualizarResumo);
    whatsappInput.addEventListener('input', atualizarResumo);
    
    // Máscara para WhatsApp
    whatsappInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 11) {
            value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }
        e.target.value = value;
    });
}

// Definir data mínima (hoje)
function definirDataMinima() {
    const hoje = new Date();
    const dataFormatada = hoje.toISOString().split('T')[0];
    
    const dataInput = document.getElementById('data-agendamento');
    dataInput.min = dataFormatada;
    dataInput.value = dataFormatada;
    
    console.log('📅 Data mínima definida:', dataFormatada);
    carregarHorarios();
}
// Carregar horários disponíveis
async function carregarHorarios() {
    const data = document.getElementById('data-agendamento').value;
    if (!data || !barbeiroData) return;
    
    console.log('🕐 Carregando horários para:', data);
    
    try {
        showLoadingHorarios();
        
        // Buscar agendamentos existentes
        const response = await fetch(`${API_BASE}/agendamentos/${barbeiroData.slug}/${data}`);
        const agendamentos = await response.json();
        
        console.log(`📋 Encontrados ${agendamentos.length} agendamentos:`, agendamentos);
        
        // Mapear horários ocupados
        const horariosOcupados = agendamentos.map(a => a.horario);
        console.log('🚫 Horários ocupados:', horariosOcupados);
        
        // Renderizar grid de horários
        renderizarHorarios(horariosOcupados);
        
        // Resetar seleção quando recarregar horários
        horarioSelecionado = null;
        atualizarResumo();
        
    } catch (error) {
        console.error('❌ Erro ao carregar horários:', error);
        renderizarHorarios([]); // Mostrar todos disponíveis em caso de erro
    }
}

// Mostrar loading nos horários
function showLoadingHorarios() {
    const grid = document.getElementById('horarios-grid');
    grid.innerHTML = '';
    
    // Criar slots de loading
    for (let i = 0; i < 6; i++) {
        const div = document.createElement('div');
        div.className = 'loading time-slot';
        div.innerHTML = '&nbsp;';
        grid.appendChild(div);
    }
}

// Renderizar horários no grid
function renderizarHorarios(horariosOcupados) {
    const grid = document.getElementById('horarios-grid');
    grid.innerHTML = '';
    
    HORARIOS_DISPONIVEIS.forEach(horario => {
        const div = document.createElement('div');
        div.className = 'time-slot';
        div.textContent = horario;
        div.setAttribute('data-horario', horario);
        
        if (horariosOcupados.includes(horario)) {
            div.className += ' occupied';
            div.title = 'Horário ocupado';
        } else {
            div.onclick = () => selecionarHorario(horario, div);
            div.title = 'Clique para selecionar';
        }
        
        grid.appendChild(div);
    });
    
    console.log('✅ Horários renderizados');
}

// Selecionar horário
function selecionarHorario(horario, elemento) {
    console.log('⏰ Horário selecionado:', horario);
    
    // Remover seleção anterior
    document.querySelectorAll('.time-slot.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Selecionar novo horário
    elemento.classList.add('selected');
    horarioSelecionado = horario;
    
    atualizarResumo();
}

// Atualizar resumo do agendamento
function atualizarResumo() {
    const data = document.getElementById('data-agendamento').value;
    const servico = document.getElementById('servico-select').value;
    const whatsapp = document.getElementById('cliente-whatsapp').value;
    
    const resumoDiv = document.getElementById('resumo-agendamento');
    const conteudoDiv = document.getElementById('resumo-conteudo');
    
    if (data && horarioSelecionado && servico && whatsapp) {
        const dataFormatada = new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
        
        conteudoDiv.innerHTML = `
            <div><strong>Data:</strong> ${dataFormatada}</div>
            <div><strong>Horário:</strong> ${horarioSelecionado}</div>
            <div><strong>Serviço:</strong> ${servico}</div>
            <div><strong>WhatsApp:</strong> ${whatsapp}</div>
        `;
        
        resumoDiv.classList.remove('hidden');
    } else {
        resumoDiv.classList.add('hidden');
    }
}

// Confirmar agendamento
async function confirmarAgendamento() {
    const data = document.getElementById('data-agendamento').value;
    const servico = document.getElementById('servico-select').value;
    const whatsapp = document.getElementById('cliente-whatsapp').value;
    
    console.log('📝 Tentando confirmar agendamento:', {
        data, horarioSelecionado, servico, whatsapp
    });
    
    // Validações
    if (!data) {
        showError('❌ Selecione uma data!');
        return;
    }
    
    if (!horarioSelecionado) {
        showError('❌ Selecione um horário!');
        return;
    }
    
    if (!servico) {
        showError('❌ Selecione um serviço!');
        return;
    }
    
    if (!whatsapp || whatsapp.length < 10) {
        showError('❌ Digite um WhatsApp válido!');
        return;
    }
    
    const btn = document.getElementById('confirmar-btn');
    btn.disabled = true;
    btn.textContent = '⏳ Confirmando...';
    
    try {
        const response = await fetch(`${API_BASE}/agendamento`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                barbeiro_slug: barbeiroData.slug,
                data,
                horario: horarioSelecionado,
                cliente_whatsapp: whatsapp.replace(/\D/g, ''), // Apenas números
                servico
            })
        });
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        const resultado = await response.json();
        console.log('✅ Agendamento confirmado:', resultado);
        
        const dataFormatada = new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
        showSuccess(`🎉 Agendamento confirmado!<br>
            <strong>${dataFormatada} às ${horarioSelecionado}</strong><br>
            <small>Em breve você receberá a confirmação no WhatsApp</small>`);
        
        // Recarregar horários após 3 segundos
        setTimeout(() => {
            carregarHorarios();
            document.getElementById('resumo-agendamento').classList.add('hidden');
            horarioSelecionado = null;
        }, 3000);
        
    } catch (error) {
        console.error('❌ Erro ao confirmar agendamento:', error);
        showError('❌ Erro ao confirmar agendamento. Tente novamente.');
    } finally {
        btn.disabled = false;
        btn.textContent = '✅ Confirmar Agendamento';
    }
}

// Funções de UI
function showLoading(message = 'Carregando...') {
    const statusDiv = document.getElementById('status-message');
    statusDiv.className = 'mt-4 p-3 rounded-lg bg-blue-100 text-blue-700';
    statusDiv.innerHTML = `<div class="flex items-center gap-2">
        <div class="animate-spin w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full"></div>
        ${message}
    </div>`;
    statusDiv.classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('status-message').classList.add('hidden');
}

function showError(message) {
    const div = document.getElementById('status-message');
    div.className = 'mt-4 p-3 rounded-lg bg-red-100 text-red-700 border border-red-200';
    div.innerHTML = message;
    div.classList.remove('hidden');
    
    // Auto-hide após 5 segundos
    setTimeout(() => div.classList.add('hidden'), 5000);
}

function showSuccess(message) {
    const div = document.getElementById('status-message');
    div.className = 'mt-4 p-3 rounded-lg bg-green-100 text-green-700 border border-green-200';
    div.innerHTML = message;
    div.classList.remove('hidden');
    
    // Auto-hide após 8 segundos
    setTimeout(() => div.classList.add('hidden'), 8000);
}