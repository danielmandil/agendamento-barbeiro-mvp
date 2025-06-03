const cron = require('node-cron');
const admin = require('firebase-admin');
const WhatsAppService = require('./whatsapp');

const db = admin.firestore();
const whatsapp = new WhatsAppService();

// Executar todo dia às 10h
cron.schedule('0 10 * * *', async () => {
    console.log('🔔 Verificando lembretes...');
    
    try {
        // Data de amanhã
        const amanha = new Date();
        amanha.setDate(amanha.getDate() + 1);
        const dataAmanha = amanha.toISOString().split('T')[0];
        
        // Buscar agendamentos de amanhã
        const snapshot = await db.collection('agendamentos')
            .where('data', '==', dataAmanha)
            .where('status', '==', 'confirmado')
            .get();
        
        console.log(`📋 Encontrados ${snapshot.size} agendamentos para amanhã`);
        
        // Enviar lembretes
        for (const doc of snapshot.docs) {
            const agendamento = doc.data();
            
            // Buscar dados do barbeiro
            const barbeiroDoc = await db.collection('barbeiros')
                .doc(agendamento.barbeiro_slug).get();
            const barbeiro = barbeiroDoc.data();
            
            try {
                await whatsapp.enviarLembrete({
                    cliente_whatsapp: agendamento.cliente_whatsapp,
                    barbeiro_nome: barbeiro.nome,
                    data: agendamento.data,
                    horario: agendamento.horario,
                    servico: agendamento.servico
                });
                
                console.log(`✅ Lembrete enviado para ${agendamento.cliente_whatsapp}`);
            } catch (error) {
                console.error(`❌ Erro ao enviar lembrete:`, error);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro no scheduler:', error);
    }
});

console.log('⏰ Scheduler de lembretes iniciado');
