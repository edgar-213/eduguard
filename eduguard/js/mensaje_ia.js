// ========================================
//  SISTEMA DE MENSAJES DE APOYO - EduGuard
//  Con modal overlay centrado
// ========================================

const FLOWISE_URL = "https://cloud.flowiseai.com/api/v1/prediction/fee038ce-9995-4888-8183-70ddf1acd816";
const TIEMPO_ESPERA_HORAS = 6;

// ===============================
// FUNCIÓN PRINCIPAL
// ===============================
async function verificarYMostrarMensajeApoyo() {
    try {
        const response = await fetch('../php/get_ultima_nota.php');
        const data = await response.json();

        if (!data.success) {
            console.log('❌ No hay notas:', data.message);
            return;
        }

        console.log('✅ Nota obtenida:', data);

        const { materia, nota_reciente, promedio_historico, tendencia, nota_id, timestamp, hash } = data;

        // Validación de hash
        const ultimoHashProcesado = localStorage.getItem('ultimo_hash_nota');
        const esNotaNueva = ultimoHashProcesado !== hash;
        
        if (!esNotaNueva) {
            const ultimaVezMostrado = localStorage.getItem('ultimo_timestamp_mostrado');
            
            if (ultimaVezMostrado) {
                const tiempoTranscurrido = Date.now() - parseInt(ultimaVezMostrado);
                const horasTranscurridas = tiempoTranscurrido / (1000 * 60 * 60);
                
                if (horasTranscurridas < TIEMPO_ESPERA_HORAS) {
                    console.log(`⏰ Mensaje ya mostrado hace ${horasTranscurridas.toFixed(1)} horas.`);
                    return;
                }
            }
        } else {
            console.log('🆕 Nueva nota detectada!');
        }

        // Generar mensaje con IA
        console.log('🤖 Generando mensaje con Flowise...');
        const mensajeIA = await generarMensajeConIA(materia, nota_reciente, promedio_historico, tendencia);
        console.log('✅ Mensaje generado:', mensajeIA);

        // Mostrar modal
        mostrarMensajeEnModal(mensajeIA, materia, tendencia, nota_reciente);

        await guardarMensajeEnBD(mensajeIA, materia);
        agregarNotificacion(materia, mensajeIA, nota_reciente);
        
        sessionStorage.setItem('ultimoMensajeEducativo', JSON.stringify({
            materia,
            mensaje: mensajeIA,
            nota: nota_reciente,
            tendencia: tendencia
        }));

        reproducirSonidoNotificacion();
        
        localStorage.setItem("ultimo_hash_nota", hash);
        localStorage.setItem("ultimo_timestamp_mostrado", Date.now().toString());

    } catch (error) {
        console.error("❌ Error:", error);
    }
}

// ===============================
//  GENERAR MENSAJE CON IA
// ===============================
async function generarMensajeConIA(materia, nota_reciente, promedio_historico, tendencia) {
    try {
        let contextoTendencia = '';
        let instruccionTono = '';
        
        if (tendencia === 'subio') {
            contextoTendencia = `mejoró su rendimiento y tiene una nota de ${nota_reciente}/20`;
            instruccionTono = 'Felicita con emoción genuina y celebra el logro. Menciona la nota específica.';
        } else if (tendencia === 'bajo') {
            contextoTendencia = `tiene dificultades y sacó ${nota_reciente}/20`;
            instruccionTono = 'Sé empático, ofrece apoyo emocional genuino. Menciona que viste su nota y estás ahí para ayudar.';
        } else {
            contextoTendencia = `mantiene un rendimiento estable con ${nota_reciente}/20`;
            instruccionTono = 'Reconoce su constancia y motiva a seguir. Menciona su nota actual.';
        }

        const prompt = `Eres EduGuard. Hablas como un amigo cercano y tranquilo, como alguien que se sienta al lado del estudiante.
                        Tu tono es suave, cálido y real. 
                        No usas frases genéricas como “sigue esforzándote” o “todo se puede lograr”.
                        Hablas como una persona de verdad:
                        - Validando emociones
                        - Mostrando comprensión genuina
                        - Transmitiendo calma


📊 Situación del estudiante:
- Materia: ${materia}
- Nota: ${nota_reciente}/20
- Promedio anterior: ${promedio_historico}/20
- Estado: ${contextoTendencia}

🎯 Tu mensaje debe:
${instruccionTono}

📝 Formato:
- Primera línea: Menciona que viste su nota en ${materia} (ejemplo: "Vi que en ${materia} tienes un ${nota_reciente}")
- Segunda línea: Un mensaje motivacional según la situación
- Máximo 2 líneas en total
- Máximo 2 emojis
- Tono muy humano y cercano

Mensaje:`;

        const response = await fetch(FLOWISE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: prompt })
        });

        const result = await response.json();
        const mensaje = result.text || result.answer || result.response || result.output || null;

        if (!mensaje) {
            return generarMensajeFallback(tendencia, nota_reciente, materia);
        }

        return mensaje.trim();

    } catch (error) {
        console.error("❌ Error Flowise:", error);
        return generarMensajeFallback(tendencia, nota_reciente, materia);
    }
}

// ===============================
//  MENSAJE FALLBACK
// ===============================
function generarMensajeFallback(tendencia, nota, materia) {
    if (nota >= 16) {
        return `Vi que en ${materia} tienes un ${nota} 🎉\n¡Excelente! Tu dedicación está dando resultados increíbles.`;
    } else if (nota >= 14) {
        return `Vi que en ${materia} tienes un ${nota} 🌟\n¡Muy bien! Tu esfuerzo se nota claramente.`;
    } else if (nota >= 11) {
        return `Vi que en ${materia} tienes un ${nota} 💪\nVas por buen camino, sigamos mejorando juntos.`;
    } else {
        return `Vi que en ${materia} tienes un ${nota} 💙\nEstoy aquí para apoyarte. Juntos vamos a superar esto.`;
    }
}

// ===============================
//  MOSTRAR MODAL CENTRADO
// ===============================
function mostrarMensajeEnModal(mensaje, materia, tendencia, nota) {
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.className = 'mensaje-apoyo-overlay';
    overlay.id = 'mensajeApoyoOverlay';
    
    const icono = obtenerIcono(tendencia);
    const colorClase = obtenerColorClase(tendencia);
    
    // Formatear mensaje con saltos de línea
    const mensajeFormateado = mensaje.replace(/\n/g, '<br>');

    overlay.innerHTML = `
        <div class="mensaje-apoyo-card ${colorClase}">
            <div class="mensaje-apoyo-header">
                <div class="mensaje-apoyo-icono">${icono}</div>
                <div class="mensaje-apoyo-titulo">
                    <h4>EduGuard te acompaña</h4>
                    <div class="mensaje-apoyo-nota-info">
                        <span>${materia}:</span>
                        <span class="mensaje-apoyo-nota-numero">${nota}</span>
                        <span>/20</span>
                    </div>
                </div>
                <button class="mensaje-apoyo-close" onclick="cerrarMensajeApoyo()">✖</button>
            </div>
            <div class="mensaje-apoyo-contenido">
                <p>${mensajeFormateado}</p>
            </div>
            <div class="mensaje-apoyo-footer">
                <button class="btn-hablar-eduguard" onclick="abrirChatIA()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Hablar con EduGuard
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';
    
    // Lanzar efectos
    setTimeout(() => {
        if (nota >= 14) {
            lanzarConfeti();
        } else if (nota < 11) {
            mostrarEfectoApoyo();
        } else {
            mostrarEfectoNeutral();
        }
    }, 400);
    
    // Cerrar con ESC
    document.addEventListener('keydown', cerrarConEscape);
}

function cerrarConEscape(e) {
    if (e.key === 'Escape') {
        cerrarMensajeApoyo();
    }
}

// ===============================
//  CERRAR MODAL
// ===============================
function cerrarMensajeApoyo() {
    const overlay = document.getElementById('mensajeApoyoOverlay');
    if (overlay) {
        overlay.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            overlay.remove();
            document.body.style.overflow = '';
        }, 300);
    }
    document.removeEventListener('keydown', cerrarConEscape);
}

// ===============================
//  EFECTOS VISUALES
// ===============================
function lanzarConfeti() {
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#10B981'];
    
    for (let i = 0; i < 60; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: ${8 + Math.random() * 6}px;
                height: ${8 + Math.random() * 6}px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                left: ${Math.random() * 100}%;
                top: -30px;
                border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
                animation: confettiFall ${2 + Math.random() * 2}s linear forwards;
                z-index: 100000;
                opacity: 0.9;
            `;
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 4500);
        }, i * 25);
    }
}

function mostrarEfectoApoyo() {
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.innerHTML = '💙';
            heart.style.cssText = `
                position: fixed;
                font-size: ${20 + Math.random() * 8}px;
                left: ${15 + Math.random() * 70}%;
                bottom: -40px;
                animation: floatUp ${2.5 + Math.random()}s ease-out forwards;
                z-index: 100000;
                pointer-events: none;
            `;
            document.body.appendChild(heart);
            setTimeout(() => heart.remove(), 3500);
        }, i * 180);
    }
}

function mostrarEfectoNeutral() {
    for (let i = 0; i < 6; i++) {
        setTimeout(() => {
            const star = document.createElement('div');
            star.innerHTML = '✨';
            star.style.cssText = `
                position: fixed;
                font-size: 22px;
                left: ${25 + Math.random() * 50}%;
                top: ${15 + Math.random() * 10}%;
                animation: twinkle 2s ease-in-out forwards;
                z-index: 100000;
                pointer-events: none;
            `;
            document.body.appendChild(star);
            setTimeout(() => star.remove(), 2200);
        }, i * 280);
    }
}

function obtenerIcono(tendencia) {
    return { subio: "🎉", bajo: "💙", estable: "⭐" }[tendencia] || "💙";
}

function obtenerColorClase(tendencia) {
    return { subio: "apoyo-positivo", bajo: "apoyo-alerta", estable: "apoyo-neutro" }[tendencia] || "apoyo-neutro";
}

// ===============================
//  GUARDAR Y NOTIFICACIONES
// ===============================
async function guardarMensajeEnBD(mensaje, materia) {
    try {
        await fetch('../php/guardar_mensaje_ia.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mensaje, materia })
        });
    } catch (error) {
        console.error('Error al guardar:', error);
    }
}

function agregarNotificacion(materia, mensaje, nota) {
    const panel = document.getElementById('notificationPanel');
    if (!panel) return;

    const ahora = new Date();
    const horaFormato = ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    const notifHTML = `
        <div class="notification-item unread">
            <h4>💬 Mensaje de apoyo - ${materia}</h4>
            <p>Nota: ${nota}/20 - ${mensaje.substring(0, 80)}...</p>
            <span class="notification-time">${horaFormato}</span>
        </div>
    `;

    const heading = panel.querySelector('h3');
    if (heading) {
        heading.insertAdjacentHTML('afterend', notifHTML);
    }

    const badge = document.getElementById('notificationBadge');
    if (badge) {
        const count = parseInt(badge.textContent) || 0;
        badge.textContent = count + 1;
        badge.style.display = 'flex';
    }
}

function reproducirSonidoNotificacion() {
    const audio = new Audio('../assets/notify.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {});
}

function abrirChatIA() {
    const contexto = sessionStorage.getItem('ultimoMensajeEducativo');
    
    // Cerrar el modal
    cerrarMensajeApoyo();
    
    // Cambiar a la sección de chat
    setActiveSection('chat');
    
    // Esperar a que renderice y agregar el mensaje
    setTimeout(() => {
        if (contexto) {
            const data = JSON.parse(contexto);
            
            // Buscar el input del chat
            const chatInput = document.getElementById('chatInput');
            if (chatInput) {
                // Pre-llenar con el contexto
                chatInput.value = `Hola EduGuard, quiero hablar sobre mi nota de ${data.nota} en ${data.materia}. ${data.mensaje}`;
                chatInput.focus();
                
                // Opcional: Enviar automáticamente
                // setTimeout(() => {
                //     const sendBtn = document.getElementById('chatSendBtn');
                //     if (sendBtn) sendBtn.click();
                // }, 500);
            }
        }
    }, 500);
}

async function marcarNotificacionesLeidas() {
    try {
        await fetch('../php/api.php?action=mark_notifications_read', { method: 'POST' });
        document.querySelectorAll('.notification-item.unread').forEach(n => n.classList.remove('unread'));
        
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.textContent = '0';
            badge.style.display = 'none';
        }
    } catch (error) {}
}

document.addEventListener('DOMContentLoaded', () => {
    const notificationBtn = document.getElementById('notificationBtn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', () => {
            setTimeout(() => marcarNotificacionesLeidas(), 2000);
        });
    }
});

function resetearMensajeApoyo() {
    localStorage.removeItem("ultimo_hash_nota");
    localStorage.removeItem("ultimo_timestamp_mostrado");
    console.log('✅ Reseteado. Recarga la página.');
}

function verEstadoSistema() {
    const hash = localStorage.getItem('ultimo_hash_nota');
    const timestamp = localStorage.getItem('ultimo_timestamp_mostrado');
    
    console.log('═══════════════════════════════════════');
    console.log('📊 ESTADO DEL SISTEMA');
    console.log('🔑 Hash:', hash || 'Ninguno');
    
    if (timestamp) {
        const fecha = new Date(parseInt(timestamp));
        const horas = (Date.now() - parseInt(timestamp)) / (1000 * 60 * 60);
        console.log('⏰ Último mensaje:', fecha.toLocaleString());
        console.log('⏱️  Hace:', horas.toFixed(2), 'horas');
    }
    console.log('═══════════════════════════════════════');
}