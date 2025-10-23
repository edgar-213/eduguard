// ========================================
// CONFIGURACIÓN API
// ========================================
const API_URL = '../php/api.php';

// Estado de la aplicación
const state = {
    darkMode: false,
    activeSection: 'home',
    sidebarOpen: true,
    showProfileMenu: false,
    showNotificationPanel: false,
    chatOpen: false,
    chatMenuOpen: false,
    currentUser: null,
    chatMessages: [],
    activitiesLog: [],
    groups: [],
    schoolNews: [],
    adminRecommendations: [],
    calendarEvents: [],
    subjects: [],
    notifications: [],
    monthlyStats: {
        current: { hours: 0, sessions: 0, topics: 0 },
        previous: { hours: 0, sessions: 0, topics: 0 }
    }
};

// ========================================
// FUNCIONES API
// ========================================
async function fetchAPI(action, options = {}) {
    try {
        const url = `${API_URL}?action=${action}`;
        const response = await fetch(url, {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            body: options.body ? JSON.stringify(options.body) : null
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Error en la petición');
        }
        
        return data;
    } catch (error) {
        console.error('Error API:', error);
        showNotification('Error al cargar datos: ' + error.message, 'error');
        return null;
    }
}

async function loadUserData() {
    const data = await fetchAPI('user');
    if (data && data.user) {
        state.currentUser = {
            id: data.user.id,
            nombre: data.user.nombre,
            email: data.user.email,
            tipo_usuario: data.user.tipo_usuario,
            grado: data.user.grado || 'Sin grado',
            seccion: data.user.seccion || '-',
            telefono: data.user.telefono || 'Sin teléfono',
            bio: data.user.bio || 'Apasionado por aprender',
            puntuacion: data.user.puntuacion || 0,
            nivel: data.user.nivel || 'Bronce',
            racha: data.user.racha || 0,
            horasEstudio: data.user.horas_estudio || 0
        };
        updateUserInterface();
    }
}

async function loadActivities() {
    const data = await fetchAPI('activities');
    if (data && data.actividades) {
        state.activitiesLog = data.actividades;
    }
}

async function loadSubjects() {
    const data = await fetchAPI('subjects');
    if (data && data.materias) {
        state.subjects = data.materias.map(m => ({
            id: m.id,
            nombre: m.nombre,
            profesor: m.profesor,
            color: m.color || 'blue',
            notas: parseInt(m.notas),
            promedio: parseFloat(m.promedio)
        }));
    }
}

async function loadCalendar() {
    const data = await fetchAPI('calendar');
    if (data && data.eventos) {
        state.calendarEvents = data.eventos;
    }
}

async function loadGroups() {
    const data = await fetchAPI('groups');
    if (data && data.grupos) {
        state.groups = data.grupos.map(g => ({
            id: g.id,
            nombre: g.nombre,
            miembros: parseInt(g.miembros),
            admin: g.admin,
            mensajes: parseInt(g.mensajes),
            ultimoMensaje: g.ultimo_mensaje || 'Sin mensajes',
            tiempo: g.tiempo || '--'
        }));
    }
}

async function loadNews() {
    const data = await fetchAPI('news');
    if (data && data.noticias) {
        state.schoolNews = data.noticias;
    }
}

async function loadRecommendations() {
    const data = await fetchAPI('recommendations');
    if (data && data.recomendaciones) {
        state.adminRecommendations = data.recomendaciones;
    }
}

async function loadNotifications() {
    const data = await fetchAPI('notifications');
    if (data && data.notificaciones) {
        state.notifications = data.notificaciones;
        updateNotificationBadge(data.no_leidas);
    }
}

async function loadChatMessages() {
    const data = await fetchAPI('chat');
    if (data && data.mensajes) {
        state.chatMessages = data.mensajes.map(m => ({
            id: m.id,
            sender: m.sender,
            text: m.mensaje,
            time: m.time
        }));
    }
}

async function loadStats() {
    const data = await fetchAPI('stats');
    if (data && data.stats) {
        state.monthlyStats = data.stats;
    }
}

async function sendChatMessage(mensaje) {
    return await fetchAPI('send_chat', {
        method: 'POST',
        body: { mensaje }
    });
}

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar sesión y cargar datos
    await loadUserData();
    
    if (!state.currentUser) {
        window.location.href = '../index.html';
        return;
    }
    
    // Cargar datos iniciales
    await Promise.all([
        loadActivities(),
        loadSubjects(),
        loadNotifications()
    ]);
    
    initializeEventListeners();
    renderSection('home');
});

// ========================================
// ACTUALIZAR INTERFAZ
// ========================================
function updateUserInterface() {
    if (!state.currentUser) return;
    
    // Actualizar nombre en header
    const profileMenuHeader = document.querySelector('.profile-menu-header h4');
    if (profileMenuHeader) {
        profileMenuHeader.textContent = state.currentUser.nombre;
    }
    
    const profileMenuSubtitle = document.querySelector('.profile-menu-header p');
    if (profileMenuSubtitle) {
        profileMenuSubtitle.textContent = `${state.currentUser.grado} - Sección ${state.currentUser.seccion}`;
    }
    
    // Actualizar avatar
    const avatars = document.querySelectorAll('.avatar');
    const initials = state.currentUser.nombre.split(' ').map(n => n[0]).join('');
    avatars.forEach(avatar => {
        avatar.textContent = initials;
    });
}

function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

function showNotification(message, type = 'info') {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.className = `notification-toast ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'error' ? '#EF4444' : '#10B981'};
        color: white;
        border-radius: 8px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ========================================
// EVENT LISTENERS
// ========================================
function initializeEventListeners() {
    // Dark Mode Toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }
    
    // Menu Toggle (Mobile)
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }
    // Botón cerrar sidebar (móvil)
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener('click', toggleSidebar);
    }
    
    // Profile Menu
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleProfileMenu();
        });
    }
    
    // Notification Panel
    const notificationBtn = document.getElementById('notificationBtn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await loadNotifications();
            toggleNotificationPanel();
        });
    }
    
    // Navigation Items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const section = item.getAttribute('data-section');
            setActiveSection(section);
        });
    });
    
    // Profile Menu Items
    document.querySelectorAll('.menu-item[data-section]').forEach(item => {
        item.addEventListener('click', () => {
            const section = item.getAttribute('data-section');
            setActiveSection(section);
            toggleProfileMenu();
        });
    });
    
    // Logout button
    const logoutBtn = document.querySelector('.menu-item.logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await fetchAPI('logout');
            window.location.href = '../index.html';
        });
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.profile-btn') && !e.target.closest('.profile-menu')) {
            if (state.showProfileMenu) toggleProfileMenu();
        }
        if (!e.target.closest('.notification-wrapper') && !e.target.closest('.notification-panel')) {
            if (state.showNotificationPanel) toggleNotificationPanel();
        }
    });
    
}

// ========================================
// TOGGLE FUNCTIONS
// ========================================
function toggleDarkMode() {
    state.darkMode = !state.darkMode;
    document.body.classList.toggle('dark-mode', state.darkMode);
}

function toggleSidebar() {
    state.sidebarOpen = !state.sidebarOpen;
    const sidebar = document.getElementById('sidebar');
    
    if (sidebar) {
        sidebar.classList.toggle('open', state.sidebarOpen);
    }
    
    // Agregar/quitar clase al body para el overlay
    document.body.classList.toggle('sidebar-open', state.sidebarOpen);
    
    // Prevenir scroll del body cuando el sidebar está abierto en móvil
    if (window.innerWidth <= 1024) {
        document.body.style.overflow = state.sidebarOpen ? 'hidden' : '';
    }
}
// Cerrar sidebar al hacer clic en un nav-item en móvil
function closeSidebarOnMobile() {
    if (window.innerWidth <= 1024 && state.sidebarOpen) {
        toggleSidebar();
    }
}

function toggleProfileMenu() {
    state.showProfileMenu = !state.showProfileMenu;
    const menu = document.getElementById('profileMenu');
    if (menu) {
        menu.classList.toggle('show', state.showProfileMenu);
    }
}

function toggleNotificationPanel() {
    state.showNotificationPanel = !state.showNotificationPanel;
    const panel = document.getElementById('notificationPanel');
    if (panel) {
        panel.classList.toggle('show', state.showNotificationPanel);
        if (state.showNotificationPanel) {
            renderNotifications();
        }
    }
}

// ========================================
// NAVIGATION
// ========================================
function setActiveSection(section) {
    state.activeSection = section;
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === section) {
            item.classList.add('active');
        }
    });
    
    // Render section content
    renderSection(section);
    
    // Close sidebar on mobile

    closeSidebarOnMobile();
}

async function renderSection(section) {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;
    
    // Mostrar loading
    mainContent.innerHTML = '<div style="text-align: center; padding: 2rem;">Cargando...</div>';
    
    switch(section) {
        case 'home':
            await loadActivities();
            mainContent.innerHTML = renderHome();
            initializeHomeListeners();
            break;
        case 'news':
            await Promise.all([loadNews(), loadRecommendations()]);
            mainContent.innerHTML = renderNews();
            break;
        case 'calendar':
            await loadCalendar();
            mainContent.innerHTML = renderCalendar();
            break;
        case 'pomodoro':
            mainContent.innerHTML = renderPomodoro();
            initializePomodoroListeners();
            break;
        case 'subjects':
            await loadSubjects();
            mainContent.innerHTML = renderSubjects();
            break;
        case 'chat':
            await loadChatMessages();
            mainContent.innerHTML = renderChat();
            initializeChatListeners();
            break;
        case 'groups':
            await loadGroups();
            mainContent.innerHTML = renderGroups();
            break;
        case 'stats':
            await loadStats();
            mainContent.innerHTML = renderStats();
            break;
        case 'scan':
            mainContent.innerHTML = renderScan();
            break;
        case 'profile':
            mainContent.innerHTML = renderProfile();
            break;
        case 'settings':
            mainContent.innerHTML = renderSettings();
            initializeSettingsListeners();
            break;
        default:
            mainContent.innerHTML = renderHome();
    }
}

// ========================================
// RENDER FUNCTIONS
// ========================================
function renderHome() {
    if (!state.currentUser) return '';
    
    return `
        <div class="content-section active">
            <!-- Logo Grande -->
            <div class="card center">
                <div class="logo-large">
                    <img src="../img/logo.png" class="img" alt="EduGuard Logo" />
                </div>
            </div>
            
            <!-- Bienvenida -->
            <div class="welcome-card">
                <h3>Bienvenido</h3>
                <div class="name">${state.currentUser.nombre}</div>
                <p class="subtitle">${state.currentUser.grado} • Sección ${state.currentUser.seccion}</p>
            </div>
            
            <!-- Chat IA Button -->
            <div class="chat-button-container">
                <button class="chat-button" id="chatButton">
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        <line x1="12" y1="19" x2="12" y2="22"></line>
                    </svg>
                </button>
                <span class="chat-label">Chat IA</span>
            </div>
            
            <!-- Chat Expandido -->
            <div id="chatContainer" style="display: none;">
                ${renderChatInterface()}
            </div>
            
            <!-- Estadísticas -->
            <div class="stats-grid">
                <div class="stat-card">
                    <svg class="icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#F97316" stroke-width="2">
                        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
                    </svg>
                    <div class="value">${state.currentUser.racha}</div>
                    <div class="label">Racha Días</div>
                </div>
                <div class="stat-card">
                    <svg class="icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#EAB308" stroke-width="2">
                        <circle cx="12" cy="8" r="7"></circle>
                        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                    </svg>
                    <div class="value">${state.currentUser.puntuacion}</div>
                    <div class="label">Puntuación</div>
                </div>
                <div class="stat-card">
                    <svg class="icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <div class="value">${state.currentUser.horasEstudio}h</div>
                    <div class="label">Horas Estudio</div>
                </div>
                <div class="stat-card">
                    <svg class="icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9333EA" stroke-width="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    <div class="value">${state.currentUser.nivel}</div>
                    <div class="label">Nivel</div>
                </div>
            </div>
            
            <!-- Actividades -->
            <div class="card">
                <h3 style="display: flex; align-items: center; gap: 0.75rem;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EAB308" stroke-width="2">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                    Actividades Realizadas
                </h3>
                ${state.activitiesLog.length > 0 ? state.activitiesLog.map(activity => `
                    <div class="activity-item">
                        <div class="activity-icon">${activity.icono || '📝'}</div>
                        <div class="activity-content">
                            <div class="activity-title">${activity.titulo}</div>
                            <div class="activity-subject">${activity.materia || 'General'}</div>
                        </div>
                        <div class="activity-meta">
                            ${activity.duracion ? `<div class="activity-duration">${activity.duracion}</div>` : ''}
                            ${activity.resultado ? `<div class="activity-result">${activity.resultado}</div>` : ''}
                            <div class="activity-date">${activity.fecha}</div>
                        </div>
                    </div>
                `).join('') : '<p style="text-align: center; padding: 2rem; color: #999;">No hay actividades registradas</p>'}
            </div>
        </div>
    `;
}

function renderChatInterface() {
    return `
        <div class="card">
            <div class="chat-header">
                <h3>Asistente Educativo</h3>
                <div class="chat-actions">
                    <button class="chat-action-btn" id="closeChatBtn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
            
            <div class="chat-messages" id="chatMessages">
                ${state.chatMessages.length > 0 ? state.chatMessages.map(msg => `
                    <div class="message ${msg.sender}">
                        <div class="message-avatar ${msg.sender}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                                ${msg.sender === 'ia' ? 
                                    '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line>' :
                                    '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>'
                                }
                            </svg>
                        </div>
                        <div class="message-bubble">
                            <div class="message-text">${msg.text}</div>
                        </div>
                    </div>
                `).join('') : `
                    <div class="message ia">
                        <div class="message-avatar ia">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                <line x1="12" y1="19" x2="12" y2="22"></line>
                            </svg>
                        </div>
                        <div class="message-bubble">
                            <div class="message-text">¡Hola! Soy tu asistente educativo. ¿En qué puedo ayudarte hoy?</div>
                        </div>
                    </div>
                `}
            </div>
            
            <div class="chat-input-container">
                <input type="text" class="chat-input" id="chatInput" placeholder="Escribe tu pregunta...">
                <button class="chat-send-btn" id="chatSendBtn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </div>
        </div>
    `;
}

function renderNews() {
    const isTeacher = state.currentUser && state.currentUser.tipo_usuario === 'profesor';
    
    return `
        <div class="content-section active">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3 style="font-size: 1.5rem; font-weight: 700;">Noticias y Anuncios</h3>
                ${isTeacher ? `
                    <button class="create-group-btn" onclick="showCreateNewsModal()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Crear Noticia
                    </button>
                ` : ''}
            </div>
            
            ${state.adminRecommendations.length > 0 ? `
            <div class="card">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                        <h4 style="font-size: 1.125rem; font-weight: 700;">Recomendaciones de Profesores</h4>
                    </div>
                    ${isTeacher ? `
                        <button class="btn btn-primary" onclick="showCreateRecommendationModal()" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                            + Nueva
                        </button>
                    ` : ''}
                </div>
                ${state.adminRecommendations.map(rec => `
                    <div class="recommendation-card">
                        <p class="recommendation-text">${rec.mensaje}</p>
                        <p class="recommendation-meta">${rec.autor} • ${rec.fecha}</p>
                    </div>
                `).join('')}
            </div>
            ` : ''}
            
            <div class="grid">
                ${state.schoolNews.length > 0 ? state.schoolNews.map(news => `
                    <div class="news-card">
                        <h4 class="news-title">${news.titulo}</h4>
                        <p class="news-description">${news.descripcion || ''}</p>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                            <p class="news-meta">${news.autor} • ${news.fecha}</p>
                            ${isTeacher && news.usuario_id == state.currentUser.id ? `
                                <button class="btn-delete-news" onclick="deleteNews(${news.id})" style="color: #EF4444; cursor: pointer; background: none; border: none; padding: 0.25rem 0.5rem;">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `).join('') : '<p>No hay noticias disponibles</p>'}
            </div>
        </div>
    `;
}

function renderCalendar() {
    return `
        <div class="content-section active">
            <div class="card">
                <h3>Calendario Escolar</h3>
                <div class="grid">
                    ${state.calendarEvents.length > 0 ? state.calendarEvents.map(event => {
                        const date = new Date(event.fecha);
                        const day = date.getDate();
                        const month = date.toLocaleDateString('es', { month: 'short' });
                        return `
                            <div class="calendar-event">
                                <div class="calendar-date-box ${event.tipo}">
                                    <div class="calendar-day">${day}</div>
                                    <div class="calendar-month">${month}</div>
                                </div>
                                <div class="calendar-event-content">
                                    <div class="calendar-event-title">${event.titulo}</div>
                                    <div class="calendar-event-details">${event.materia} • ${event.hora}</div>
                                    <div class="calendar-event-location">📍 ${event.aula}</div>
                                </div>
                            </div>
                        `;
                    }).join('') : '<p>No hay eventos próximos</p>'}
                </div>
            </div>
        </div>
    `;
}

function renderSubjects() {
    return `
        <div class="content-section active">
            <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem;">Mis Materias</h3>
            <div class="grid-2">
                ${state.subjects.length > 0 ? state.subjects.map(subject => `
                    <div class="subject-card">
                        <div class="subject-header">
                            <svg class="icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2">
                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                            </svg>
                            <span class="subject-grade">${subject.promedio}</span>
                        </div>
                        <div class="subject-name">${subject.nombre}</div>
                        <div class="subject-teacher">${subject.profesor}</div>
                    </div>
                `).join('') : '<p>No hay materias registradas</p>'}
            </div>
        </div>
    `;
}

function renderGroups() {
    return `
        <div class="content-section active">
            <div class="groups-header">
                <h3 style="font-size: 1.5rem; font-weight: 700;">Grupos de Estudio</h3>
                <button class="create-group-btn" onclick="createGroup()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Crear Grupo
                </button>
            </div>
            
            <div class="grid">
                ${state.groups.length > 0 ? state.groups.map(group => `
                    <div class="group-card" onclick="openGroup(${group.id})">
                        <div class="group-content">
                            <svg class="icon group-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                            <div class="group-info">
                                <div class="group-name">${group.nombre}</div>
                                <div class="group-meta">${group.miembros} miembros • Admin: ${group.admin}</div>
                                <div class="group-last-message">💬 ${group.ultimoMensaje}</div>
                            </div>
                        </div>
                    </div>
                `).join('') : '<p>No perteneces a ningún grupo. ¡Crea uno!</p>'}
            </div>
        </div>
    `;
}

function renderStats() {
    const current = state.monthlyStats.current;
    const previous = state.monthlyStats.previous;
    const hoursChange = previous.hours > 0 ? ((current.hours - previous.hours) / previous.hours * 100).toFixed(0) : 0;
    const sessionsChange = previous.sessions > 0 ? ((current.sessions - previous.sessions) / previous.sessions * 100).toFixed(0) : 0;
    
    return `
        <div class="content-section active">
            <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem;">Estadísticas</h3>
            <div class="grid-2">
                <div class="card">
                    <h4 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 1rem;">Horas de Estudio</h4>
                    <p style="font-size: 1.875rem; font-weight: 700;">${current.hours}h</p>
                    <p class="stat-comparison">${hoursChange >= 0 ? '↑' : '↓'} ${Math.abs(hoursChange)}% vs mes anterior</p>
                </div>
                <div class="card">
                    <h4 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 1rem;">Sesiones Completadas</h4>
                    <p style="font-size: 1.875rem; font-weight: 700;">${current.sessions}</p>
                    <p class="stat-comparison">${sessionsChange >= 0 ? '↑' : '↓'} ${Math.abs(sessionsChange)}% vs mes anterior</p>
                </div>
            </div>
        </div>
    `;
}

function renderPomodoro() {
    return `
        <div class="content-section active">
            <div class="card">
                <h3 style="text-align: center; margin-bottom: 1.5rem;">Temporizador Pomodoro</h3>
                <div class="pomodoro-container">
                    <div class="pomodoro-circle">
                        <div class="pomodoro-time">
                            <div class="pomodoro-timer" id="pomodoroTimer">25:00</div>
                            <div class="pomodoro-status" id="pomodoroStatus">Iniciando</div>
                        </div>
                    </div>
                    <div class="pomodoro-controls">
                        <button class="pomodoro-btn primary" id="pomodoroStart">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                            Iniciar
                        </button>
                        <button class="pomodoro-btn secondary" id="pomodoroReset">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="1 4 1 10 7 10"></polyline>
                                <polyline points="23 20 23 14 17 14"></polyline>
                                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                            </svg>
                            Reiniciar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderScan() {
    return `
        <div class="content-section active">
            <div class="card">
                <h3>Escanear Documentos (OCR)</h3>
                <p style="margin-bottom: 1.5rem; color: var(--text-secondary-light);">Sube fotos de tus apuntes para procesarlas</p>
                <div class="upload-zone">
                    <svg class="upload-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                    <h4 class="upload-title">Haz clic para subir imagen</h4>
                    <p class="upload-description">o arrastra y suelta aquí</p>
                </div>
            </div>
        </div>
    `;
}

function renderProfile() {
    if (!state.currentUser) return '';
    
    return `
        <div class="content-section active">
            <div class="profile-header">
                <div class="profile-header-content">
                    <div class="profile-avatar">${state.currentUser.nombre.split(' ').map(n => n[0]).join('')}</div>
                    <div class="profile-info">
                        <div class="profile-name">${state.currentUser.nombre}</div>
                        <p class="profile-grade">${state.currentUser.grado} • Sección ${state.currentUser.seccion}</p>
                        <p class="profile-bio">${state.currentUser.bio}</p>
                        <button class="edit-profile-btn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Editar Perfil
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="info-grid">
                <div class="info-card">
                    <div class="info-header">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                        </svg>
                        <h4>Email</h4>
                    </div>
                    <p class="info-value">${state.currentUser.email}</p>
                </div>
                <div class="info-card">
                    <div class="info-header">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                        <h4>Teléfono</h4>
                    </div>
                    <p class="info-value">${state.currentUser.telefono}</p>
                </div>
            </div>
            
            <div class="achievements-grid">
                <div class="achievement-card">
                    <svg class="achievement-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#EAB308" stroke-width="2">
                        <circle cx="12" cy="8" r="7"></circle>
                        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                    </svg>
                    <div class="achievement-value">${state.activitiesLog.length}</div>
                    <div class="achievement-label">Actividades</div>
                </div>
                <div class="achievement-card">
                    <svg class="achievement-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <div class="achievement-value">${state.groups.length}</div>
                    <div class="achievement-label">Grupos Activos</div>
                </div>
                <div class="achievement-card">
                    <svg class="achievement-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2">
                        <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <div class="achievement-value">${state.subjects.length}</div>
                    <div class="achievement-label">Materias</div>
                </div>
            </div>
            
            <div class="card">
                <h4 style="font-weight: 700; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                    </svg>
                    Rendimiento Académico
                </h4>
                <div class="performance-list">
                    ${state.subjects.slice(0, 4).map(subject => `
                        <div class="performance-item">
                            <span class="performance-subject">${subject.nombre}</span>
                            <span class="performance-grade ${subject.promedio >= 17 ? 'high' : 'medium'}">${subject.promedio}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderSettings() {
    return `
        <div class="content-section active">
            <div class="card">
                <h3 style="margin-bottom: 1.5rem;">Configuración</h3>
                <div class="settings-item">
                    <span class="settings-label">Modo Oscuro</span>
                    <label class="toggle-switch">
                        <input type="checkbox" id="darkModeCheckbox" ${state.darkMode ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </div>
        </div>
    `;
}

function renderChat() {
    return `
        <div class="content-section active">
            ${renderChatInterface()}
        </div>
    `;
}

function renderNotifications() {
    const panel = document.getElementById('notificationPanel');
    if (!panel) return;
    
    panel.innerHTML = `
        <h3>Notificaciones</h3>
        ${state.notifications.length > 0 ? state.notifications.slice(0, 5).map(notif => `
            <div class="notification-item ${notif.leido ? '' : 'unread'}">
                <h4>${notif.titulo}</h4>
                <p>${notif.mensaje || ''}</p>
                <span class="notification-time">${notif.fecha}</span>
            </div>
        `).join('') : '<p style="padding: 1rem; text-align: center; color: #999;">No hay notificaciones</p>'}
    `;
}

// ========================================
// MODALES
// ========================================
function showModal(content) {
    const overlay = document.getElementById('modalOverlay');
    const modalContent = document.getElementById('modalContent');
    
    modalContent.innerHTML = content;
    overlay.classList.add('show');
    
    // Cerrar al hacer click fuera del modal
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            closeModal();
        }
    };
}

function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    overlay.classList.remove('show');
}

// ========================================
// GRUPOS - FUNCIONES ACTUALIZADAS
// ========================================
async function createGroup() {
    const modalHTML = `
        <div class="modal-header">
            <h3>Crear Nuevo Grupo</h3>
            <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label for="groupName">Nombre del grupo *</label>
                <input type="text" id="groupName" placeholder="Ej: Matemáticas 5to A" required>
            </div>
            <div class="form-group">
                <label for="groupDesc">Descripción</label>
                <textarea id="groupDesc" placeholder="Describe el propósito del grupo..."></textarea>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="submitCreateGroup()">Crear Grupo</button>
        </div>
    `;
    
    showModal(modalHTML);
    
    // Focus en el input
    setTimeout(() => document.getElementById('groupName').focus(), 100);
}

async function submitCreateGroup() {
    const nombre = document.getElementById('groupName').value.trim();
    const descripcion = document.getElementById('groupDesc').value.trim();
    
    if (!nombre) {
        showNotification('El nombre del grupo es obligatorio', 'error');
        return;
    }
    
    const data = await fetchAPI('create_group', {
        method: 'POST',
        body: { nombre, descripcion }
    });
    
    if (data) {
        closeModal();
        showNotification('Grupo creado exitosamente', 'info');
        await loadGroups();
        renderSection('groups');
    }
}

async function addMemberToGroup() {
    const modalHTML = `
        <div class="modal-header">
            <h3>Agregar Miembro</h3>
            <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
            <input 
                type="text" 
                class="search-input" 
                id="searchUserInput" 
                placeholder="Buscar por nombre o email..."
                onkeyup="searchUsersForGroup()"
            >
            <div id="userSearchResults" class="user-list">
                <p style="text-align: center; color: #6b7280;">Escribe para buscar usuarios...</p>
            </div>
        </div>
    `;
    
    showModal(modalHTML);
}

async function searchUsersForGroup() {
    const search = document.getElementById('searchUserInput').value.trim();
    const resultsDiv = document.getElementById('userSearchResults');
    
    if (search.length < 2) {
        resultsDiv.innerHTML = '<p style="text-align: center; color: #6b7280;">Escribe al menos 2 caracteres...</p>';
        return;
    }
    
    const response = await fetch(`${API_URL}?action=search_users&q=${encodeURIComponent(search)}`);
    const data = await response.json();
    
    if (!data.success || data.usuarios.length === 0) {
        resultsDiv.innerHTML = '<p style="text-align: center; color: #6b7280;">No se encontraron usuarios</p>';
        return;
    }
    
    resultsDiv.innerHTML = data.usuarios.map(user => `
        <div class="user-item">
            <div class="user-info">
                <span class="user-name">${user.nombre}</span>
                <span class="user-email">${user.email}</span>
            </div>
            <button class="btn-add" onclick="confirmAddMember(${user.id}, '${user.nombre}')">
                Agregar
            </button>
        </div>
    `).join('');
}

async function confirmAddMember(userId, userName) {
    const result = await fetchAPI('add_member', {
        method: 'POST',
        body: {
            grupo_id: currentGroupId,
            usuario_id: userId
        }
    });
    
    if (result) {
        closeModal();
        showNotification(`${userName} agregado al grupo`, 'info');
        openGroup(currentGroupId); // Recargar para ver el nuevo miembro
    }
}

// ========================================
// CHAT FUNCTIONS
// ========================================
function initializeHomeListeners() {
    const chatButton = document.getElementById('chatButton');
    const chatContainer = document.getElementById('chatContainer');
    
    if (chatButton) {
        chatButton.addEventListener('click', async () => {
            state.chatOpen = !state.chatOpen;
            chatContainer.style.display = state.chatOpen ? 'block' : 'none';
            if (state.chatOpen) {
                await loadChatMessages();
                chatContainer.innerHTML = renderChatInterface();
                initializeChatListeners();
            }
        });
    }
}

function initializeChatListeners() {
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const closeChatBtn = document.getElementById('closeChatBtn');
    
    if (chatSendBtn) {
        chatSendBtn.addEventListener('click', sendMessage);
    }
    
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    if (closeChatBtn) {
        closeChatBtn.addEventListener('click', () => {
            state.chatOpen = false;
            const chatContainer = document.getElementById('chatContainer');
            if (chatContainer) {
                chatContainer.style.display = 'none';
            }
        });
    }
}

async function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    if (!chatInput) return;
    
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Limpiar input
    chatInput.value = '';
    
    // Agregar mensaje del usuario temporalmente
    const time = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    state.chatMessages.push({
        id: Date.now(),
        sender: 'user',
        text: message,
        time: time
    });
    
    updateChatMessages();
    
    // Enviar a la API
    const result = await sendChatMessage(message);
    
    if (result) {
        // Recargar mensajes desde BD
        await loadChatMessages();
        updateChatMessages();
    }
}

function updateChatMessages() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    chatMessages.innerHTML = state.chatMessages.map(msg => `
        <div class="message ${msg.sender}">
            <div class="message-avatar ${msg.sender}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    ${msg.sender === 'ia' ? 
                        '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line>' :
                        '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>'
                    }
                </svg>
            </div>
            <div class="message-bubble">
                <div class="message-text">${msg.text}</div>
            </div>
        </div>
    `).join('');
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ========================================
// POMODORO FUNCTIONS
// ========================================
function initializePomodoroListeners() {
    let timerInterval = null;
    let timeLeft = 25 * 60;
    let isRunning = false;
    
    const pomodoroStart = document.getElementById('pomodoroStart');
    const pomodoroReset = document.getElementById('pomodoroReset');
    const pomodoroTimer = document.getElementById('pomodoroTimer');
    const pomodoroStatus = document.getElementById('pomodoroStatus');
    
    if (pomodoroStart) {
        pomodoroStart.addEventListener('click', () => {
            if (!isRunning) {
                isRunning = true;
                pomodoroStatus.textContent = 'En progreso';
                pomodoroStart.innerHTML = `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="6" y="4" width="4" height="16"></rect>
                        <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                    Pausar
                `;
                
                timerInterval = setInterval(() => {
                    timeLeft--;
                    updateTimerDisplay();
                    
                    if (timeLeft <= 0) {
                        clearInterval(timerInterval);
                        isRunning = false;
                        pomodoroStatus.textContent = '¡Completado!';
                        showNotification('¡Pomodoro completado! Toma un descanso.', 'info');
                        pomodoroStart.innerHTML = `
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                            Iniciar
                        `;
                    }
                }, 1000);
            } else {
                isRunning = false;
                clearInterval(timerInterval);
                pomodoroStatus.textContent = 'Pausado';
                pomodoroStart.innerHTML = `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    Reanudar
                `;
            }
        });
    }
    
    if (pomodoroReset) {
        pomodoroReset.addEventListener('click', () => {
            clearInterval(timerInterval);
            isRunning = false;
            timeLeft = 25 * 60;
            updateTimerDisplay();
            pomodoroStatus.textContent = 'Iniciando';
            pomodoroStart.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                Iniciar
            `;
        });
    }
    
    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        pomodoroTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

// ========================================
// SETTINGS FUNCTIONS
// ========================================
function initializeSettingsListeners() {
    
    const darkModeCheckbox = document.getElementById('darkModeCheckbox');
    
    if (darkModeCheckbox) {
        darkModeCheckbox.addEventListener('change', (e) => {
            state.darkMode = e.target.checked;
            document.body.classList.toggle('dark-mode', state.darkMode);
        });
    }
}

// ========================================
// GRUPOS - FUNCIONES (Resto de funciones que quedan igual)
// ========================================
let currentGroupId = null;
let messagePollingInterval = null;

async function openGroup(grupoId) {
    currentGroupId = grupoId;
    
    const response = await fetch(`${API_URL}?action=group_details&grupo_id=${grupoId}`);
    const data = await response.json();
    
    if (!data.success) {
        showNotification('Error al cargar grupo', 'error');
        return;
    }
    
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = renderGroupChat(data.grupo, data.miembros);
    
    // Cargar mensajes (primera vez, ir al final)
    await loadGroupMessages(grupoId, false);
    
    // Iniciar polling cada 3 segundos (mantener posición del scroll)
    if (messagePollingInterval) clearInterval(messagePollingInterval);
    messagePollingInterval = setInterval(() => loadGroupMessages(grupoId, true), 3000);
    
    initializeGroupChatListeners();
}

async function loadGroupMessages(grupoId, maintainScroll = false) {
    const container = document.getElementById('groupChatMessages');
    if (!container) return;
    
    // Guardar estado del scroll ANTES de actualizar
    const scrollHeight = container.scrollHeight;
    const scrollTop = container.scrollTop;
    const clientHeight = container.clientHeight;
    
    // Determinar si el usuario está al final (con margen de 100px)
    const isNearBottom = (scrollHeight - scrollTop - clientHeight) < 100;
    
    const response = await fetch(`${API_URL}?action=group_messages&grupo_id=${grupoId}`);
    const data = await response.json();
    
    if (data.success) {
        updateGroupMessages(data.mensajes);
        
        // DESPUÉS de actualizar el DOM
        if (maintainScroll) {
            // Solo hacer scroll al final si estaba cerca del final
            if (isNearBottom) {
                container.scrollTop = container.scrollHeight;
            } else {
                // Mantener la posición relativa si estaba viendo mensajes antiguos
                const newScrollHeight = container.scrollHeight;
                container.scrollTop = scrollTop + (newScrollHeight - scrollHeight);
            }
        } else {
            // Primera carga: ir al final
            container.scrollTop = container.scrollHeight;
        }
    }
}

function updateGroupMessages(mensajes) {
    const container = document.getElementById('groupChatMessages');
    if (!container) return;
    
    container.innerHTML = mensajes.map(msg => `
        <div class="group-message ${msg.usuario_id == state.currentUser.id ? 'own' : ''}">
            <div class="message-header">
                <strong>${msg.usuario}</strong>
                <span class="message-time">${msg.hora}</span>
            </div>
            ${msg.tipo_mensaje === 'imagen' ? 
                `<img src="${msg.imagen}" class="message-image" alt="Imagen" />` : 
                `<p class="message-text">${msg.mensaje}</p>`
            }
        </div>
    `).join('');
    
   
}

async function sendGroupMessage() {
    const input = document.getElementById('groupMessageInput');
    if (!input) return;
    
    const mensaje = input.value.trim();
    if (!mensaje) return;
    
    input.value = '';
    
    await fetchAPI('send_group_message', {
        method: 'POST',
        body: {
            grupo_id: currentGroupId,
            mensaje: mensaje
        }
    });
    
    // Recargar mensajes y forzar scroll al final (mensaje nuevo propio)
    await loadGroupMessages(currentGroupId, false);
}

async function uploadGroupImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Mostrar loading
        showNotification('Subiendo imagen...', 'info');
        
        const formData = new FormData();
        formData.append('imagen', file);
        
        try {
            const response = await fetch(`${API_URL}?action=upload_image`, {
                method: 'POST',
                body: formData
            });
            
            
            const data = await response.json();
            
            if (data.success) {
                await fetchAPI('send_group_message', {
                    method: 'POST',
                    body: {
                        grupo_id: currentGroupId,
                        mensaje: '📷 Imagen',
                        imagen: data.url
                    }
                });
                
                // Recargar y forzar scroll al final (imagen nueva propia)
                await loadGroupMessages(currentGroupId, false);
                showNotification('Imagen enviada', 'info');
            }
        } catch (error) {
            showNotification('Error al subir imagen', 'error');
        }
    };
    
    input.click();
}

function initializeGroupChatListeners() {
    const sendBtn = document.getElementById('sendGroupMessage');
    const input = document.getElementById('groupMessageInput');
    const imageBtn = document.getElementById('uploadImageBtn');
    const addMemberBtn = document.getElementById('addMemberBtn');
    const backBtn = document.getElementById('backToGroups');
    
    if (sendBtn) sendBtn.addEventListener('click', sendGroupMessage);
    
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendGroupMessage();
        });
    }
    
    if (imageBtn) imageBtn.addEventListener('click', uploadGroupImage);
    if (addMemberBtn) addMemberBtn.addEventListener('click', addMemberToGroup);
    
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (messagePollingInterval) clearInterval(messagePollingInterval);
            currentGroupId = null;
            renderSection('groups');
        });
    }
}

function renderGroupChat(grupo, miembros) {
    const isAdmin = grupo.admin_id == state.currentUser.id;
    
    return `
        <div class="group-chat-container">
            <div class="group-chat-header">
                <button class="back-btn" id="backToGroups">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
                <div class="group-info-header">
                    <h2>${grupo.nombre}</h2>
                    <p>${miembros.length} miembros</p>
                </div>
                ${isAdmin ? `
                    <button class="add-member-btn" id="addMemberBtn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="8.5" cy="7" r="4"></circle>
                            <line x1="20" y1="8" x2="20" y2="14"></line>
                            <line x1="23" y1="11" x2="17" y2="11"></line>
                        </svg>
                    </button>
                ` : ''}
            </div>
            
            <div class="group-members">
                <strong>Miembros:</strong> ${miembros.map(m => m.nombre).join(', ')}
            </div>
            
            <div class="group-chat-messages" id="groupChatMessages">
                <!-- Mensajes se cargan aquí -->
            </div>
            
            <div class="group-chat-input">
                <button class="attach-btn" id="uploadImageBtn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                    </svg>
                </button>
                <input type="text" id="groupMessageInput" placeholder="Escribe un mensaje..." />
                <button class="send-btn" id="sendGroupMessage">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </div>
        </div>
    `;
}// ========================================
// NOTICIAS - CREAR Y ELIMINAR
// ========================================
function showCreateNewsModal() {
    const modalHTML = `
        <div class="modal-header">
            <h3>Crear Noticia</h3>
            <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label for="newsTitle">Título *</label>
                <input type="text" id="newsTitle" placeholder="Título de la noticia" required>
            </div>
            <div class="form-group">
                <label for="newsDesc">Descripción</label>
                <textarea id="newsDesc" placeholder="Describe la noticia..." rows="4"></textarea>
            </div>
            <div class="form-group">
                <label for="newsType">Tipo</label>
                <select id="newsType">
                    <option value="noticia">Noticia</option>
                    <option value="anuncio">Anuncio</option>
                    <option value="evento">Evento</option>
                </select>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="submitCreateNews()">Publicar</button>
        </div>
    `;
    
    showModal(modalHTML);
    setTimeout(() => document.getElementById('newsTitle').focus(), 100);
}

async function submitCreateNews() {
    const titulo = document.getElementById('newsTitle').value.trim();
    const descripcion = document.getElementById('newsDesc').value.trim();
    const tipo = document.getElementById('newsType').value;
    
    if (!titulo) {
        showNotification('El título es obligatorio', 'error');
        return;
    }
    
    const data = await fetchAPI('create_news', {
        method: 'POST',
        body: { titulo, descripcion, tipo }
    });
    
    if (data) {
        closeModal();
        showNotification('Noticia creada exitosamente', 'info');
        await Promise.all([loadNews(), loadRecommendations()]);
        renderSection('news');
    }
}

async function deleteNews(newsId) {
    if (!confirm('¿Eliminar esta noticia?')) return;
    
    const data = await fetchAPI('delete_news', {
        method: 'POST',
        body: { id: newsId }
    });
    
    if (data) {
        showNotification('Noticia eliminada', 'info');
        await loadNews();
        renderSection('news');
    }
}

function showCreateRecommendationModal() {
    const modalHTML = `
        <div class="modal-header">
            <h3>Nueva Recomendación</h3>
            <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label for="recMessage">Mensaje *</label>
                <textarea id="recMessage" placeholder="Escribe tu recomendación..." rows="4" required></textarea>
            </div>
            <div class="form-group">
                <label for="recTarget">Dirigido a</label>
                <input type="text" id="recTarget" placeholder="Ej: 5to Secundaria" value="Todos">
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="submitCreateRecommendation()">Publicar</button>
        </div>
    `;
    
    showModal(modalHTML);
    setTimeout(() => document.getElementById('recMessage').focus(), 100);
}

async function submitCreateRecommendation() {
    const mensaje = document.getElementById('recMessage').value.trim();
    const dirigido_a = document.getElementById('recTarget').value.trim();
    
    if (!mensaje) {
        showNotification('El mensaje es obligatorio', 'error');
        return;
    }
    
    const data = await fetchAPI('create_recommendation', {
        method: 'POST',
        body: { mensaje, dirigido_a }
    });
    
    if (data) {
        closeModal();
        showNotification('Recomendación publicada', 'info');
        await loadRecommendations();
        renderSection('news');
    }
}