const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Dados em memória para teste
let barbeiros = {
  'joao-barbeiro': {
    nome: 'João Silva',
    whatsapp: '5531999999999',
    slug: 'joao-barbeiro',
    servicos: ['Corte', 'Barba', 'Corte + Barba']
  }
};

let agendamentos = [];

// Rota de teste
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Agendamento funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Rota para buscar barbeiro
app.get('/api/barbeiro/:slug', (req, res) => {
  const barbeiro = barbeiros[req.params.slug];
  if (!barbeiro) {
    return res.status(404).json({ error: 'Barbeiro não encontrado' });
  }
  res.json(barbeiro);
});

// Rota para buscar agendamentos
app.get('/api/agendamentos/:barbeiro_slug/:data', (req, res) => {
  const { barbeiro_slug, data } = req.params;
  const agendamentosDoDia = agendamentos.filter(a => 
    a.barbeiro_slug === barbeiro_slug && a.data === data
  );
  res.json(agendamentosDoDia);
});

// Rota para criar agendamento
app.post('/api/agendamento', (req, res) => {
  const { barbeiro_slug, data, horario, cliente_whatsapp, servico } = req.body;
  
  const novoAgendamento = {
    id: Date.now().toString(),
    barbeiro_slug,
    data,
    horario,
    cliente_whatsapp,
    servico,
    status: 'confirmado',
    criado_em: new Date()
  };
  
  agendamentos.push(novoAgendamento);
  
  console.log('Agendamento criado:', novoAgendamento);
  res.json({ success: true, agendamento: novoAgendamento });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

module.exports = app;
