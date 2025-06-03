const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

// Inicializar Firebase
const serviceAccount = require('./firebase-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Agendamento funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Rota para criar barbeiro
app.post('/api/barbeiro', async (req, res) => {
  try {
    const { nome, whatsapp, slug } = req.body;
    
    console.log('Criando barbeiro:', { nome, whatsapp, slug });
    
    const barbeiroData = {
      nome,
      whatsapp,
      slug,
      horario_funcionamento: '9-18',
      servicos: ['Corte', 'Barba', 'Corte + Barba'],
      criado_em: new Date()
    };
    
    await db.collection('barbeiros').doc(slug).set(barbeiroData);
    console.log('Barbeiro criado com sucesso!');
    
    res.json({ success: true, barbeiro: barbeiroData });
  } catch (error) {
    console.error('Erro ao criar barbeiro:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rota para buscar barbeiro
app.get('/api/barbeiro/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;
    console.log('Buscando barbeiro:', slug);
    
    const doc = await db.collection('barbeiros').doc(slug).get();
    if (!doc.exists) {
      console.log('Barbeiro não encontrado:', slug);
      return res.status(404).json({ error: 'Barbeiro não encontrado' });
    }
    
    const barbeiro = doc.data();
    console.log('Barbeiro encontrado:', barbeiro.nome);
    res.json(barbeiro);
  } catch (error) {
    console.error('Erro ao buscar barbeiro:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rota para buscar agendamentos
app.get('/api/agendamentos/:barbeiro_slug/:data', async (req, res) => {
  try {
    const { barbeiro_slug, data } = req.params;
    console.log('Buscando agendamentos:', { barbeiro_slug, data });
    
    const snapshot = await db.collection('agendamentos')
      .where('barbeiro_slug', '==', barbeiro_slug)
      .where('data', '==', data)
      .get();
    
    const agendamentos = [];
    snapshot.forEach(doc => {
      agendamentos.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`Encontrados ${agendamentos.length} agendamentos`);
    res.json(agendamentos);
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Importar WhatsApp Service
const WhatsAppService = require('./whatsapp');
const whatsapp = new WhatsAppService();

// Rota para webhook do WhatsApp
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    // Verificar token (use um token secreto seu)
    if (mode === 'subscribe' && token === 'wm123') {
        console.log('✅ Webhook verificado');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Receber mensagens do WhatsApp
app.post('/webhook', (req, res) => {
    const result = whatsapp.processarWebhook(req.body);
    res.status(200).json(result);
});

// ROTA DE AGENDAMENTO COM WHATSAPP (ÚNICA)
app.post('/api/agendamento', async (req, res) => {
    try {
        const { barbeiro_slug, data, horario, cliente_whatsapp, servico } = req.body;
        
        console.log('Criando agendamento:', { barbeiro_slug, data, horario, servico });
        
        // Buscar dados do barbeiro
        const barbeiroDoc = await db.collection('barbeiros').doc(barbeiro_slug).get();
        const barbeiroData = barbeiroDoc.data();
        
        const agendamentoId = `${barbeiro_slug}-${data}-${horario.replace(':', '-')}`;
        const agendamentoData = {
            barbeiro_slug,
            data,
            horario,
            cliente_whatsapp,
            servico,
            status: 'confirmado',
            criado_em: new Date()
        };
        
        // Salvar no Firebase
        await db.collection('agendamentos').doc(agendamentoId).set(agendamentoData);
        console.log('Agendamento criado com sucesso!');
        
        // NOVO: Enviar confirmação via WhatsApp
        try {
            await whatsapp.confirmarAgendamento({
                cliente_whatsapp,
                barbeiro_nome: barbeiroData.nome,
                data,
                horario,
                servico
            });
            console.log('✅ Confirmação WhatsApp enviada');
        } catch (whatsappError) {
            console.error('❌ Erro ao enviar WhatsApp:', whatsappError);
            // Não falhar o agendamento se WhatsApp der erro
        }
        
        res.json({ success: true, agendamento: agendamentoData });
    } catch (error) {
        console.error('Erro ao criar agendamento:', error);
        res.status(500).json({ error: error.message });
    }
});

// Rota de teste WhatsApp
app.post('/api/test-whatsapp', async (req, res) => {
  try {
    const { numero, mensagem } = req.body;
    console.log('🧪 Testando WhatsApp para:', numero);
    
    const resultado = await whatsapp.enviarMensagem(numero, mensagem);
    console.log('✅ Teste WhatsApp OK:', resultado);
    
    res.json({ success: true, resultado });
  } catch (error) {
    console.error('❌ Erro no teste WhatsApp:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Teste em: http://localhost:${PORT}`);
});
