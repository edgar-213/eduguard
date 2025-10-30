// profesor.js - Versión completa con integración Flowise y manejo de errores mejorado

// Variables globales
let currentUser = null;
let grupoActivo = null;
let cursosData = [];
let estudiantesData = [];
let todosLosEstudiantes = [];
let chatInterval = null;
let alumnoActivo = null;
let conversacionesAlumnos = [];
let chatAlumnoInterval = null;
let calendarioMesActual = new Date();
let eventosCalendario = [];

// Configuración de logging
const DEBUG = true;
function log(message, data = null) {
    if (DEBUG) {
        console.log(`[EduGuard Profesor] ${message}`, data || '');
    }
}

function error(message, err = null) {
    console.error(`[EduGuard Profesor ERROR] ${message}`, err || '');
}

// Función API mejorada con logging
async function apiCall(url, options = {}) {
    try {
        const baseUrl = '/eduguard/php/';
        const fullUrl = baseUrl + url;
        
        log(`Llamando a API: ${fullUrl}`, options);
        
        const response = await fetch(fullUrl, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        log(`Respuesta API: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        log(`Datos recibidos:`, data);
        return data;
    } catch (err) {
        error(`Error en API call a ${url}:`, err);
        throw err;
    }
}

// Verificación de sesión con logging extendido
async function verificarSesion() {
    log('Iniciando verificación de sesión...');
    
    try {
        const data = await apiCall('profesor_api.php?action=verificar_sesion');
        
        if (!data.success) {
            log('Sesión no válida, redirigiendo a inicio');
            window.location.href = 'inicio.html';
            return;
        }
        
        currentUser = data.user;
        log('Usuario cargado:', currentUser);
        
        // Validar datos del usuario
        if (!currentUser.nombre) {
            log('Nombre de usuario no encontrado, usando valor por defecto');
            currentUser.nombre = "Profesor";
        }
        
        if (!currentUser.email) {
            currentUser.email = 'profesor@ejemplo.com';
        }
        
        log('Datos del usuario validados:', currentUser);
        
        // Inicializar datos después de cargar usuario
        await inicializarDatos();
        
    } catch (err) {
        error('Error verificando sesión:', err);
        showNotification('Error de conexión', 'error');
        setTimeout(() => window.location.href = 'inicio.html', 2000);
    }
}

// Inicialización de datos con logging
async function inicializarDatos() {
    log('Iniciando inicialización de datos...');
    
    try {
        // Actualizar elementos básicos del usuario
        document.getElementById('userName').textContent = currentUser.nombre;
        const iniciales = currentUser.nombre.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        document.getElementById('userAvatar').textContent = iniciales;
        
        log('Elementos básicos actualizados:', {
            nombre: currentUser.nombre,
            iniciales: iniciales
        });
        
        // Cargar todos los datos en paralelo
        const promesas = [
            cargarEstadisticas(),
            cargarCursos(),
            cargarTodosLosEstudiantes(),
            cargarEstudiantes(),
            cargarUltimasNotas(),
            cargarGrupos(),
            cargarAnuncios(),
            cargarMateriales(),
            initChart(),
            cargarConversacionesAlumnos(),
            inicializarPerfil()
        ];
        
        log('Ejecutando promesas de carga de datos...');
        await Promise.all(promesas);
        log('Todos los datos cargados exitosamente');
        
        // Actualizar campos del formulario de configuración
        actualizarFormularioConfiguracion();
        
    } catch (err) {
        error('Error en inicialización de datos:', err);
        showNotification('Error al cargar datos iniciales', 'error');
    }
}

// Función para actualizar formulario de configuración
function actualizarFormularioConfiguracion() {
    log('Actualizando formulario de configuración...');
    
    try {
        const campos = {
            'perfilNombre': currentUser.nombre || '',
            'perfilEmail': currentUser.email || '',
            'perfilTelefono': currentUser.telefono || '',
            'perfilBio': currentUser.bio || ''
        };
        
        Object.entries(campos).forEach(([id, valor]) => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.value = valor;
                log(`Campo ${id} actualizado con: ${valor}`);
            } else {
                error(`Elemento no encontrado: ${id}`);
            }
        });
        
    } catch (err) {
        error('Error actualizando formulario:', err);
    }
}

// Inicialización del perfil con logging extendido
async function inicializarPerfil() {
    log('Iniciando inicialización del perfil...');
    
    try {
        // Actualizar información básica del perfil inmediatamente
        actualizarInfoPerfilBasica();
        
        // Intentar cargar estadísticas del perfil
        try {
            const data = await apiCall('profesor_api.php?action=get_perfil_stats');
            
            if (data.success) {
                log('Estadísticas del perfil cargadas:', data.stats);
                
                // Actualizar estadísticas
                document.getElementById('totalCursosPerfil').textContent = data.stats.totalCursos || 0;
                document.getElementById('totalEstudiantesPerfil').textContent = data.stats.totalEstudiantes || 0;
                document.getElementById('totalNotasPerfil').textContent = data.stats.totalNotas || 0;
                document.getElementById('promedioGeneralPerfil').textContent = (data.stats.promedioGeneral || 0).toFixed(1);
                
                log('Estadísticas actualizadas en el DOM');
            } else {
                log('Error en respuesta de estadísticas del perfil:', data.message);
                // Usar valores por defecto
                establecerValoresPorDefectoPerfil();
            }
        } catch (err) {
            error('Error cargando estadísticas del perfil:', err);
            // Usar valores por defecto
            establecerValoresPorDefectoPerfil();
        }
        
        // Cargar datos adicionales con manejo de errores individual
        try {
            await cargarActividadReciente();
        } catch (err) {
            error('Error cargando actividad reciente:', err);
            cargarActividadRecientePorDefecto();
        }
        
        try {
            await cargarEventosCalendario();
        } catch (err) {
            error('Error cargando eventos del calendario:', err);
        }
        
        // Inicializar calendario
        inicializarCalendario();
        
        log('Perfil inicializado completamente');
        
    } catch (err) {
        error('Error inicializando perfil:', err);
        establecerValoresPorDefectoPerfil();
    }
}

// Función para actualizar información básica del perfil
function actualizarInfoPerfilBasica() {
    log('Actualizando información básica del perfil...');
    
    try {
        // Actualizar nombre completo
        const elementoNombre = document.getElementById('perfilNombreCompleto');
        if (elementoNombre) {
            elementoNombre.textContent = currentUser.nombre;
            log(`Nombre del perfil actualizado: ${currentUser.nombre}`);
        } else {
            error('Elemento perfilNombreCompleto no encontrado');
        }
        
        // Actualizar email
        const elementoEmail = document.getElementById('perfilEmailCompleto');
        if (elementoEmail) {
            elementoEmail.textContent = currentUser.email;
            log(`Email del perfil actualizado: ${currentUser.email}`);
        } else {
            error('Elemento perfilEmailCompleto no encontrado');
        }
        
        // Actualizar avatar
        const iniciales = currentUser.nombre.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        
        const avatarGrande = document.getElementById('perfilAvatarGrande');
        if (avatarGrande) {
            avatarGrande.textContent = iniciales;
            log(`Avatar grande actualizado con: ${iniciales}`);
        }
        
        const avatarPreview = document.getElementById('avatarPreview');
        if (avatarPreview) {
            avatarPreview.textContent = iniciales;
            log(`Avatar preview actualizado con: ${iniciales}`);
        }
        
    } catch (err) {
        error('Error actualizando información básica del perfil:', err);
    }
}

// Función para establecer valores por defecto del perfil
function establecerValoresPorDefectoPerfil() {
    log('Estableciendo valores por defecto del perfil...');
    
    try {
        document.getElementById('totalCursosPerfil').textContent = '0';
        document.getElementById('totalEstudiantesPerfil').textContent = '0';
        document.getElementById('totalNotasPerfil').textContent = '0';
        document.getElementById('promedioGeneralPerfil').textContent = '0.0';
        
        // Cargar actividad reciente por defecto
        cargarActividadRecientePorDefecto();
        
    } catch (err) {
        error('Error estableciendo valores por defecto:', err);
    }
}

// Función para cargar actividad reciente por defecto
function cargarActividadRecientePorDefecto() {
    const actividadReciente = document.getElementById('actividadReciente');
    if (actividadReciente) {
        actividadReciente.innerHTML = `
            <div class="actividad-item">
                <div class="actividad-icon">
                    <i class="fas fa-file-alt"></i>
                </div>
                <div class="actividad-content">
                    <div class="actividad-titulo">Registraste nuevas notas</div>
                    <div class="actividad-descripcion">Matemáticas - 5to Grado</div>
                    <div class="actividad-fecha">Hace 2 horas</div>
                </div>
            </div>
            <div class="actividad-item">
                <div class="actividad-icon">
                    <i class="fas fa-bullhorn"></i>
                </div>
                <div class="actividad-content">
                    <div class="actividad-titulo">Publicaste un anuncio</div>
                    <div class="actividad-descripcion">Examen Final - Ciencias</div>
                    <div class="actividad-fecha">Ayer</div>
                </div>
            </div>
        `;
    }
}

// Función para cargar estadísticas con logging
async function cargarEstadisticas() {
    log('Cargando estadísticas...');
    
    try {
        const data = await apiCall('profesor_api.php?action=get_stats');
        
        if (data.success) {
            log('Estadísticas cargadas:', data.stats);
            
            document.getElementById('totalEstudiantes').textContent = data.stats.totalEstudiantes || 0;
            document.getElementById('totalCursos').textContent = data.stats.totalCursos || 0;
            document.getElementById('mensajesNuevos').textContent = data.stats.mensajesNuevos || 0;
            document.getElementById('promedioGeneral').textContent = (data.stats.promedioGeneral || 0).toFixed(1);
            
            log('Estadísticas actualizadas en el panel principal');
        } else {
            error('Error en respuesta de estadísticas:', data.message);
        }
    } catch (err) {
        error('Error cargando estadísticas:', err);
    }
}

// Función para cargar cursos con logging
async function cargarCursos() {
    log('Cargando cursos...');
    
    try {
        const data = await apiCall('profesor_api.php?action=get_materias');
        
        if (data.success) {
            cursosData = data.materias;
            log('Cursos cargados:', cursosData);
            
            mostrarCursos(cursosData);
            llenarSelectsCursos(cursosData);
        } else {
            error('Error cargando cursos:', data.message);
            document.getElementById('listaCursos').innerHTML = '<p class="empty-state"><i class="fas fa-book"></i><p>Error al cargar cursos</p></p>';
        }
    } catch (err) {
        error('Error cargando cursos:', err);
        document.getElementById('listaCursos').innerHTML = '<p class="empty-state"><i class="fas fa-book"></i><p>Error de conexión al cargar cursos</p></p>';
    }
}

// Función para mostrar cursos
function mostrarCursos(cursos) {
    if (!cursos || cursos.length === 0) {
        document.getElementById('listaCursos').innerHTML = `
            <p class="empty-state"><i class="fas fa-book"></i><p>No tienes cursos asignados</p></p>
            <button class="btn btn-primary" onclick="abrirModalCrearCurso()">
                <i class="fas fa-plus"></i> Crear Nuevo Curso
            </button>
        `;
        return;
    }
    
    const html = cursos.map(curso => `
        <div class="content-card">
            <h3 style="margin-bottom: 0.5rem;">${curso.nombre}</h3>
            <p style="color: var(--text-secondary); margin-bottom: 0.5rem;">${curso.profesor || currentUser.nombre}</p>
            <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                <span class="badge badge-info">
                    <i class="fas fa-users"></i> ${curso.num_estudiantes || 0} estudiantes
                </span>
                <span class="badge ${curso.promedio >= 13 ? 'badge-success' : 'badge-warning'}">
                    <i class="fas fa-chart-line"></i> Promedio: ${curso.promedio || 0}
                </span>
            </div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button class="btn btn-primary btn-sm" onclick="verEstudiantesCurso(${curso.id})">
                    <i class="fas fa-users"></i> Estudiantes
                </button>
                <button class="btn btn-success btn-sm" onclick="registrarNotaCurso(${curso.id})">
                    <i class="fas fa-file-alt"></i> Notas
                </button>
                <button class="btn btn-warning btn-sm" onclick="abrirModalAgregarEstudiantes(${curso.id})">
                    <i class="fas fa-user-plus"></i> Agregar Estudiantes
                </button>
            </div>
        </div>
    `).join('');
    
    document.getElementById('listaCursos').innerHTML = html + 
        `<div style="margin-top: 1rem; text-align: center;">
            <button class="btn btn-primary" onclick="abrirModalCrearCurso()">
                <i class="fas fa-plus"></i> Crear Nuevo Curso
            </button>
        </div>`;
}

// Función para llenar selects de cursos
function llenarSelectsCursos(cursos) {
    const selects = ['filtroCurso', 'notaCurso', 'materialCurso'];
    selects.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            const options = cursos.map(c => 
                `<option value="${c.id}">${c.nombre}</option>`
            ).join('');
            if (id === 'filtroCurso') {
                select.innerHTML = '<option value="">Todos los cursos</option>' + options;
            } else {
                select.innerHTML = '<option value="">Seleccionar curso...</option>' + options;
            }
            log(`Select ${id} actualizado con ${cursos.length} cursos`);
        }
    });
}

// Función para cargar todos los estudiantes
async function cargarTodosLosEstudiantes() {
    log('Cargando todos los estudiantes...');
    
    try {
        const data = await apiCall('profesor_api.php?action=get_all_estudiantes');
        
        if (data.success) {
            todosLosEstudiantes = data.estudiantes;
            log(`Todos los estudiantes cargados: ${todosLosEstudiantes.length}`);
        }
    } catch (err) {
        error('Error cargando todos los estudiantes:', err);
    }
}

// Función para cargar estudiantes
async function cargarEstudiantes() {
    log('Cargando estudiantes...');
    
    try {
        const data = await apiCall('profesor_api.php?action=get_estudiantes');
        
        if (data.success) {
            estudiantesData = data.estudiantes;
            log(`Estudiantes cargados: ${estudiantesData.length}`);
            mostrarEstudiantes(estudiantesData);
        }
    } catch (err) {
        error('Error cargando estudiantes:', err);
        document.getElementById('tablaEstudiantes').innerHTML = '<tr><td colspan="5" style="text-align: center;">Error al cargar estudiantes</td></tr>';
    }
}

// Función para mostrar estudiantes
function mostrarEstudiantes(estudiantes) {
    if (!estudiantes || estudiantes.length === 0) {
        document.getElementById('tablaEstudiantes').innerHTML = `
            <tr><td colspan="5" style="text-align: center;">No hay estudiantes registrados</td></tr>
            <tr><td colspan="5" style="text-align: center;">
                <button class="btn btn-primary" onclick="abrirModalAgregarEstudiantes()">
                    <i class="fas fa-user-plus"></i> Agregar Estudiantes a Cursos
                </button>
            </td></tr>
        `;
        return;
    }
    
    const html = estudiantes.map(est => `
        <tr>
            <td>${est.nombre}</td>
            <td>${est.email}</td>
            <td>${est.grado || 'N/A'} ${est.seccion || ''}</td>
            <td><strong>${(est.promedio || 0).toFixed(1)}</strong></td>
            <td>
                <span class="badge ${est.promedio >= 13 ? 'badge-success' : 'badge-danger'}">
                    ${est.promedio >= 13 ? 'Aprobado' : 'Desaprobado'}
                </span>
            </td>
        </tr>
    `).join('');
    
    document.getElementById('tablaEstudiantes').innerHTML = html + 
        `<tr><td colspan="5" style="text-align: center;">
            <button class="btn btn-primary" onclick="abrirModalAgregarEstudiantes()">
                <i class="fas fa-user-plus"></i> Agregar Estudiantes a Cursos
            </button>
        </td></tr>`;
}

// Función para cargar últimas notas
async function cargarUltimasNotas() {
    log('Cargando últimas notas...');
    
    try {
        const data = await apiCall('profesor_api.php?action=get_notas_recientes');
        
        if (data.success && data.notas.length > 0) {
            const html = data.notas.map(nota => `
                <tr>
                    <td>${nota.estudiante}</td>
                    <td>${nota.materia}</td>
                    <td>${nota.evaluacion}</td>
                    <td><strong>${nota.nota.toFixed(1)}</strong></td>
                    <td>${nota.fecha}</td>
                </tr>
            `).join('');
            document.getElementById('ultimasNotas').innerHTML = html;
            log('Últimas notas cargadas');
        } else {
            document.getElementById('ultimasNotas').innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay notas registradas</td></tr>';
        }
    } catch (err) {
        error('Error cargando últimas notas:', err);
    }
}

// Función para cargar grupos
async function cargarGrupos() {
    log('Cargando grupos...');
    
    try {
        const data = await apiCall('profesor_api.php?action=get_grupos');
        
        if (data.success && data.grupos.length > 0) {
            const html = data.grupos.map(grupo => `
                <div class="content-card" style="cursor: pointer; margin-bottom: 0.5rem; padding: 1rem;" onclick="abrirGrupo(${grupo.id}, '${grupo.nombre.replace(/'/g, "\\'")}')">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h4 style="margin-bottom: 0.3rem;">${grupo.nombre}</h4>
                            <small style="color: var(--text-secondary);">
                                <i class="fas fa-users"></i> ${grupo.miembros} miembros
                                ${grupo.total_mensajes > 0 ? ` • ${grupo.total_mensajes} mensajes` : ''}
                            </small>
                        </div>
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            `).join('');
            document.getElementById('listaGrupos').innerHTML = html;
        } else {
            document.getElementById('listaGrupos').innerHTML = '<p class="empty-state"><i class="fas fa-users"></i><p>No tienes grupos creados</p></p>';
        }
    } catch (err) {
        error('Error cargando grupos:', err);
        // Verificar si el elemento existe antes de intentar modificarlo
        const listaGrupos = document.getElementById('listaGrupos');
        if (listaGrupos) {
            listaGrupos.innerHTML = '<p class="empty-state"><i class="fas fa-users"></i><p>Error al cargar grupos</p></p>';
        }
    }
}

// Función para cargar anuncios
async function cargarAnuncios() {
    log('Cargando anuncios...');
    
    try {
        const data = await apiCall('profesor_api.php?action=get_anuncios');
        
        if (data.success && data.anuncios.length > 0) {
            const html = data.anuncios.map(anuncio => `
                <div class="content-card" style="margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div style="flex: 1;">
                            <h3 style="margin-bottom: 0.5rem;">${anuncio.titulo}</h3>
                            ${anuncio.descripcion ? `<p style="margin-bottom: 0.5rem;">${anuncio.descripcion}</p>` : ''}
                            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
                                <span class="badge badge-${anuncio.tipo === 'academico' ? 'warning' : anuncio.tipo === 'evento' ? 'info' : 'success'}">
                                    ${anuncio.tipo}
                                </span>
                                ${anuncio.destacado ? '<span class="badge badge-danger">Destacado</span>' : ''}
                            </div>
                            <p style="color: var(--text-secondary); font-size: 0.9rem;">
                                ${anuncio.fecha ? 'Fecha del evento: ' + anuncio.fecha : 'Publicado: ' + anuncio.fecha_publicacion}
                            </p>
                        </div>
                        <button class="btn btn-danger btn-sm" onclick="eliminarAnuncio(${anuncio.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
            document.getElementById('listaAnuncios').innerHTML = html;
        } else {
            document.getElementById('listaAnuncios').innerHTML = '<p class="empty-state"><i class="fas fa-bullhorn"></i><p>No hay anuncios publicados</p></p>';
        }
    } catch (err) {
        error('Error cargando anuncios:', err);
    }
}

// Función para cargar materiales
async function cargarMateriales() {
    log('Cargando materiales...');
    
    try {
        const data = await apiCall('profesor_api.php?action=get_materiales');
        
        if (data.success && data.materiales.length > 0) {
            const html = data.materiales.map(mat => `
                <tr>
                    <td>${mat.nombre}</td>
                    <td>${mat.materia}</td>
                    <td><span class="badge badge-info">${mat.tipo_archivo.toUpperCase()}</span></td>
                    <td>${mat.tamanio_formateado}</td>
                    <td>${mat.fecha}</td>
                </tr>
            `).join('');
            document.getElementById('tablaMateriales').innerHTML = html;
        } else {
            document.getElementById('tablaMateriales').innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay materiales subidos</td></tr>';
        }
    } catch (err) {
        error('Error cargando materiales:', err);
    }
}

// Función para cargar conversaciones de alumnos
async function cargarConversacionesAlumnos() {
    log('Cargando conversaciones de alumnos...');
    
    try {
        const data = await apiCall('profesor_api.php?action=get_conversaciones_alumnos');
        
        if (data.success) {
            conversacionesAlumnos = data.conversaciones;
            mostrarConversaciones(data.conversaciones);
        }
    } catch (err) {
        error('Error cargando conversaciones:', err);
    }
}

// Función para mostrar conversaciones
function mostrarConversaciones(conversaciones) {
    const listaConversaciones = document.getElementById('listaConversaciones');
    
    if (!conversaciones || conversaciones.length === 0) {
        listaConversaciones.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comments"></i>
                <p>No tienes conversaciones con alumnos</p>
                <button class="btn btn-primary btn-sm" onclick="abrirModalBuscarAlumno()">
                    <i class="fas fa-search"></i> Buscar Alumno
                </button>
            </div>
        `;
        return;
    }
    
    const html = conversaciones.map(conv => `
        <div class="conversacion-item ${alumnoActivo == conv.id ? 'active' : ''}" onclick="abrirConversacion(${conv.id}, this)">
            <div class="conversacion-nombre">${conv.nombre}</div>
            <div class="conversacion-ultimo-mensaje">${conv.ultimo_mensaje}</div>
            <div class="conversacion-fecha">${conv.fecha_ultimo_mensaje}</div>
            ${conv.no_leidos > 0 ? `<div class="conversacion-no-leidos">${conv.no_leidos}</div>` : ''}
        </div>
    `).join('');
    
    listaConversaciones.innerHTML = html;
}

// Función para cargar actividad reciente
async function cargarActividadReciente() {
    log('Cargando actividad reciente...');
    
    try {
        const data = await apiCall('profesor_api.php?action=get_actividad_reciente');
        
        if (data.success && data.actividades.length > 0) {
            const html = data.actividades.map(actividad => `
                <div class="actividad-item">
                    <div class="actividad-icon">
                        <i class="fas ${getIconoActividad(actividad.tipo)}"></i>
                    </div>
                    <div class="actividad-content">
                        <div class="actividad-titulo">${actividad.titulo}</div>
                        <div class="actividad-descripcion">${actividad.descripcion}</div>
                        <div class="actividad-fecha">${formatearFecha(actividad.fecha)}</div>
                    </div>
                </div>
            `).join('');
            
            document.getElementById('actividadReciente').innerHTML = html;
            log('Actividad reciente cargada');
        } else {
            cargarActividadRecientePorDefecto();
        }
    } catch (err) {
        error('Error cargando actividad reciente:', err);
        cargarActividadRecientePorDefecto();
    }
}

// Función para obtener ícono de actividad
function getIconoActividad(tipo) {
    const iconos = {
        'nota': 'fa-file-alt',
        'anuncio': 'fa-bullhorn',
        'material': 'fa-upload',
        'mensaje': 'fa-comment',
        'curso': 'fa-book',
        'examen': 'fa-clipboard-list'
    };
    
    return iconos[tipo] || 'fa-circle';
}

// Función para formatear fecha
function formatearFecha(fecha) {
    const fechaObj = new Date(fecha);
    const ahora = new Date();
    const diferencia = ahora - fechaObj;
    
    // Si es hoy
    if (diferencia < 24 * 60 * 60 * 1000) {
        const horas = Math.floor(diferencia / (60 * 60 * 1000));
        if (horas < 1) {
            const minutos = Math.floor(diferencia / (60 * 1000));
            return `Hace ${minutos} minuto${minutos !== 1 ? 's' : ''}`;
        }
        return `Hace ${horas} hora${horas !== 1 ? 's' : ''}`;
    }
    
    // Si es ayer
    if (diferencia < 48 * 60 * 60 * 1000) {
        return 'Ayer';
    }
    
    // Si es esta semana
    if (diferencia < 7 * 24 * 60 * 60 * 1000) {
        const dias = Math.floor(diferencia / (24 * 60 * 60 * 1000));
        return `Hace ${dias} día${dias !== 1 ? 's' : ''}`;
    }
    
    // Formato normal
    return fechaObj.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: fechaObj.getFullYear() !== ahora.getFullYear() ? 'numeric' : undefined
    });
}

// Función para cargar eventos del calendario
async function cargarEventosCalendario() {
    log('Cargando eventos del calendario...');
    
    try {
        const data = await apiCall('profesor_api.php?action=get_eventos_calendario');
        
        if (data.success) {
            eventosCalendario = data.eventos;
            log(`Eventos del calendario cargados: ${eventosCalendario.length}`);
        }
    } catch (err) {
        error('Error cargando eventos del calendario:', err);
    }
}

// Función para inicializar calendario
function inicializarCalendario() {
    log('Inicializando calendario...');
    renderizarCalendario();
}

// Función para renderizar calendario
function renderizarCalendario() {
    const año = calendarioMesActual.getFullYear();
    const mes = calendarioMesActual.getMonth();
    
    // Actualizar el título del mes
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    document.getElementById('calendarioMes').textContent = `${meses[mes]} ${año}`;
    
    // Obtener el primer día del mes y el número de días
    const primerDia = new Date(año, mes, 1).getDay();
    const diasEnMes = new Date(año, mes + 1, 0).getDate();
    
    // Crear el grid del calendario
    let html = '';
    
    // Encabezados de los días de la semana
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    diasSemana.forEach(dia => {
        html += `<div class="calendario-dia-header">${dia}</div>`;
    });
    
    // Días vacíos antes del primer día del mes
    for (let i = 0; i < primerDia; i++) {
        html += '<div class="calendario-dia"></div>';
    }
    
    // Días del mes
    const hoy = new Date();
    for (let dia = 1; dia <= diasEnMes; dia++) {
        const fechaActual = new Date(año, mes, dia);
        const esHoy = fechaActual.toDateString() === hoy.toDateString();
        const tieneEvento = eventosCalendario.some(evento => {
            const fechaEvento = new Date(evento.fecha);
            return fechaEvento.toDateString() === fechaActual.toDateString();
        });
        
        let clases = 'calendario-dia';
        if (esHoy) clases += ' hoy';
        if (tieneEvento) clases += ' con-evento';
        
        html += `<div class="${clases}" onclick="verEventosDia(${año}, ${mes}, ${dia})">${dia}</div>`;
    }
    
    document.getElementById('calendarioGrid').innerHTML = html;
}

// Función para cambiar de mes
function cambiarMes(direccion) {
    calendarioMesActual.setMonth(calendarioMesActual.getMonth() + direccion);
    renderizarCalendario();
}

// Función para ver eventos de un día
function verEventosDia(año, mes, dia) {
    const fecha = new Date(año, mes, dia);
    const eventosDia = eventosCalendario.filter(evento => {
        const fechaEvento = new Date(evento.fecha);
        return fechaEvento.toDateString() === fecha.toDateString();
    });
    
    if (eventosDia.length > 0) {
        const eventosHtml = eventosDia.map(evento => `
            <div style="margin-bottom: 0.5rem;">
                <strong>${evento.titulo}</strong>
                <div style="font-size: 0.9rem; color: var(--text-secondary);">${evento.hora}</div>
                ${evento.descripcion ? `<div style="font-size: 0.9rem;">${evento.descripcion}</div>` : ''}
            </div>
        `).join('');
        
        showNotification(`
            <div style="text-align: left;">
                <strong>Eventos del ${dia}/${mes + 1}/${año}:</strong><br>
                ${eventosHtml}
            </div>
        `, 'info');
    } else {
        showNotification(`No hay eventos programados para el ${dia}/${mes + 1}/${año}`, 'info');
    }
}

// Función para inicializar gráfico
async function initChart() {
    log('Inicializando gráfico...');
    
    try {
        const data = await apiCall('profesor_api.php?action=get_chart_data');
        
        if (data.success && data.data.length > 0) {
            const ctx = document.getElementById('performanceChart');
            const labels = data.data.map(d => d.nombre);
            const valores = data.data.map(d => d.promedio);
            
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Promedio',
                        data: valores,
                        backgroundColor: 'rgba(99, 102, 241, 0.6)',
                        borderColor: 'rgba(99, 102, 241, 1)',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 20,
                            ticks: { 
                                color: getComputedStyle(document.body).getPropertyValue('--text-secondary') 
                            }
                        },
                        x: {
                            ticks: { 
                                color: getComputedStyle(document.body).getPropertyValue('--text-secondary') 
                            }
                        }
                    }
                }
            });
            log('Gráfico inicializado');
        }
    } catch (err) {
        error('Error inicializando gráfico:', err);
    }
}

// Función para mostrar sección
function showSection(sectionId) {
    log(`Mostrando sección: ${sectionId}`);
    
    // Ocultar todas las secciones
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        if (section) section.classList.remove('active');
    });
    
    // Mostrar la sección seleccionada
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    } else {
        error(`Sección no encontrada: ${sectionId}`);
        return;
    }
    
    // Actualizar navegación
    const navItems = document.querySelectorAll('.menu-item');
    navItems.forEach(item => {
        if (item && item.getAttribute('onclick') && item.getAttribute('onclick').includes(sectionId)) {
            item.classList.add('active');
        } else if (item) {
            item.classList.remove('active');
        }
    });
    
    // Limpiar intervalos de chat al cambiar de sección
    if (sectionId !== 'chat') {
        if (chatAlumnoInterval) {
            clearInterval(chatAlumnoInterval);
            chatAlumnoInterval = null;
        }
    } else {
        // Si volvemos a la sección de chat, cargar conversaciones
        cargarConversacionesAlumnos();
        if (chatAlumnoInterval) clearInterval(chatAlumnoInterval);
        chatAlumnoInterval = setInterval(cargarConversacionesAlumnos, 10000);
    }
    
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('active');
    }
}

// Función para toggle sidebar
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

// Función para toggle theme
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const icon = document.querySelector('.theme-toggle i');
    icon.classList.toggle('fa-moon');
    icon.classList.toggle('fa-sun');
    localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
}

// Función para mostrar notificación
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
    if (type === 'info') icon = 'fa-info-circle';
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Función para cerrar modal
function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        log(`Modal cerrado: ${modalId}`);
    }
}

// Función para establecer fecha actual
function setFechaActual() {
    const hoy = new Date().toISOString().split('T')[0];
    const camposFecha = ['notaFecha'];
    camposFecha.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) campo.value = hoy;
    });
}

// Función para logout
function logout() {
    if (confirm('¿Estás seguro de cerrar sesión?')) {
        if (chatInterval) clearInterval(chatInterval);
        if (chatAlumnoInterval) clearInterval(chatAlumnoInterval);
        window.location.href = '/eduguard/php/logout.php';
    }
}

// Función para guardar nota
async function guardarNota(event) {
    event.preventDefault();
    
    const nota = {
        materia_id: document.getElementById('notaCurso').value,
        usuario_id: document.getElementById('notaEstudiante').value,
        tipo: document.getElementById('tipoEvaluacion').value,
        titulo: document.getElementById('notaTitulo').value,
        nota: parseFloat(document.getElementById('notaValor').value),
        fecha: document.getElementById('notaFecha').value
    };
    
    try {
        const data = await apiCall('profesor_api.php?action=save_nota', {
            method: 'POST',
            body: JSON.stringify(nota)
        });
        
        if (data.success) {
            showNotification('Nota guardada correctamente', 'success');
            document.getElementById('formNotas').reset();
            setFechaActual();
            cargarUltimasNotas();
            cargarEstadisticas();
        } else {
            showNotification(data.message || 'Error al guardar nota', 'error');
        }
    } catch (err) {
        error('Error guardando nota:', err);
        showNotification('Error al guardar nota', 'error');
    }
}

// Función para publicar anuncio
async function publicarAnuncio(event) {
    event.preventDefault();
    
    const anuncio = {
        titulo: document.getElementById('anuncioTitulo').value,
        descripcion: document.getElementById('anuncioDescripcion').value,
        tipo: document.getElementById('anuncioTipo').value,
        fecha: document.getElementById('anuncioFecha').value || null,
        destacado: parseInt(document.getElementById('anuncioDestacado').value)
    };
    
    try {
        const data = await apiCall('profesor_api.php?action=create_anuncio', {
            method: 'POST',
            body: JSON.stringify(anuncio)
        });
        
        if (data.success) {
            showNotification('Anuncio publicado correctamente', 'success');
            document.getElementById('formAnuncio').reset();
            cargarAnuncios();
        } else {
            showNotification(data.message || 'Error al publicar', 'error');
        }
    } catch (err) {
        error('Error publicando anuncio:', err);
        showNotification('Error al publicar anuncio', 'error');
    }
}

// Función para eliminar anuncio
async function eliminarAnuncio(anuncioId) {
    if (!confirm('¿Estás seguro de eliminar este anuncio?')) return;
    
    try {
        const data = await apiCall(`profesor_api.php?action=delete_anuncio&id=${anuncioId}`);
        
        if (data.success) {
            showNotification('Anuncio eliminado', 'success');
            cargarAnuncios();
        } else {
            showNotification(data.message || 'Error al eliminar', 'error');
        }
    } catch (err) {
        error('Error eliminando anuncio:', err);
        showNotification('Error al eliminar anuncio', 'error');
    }
}

// Función para subir material
async function subirMaterial(event) {
    event.preventDefault();
    
    const archivo = document.getElementById('fileInput').files[0];
    if (!archivo) {
        showNotification('Por favor selecciona un archivo', 'warning');
        return;
    }
    
    if (archivo.size > 50 * 1024 * 1024) {
        showNotification('El archivo es demasiado grande (máx 50MB)', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('action', 'upload_material');
    formData.append('nombre', document.getElementById('materialNombre').value);
    formData.append('descripcion', document.getElementById('materialDescripcion').value);
    formData.append('materia_id', document.getElementById('materialCurso').value);
    formData.append('archivo', archivo);
    
    showNotification('Subiendo material...', 'info');
    
    try {
        const response = await fetch('/eduguard/php/profesor_api.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Material subido correctamente', 'success');
            document.getElementById('formMaterial').reset();
            document.getElementById('fileName').innerHTML = '';
            cargarMateriales();
        } else {
            showNotification(data.message || 'Error al subir material', 'error');
        }
    } catch (err) {
        error('Error subiendo material:', err);
        showNotification('Error al subir material', 'error');
    }
}

// Función para actualizar perfil
async function actualizarPerfil(event) {
    event.preventDefault();
    
    const perfil = {
        nombre: document.getElementById('perfilNombre').value,
        email: document.getElementById('perfilEmail').value,
        telefono: document.getElementById('perfilTelefono').value,
        bio: document.getElementById('perfilBio').value
    };
    
    try {
        const data = await apiCall('profesor_api.php?action=update_profile', {
            method: 'POST',
            body: JSON.stringify(perfil)
        });
        
        if (data.success) {
            showNotification('Perfil actualizado correctamente', 'success');
            currentUser.nombre = perfil.nombre;
            currentUser.email = perfil.email;
            currentUser.telefono = perfil.telefono;
            currentUser.bio = perfil.bio;
            
            // Actualizar todos los elementos del perfil
            document.getElementById('userName').textContent = perfil.nombre;
            document.getElementById('perfilNombreCompleto').textContent = perfil.nombre;
            document.getElementById('perfilEmailCompleto').textContent = perfil.email;
            
            // Actualizar iniciales del avatar
            const iniciales = perfil.nombre.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            document.getElementById('userAvatar').textContent = iniciales;
            document.getElementById('perfilAvatarGrande').textContent = iniciales;
            document.getElementById('avatarPreview').textContent = iniciales;
            
            log('Perfil actualizado exitosamente');
        } else {
            showNotification(data.message || 'Error al actualizar', 'error');
        }
    } catch (err) {
        error('Error actualizando perfil:', err);
        showNotification('Error al actualizar perfil', 'error');
    }
}

// Función para cambiar contraseña
async function cambiarPassword(event) {
    event.preventDefault();
    
    const passwordActual = document.getElementById('passwordActual').value;
    const passwordNueva = document.getElementById('passwordNueva').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;
    
    if (passwordNueva !== passwordConfirm) {
        showNotification('Las contraseñas no coinciden', 'error');
        return;
    }
    
    if (passwordNueva.length < 8) {
        showNotification('La contraseña debe tener al menos 8 caracteres', 'error');
        return;
    }
    
    try {
        const data = await apiCall('profesor_api.php?action=change_password', {
            method: 'POST',
            body: JSON.stringify({
                password_actual: passwordActual,
                password_nueva: passwordNueva
            })
        });
        
        if (data.success) {
            showNotification('Contraseña cambiada correctamente', 'success');
            document.getElementById('formPassword').reset();
        } else {
            showNotification(data.message || 'Error al cambiar contraseña', 'error');
        }
    } catch (err) {
        error('Error cambiando contraseña:', err);
        showNotification('Error al cambiar contraseña', 'error');
    }
}

// Función para guardar preferencias
async function guardarPreferencias(event) {
    event.preventDefault();
    
    const preferencias = {
        idioma: document.getElementById('idiomaPreferencia').value,
        zona_horaria: document.getElementById('zonaHoraria').value,
        notificaciones_nuevas_notas: document.getElementById('notificacionesNuevasNotas').checked,
        notificaciones_mensajes: document.getElementById('notificacionesMensajes').checked,
        notificaciones_anuncios: document.getElementById('notificacionesAnuncios').checked
    };
    
    try {
        const data = await apiCall('profesor_api.php?action=save_preferencias', {
            method: 'POST',
            body: JSON.stringify(preferencias)
        });
        
        if (data.success) {
            showNotification('Preferencias guardadas correctamente', 'success');
        } else {
            showNotification(data.message || 'Error al guardar preferencias', 'error');
        }
    } catch (err) {
        error('Error guardando preferencias:', err);
        showNotification('Error al guardar preferencias', 'error');
    }
}

// Función para inicializar file input
function initFileInput() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const sizeMB = (file.size / 1024 / 1024).toFixed(2);
                document.getElementById('fileName').innerHTML = `
                    <i class="fas fa-file"></i> ${file.name} (${sizeMB} MB)
                `;
            }
        });
    }
}

// Función para inicializar chat con Flowise
function initChat() {
    log('Inicializando chat con Flowise...');
    
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');
    const emojiButton = document.getElementById('emojiButton');
    const attachButton = document.getElementById('attachButton');
    
    if (!chatMessages || !chatInput || !sendButton) return;
    
    // Cargar historial de chat al iniciar
    cargarHistorialChat();
    
    // Emoji picker
    const emojiPicker = document.createElement('div');
    emojiPicker.className = 'emoji-picker';
    
    const emojis = ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', 
                    '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', 
                    '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄'];
    
    emojis.forEach(emoji => {
        const emojiBtn = document.createElement('button');
        emojiBtn.className = 'emoji-btn';
        emojiBtn.textContent = emoji;
        emojiBtn.addEventListener('click', () => {
            chatInput.value += emoji;
            emojiPicker.classList.remove('show');
            chatInput.focus();
        });
        emojiPicker.appendChild(emojiBtn);
    });
    
    document.querySelector('.chat-input-container').appendChild(emojiPicker);
    
    // Toggle emoji picker
    emojiButton.addEventListener('click', () => {
        emojiPicker.classList.toggle('show');
    });
    
    // Close emoji picker when clicking outside
    document.addEventListener('click', (e) => {
        if (!emojiPicker.contains(e.target) && e.target !== emojiButton) {
            emojiPicker.classList.remove('show');
        }
    });
    
    // File attachment
    attachButton.addEventListener('click', () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleFileUpload(file);
            }
        });
        fileInput.click();
    });
    
    // Send message
    function sendMessage() {
        const message = chatInput.value.trim();
        if (message) {
            addUserMessage(message);
            chatInput.value = '';
            
            // Enviar mensaje al servidor con Flowise
            enviarMensajeChat(message);
        }
    }
    
    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    function addUserMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = 'message user-message';
        
        const now = new Date();
        const timeString = now.getHours().toString().padStart(2, '0') + ':' + 
                          now.getMinutes().toString().padStart(2, '0');
        
        messageEl.innerHTML = `
            <div class="message-content">
                <p>${escapeHtml(message)}</p>
            </div>
            <div class="message-time">${timeString}</div>
        `;
        
        chatMessages.appendChild(messageEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function addBotMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = 'message bot-message';
        
        const now = new Date();
        const timeString = now.getHours().toString().padStart(2, '0') + ':' + 
                          now.getMinutes().toString().padStart(2, '0');
        
        messageEl.innerHTML = `
            <div class="message-content">
                <p>${message}</p>
            </div>
            <div class="message-time">${timeString}</div>
        `;
        
        chatMessages.appendChild(messageEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function handleFileUpload(file) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const messageEl = document.createElement('div');
                messageEl.className = 'message user-message';
                
                const now = new Date();
                const timeString = now.getHours().toString().padStart(2, '0') + ':' + 
                                  now.getMinutes().toString().padStart(2, '0');
                
                messageEl.innerHTML = `
                    <div class="message-content">
                        <img src="${e.target.result}" alt="Imagen adjunta" style="max-width: 100%; border-radius: 8px;">
                    </div>
                    <div class="message-time">${timeString}</div>
                `;
                
                chatMessages.appendChild(messageEl);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                
                // Simulate bot response
                setTimeout(() => {
                    addBotMessage("He recibido tu imagen. ¿Qué te gustaría saber sobre ella?");
                }, 1000);
            };
            reader.readAsDataURL(file);
        } else {
            addBotMessage("Solo puedo procesar imágenes en este momento.");
        }
    }
    
    async function enviarMensajeChat(message) {
        try {
            const data = await apiCall('profesor_api.php?action=send_chat_message', {
                method: 'POST',
                body: JSON.stringify({ message: message })
            });
            
            if (data.success) {
                addBotMessage(data.response);
            } else {
                addBotMessage("Lo siento, no pude procesar tu mensaje en este momento.");
            }
        } catch (err) {
            error('Error enviando mensaje chat:', err);
            addBotMessage("Lo siento, ha ocurrido un error al procesar tu mensaje.");
        }
    }
    
    async function cargarHistorialChat() {
        try {
            const data = await apiCall('profesor_api.php?action=get_chat_history');
            
            if (data.success && data.messages.length > 0) {
                // Limpiar mensajes de bienvenida
                chatMessages.innerHTML = '';
                
                // Cargar historial
                data.messages.forEach(msg => {
                    if (msg.tipo === 'usuario') {
                        addUserMessage(msg.mensaje);
                    } else {
                        addBotMessage(msg.mensaje);
                    }
                });
            }
        } catch (err) {
            error('Error cargando historial de chat:', err);
            // No mostrar error al usuario, solo loggearlo
        }
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Función para mostrar tab de chat
function mostrarChatTab(tab) {
    // Ocultar todos los paneles
    document.querySelectorAll('.chat-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    // Desactivar todas las pestañas
    document.querySelectorAll('.chat-tab').forEach(tabBtn => {
        tabBtn.classList.remove('active');
    });
    
    // Mostrar el panel seleccionado
    document.getElementById('chat' + (tab === 'alumnos' ? 'Alumnos' : 'IA')).classList.add('active');
    
    // Activar la pestaña seleccionada
    event.target.classList.add('active');
    
    // Cargar datos según la pestaña
    if (tab === 'alumnos') {
        cargarConversacionesAlumnos();
        if (chatAlumnoInterval) clearInterval(chatAlumnoInterval);
        chatAlumnoInterval = setInterval(cargarConversacionesAlumnos, 10000);
    } else {
        if (chatAlumnoInterval) clearInterval(chatAlumnoInterval);
        chatAlumnoInterval = null;
    }
}

// Función para abrir conversación
async function abrirConversacion(alumnoId, element) {
    alumnoActivo = alumnoId;
    
    // Actualizar UI
    document.querySelectorAll('.conversacion-item').forEach(item => {
        item.classList.remove('active');
    });
    
    element.classList.add('active');
    
    // Obtener información del alumno
    const alumno = conversacionesAlumnos.find(a => a.id == alumnoId);
    document.getElementById('nombreAlumnoActivo').textContent = alumno.nombre;
    
    // Habilitar input de mensaje
    document.getElementById('mensajeAlumnoInput').disabled = false;
    document.getElementById('btnEnviarAlumno').disabled = false;
    
    // Cargar mensajes
    await cargarMensajesAlumno(alumnoId);
    
    // Establecer intervalo para actualizar mensajes
    if (chatAlumnoInterval) clearInterval(chatAlumnoInterval);
    chatAlumnoInterval = setInterval(() => {
        if (alumnoActivo == alumnoId) {
            cargarMensajesAlumno(alumnoId);
        }
        cargarConversacionesAlumnos();
    }, 5000);
}

// Función para cargar mensajes de alumno
async function cargarMensajesAlumno(alumnoId) {
    try {
        const data = await apiCall(`profesor_api.php?action=get_mensajes_alumno&alumno_id=${alumnoId}`);
        
        if (data.success) {
            mostrarMensajesAlumno(data.mensajes);
        }
    } catch (err) {
        error('Error cargando mensajes alumno:', err);
    }
}

// Función para mostrar mensajes de alumno
function mostrarMensajesAlumno(mensajes) {
    const mensajesContainer = document.getElementById('mensajesAlumno');
    const scrollAtBottom = mensajesContainer.scrollHeight - mensajesContainer.scrollTop <= mensajesContainer.clientHeight + 100;
    
    if (!mensajes || mensajes.length === 0) {
        mensajesContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comments"></i>
                <p>No hay mensajes en esta conversación</p>
            </div>
        `;
        return;
    }
    
    const html = mensajes.map(msg => {
        const esProfesor = msg.remitente === 'profesor';
        return `
            <div class="mensaje-alumno ${esProfesor ? 'mensaje-profesor' : 'mensaje-alumno-enviado'}">
                <div class="mensaje-contenido">${msg.mensaje}</div>
                <div class="mensaje-hora">${msg.hora}</div>
            </div>
        `;
    }).join('');
    
    mensajesContainer.innerHTML = html;
    
    if (scrollAtBottom) {
        mensajesContainer.scrollTop = mensajesContainer.scrollHeight;
    }
}

// Función para enviar mensaje a alumno
async function enviarMensajeAlumno(event) {
    event.preventDefault();
    
    const mensaje = document.getElementById('mensajeAlumnoInput').value.trim();
    if (!mensaje || !alumnoActivo) return;
    
    try {
        const data = await apiCall('profesor_api.php?action=send_mensaje_alumno', {
            method: 'POST',
            body: JSON.stringify({
                alumno_id: alumnoActivo,
                mensaje: mensaje
            })
        });
        
        if (data.success) {
            document.getElementById('mensajeAlumnoInput').value = '';
            await cargarMensajesAlumno(alumnoActivo);
            await cargarConversacionesAlumnos();
            
            const mensajesContainer = document.getElementById('mensajesAlumno');
            mensajesContainer.scrollTop = mensajesContainer.scrollHeight;
        } else {
            showNotification(data.message || 'Error al enviar mensaje', 'error');
        }
    } catch (err) {
        error('Error enviendo mensaje alumno:', err);
        showNotification('Error al enviar mensaje', 'error');
    }
}

// Función para cargar estudiantes por curso
async function cargarEstudiantesPorCurso() {
    const cursoId = document.getElementById('notaCurso').value;
    if (!cursoId) {
        document.getElementById('notaEstudiante').innerHTML = '<option value="">Primero selecciona un curso</option>';
        return;
    }
    
    try {
        const data = await apiCall(`profesor_api.php?action=get_estudiantes&materia_id=${cursoId}`);
        
        if (data.success && data.estudiantes.length > 0) {
            const options = data.estudiantes.map(e => 
                `<option value="${e.id}">${e.nombre}</option>`
            ).join('');
            document.getElementById('notaEstudiante').innerHTML = '<option value="">Seleccionar estudiante...</option>' + options;
        } else {
            document.getElementById('notaEstudiante').innerHTML = '<option value="">No hay estudiantes en este curso</option>';
        }
    } catch (err) {
        error('Error cargando estudiantes por curso:', err);
        document.getElementById('notaEstudiante').innerHTML = '<option value="">Error al cargar estudiantes</option>';
    }
}

// Función para filtrar estudiantes
function filtrarEstudiantes() {
    const cursoId = document.getElementById('filtroCurso').value;
    const busqueda = document.getElementById('buscarEstudiante').value.toLowerCase();
    
    let filtrados = estudiantesData;
    
    if (busqueda) {
        filtrados = filtrados.filter(est => 
            est.nombre.toLowerCase().includes(busqueda) ||
            est.email.toLowerCase().includes(busqueda)
        );
    }
    
    mostrarEstudiantes(filtrados);
}

// Función para ver estudiantes de curso
function verEstudiantesCurso(cursoId) {
    showSection('estudiantes');
    document.getElementById('filtroCurso').value = cursoId;
    filtrarEstudiantes();
}

// Función para registrar nota de curso
function registrarNotaCurso(cursoId) {
    showSection('notas');
    document.getElementById('notaCurso').value = cursoId;
    cargarEstudiantesPorCurso();
}

// Función para abrir modal crear curso
function abrirModalCrearCurso() {
    if (!document.getElementById('modalCrearCurso')) {
        const modal = document.createElement('div');
        modal.id = 'modalCrearCurso';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Crear Nuevo Curso</h2>
                    <button class="close-modal" onclick="cerrarModal('modalCrearCurso')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form onsubmit="guardarNuevoCurso(event)">
                    <div class="form-group">
                        <label>Nombre del Curso</label>
                        <input type="text" class="form-control" id="nuevoCursoNombre" placeholder="Ej: Matemáticas 5to Grado" required>
                    </div>
                    <div class="form-group">
                        <label>Descripción</label>
                        <textarea class="form-control" id="nuevoCursoDescripcion" placeholder="Descripción del curso..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>Color (opcional)</label>
                        <input type="color" class="form-control" id="nuevoCursoColor" value="#6366f1">
                    </div>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Crear Curso
                    </button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    document.getElementById('modalCrearCurso').classList.add('active');
}

// Función para guardar nuevo curso
async function guardarNuevoCurso(event) {
    event.preventDefault();
    
    const curso = {
        nombre: document.getElementById('nuevoCursoNombre').value,
        descripcion: document.getElementById('nuevoCursoDescripcion').value,
        color: document.getElementById('nuevoCursoColor').value
    };
    
    try {
        const data = await apiCall('profesor_api.php?action=create_materia', {
            method: 'POST',
            body: JSON.stringify(curso)
        });
        
        if (data.success) {
            showNotification('Curso creado correctamente', 'success');
            cerrarModal('modalCrearCurso');
            cargarCursos();
            cargarEstadisticas();
        } else {
            showNotification(data.message || 'Error al crear curso', 'error');
        }
    } catch (err) {
        error('Error creando curso:', err);
        showNotification('Error al crear curso', 'error');
    }
}

// Función para abrir modal agregar estudiantes
function abrirModalAgregarEstudiantes(cursoId = null) {
    if (!document.getElementById('modalAgregarEstudiantes')) {
        const modal = document.createElement('div');
        modal.id = 'modalAgregarEstudiantes';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Agregar Estudiantes al Curso</h2>
                    <button class="close-modal" onclick="cerrarModal('modalAgregarEstudiantes')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form onsubmit="guardarEstudiantesEnCurso(event)">
                    <div class="form-group">
                        <label>Curso</label>
                        <select class="form-control" id="cursoSeleccionado" required>
                            <option value="">Seleccionar curso...</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Estudiantes Disponibles</label>
                        <div id="listaEstudiantesDisponibles" style="max-height: 200px; overflow-y: auto; border: 1px solid var(--border); border-radius: 8px; padding: 1rem;">
                            <p>Cargando estudiantes...</p>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Agregar Estudiantes
                    </button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    if (cursoId) {
        document.getElementById('cursoSeleccionado').value = cursoId;
    }
    
    const selectCurso = document.getElementById('cursoSeleccionado');
    selectCurso.innerHTML = '<option value="">Seleccionar curso...</option>' + 
        cursosData.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    
    cargarEstudiantesDisponibles();
    
    document.getElementById('modalAgregarEstudiantes').classList.add('active');
}

// Función para cargar estudiantes disponibles
function cargarEstudiantesDisponibles() {
    const contenedor = document.getElementById('listaEstudiantesDisponibles');
    
    if (!todosLosEstudiantes || todosLosEstudiantes.length === 0) {
        contenedor.innerHTML = '<p>No hay estudiantes disponibles</p>';
        return;
    }
    
    const html = todosLosEstudiantes.map(est => `
        <div style="margin-bottom: 0.5rem;">
            <label style="display: flex; align-items: center; cursor: pointer;">
                <input type="checkbox" name="estudianteSeleccionado" value="${est.id}" style="margin-right: 0.5rem;">
                <span>${est.nombre} - ${est.email}</span>
            </label>
        </div>
    `).join('');
    
    contenedor.innerHTML = html;
}

// Función para guardar estudiantes en curso
async function guardarEstudiantesEnCurso(event) {
    event.preventDefault();
    
    const cursoId = document.getElementById('cursoSeleccionado').value;
    if (!cursoId) {
        showNotification('Debes seleccionar un curso', 'warning');
        return;
    }
    
    const checkboxes = document.querySelectorAll('input[name="estudianteSeleccionado"]:checked');
    if (checkboxes.length === 0) {
        showNotification('Debes seleccionar al menos un estudiante', 'warning');
        return;
    }
    
    const estudiantesIds = Array.from(checkboxes).map(cb => cb.value);
    
    try {
        const data = await apiCall('profesor_api.php?action=add_estudiantes_to_materia', {
            method: 'POST',
            body: JSON.stringify({
                materia_id: cursoId,
                estudiantes_ids: estudiantesIds
            })
        });
        
        if (data.success) {
            showNotification('Estudiantes agregados correctamente', 'success');
            cerrarModal('modalAgregarEstudiantes');
            cargarCursos();
            cargarEstudiantes();
            cargarEstadisticas();
        } else {
            showNotification(data.message || 'Error al agregar estudiantes', 'error');
        }
    } catch (err) {
        error('Error agregando estudiantes:', err);
        showNotification('Error al agregar estudiantes', 'error');
    }
}

// Función para abrir modal cambiar avatar
function abrirModalCambiarAvatar() {
    document.getElementById('modalCambiarAvatar').classList.add('active');
}

// Función para cambiar avatar
async function cambiarAvatar(event) {
    event.preventDefault();
    
    const archivo = document.getElementById('avatarInput').files[0];
    if (!archivo) {
        showNotification('Por favor selecciona una imagen', 'warning');
        return;
    }
    
    if (archivo.size > 5 * 1024 * 1024) {
        showNotification('La imagen es demasiado grande (máx 5MB)', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('action', 'cambiar_avatar');
    formData.append('avatar', archivo);
    
    showNotification('Subiendo avatar...', 'info');
    
    try {
        const response = await fetch('/eduguard/php/profesor_api.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Avatar actualizado correctamente', 'success');
            cerrarModal('modalCambiarAvatar');
            
            // Actualizar avatar en la interfaz
            if (data.avatar_url) {
                document.getElementById('perfilAvatarGrande').style.backgroundImage = `url(${data.avatar_url})`;
                document.getElementById('perfilAvatarGrande').textContent = '';
                document.getElementById('userAvatar').style.backgroundImage = `url(${data.avatar_url})`;
                document.getElementById('userAvatar').textContent = '';
            }
        } else {
            showNotification(data.message || 'Error al actualizar avatar', 'error');
        }
    } catch (err) {
        error('Error cambiando avatar:', err);
        showNotification('Error al actualizar avatar', 'error');
    }
}

// Función para abrir modal agregar evento
function abrirModalAgregarEvento() {
    document.getElementById('modalAgregarEvento').classList.add('active');
    
    // Establecer la fecha actual por defecto
    const hoy = new Date();
    document.getElementById('eventoFecha').value = hoy.toISOString().split('T')[0];
    document.getElementById('eventoHora').value = `${hoy.getHours().toString().padStart(2, '0')}:00`;
}

// Función para agregar evento
async function agregarEvento(event) {
    event.preventDefault();
    
    const evento = {
        titulo: document.getElementById('eventoTitulo').value,
        descripcion: document.getElementById('eventoDescripcion').value,
        fecha: document.getElementById('eventoFecha').value,
        hora: document.getElementById('eventoHora').value,
        tipo: document.getElementById('eventoTipo').value
    };
    
    try {
        const data = await apiCall('profesor_api.php?action=add_evento_calendario', {
            method: 'POST',
            body: JSON.stringify(evento)
        });
        
        if (data.success) {
            showNotification('Evento agregado correctamente', 'success');
            cerrarModal('modalAgregarEvento');
            document.getElementById('eventoTitulo').value = '';
            document.getElementById('eventoDescripcion').value = '';
            await cargarEventosCalendario();
            renderizarCalendario();
        } else {
            showNotification(data.message || 'Error al agregar evento', 'error');
        }
    } catch (err) {
        error('Error agregando evento:', err);
        showNotification('Error al agregar evento', 'error');
    }
}

// Función para ver toda actividad
function verTodaActividad() {
    showSection('actividad');
}

// Función para limpiar chat IA
function limpiarChatIA() {
    if (confirm('¿Estás seguro de que quieres limpiar el historial de chat?')) {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = `
            <div class="message bot-message">
                <div class="message-content">
                    <p>¡Hola! Soy tu asistente educativo. ¿En qué puedo ayudarte hoy?</p>
                </div>
                <div class="message-time">Ahora</div>
            </div>
        `;
        showNotification('Chat limpiado correctamente', 'success');
    }
}

// Función para abrir modal buscar alumno
function abrirModalBuscarAlumno() {
    if (!document.getElementById('modalBuscarAlumno')) {
        const modal = document.createElement('div');
        modal.id = 'modalBuscarAlumno';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Buscar Alumno</h2>
                    <button class="close-modal" onclick="cerrarModal('modalBuscarAlumno')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="form-group">
                    <label>Nombre o Email del Alumno</label>
                    <input type="text" class="form-control" id="busquedaAlumno" placeholder="Escribe para buscar..." oninput="buscarAlumnos()">
                </div>
                <div id="resultadosBusqueda" style="max-height: 200px; overflow-y: auto; margin-top: 1rem;">
                    <p style="text-align: center; color: var(--text-secondary);">Escribe para comenzar la búsqueda</p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    document.getElementById('modalBuscarAlumno').classList.add('active');
    document.getElementById('busquedaAlumno').value = '';
    document.getElementById('resultadosBusqueda').innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Escribe para comenzar la búsqueda</p>';
    document.getElementById('busquedaAlumno').focus();
}

// Función para buscar alumnos
async function buscarAlumnos() {
    const termino = document.getElementById('busquedaAlumno').value.trim();
    const resultadosContainer = document.getElementById('resultadosBusqueda');
    
    if (termino.length < 3) {
        resultadosContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Escribe al menos 3 caracteres</p>';
        return;
    }
    
    try {
        const data = await apiCall(`profesor_api.php?action=buscar_alumnos_chat&termino=${encodeURIComponent(termino)}`);
        
        if (data.success && data.alumnos.length > 0) {
            const html = data.alumnos.map(alumno => `
                <div style="padding: 0.8rem; border-bottom: 1px solid var(--border); cursor: pointer;" onclick="iniciarConversacion(${alumno.id}, '${alumno.nombre.replace(/'/g, "\\'")}')">
                    <div style="font-weight: 600;">${alumno.nombre}</div>
                    <div style="font-size: 0.9rem; color: var(--text-secondary);">${alumno.email}</div>
                    <div style="font-size: 0.9rem; color: var(--text-secondary);">${alumno.grado || ''} ${alumno.seccion || ''}</div>
                </div>
            `).join('');
            
            resultadosContainer.innerHTML = html;
        } else {
            resultadosContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No se encontraron alumnos</p>';
        }
    } catch (err) {
        error('Error buscando alumnos:', err);
        resultadosContainer.innerHTML = '<p style="text-align: center; color: var(--danger);">Error al buscar alumnos</p>';
    }
}

// Función para iniciar conversación
function iniciarConversacion(alumnoId, alumnoNombre) {
    cerrarModal('modalBuscarAlumno');
    
    // Cambiar a la pestaña de chat con alumnos si no está activa
    if (!document.getElementById('chatAlumnos').classList.contains('active')) {
        document.querySelector('.chat-tab').click();
    }
    
    // Abrir conversación
    setTimeout(() => {
        // Buscar el elemento de conversación por el ID del alumno
        const conversacionItem = document.querySelector(`.conversacion-item[onclick*="${alumnoId}"]`);
        if (conversacionItem) {
            abrirConversacion(alumnoId, conversacionItem);
        } else {
            // Si no se encuentra, crear una conversación temporal
            alumnoActivo = alumnoId;
            document.getElementById('nombreAlumnoActivo').textContent = alumnoNombre;
            document.getElementById('mensajeAlumnoInput').disabled = false;
            document.getElementById('btnEnviarAlumno').disabled = false;
            document.getElementById('mensajesAlumno').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <p>No hay mensajes en esta conversación</p>
                </div>
            `;
        }
    }, 300);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    log('DOM cargado, iniciando aplicación...');
    
    verificarSesion();
    initFileInput();
    setFechaActual();
    initChat();
    
    // Cargar tema guardado
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-mode');
        document.querySelector('.theme-toggle i').classList.replace('fa-moon', 'fa-sun');
    }
    
    // Preview del avatar
    document.getElementById('avatarInput')?.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('avatarPreview').style.backgroundImage = `url(${e.target.result})`;
                document.getElementById('avatarPreview').textContent = '';
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Cerrar modales al hacer clic fuera
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.classList.remove('active');
        }
    });
    
    // Limpiar intervalos al cambiar de sección
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const section = this.textContent.trim();
            if (section !== 'Chat' && chatInterval) {
                clearInterval(chatInterval);
                chatInterval = null;
            }
        });
    });
    
    // Enviar mensaje con Enter
    document.getElementById('mensajeInput')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            document.getElementById('formChat').dispatchEvent(new Event('submit'));
        }
    });
    
    // Cerrar sidebar en móvil
    document.addEventListener('click', function(e) {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.querySelector('.menu-toggle');
        
        if (window.innerWidth <= 768 && 
            sidebar.classList.contains('active') && 
            !sidebar.contains(e.target) && 
            !toggle.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });
    
    // Limpiar intervalos antes de salir
    window.addEventListener('beforeunload', function(e) {
        if (chatInterval) {
            clearInterval(chatInterval);
        }
        if (chatAlumnoInterval) {
            clearInterval(chatAlumnoInterval);
        }
    });
    
    log('Aplicación inicializada completamente');
});

// Mensaje de bienvenida en consola
console.log('%cEduGuard Profesor v2.0', 'color: #6366f1; font-size: 20px; font-weight: bold;');
console.log('%c✓ Sistema optimizado y funcionando', 'color: #10b981; font-size: 14px;');
console.log('%c📊 Logging activado - Revisa la consola para depuración', 'color: #f59e0b; font-size: 12px;');