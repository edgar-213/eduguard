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
    const mensajeFormateado = mensaje.replace(/\n/g, '<br>');
    
    // 🎯 GENERAR RECOMENDACIONES
    const recomendaciones = generarRecomendaciones(materia, nota, tendencia);
    const recomendacionesHTML = `
        <div style="
            background: rgba(249,250,251,0.8);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 1.25rem;
            margin: 1.5rem 0;
        ">
            <h5 style="margin: 0 0 1rem 0; font-size: 1rem; color: #374151; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">
                💡 Recomendaciones para ti
            </h5>
            ${recomendaciones.map(r => `
                <div style="
                    padding: 0.75rem 1rem;
                    margin: 0.5rem 0;
                    background: white;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    color: #1f2937;
                    border-left: 3px solid #3B82F6;
                    transition: all 0.3s;
                    cursor: pointer;
                " onmouseover="this.style.transform='translateX(8px)'" onmouseout="this.style.transform='translateX(0)'">
                    ${r}
                </div>
            `).join('')}
        </div>
    `;
    
    // 📊 COMPARACIÓN (simulada por ahora)
    const promedioSalon = 13.5; // Después lo conectas con tu BD
    const comparacionHTML = mostrarComparacion(nota, promedioSalon);
    
    // 🦁 MASCOTA ANIMADA
    const mascota = obtenerMascotaAnimada(nota);

    overlay.innerHTML = `
        <div class="mensaje-apoyo-card ${colorClase}">
            <div class="mensaje-apoyo-header">
                <div class="mensaje-apoyo-icono">${icono}</div>
                ${mascota}
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
                ${comparacionHTML}
                ${recomendacionesHTML}
            </div>
            <div class="mensaje-apoyo-footer">
                <button class="btn-compartir-logro" onclick="compartirLogro(${nota}, '${materia}')">
                    📱 Compartir logro
                </button>
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
    document.body.style.overflow = 'hidden';
    
    // 🎉 EFECTOS SEGÚN NOTA
    setTimeout(() => {
        if (nota >= 16) {
            celebracionCompleta(nota);
            lanzarConfeti();
        } else if (nota < 11) {
            mostrarEfectoApoyo();
        } else {
            mostrarEfectoNeutral();
        }
    }, 400);
    
    // 🔊 VOZ DE EDUGUARD
    setTimeout(() => {
        eduguardHabla(mensaje);
    }, 800);
    
    // 🔥 RACHA DE LOGROS (si aplica)
    verificarRachaLogros(nota);
    
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
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#10B981', '#F472B6'];
    
    // MÁS CONFETI
    for (let i = 0; i < 100; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: ${10 + Math.random() * 8}px;
                height: ${10 + Math.random() * 8}px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                left: ${Math.random() * 100}%;
                top: -50px;
                border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
                animation: confettiFall ${2 + Math.random() * 3}s linear forwards;
                z-index: 100001;
                opacity: 0.95;
                box-shadow: 0 0 10px rgba(255,255,255,0.5);
            `;
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 5500);
        }, i * 15);
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
function reproducirSonidoNotificacion() {
    const audio = new Audio('../assets/notify.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {});
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



function abrirChatIA() {
    const contexto = sessionStorage.getItem('ultimoMensajeEducativo');
    
    cerrarMensajeApoyo();
    setActiveSection('chat');
    
    setTimeout(() => {
        if (contexto) {
            const data = JSON.parse(contexto);
            const chatInput = document.getElementById('chatInput');
            
            if (chatInput) {
                let mensajeInicial = '';
                
                if (data.tendencia === 'subio' || data.nota >= 16) {
                    mensajeInicial = `🎉 ¡Hola EduGuard! Acabo de ver que saqué ${data.nota}/20 en ${data.materia}. ¡Estoy muy feliz! 😊\n\n¿Qué me recomiendas para mantener este nivel?`;
                } else if (data.tendencia === 'bajo' || data.nota < 11) {
                    mensajeInicial = `😔 Hola EduGuard, necesito tu ayuda. Saqué ${data.nota}/20 en ${data.materia} y me siento un poco desanimado.\n\n¿Podrías darme un plan de estudio personalizado y algunos consejos motivacionales?`;
                } else {
                    mensajeInicial = `👋 Hola EduGuard, te cuento sobre mi nota de ${data.nota}/20 en ${data.materia}. ${data.mensaje}\n\n¿Cómo puedo mejorar y qué estrategias me recomiendas?`;
                }
                
                chatInput.value = mensajeInicial;
                chatInput.focus();
                chatInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Efecto visual en el input
                chatInput.style.animation = 'pulse 0.5s ease';
            }
        }
    }, 400);
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
// ========================================
//  🎯 RECOMENDACIONES INTELIGENTES
// ========================================
function generarRecomendaciones(materia, nota, tendencia) {
    let recomendaciones = [];
    
    if (nota < 11) {
        recomendaciones = [
            `📅 Sesión de 30 min diarios en ${materia}`,
            `👥 Únete al grupo de estudio de ${materia}`,
            `🎯 Habla con el profesor esta semana`,
            `📚 Usa el Pomodoro para estudiar`,
            `💬 Pregunta tus dudas en el chat IA`
        ];
    } else if (nota < 14) {
        recomendaciones = [
            `⚡ 15 min de práctica extra diaria`,
            `🎮 Prueba ejercicios interactivos`,
            `📝 Resuelve 5 problemas más`,
            `👀 Repasa tus últimos errores`
        ];
    } else if (nota < 16) {
        recomendaciones = [
            `🚀 Estás cerca de la excelencia`,
            `📖 Profundiza en temas avanzados`,
            `🎯 Mantén tu ritmo de estudio`,
            `⭐ Desafíate con ejercicios difíciles`
        ];
    } else {
        recomendaciones = [
            `🏆 ¡Ayuda a un compañero!`,
            `🎯 Explora temas complementarios`,
            `⭐ Mantén tu racha estudiando 10 min/día`,
            `🌟 Comparte tus técnicas de estudio`
        ];
    }
    
    return recomendaciones.slice(0, 4); // Máximo 4
}

// ========================================
//  📊 COMPARACIÓN CON PROMEDIO
// ========================================
function mostrarComparacion(nota, promedioSalon) {
    const diferencia = nota - promedioSalon;
    let mensaje, color, icono;
    
    if (diferencia >= 2) {
        mensaje = `¡${diferencia.toFixed(1)} puntos ARRIBA del promedio del salón!`;
        color = '#10B981';
        icono = '📈';
    } else if (diferencia >= 0) {
        mensaje = `Estás en el promedio del salón (${promedioSalon})`;
        color = '#3B82F6';
        icono = '📊';
    } else {
        mensaje = `${Math.abs(diferencia).toFixed(1)} puntos para alcanzar el promedio`;
        color = '#F59E0B';
        icono = '🎯';
    }
    
    return `
        <div style="
            background: ${color}15;
            border-left: 4px solid ${color};
            padding: 1rem 1.25rem;
            border-radius: 12px;
            margin: 1rem 0;
            font-size: 0.95rem;
            color: ${color};
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        ">
            <span style="font-size: 1.5rem;">${icono}</span>
            <span>${mensaje}</span>
        </div>
    `;
}

// ========================================
//  🦁 MASCOTA ANIMADA
// ========================================
function obtenerMascotaAnimada(nota) {
    if (nota >= 17) {
        return `<div style="font-size: 4rem; animation: jump 0.6s ease infinite; margin: 0.5rem 0;">🦁</div>`;
    }
    if (nota >= 14) {
        return `<div style="font-size: 4rem; animation: wiggle 1s ease infinite; margin: 0.5rem 0;">🐱</div>`;
    }
    if (nota >= 11) {
        return `<div style="font-size: 4rem; animation: nod 2s ease infinite; margin: 0.5rem 0;">🐶</div>`;
    }
    return `<div style="font-size: 4rem; animation: hug 2s ease infinite; margin: 0.5rem 0;">🐻</div>`;
}

// ========================================
//  🎉 CELEBRACIÓN COMPLETA
// ========================================
function celebracionCompleta(nota) {
    // FONDO TEMPORAL
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: radial-gradient(circle at center, rgba(16,185,129,0.15) 0%, transparent 70%);
        z-index: 99998;
        pointer-events: none;
        animation: pulseGlow 2s ease-in-out;
    `;
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 2000);
    
    // TEXTO GIGANTE
    const bigText = document.createElement('div');
    bigText.innerHTML = '¡EXCELENTE! 🎉';
    bigText.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0);
        font-size: 5rem;
        font-weight: 900;
        color: #10B981;
        text-shadow: 0 10px 40px rgba(16,185,129,0.6);
        z-index: 100000;
        pointer-events: none;
        animation: popScale 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
    `;
    document.body.appendChild(bigText);
    setTimeout(() => bigText.remove(), 1200);
}

// ========================================
//  📱 COMPARTIR LOGRO
// ========================================
function compartirLogro(nota, materia) {
    let emoji = '📚';
    let mensaje = '';
    
    if (nota >= 17) {
        emoji = '🏆';
        mensaje = `¡INCREÍBLE! Saqué ${nota}/20 en ${materia}! ${emoji} #EduGuard #Hack4Edu`;
    } else if (nota >= 14) {
        emoji = '🎯';
        mensaje = `¡Bien! Saqué ${nota}/20 en ${materia}! ${emoji} #EduGuard #Hack4Edu`;
    } else {
        emoji = '💪';
        mensaje = `Seguimos mejorando: ${nota}/20 en ${materia} ${emoji} #EduGuard #Hack4Edu`;
    }
    
    if (navigator.share) {
        navigator.share({
            title: 'Mi progreso en EduGuard',
            text: mensaje
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(mensaje).then(() => {
            const toast = document.createElement('div');
            toast.textContent = '📋 ¡Texto copiado al portapapeles!';
            toast.style.cssText = `
                position: fixed;
                bottom: 30px;
                right: 30px;
                background: #10B981;
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(16,185,129,0.3);
                z-index: 100001;
                animation: slideInRight 0.5s ease;
                font-weight: 600;
            `;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        });
    }
}


// ========================================
//  🔥 RACHA DE LOGROS
// ========================================
function verificarRachaLogros(notaActual) {
    // Obtener historial (simulado, después conectas con tu BD)
    let historial = JSON.parse(localStorage.getItem('historialNotas') || '[]');
    historial.push(notaActual);
    historial = historial.slice(-5); // Últimas 5
    localStorage.setItem('historialNotas', JSON.stringify(historial));
    
    const buenasNotas = historial.filter(n => n >= 14).length;
    
    if (buenasNotas >= 3 && notaActual >= 14) {
        setTimeout(() => {
            const badge = document.createElement('div');
            badge.innerHTML = `
                <div style="
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    background: linear-gradient(135deg, #F59E0B, #EF4444);
                    color: white;
                    padding: 1.25rem 2rem;
                    border-radius: 50px;
                    box-shadow: 0 10px 30px rgba(245,158,11,0.5);
                    font-weight: 700;
                    font-size: 1.1rem;
                    z-index: 100001;
                    animation: slideInRight 0.6s ease, shake 0.5s ease 1s;
                ">
                    🔥 ¡${buenasNotas} NOTAS SEGUIDAS! 🔥
                </div>
            `;
            document.body.appendChild(badge);
            setTimeout(() => badge.remove(), 5000);
        }, 2500);
    }
}

// Variable global para controlar la voz
let vozActivada = true;

function toggleVoz() {
    vozActivada = !vozActivada;
    const btn = document.getElementById('btnToggleVoz');
    
    if (vozActivada) {
        btn.textContent = '🔊';
        btn.style.opacity = '1';
        // Reproducir sonido de confirmación
        const utterance = new SpeechSynthesisUtterance('Voz activada');
        utterance.lang = 'es-ES';
        utterance.rate = 1.2;
        utterance.volume = 0.5;
        speechSynthesis.speak(utterance);
    } else {
        btn.textContent = '🔇';
        btn.style.opacity = '0.5';
        // Detener cualquier voz en reproducción
        speechSynthesis.cancel();
    }
    
    // Guardar preferencia
    localStorage.setItem('eduguard_voz', vozActivada);
}

// Modificar la función eduguardHabla:
function eduguardHabla(mensaje) {
    const vozGuardada = localStorage.getItem('eduguard_voz');
    if (vozGuardada !== null) {
        vozActivada = vozGuardada === 'true';
    }
    
    if (!vozActivada) return;
    
    if ('speechSynthesis' in window) {
        const textoLimpio = mensaje.replace(/\n/g, '. ').replace(/[^\w\s\.,;áéíóúñ¿?¡!]/gi, '');
        
        const utterance = new SpeechSynthesisUtterance(textoLimpio);
        utterance.lang = 'es-ES';
        utterance.rate = 0.95;
        utterance.pitch = 1.1;
        utterance.volume = 0.8;
        
        const voices = speechSynthesis.getVoices();
        const spanishVoice = voices.find(voice => voice.lang.startsWith('es'));
        if (spanishVoice) {
            utterance.voice = spanishVoice;
        }
        
        // 🎤 INDICADOR VISUAL - AQUÍ ESTABA EL PROBLEMA
        utterance.onstart = () => {
            const indicator = document.createElement('div');
            indicator.id = 'vozIndicator';
            indicator.innerHTML = '🎤 EduGuard hablando...';
            indicator.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #10B981, #059669);
                color: white;
                padding: 0.75rem 1.5rem;
                border-radius: 50px;
                box-shadow: 0 8px 24px rgba(16,185,129,0.4);
                font-weight: 700;
                z-index: 100002;
                animation: pulse 1s ease infinite;
            `;
            document.body.appendChild(indicator);
        };
        
        utterance.onend = () => {
            const indicator = document.getElementById('vozIndicator');
            if (indicator) indicator.remove();
        };
        
        utterance.onerror = () => {
            const indicator = document.getElementById('vozIndicator');
            if (indicator) indicator.remove();
        };
        
        speechSynthesis.speak(utterance);
    }
}