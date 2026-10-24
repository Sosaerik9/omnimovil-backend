const WebSocket = require('ws');

// Puerto dinámico asignado por el hosting gratuito o el puerto 8089 por defecto
const PORT = process.env.PORT || 8089;
const wss = new WebSocket.Server({ port: PORT });

const activeClients = new Map();

wss.on('connection', (ws) => {
    console.log('Nuevo cliente conectado al servidor de llamadas OmniMovil');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            // Registrar línea del usuario
            if (data.type === 'register') {
                activeClients.set(data.numero, ws);
                ws.numero = data.numero;
                console.log(`Línea registrada: ${data.numero}`);
            }

            // Enrutar llamadas y señales WebRTC (Oferta, Respuesta, ICE, Colgar)
            if (['call-offer', 'call-answer', 'ice-candidate', 'hangup'].includes(data.type)) {
                const targetSocket = activeClients.get(data.to);
                if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
                    targetSocket.send(JSON.stringify({
                        from: ws.numero,
                        ...data
                    }));
                    console.log(`Señal '${data.type}' enviada de ${ws.numero} a ${data.to}`);
                } else {
                    ws.send(JSON.stringify({ type: 'error', message: 'El usuario no está disponible.' }));
                }
            }
        } catch (e) {
            console.error("Error procesando mensaje:", e);
        }
    });

    ws.on('close', () => {
        if (ws.numero) {
            activeClients.delete(ws.numero);
            console.log(`Línea desconectada: ${ws.numero}`);
        }
    });
});

console.log(`🚀 Servidor de llamadas corriendo en el puerto ${PORT}`);
