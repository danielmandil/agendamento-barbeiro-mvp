const axios = require('axios');

class WhatsAppService {
    constructor() {
        // Configurações do Meta Developer
        this.accessToken = 'EAAOa52VHi6cBO605z9Cd1bliR0ZBIqO8V7pNZBvVJYLhxDGkPvZCXJ15Ri7ykobfzrevvxa4NrnQR3SVl3yt4h3ZBM1bZAcNByTSB0UYXlh23ZA4vqXr6AmQ1PN1r5iMWjbJoSFsnZC0Mvcq1wI2ZAlTZAc4q3ciBFjp0L21mZC3roXcOd2a42HWqiFLb3VGf6vvstUWN8Nat8qLDt7oZBnYSmdrKK00NlNFi8f';
        this.phoneNumberId = '642777122260896';
        this.version = 'v22.0';
        this.baseURL = `https://graph.facebook.com/${this.version}/${this.phoneNumberId}`;
    }

    // Enviar mensagem simples
    async enviarMensagem(para, mensagem) {
        try {
            const response = await axios.post(
                `${this.baseURL}/messages`,
                {
                    messaging_product: "whatsapp",
                    to: para,
                    type: "text",
                    text: { body: mensagem }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log('✅ Mensagem enviada:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Erro ao enviar mensagem:', error.response?.data || error.message);
            throw error;
        }
    }

    // Confirmar agendamento
    async confirmarAgendamento(dados) {
        const { cliente_whatsapp, barbeiro_nome, data, horario, servico } = dados;
        
        const dataFormatada = new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
        
        const mensagem = `✅ *Agendamento Confirmado!*

👤 *Cliente:* Você
💇‍♂️ *Barbeiro:* ${barbeiro_nome}
📅 *Data:* ${dataFormatada}
🕐 *Horário:* ${horario}
✂️ *Serviço:* ${servico}

📍 *Local:* [Endereço da barbearia]

⏰ *Lembrete:* Você receberá uma confirmação 1 dia antes.

❌ *Para cancelar:* Responda CANCELAR`;

        return await this.enviarMensagem(cliente_whatsapp, mensagem);
    }
}

module.exports = WhatsAppService;
