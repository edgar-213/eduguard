// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    
    // Elementos del DOM
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterBtn = document.getElementById('showRegister');
    const showLoginBtn = document.getElementById('showLogin');
    const backToLoginBtn = document.getElementById('backToLogin');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const typeBtns = document.querySelectorAll('.type-btn');
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    const strengthBar = document.querySelector('.strength-bar');
    const registerPassword = document.getElementById('registerPassword');

    let userType = 'alumno';

    // Verificar que existen los elementos
    if (!loginForm || !registerForm) {
        console.error('Formularios no encontrados');
        return;
    }

    // Mensajes dinámicos
    const messages = [
        'Aprendizaje inteligente para tu éxito académico',
        'Tu aliado en el camino del conocimiento',
        'Impulsando tu potencial con IA'
    ];
    let msgIndex = 0;

    if (welcomeMessage) {
        welcomeMessage.style.transition = 'opacity 0.3s ease';
        
        setInterval(() => {
            msgIndex = (msgIndex + 1) % messages.length;
            welcomeMessage.style.opacity = '0';
            setTimeout(() => {
                welcomeMessage.textContent = messages[msgIndex];
                welcomeMessage.style.opacity = '1';
            }, 300);
        }, 4000);
    }

    // Cambiar entre formularios
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.classList.remove('active');
            registerForm.classList.add('active');
        });
    }

    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            registerForm.classList.remove('active');
            loginForm.classList.add('active');
        });
    }

    if (backToLoginBtn) {
        backToLoginBtn.addEventListener('click', () => {
            registerForm.classList.remove('active');
            loginForm.classList.add('active');
        });
    }

    // Selector de tipo de usuario
    typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            typeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            userType = btn.getAttribute('data-type');
        });
    });

    // Toggle password
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            const icon = btn.querySelector('i');
            
            if (input && icon) {
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            }
        });
    });

    // Validación de contraseña
    if (registerPassword && strengthBar) {
        registerPassword.addEventListener('input', (e) => {
            const password = e.target.value;
            let strength = 0;
            
            if (password.length >= 8) strength++;
            if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
            if (password.match(/[0-9]/)) strength++;
            if (password.match(/[^a-zA-Z0-9]/)) strength++;
            
            strengthBar.className = 'strength-bar';
            
            if (strength === 0) {
                strengthBar.style.width = '0%';
            } else if (strength <= 2) {
                strengthBar.classList.add('weak');
            } else if (strength === 3) {
                strengthBar.classList.add('medium');
            } else {
                strengthBar.classList.add('strong');
            }
        });
    }

    // ==========================
    // LOGIN - PETICIÓN REAL
    // ==========================
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            showNotification('Completa todos los campos', 'error');
            return;
        }
        
        showNotification('Iniciando sesión...', 'loading');
        
        console.log('Enviando petición a login.php...');
        console.log('Email:', email);
        console.log('Tipo:', userType);
        
        try {
            const response = await fetch('../php/login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    userType: userType
                })
            });
            
            console.log('Response status:', response.status);
            
            const data = await response.json();
            console.log('Response data:', data);
            
            if (data.success) {
                showNotification(data.message, 'success');
                localStorage.setItem('user', JSON.stringify(data.user));
                
                console.log('Redirigiendo a:', data.redirect);
                
                setTimeout(() => {
                    window.location.href = data.redirect;
                }, 1000);
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) {
            console.error('Error completo:', error);
            showNotification('Error de conexión al servidor', 'error');
        }
    });

    // ==========================
    // REGISTRO - PETICIÓN REAL
    // ==========================
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
        const code = document.getElementById('registerCode').value.trim();
        
        if (!name || !email || !password || !passwordConfirm || !code) {
            showNotification('Completa todos los campos', 'error');
            return;
        }
        
        if (password !== passwordConfirm) {
            showNotification('Las contraseñas no coinciden', 'error');
            return;
        }
        
        if (password.length < 8) {
            showNotification('La contraseña debe tener 8+ caracteres', 'error');
            return;
        }
        
        showNotification('Creando cuenta...', 'loading');
        
        console.log('Enviando petición a register.php...');
        
        try {
            const response = await fetch('../php/register.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password,
                    userType: userType,
                    registrationCode: code
                })
            });
            
            const data = await response.json();
            console.log('Register response:', data);
            
            if (data.success) {
                showNotification(data.message, 'success');
                setTimeout(() => {
                    registerForm.classList.remove('active');
                    loginForm.classList.add('active');
                    registerForm.reset();
                    if (strengthBar) strengthBar.style.width = '0%';
                }, 2000);
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error de conexión al servidor', 'error');
        }
    });

    // Sistema de notificaciones
    function showNotification(message, type = 'info') {
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        let icon = 'fa-info-circle';
        if (type === 'success') icon = 'fa-check-circle';
        if (type === 'error') icon = 'fa-exclamation-circle';
        if (type === 'loading') icon = 'fa-spinner fa-spin';
        
        notification.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        
        if (type !== 'loading') {
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
    }

    // Estilos de notificaciones
    const styles = document.createElement('style');
    styles.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #1e293b;
            color: #f1f5f9;
            padding: 16px 24px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            border: 1px solid #334155;
            z-index: 10000;
            opacity: 0;
            transform: translateX(400px);
            transition: all 0.3s ease;
            max-width: 400px;
            font-size: 14px;
        }
        .notification.show { opacity: 1; transform: translateX(0); }
        .notification.success { border-color: #10b981; }
        .notification.success i { color: #10b981; }
        .notification.error { border-color: #ef4444; }
        .notification.error i { color: #ef4444; }
        .notification.loading i { color: #6366f1; }
        .notification i { font-size: 20px; }
        @media (max-width: 768px) {
            .notification { top: 10px; right: 10px; left: 10px; max-width: none; }
        }
    `;
    document.head.appendChild(styles);

    console.log('%cEduGuard v1.0 - Sistema Cargado', 'color: #6366f1; font-size: 16px; font-weight: bold;');
    console.log('Formularios listos para usar');
});