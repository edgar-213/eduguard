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
// ========================================
// CHAT GRUPAL - SIN PARPADEO (ACTUALIZACIÓN OPTIMIZADA)
// ========================================

let currentGroupId = null;
let messagePollingInterval = null;
let lastMessageId = 0; // Variable para rastrear el último mensaje cargado

// Abrir grupo
async function openGroup(grupoId) {
    currentGroupId = grupoId;
    lastMessageId = 0; // Resetear
    
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
    
    // Iniciar polling cada 2 segundos (SOLO nuevos mensajes)
    if (messagePollingInterval) clearInterval(messagePollingInterval);
    messagePollingInterval = setInterval(() => loadNewMessages(grupoId), 2000);
    
    initializeGroupChatListeners();
}

// Cargar TODOS los mensajes (primera carga)
async function loadGroupMessages(grupoId, maintainScroll = false) {
    const container = document.getElementById('groupChatMessages');
    if (!container) return;
    
    const response = await fetch(`${API_URL}?action=group_messages&grupo_id=${grupoId}`);
    const data = await response.json();
    
    if (data.success) {
        const mensajes = data.mensajes;
        
        // Guardar el ID del último mensaje
        if (mensajes.length > 0) {
            lastMessageId = mensajes[mensajes.length - 1].id;
        }
        
        // Renderizar TODOS los mensajes
        updateGroupMessages(mensajes);
        
        // Scroll al final (primera carga)
        if (!maintainScroll) {
            container.scrollTop = container.scrollHeight;
        }
    }
}

// Cargar SOLO mensajes nuevos (polling)
async function loadNewMessages(grupoId) {
    const container = document.getElementById('groupChatMessages');
    if (!container) return;
    
    // Pedir solo mensajes después del último ID conocido
    const response = await fetch(`${API_URL}?action=group_messages&grupo_id=${grupoId}&after_id=${lastMessageId}`);
    const data = await response.json();
    
    if (data.success && data.mensajes.length > 0) {
        const nuevosMensajes = data.mensajes;
        
        // Detectar si el usuario está al final del scroll
        const scrollHeight = container.scrollHeight;
        const scrollTop = container.scrollTop;
        const clientHeight = container.clientHeight;
        const isNearBottom = (scrollHeight - scrollTop - clientHeight) < 100;
        
        // AGREGAR solo los nuevos mensajes al DOM (sin recargar todo)
        nuevosMensajes.forEach(msg => {
            const messageHTML = renderSingleMessage(msg);
            container.insertAdjacentHTML('beforeend', messageHTML);
        });
        
        // Actualizar el último ID
        lastMessageId = nuevosMensajes[nuevosMensajes.length - 1].id;
        
        // Solo hacer scroll si estaba cerca del final
        if (isNearBottom) {
            container.scrollTop = container.scrollHeight;
        }
    }
}

// Renderizar UN SOLO mensaje (para agregar dinámicamente)
function renderSingleMessage(msg) {
    const isOwn = msg.usuario_id == state.currentUser.id;
    const time = msg.hora || '';
    
    if (msg.tipo_mensaje === 'imagen') {
        return `
            <div class="group-message ${isOwn ? 'own' : ''}" data-msg-id="${msg.id}">
                <div class="message-header">
                    <strong>${escapeHtml(msg.usuario)}</strong>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-image-container">
                    <img src="${msg.imagen}" class="message-image" alt="Imagen compartida" onclick="openImageModal('${msg.imagen}')" />
                </div>
            </div>
        `;
    } else {
        return `
            <div class="group-message ${isOwn ? 'own' : ''}" data-msg-id="${msg.id}">
                <div class="message-header">
                    <strong>${escapeHtml(msg.usuario)}</strong>
                    <span class="message-time">${time}</span>
                </div>
                <p class="message-text">${escapeHtml(msg.mensaje)}</p>
            </div>
        `;
    }
}

// Renderizar TODOS los mensajes (primera carga)
function updateGroupMessages(mensajes) {
    const container = document.getElementById('groupChatMessages');
    if (!container) return;
    
    if (mensajes.length === 0) {
        container.innerHTML = '<div class="no-messages">No hay mensajes aún. ¡Sé el primero en escribir!</div>';
        return;
    }
    
    container.innerHTML = mensajes.map(msg => renderSingleMessage(msg)).join('');
}

// Enviar mensaje
async function sendGroupMessage() {
    const input = document.getElementById('groupMessageInput');
    if (!input) return;
    
    const mensaje = input.value.trim();
    if (!mensaje) {
        showNotification('Escribe un mensaje', 'error');
        return;
    }
    
    // Limpiar input inmediatamente
    input.value = '';
    
    const result = await fetchAPI('send_group_message', {
        method: 'POST',
        body: {
            grupo_id: currentGroupId,
            mensaje: mensaje
        }
    });
    
    if (result && result.success) {
        // NO recargar todo, el polling detectará el nuevo mensaje
        // O agregarlo manualmente si quieres verlo instantáneamente:
        const response = await fetch(`${API_URL}?action=group_messages&grupo_id=${currentGroupId}&after_id=${lastMessageId}`);
        const data = await response.json();
        
        if (data.success && data.mensajes.length > 0) {
            const container = document.getElementById('groupChatMessages');
            data.mensajes.forEach(msg => {
                container.insertAdjacentHTML('beforeend', renderSingleMessage(msg));
                lastMessageId = msg.id;
            });
            container.scrollTop = container.scrollHeight;
        }
    } else {
        showNotification('Error al enviar mensaje', 'error');
    }
}

// Upload imagen
async function uploadGroupImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/jpg,image/png,image/gif,image/webp';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validar tamaño (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('La imagen no debe superar 5MB', 'error');
            return;
        }
        
        // Mostrar loading
        showNotification('Subiendo imagen...', 'info');
        
        const formData = new FormData();
        formData.append('imagen', file);
        formData.append('grupo_id', currentGroupId);
        
        try {
            const response = await fetch(`${API_URL}?action=upload_group_image`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification('Imagen enviada correctamente', 'info');
                
                // Cargar el nuevo mensaje
                const messagesResponse = await fetch(`${API_URL}?action=group_messages&grupo_id=${currentGroupId}&after_id=${lastMessageId}`);
                const messagesData = await messagesResponse.json();
                
                if (messagesData.success && messagesData.mensajes.length > 0) {
                    const container = document.getElementById('groupChatMessages');
                    messagesData.mensajes.forEach(msg => {
                        container.insertAdjacentHTML('beforeend', renderSingleMessage(msg));
                        lastMessageId = msg.id;
                    });
                    container.scrollTop = container.scrollHeight;
                }
            } else {
                showNotification(data.message || 'Error al subir imagen', 'error');
            }
        } catch (error) {
            console.error('Error upload:', error);
            showNotification('Error de conexión al subir imagen', 'error');
        }
    };
    
    input.click();
}

// Escapar HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Abrir imagen en modal
function openImageModal(imageUrl) {
    const modalHTML = `
        <div class="modal-header">
            <h3>Imagen</h3>
            <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body" style="text-align: center;">
            <img src="${imageUrl}" style="max-width: 100%; max-height: 70vh; border-radius: 8px;" alt="Imagen" />
        </div>
        <div class="modal-footer">
            <a href="${imageUrl}" download class="btn btn-primary">Descargar</a>
            <button class="btn btn-secondary" onclick="closeModal()">Cerrar</button>
        </div>
    `;
    showModal(modalHTML);
}

// Toggle emoji picker
function toggleEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    if (picker) {
        const isVisible = picker.style.display !== 'none';
        picker.style.display = isVisible ? 'none' : 'block';
    }
}

// Insertar emoji
function insertEmoji(emoji) {
    const input = document.getElementById('groupMessageInput');
    if (input) {
        const currentValue = input.value;
        const cursorPos = input.selectionStart;
        const newValue = currentValue.slice(0, cursorPos) + emoji + currentValue.slice(cursorPos);
        input.value = newValue;
        input.focus();
        input.selectionStart = input.selectionEnd = cursorPos + emoji.length;
    }
    toggleEmojiPicker();
}

// Listeners
function initializeGroupChatListeners() {
    const sendBtn = document.getElementById('sendGroupMessage');
    const input = document.getElementById('groupMessageInput');
    const imageBtn = document.getElementById('uploadImageBtn');
    const emojiBtn = document.getElementById('emojiBtn');
    const addMemberBtn = document.getElementById('addMemberBtn');
    const backBtn = document.getElementById('backToGroups');
    
    if (sendBtn) sendBtn.addEventListener('click', sendGroupMessage);
    
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendGroupMessage();
            }
        });
    }
    
    if (imageBtn) imageBtn.addEventListener('click', uploadGroupImage);
    if (emojiBtn) emojiBtn.addEventListener('click', toggleEmojiPicker);
    if (addMemberBtn) addMemberBtn.addEventListener('click', addMemberToGroup);
    
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (messagePollingInterval) clearInterval(messagePollingInterval);
            currentGroupId = null;
            lastMessageId = 0;
            renderSection('groups');
        });
    }
    
    // Cerrar emoji picker al hacer click fuera
    document.addEventListener('click', (e) => {
        const picker = document.getElementById('emojiPicker');
        const emojiBtn = document.getElementById('emojiBtn');
        if (picker && !picker.contains(e.target) && e.target !== emojiBtn && !emojiBtn.contains(e.target)) {
            picker.style.display = 'none';
        }
    });
}

// ========================================
// GRUPOS - CHAT MEJORADO CON EMOJIS E IMÁGENES
// ========================================

// Emojis disponibles
const EMOJIS = ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','☺️','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖','😺','😸','😹','😻','😼','😽','🙀','😿','😾','🙈','🙉','🙊','💋','💌','💘','💝','💖','💗','💓','💞','💕','💟','❣️','💔','❤️','🧡','💛','💚','💙','💜','🤎','🖤','🤍','💯','💢','💥','💫','💦','💨','🕳️','💣','💬','👁️‍🗨️','🗨️','🗯️','💭','💤','👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁️','👅','👄'];

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
                
                <!-- Menú de opciones del grupo -->
                <button class="group-menu-btn" id="groupMenuBtn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="12" cy="5" r="1"></circle>
                        <circle cx="12" cy="19" r="1"></circle>
                    </svg>
                </button>
                
                <!-- Dropdown del menú -->
                <div class="group-dropdown-menu" id="groupDropdownMenu" style="display: none;">
                    ${isAdmin ? `
                        <button class="menu-item" onclick="renameGroup()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Renombrar grupo
                        </button>
                        <button class="menu-item" onclick="editDescription()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                            </svg>
                            Editar descripción
                        </button>
                        <button class="menu-item" onclick="showMembersList()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                            Gestionar miembros
                        </button>
                        <button class="menu-item danger" onclick="deleteGroup()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            Eliminar grupo
                        </button>
                    ` : `
                        <button class="menu-item" onclick="showMembersList()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                            </svg>
                            Ver miembros
                        </button>
                        <button class="menu-item danger" onclick="leaveGroup()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                            Salir del grupo
                        </button>
                    `}
                </div>
            </div>
            
            <div class="group-members">
                <strong>Miembros:</strong> ${miembros.map(m => m.nombre).join(', ')}
            </div>
            
            <div class="group-chat-messages" id="groupChatMessages">
                <div class="loading-messages">Cargando mensajes...</div>
            </div>
            
            <!-- Selector de Emojis -->
            <div class="emoji-picker" id="emojiPicker" style="display: none;">
                <div class="emoji-picker-header">
                    <span>Selecciona un emoji</span>
                    <button class="emoji-close" onclick="toggleEmojiPicker()">×</button>
                </div>
                <div class="emoji-grid">
                    ${EMOJIS.map(emoji => `
                        <button class="emoji-item" onclick="insertEmoji('${emoji}')">${emoji}</button>
                    `).join('')}
                </div>
            </div>
            
            <div class="group-chat-input">
                <button class="attach-btn" id="uploadImageBtn" title="Subir imagen">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                </button>
                <button class="emoji-btn" id="emojiBtn" title="Emojis">
                    <span style="font-size: 20px;">😊</span>
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
}

// ========================================
// FUNCIONES DE ADMIN
// ========================================

// Renombrar grupo
async function renameGroup() {
    const modalHTML = `
        <div class="modal-header">
            <h3>Renombrar Grupo</h3>
            <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label for="newGroupName">Nuevo nombre *</label>
                <input type="text" id="newGroupName" placeholder="Nombre del grupo" required>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="submitRenameGroup()">Guardar</button>
        </div>
    `;
    showModal(modalHTML);
    setTimeout(() => document.getElementById('newGroupName').focus(), 100);
}

async function submitRenameGroup() {
    const nombre = document.getElementById('newGroupName').value.trim();
    
    if (!nombre) {
        showNotification('El nombre es obligatorio', 'error');
        return;
    }
    
    const result = await fetchAPI('update_group', {
        method: 'POST',
        body: {
            grupo_id: currentGroupId,
            nombre: nombre
        }
    });
    
    if (result && result.success) {
        closeModal();
        showNotification('Grupo renombrado', 'info');
        // Recargar la vista del grupo
        openGroup(currentGroupId);
    }
}

// Editar descripción
async function editDescription() {
    const modalHTML = `
        <div class="modal-header">
            <h3>Editar Descripción</h3>
            <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label for="newGroupDesc">Descripción</label>
                <textarea id="newGroupDesc" rows="4" placeholder="Describe el grupo..."></textarea>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="submitEditDescription()">Guardar</button>
        </div>
    `;
    showModal(modalHTML);
    setTimeout(() => document.getElementById('newGroupDesc').focus(), 100);
}

async function submitEditDescription() {
    const descripcion = document.getElementById('newGroupDesc').value.trim();
    
    const result = await fetchAPI('update_group', {
        method: 'POST',
        body: {
            grupo_id: currentGroupId,
            descripcion: descripcion
        }
    });
    
    if (result && result.success) {
        closeModal();
        showNotification('Descripción actualizada', 'info');
    }
}

// Mostrar lista de miembros
async function showMembersList() {
    const response = await fetch(`${API_URL}?action=group_details&grupo_id=${currentGroupId}`);
    const data = await response.json();
    
    if (!data.success) return;
    
    const isAdmin = data.grupo.admin_id == state.currentUser.id;
    
    const modalHTML = `
        <div class="modal-header">
            <h3>Miembros del Grupo (${data.miembros.length})</h3>
            <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
            <div class="members-list">
                ${data.miembros.map(member => `
                    <div class="member-item">
                        <div class="member-info">
                            <div class="member-avatar">${member.nombre.split(' ').map(n => n[0]).join('')}</div>
                            <div>
                                <div class="member-name">${member.nombre}</div>
                                <div class="member-email">${member.email}</div>
                            </div>
                            ${member.id == data.grupo.admin_id ? '<span class="admin-badge">Admin</span>' : ''}
                        </div>
                        ${isAdmin && member.id != data.grupo.admin_id ? `
                            <button class="btn-remove-member" onclick="removeMember(${member.id}, '${member.nombre}')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
            ${isAdmin ? `
                <button class="btn btn-primary" onclick="closeModal(); addMemberToGroup();" style="width: 100%; margin-top: 1rem;">
                    + Agregar miembro
                </button>
            ` : ''}
        </div>
    `;
    showModal(modalHTML);
}

// Eliminar miembro
async function removeMember(userId, userName) {
    if (!confirm(`¿Expulsar a ${userName} del grupo?`)) return;
    
    const result = await fetchAPI('remove_member', {
        method: 'POST',
        body: {
            grupo_id: currentGroupId,
            usuario_id: userId
        }
    });
    
    if (result && result.success) {
        showNotification(`${userName} eliminado del grupo`, 'info');
        closeModal();
        setTimeout(() => showMembersList(), 300);
    }
}

// Eliminar grupo
async function deleteGroup() {
    if (!confirm('¿ELIMINAR ESTE GRUPO? Esta acción no se puede deshacer.')) return;
    
    const result = await fetchAPI('delete_group', {
        method: 'POST',
        body: {
            grupo_id: currentGroupId
        }
    });
    
    if (result && result.success) {
        if (messagePollingInterval) clearInterval(messagePollingInterval);
        currentGroupId = null;
        showNotification('Grupo eliminado', 'info');
        await loadGroups();
        renderSection('groups');
    }
}

// Salir del grupo
async function leaveGroup() {
    if (!confirm('¿Salir de este grupo?')) return;
    
    const result = await fetchAPI('leave_group', {
        method: 'POST',
        body: {
            grupo_id: currentGroupId
        }
    });
    
    if (result && result.success) {
        if (messagePollingInterval) clearInterval(messagePollingInterval);
        currentGroupId = null;
        showNotification('Has salido del grupo', 'info');
        await loadGroups();
        renderSection('groups');
    }
}


function toggleEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    if (picker) {
        const isVisible = picker.style.display !== 'none';
        picker.style.display = isVisible ? 'none' : 'block';
    }
}

function insertEmoji(emoji) {
    const input = document.getElementById('groupMessageInput');
    if (input) {
        const currentValue = input.value;
        const cursorPos = input.selectionStart;
        const newValue = currentValue.slice(0, cursorPos) + emoji + currentValue.slice(cursorPos);
        input.value = newValue;
        input.focus();
        // Mover cursor después del emoji
        input.selectionStart = input.selectionEnd = cursorPos + emoji.length;
    }
    toggleEmojiPicker();
}

function updateGroupMessages(mensajes) {
    const container = document.getElementById('groupChatMessages');
    if (!container) return;
    
    if (mensajes.length === 0) {
        container.innerHTML = '<div class="no-messages">No hay mensajes aún. ¡Sé el primero en escribir!</div>';
        return;
    }
    
    container.innerHTML = mensajes.map(msg => {
        const isOwn = msg.usuario_id == state.currentUser.id;
        const time = msg.hora || '';
        
        if (msg.tipo_mensaje === 'imagen') {
            return `
                <div class="group-message ${isOwn ? 'own' : ''}">
                    <div class="message-header">
                        <strong>${msg.usuario}</strong>
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="message-image-container">
                        <img src="${msg.imagen}" class="message-image" alt="Imagen compartida" onclick="openImageModal('${msg.imagen}')" />
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="group-message ${isOwn ? 'own' : ''}">
                    <div class="message-header">
                        <strong>${msg.usuario}</strong>
                        <span class="message-time">${time}</span>
                    </div>
                    <p class="message-text">${escapeHtml(msg.mensaje)}</p>
                </div>
            `;
        }
    }).join('');
}

// Abrir imagen en modal
function openImageModal(imageUrl) {
    const modalHTML = `
        <div class="modal-header">
            <h3>Imagen</h3>
            <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body" style="text-align: center;">
            <img src="${imageUrl}" style="max-width: 100%; max-height: 70vh; border-radius: 8px;" alt="Imagen" />
        </div>
        <div class="modal-footer">
            <a href="${imageUrl}" download class="btn btn-primary">Descargar</a>
            <button class="btn btn-secondary" onclick="closeModal()">Cerrar</button>
        </div>
    `;
    showModal(modalHTML);
}

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function uploadGroupImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/jpg,image/png,image/gif,image/webp';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validar tamaño (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('La imagen no debe superar 5MB', 'error');
            return;
        }
        
        // Mostrar loading
        showNotification('Subiendo imagen...', 'info');
        
        const formData = new FormData();
        formData.append('imagen', file);
        formData.append('grupo_id', currentGroupId);
        
        try {
            const response = await fetch(`${API_URL}?action=upload_group_image`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification('Imagen enviada correctamente', 'info');
                // Recargar mensajes y forzar scroll al final
                await loadGroupMessages(currentGroupId, false);
            } else {
                showNotification(data.message || 'Error al subir imagen', 'error');
            }
        } catch (error) {
            console.error('Error upload:', error);
            showNotification('Error de conexión al subir imagen', 'error');
        }
    };
    
    input.click();
}

function initializeGroupChatListeners() {
    const sendBtn = document.getElementById('sendGroupMessage');
    const input = document.getElementById('groupMessageInput');
    const imageBtn = document.getElementById('uploadImageBtn');
    const emojiBtn = document.getElementById('emojiBtn');
    const groupMenuBtn = document.getElementById('groupMenuBtn');
    const backBtn = document.getElementById('backToGroups');
    
    if (sendBtn) sendBtn.addEventListener('click', sendGroupMessage);
    
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendGroupMessage();
            }
        });
    }
    
    if (imageBtn) imageBtn.addEventListener('click', uploadGroupImage);
    if (emojiBtn) emojiBtn.addEventListener('click', toggleEmojiPicker);
    
    // Menú de grupo
    if (groupMenuBtn) {
        groupMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const menu = document.getElementById('groupDropdownMenu');
            if (menu) {
                menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
            }
        });
    }
    
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (messagePollingInterval) clearInterval(messagePollingInterval);
            currentGroupId = null;
            lastMessageId = 0;
            renderSection('groups');
        });
    }
    
    // Cerrar menús al hacer click fuera
    document.addEventListener('click', (e) => {
        const picker = document.getElementById('emojiPicker');
        const emojiBtn = document.getElementById('emojiBtn');
        const groupMenu = document.getElementById('groupDropdownMenu');
        const groupMenuBtn = document.getElementById('groupMenuBtn');
        
        if (picker && !picker.contains(e.target) && e.target !== emojiBtn && !emojiBtn?.contains(e.target)) {
            picker.style.display = 'none';
        }
        
        if (groupMenu && !groupMenu.contains(e.target) && e.target !== groupMenuBtn && !groupMenuBtn?.contains(e.target)) {
            groupMenu.style.display = 'none';
        }
    });
}

async function sendGroupMessage() {
    const input = document.getElementById('groupMessageInput');
    if (!input) return;
    
    const mensaje = input.value.trim();
    if (!mensaje) {
        showNotification('Escribe un mensaje', 'error');
        return;
    }
    
    // Limpiar input inmediatamente
    input.value = '';
    
    const result = await fetchAPI('send_group_message', {
        method: 'POST',
        body: {
            grupo_id: currentGroupId,
            mensaje: mensaje
        }
    });
    
    if (result && result.success) {
        // Recargar mensajes y forzar scroll al final
        await loadGroupMessages(currentGroupId, false);
    } else {
        showNotification('Error al enviar mensaje', 'error');
    }
}
// ========================================
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