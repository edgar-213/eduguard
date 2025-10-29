

    let currentUser = null;
    let grupoActivo = null;
    let cursosData = [];
    let estudiantesData = [];
    let todosLosEstudiantes = [];
    let chatInterval = null;
    let alumnoActivo = null;
    let conversacionesAlumnos = [];
    let chatAlumnoInterval = null;

    document.addEventListener('DOMContentLoaded', function() {
        verificarSesion();
        initFileInput();
        setFechaActual();
        initChat();
    });

    // Función API corregida con URL absoluta
    async function apiCall(url, options = {}) {
        try {
            const baseUrl = '/eduguard/php/';
            const fullUrl = baseUrl + url;
            
            console.log('Llamando a API:', fullUrl);
            
            const response = await fetch(fullUrl, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error en API:', error);
            throw error;
        }
    }

    async function verificarSesion() {
        try {
            const data = await apiCall('profesor_api.php?action=verificar_sesion');
            
            if (!data.success) {
                window.location.href = 'inicio.html';
                return;
            }
            currentUser = data.user;
            inicializarDatos();
        } catch (error) {
            console.error('Error verificando sesión:', error);
            showNotification('Error de conexión', 'error');
            setTimeout(() => window.location.href = 'inicio.html', 2000);
        }
    }

    async function inicializarDatos() {
        document.getElementById('userName').textContent = currentUser.nombre;
        const iniciales = currentUser.nombre.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        document.getElementById('userAvatar').textContent = iniciales;
        
        await Promise.all([
            cargarEstadisticas(),
            cargarCursos(),
            cargarTodosLosEstudiantes(),
            cargarEstudiantes(),
            cargarUltimasNotas(),
            cargarGrupos(),
            cargarAnuncios(),
            cargarMateriales(),
            initChart(),
            cargarConversacionesAlumnos()
        ]);
        
        document.getElementById('perfilNombre').value = currentUser.nombre || '';
        document.getElementById('perfilEmail').value = currentUser.email || '';
        document.getElementById('perfilTelefono').value = currentUser.telefono || '';
        document.getElementById('perfilBio').value = currentUser.bio || '';
    }

    function showSection(sectionId) {
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
            console.error('Sección no encontrada:', sectionId);
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

    function toggleSidebar() {
        document.getElementById('sidebar').classList.toggle('active');
    }

    function toggleTheme() {
        document.body.classList.toggle('light-mode');
        const icon = document.querySelector('.theme-toggle i');
        icon.classList.toggle('fa-moon');
        icon.classList.toggle('fa-sun');
        localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
    }

    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-mode');
        document.querySelector('.theme-toggle i').classList.replace('fa-moon', 'fa-sun');
    }

    async function cargarEstadisticas() {
        try {
            const data = await apiCall('profesor_api.php?action=get_stats');
            
            if (data.success) {
                document.getElementById('totalEstudiantes').textContent = data.stats.totalEstudiantes;
                document.getElementById('totalCursos').textContent = data.stats.totalCursos;
                document.getElementById('mensajesNuevos').textContent = data.stats.mensajesNuevos;
                document.getElementById('promedioGeneral').textContent = data.stats.promedioGeneral.toFixed(1);
            }
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    }

    async function cargarCursos() {
        try {
            const data = await apiCall('profesor_api.php?action=get_materias');
            
            if (data.success) {
                cursosData = data.materias;
                mostrarCursos(data.materias);
                llenarSelectsCursos(data.materias);
            }
        } catch (error) {
            console.error('Error cargando cursos:', error);
            document.getElementById('listaCursos').innerHTML = '<p class="empty-state"><i class="fas fa-book"></i><p>Error al cargar cursos</p></p>';
        }
    }

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
                        <i class="fas fa-users"></i> ${curso.num_estudiantes} estudiantes
                    </span>
                    <span class="badge ${curso.promedio >= 13 ? 'badge-success' : 'badge-warning'}">
                        <i class="fas fa-chart-line"></i> Promedio: ${curso.promedio}
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
            }
        });
    }

    function verEstudiantesCurso(cursoId) {
        showSection('estudiantes');
        document.getElementById('filtroCurso').value = cursoId;
        filtrarEstudiantes();
    }

    function registrarNotaCurso(cursoId) {
        showSection('notas');
        document.getElementById('notaCurso').value = cursoId;
        cargarEstudiantesPorCurso();
    }

    async function cargarTodosLosEstudiantes() {
        try {
            const data = await apiCall('profesor_api.php?action=get_all_estudiantes');
            
            if (data.success) {
                todosLosEstudiantes = data.estudiantes;
            }
        } catch (error) {
            console.error('Error cargando todos los estudiantes:', error);
        }
    }

    async function cargarEstudiantes() {
        try {
            const data = await apiCall('profesor_api.php?action=get_estudiantes');
            
            if (data.success) {
                estudiantesData = data.estudiantes;
                mostrarEstudiantes(data.estudiantes);
            }
        } catch (error) {
            console.error('Error cargando estudiantes:', error);
            document.getElementById('tablaEstudiantes').innerHTML = '<tr><td colspan="5" style="text-align: center;">Error al cargar estudiantes</td></tr>';
        }
    }

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
                <td><strong>${est.promedio.toFixed(1)}</strong></td>
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
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('notaEstudiante').innerHTML = '<option value="">Error al cargar estudiantes</option>';
        }
    }

    async function cargarUltimasNotas() {
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
            } else {
                document.getElementById('ultimasNotas').innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay notas registradas</td></tr>';
            }
        } catch (error) {
            console.error('Error cargando notas:', error);
        }
    }

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
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error al guardar nota', 'error');
        }
    }

    async function cargarAnuncios() {
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
        } catch (error) {
            console.error('Error cargando anuncios:', error);
        }
    }

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
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error al publicar anuncio', 'error');
        }
    }

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
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error al eliminar anuncio', 'error');
        }
    }

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

    async function cargarMateriales() {
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
        } catch (error) {
            console.error('Error cargando materiales:', error);
        }
    }

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
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error al subir material', 'error');
        }
    }

    async function cargarGrupos() {
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
        } catch (error) {
            console.error('Error cargando grupos:', error);
        }
    }

    function abrirModalGrupo() {
        document.getElementById('modalGrupo').classList.add('active');
    }

    async function guardarGrupo(event) {
        event.preventDefault();
        
        const grupo = {
            nombre: document.getElementById('grupoNombre').value,
            descripcion: document.getElementById('grupoDescripcion').value
        };
        
        try {
            const data = await apiCall('profesor_api.php?action=create_grupo', {
                method: 'POST',
                body: JSON.stringify(grupo)
            });
            
            if (data.success) {
                showNotification('Grupo creado correctamente', 'success');
                cerrarModal('modalGrupo');
                document.getElementById('grupoNombre').value = '';
                document.getElementById('grupoDescripcion').value = '';
                cargarGrupos();
            } else {
                showNotification(data.message || 'Error al crear grupo', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error al crear grupo', 'error');
        }
    }

    async function abrirGrupo(id, nombre) {
        grupoActivo = id;
        document.getElementById('grupoActual').textContent = nombre;
        document.getElementById('mensajeInput').disabled = false;
        document.getElementById('btnEnviar').disabled = false;
        
        await cargarMensajesGrupo();
        
        if (chatInterval) clearInterval(chatInterval);
        chatInterval = setInterval(cargarMensajesGrupo, 5000);
    }

    async function cargarMensajesGrupo() {
        if (!grupoActivo) return;
        
        try {
            const data = await apiCall(`profesor_api.php?action=get_mensajes_grupo&grupo_id=${grupoActivo}`);
            
            if (data.success) {
                const chatContainer = document.getElementById('chatMensajes');
                const scrollAtBottom = chatContainer.scrollHeight - chatContainer.scrollTop <= chatContainer.clientHeight + 100;
                
                if (data.mensajes.length > 0) {
                    const html = data.mensajes.map(msg => {
                        const isOwn = msg.usuario_id == currentUser.id;
                        return `
                            <div class="chat-message ${isOwn ? 'own' : ''}">
                                <div class="chat-message-header">
                                    <span class="chat-message-author">${msg.usuario}</span>
                                    <span class="chat-message-time">${msg.hora}</span>
                                </div>
                                <p style="margin: 0;">${msg.mensaje}</p>
                            </div>
                        `;
                    }).join('');
                    chatContainer.innerHTML = html;
                } else {
                    chatContainer.innerHTML = '<div class="empty-state"><i class="fas fa-comments"></i><p>No hay mensajes aún. ¡Sé el primero en escribir!</p></div>';
                }
                
                if (scrollAtBottom) {
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }
            }
        } catch (error) {
            console.error('Error cargando mensajes:', error);
        }
    }

    async function enviarMensaje(event) {
        event.preventDefault();
        
        const mensaje = document.getElementById('mensajeInput').value.trim();
        if (!mensaje || !grupoActivo) return;
        
        try {
            const data = await apiCall('profesor_api.php?action=send_mensaje_grupo', {
                method: 'POST',
                body: JSON.stringify({
                    grupo_id: grupoActivo,
                    mensaje: mensaje
                })
            });
            
            if (data.success) {
                document.getElementById('mensajeInput').value = '';
                await cargarMensajesGrupo();
                
                const chatContainer = document.getElementById('chatMensajes');
                chatContainer.scrollTop = chatContainer.scrollHeight;
            } else {
                showNotification(data.message || 'Error al enviar mensaje', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error al enviar mensaje', 'error');
        }
    }

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
                
                document.getElementById('userName').textContent = perfil.nombre;
                const iniciales = perfil.nombre.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                document.getElementById('userAvatar').textContent = iniciales;
            } else {
                showNotification(data.message || 'Error al actualizar', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error al actualizar perfil', 'error');
        }
    }

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
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error al cambiar contraseña', 'error');
        }
    }

    async function initChart() {
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
            }
        } catch (error) {
            console.error('Error cargando datos del gráfico:', error);
        }
    }

    function cerrarModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    function setFechaActual() {
        const hoy = new Date().toISOString().split('T')[0];
        const camposFecha = ['notaFecha'];
        camposFecha.forEach(id => {
            const campo = document.getElementById(id);
            if (campo) campo.value = hoy;
        });
    }

    function logout() {
        if (confirm('¿Estás seguro de cerrar sesión?')) {
            if (chatInterval) clearInterval(chatInterval);
            if (chatAlumnoInterval) clearInterval(chatAlumnoInterval);
            window.location.href = '/eduguard/php/logout.php';
        }
    }

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

    // Funciones para el Chat con Alumnos
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

    async function cargarConversacionesAlumnos() {
        try {
            const data = await apiCall('profesor_api.php?action=get_conversaciones_alumnos');
            
            if (data.success) {
                conversacionesAlumnos = data.conversaciones;
                mostrarConversaciones(data.conversaciones);
            }
        } catch (error) {
            console.error('Error cargando conversaciones:', error);
        }
    }

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
    async function abrirConversacion(alumnoId, element) {
    alumnoActivo = alumnoId;
    
    // Actualizar UI
    document.querySelectorAll('.conversacion-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Usar el elemento pasado como parámetro en lugar de event.currentTarget
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

    async function cargarMensajesAlumno(alumnoId) {
        try {
            const data = await apiCall(`profesor_api.php?action=get_mensajes_alumno&alumno_id=${alumnoId}`);
            
            if (data.success) {
                mostrarMensajesAlumno(data.mensajes);
            }
        } catch (error) {
            console.error('Error cargando mensajes:', error);
        }
    }

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
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error al enviar mensaje', 'error');
        }
    }

    function abrirModalBuscarAlumno() {
        // Crear modal si no existe
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
    } catch (error) {
        console.error('Error buscando alumnos:', error);
        resultadosContainer.innerHTML = '<p style="text-align: center; color: var(--danger);">Error al buscar alumnos</p>';
    }
}
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

    // Función para inicializar el chat IA
    function initChat() {
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
                
                // Enviar mensaje al servidor
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
            } catch (error) {
                console.error('Error enviando mensaje:', error);
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
            } catch (error) {
                console.error('Error cargando historial de chat:', error);
            }
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    }

    // Nuevas funciones para la gestión de cursos y estudiantes
    
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
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error al crear curso', 'error');
        }
    }
    
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
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error al agregar estudiantes', 'error');
        }
    }

    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.classList.remove('active');
        }
    });

    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const section = this.textContent.trim();
            if (section !== 'Chat' && chatInterval) {
                clearInterval(chatInterval);
                chatInterval = null;
            }
        });
    });

    document.getElementById('mensajeInput')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            document.getElementById('formChat').dispatchEvent(new Event('submit'));
        }
    });

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

    window.addEventListener('beforeunload', function(e) {
        if (chatInterval) {
            clearInterval(chatInterval);
        }
        if (chatAlumnoInterval) {
            clearInterval(chatAlumnoInterval);
        }
    });

    console.log('%cEduGuard Profesor v2.0', 'color: #6366f1; font-size: 20px; font-weight: bold;');
    console.log('%c✓ Sistema optimizado y funcionando', 'color: #10b981; font-size: 14px;');
 