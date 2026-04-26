const API_BASE = '/control-accesos/api';

$(document).ready(function() {
    
    // ANIMACION INICIAL (FADE IN)
    $('body').hide().fadeIn(800);

    // 1. LOGICA DE LOGIN
    $('#loginForm').submit(function(e) {
        e.preventDefault();
        const btn = $(this).find('button');
        btn.html('<span class="spinner-border spinner-border-sm"></span> Conectando...').prop('disabled', true);

        $.ajax({
            url: `${API_BASE}/auth/login.php`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ email: $('#email').val(), password: $('#password').val() }),
            success: function(res) {
                localStorage.setItem('user', JSON.stringify(res.user));
                localStorage.setItem('token', res.token);
                
                if (res.user.role_id == 3) { // Residente
                    window.location.href = 'resident.html';
                } else if (res.user.role_id == 2) { // Guardia
                    window.location.href = 'guard.html';
                } else {
                    alert("Bienvenido Administrador");
                }
            },
            error: function(xhr) {
                $('#loginAlert').text(xhr.responseJSON?.message || 'Error de conexión').removeClass('d-none');
                btn.html('Iniciar Sesión').prop('disabled', false);
            }
        });
    });

    // 2. DASHBOARD DEL RESIDENTE
    if (window.location.pathname.includes('resident.html')) {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || user.role_id != 3) return window.location.href = 'index.html';
        
        $('#userName').text(user.name);
        
        // Cargar Perfil y QR
        $.get(`${API_BASE}/resident/profile.php?resident_id=${user.id}`, function(profile) {
            $('#userAddress').text(profile.address);
            // Generar QR usando API pública (Para MVP)
            $('#qrCode').html(`<img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${profile.access_token}&bgcolor=255-255-255" class="img-fluid rounded shadow-lg border border-3 border-white">`);
        });

        // Estatus Financiero
        $.get(`${API_BASE}/resident/payment_status.php?resident_id=${user.id}`, function(status) {
            let badgeClass = status.status === 'Al corriente' ? 'bg-success' : 'bg-danger';
            $('#paymentStatus').html(`<span class="badge ${badgeClass} fs-5 px-3 py-2 rounded-pill shadow-sm">${status.status}</span>`);
        });

        // Cargar Visitas
        function loadVisits() {
            $.get(`${API_BASE}/resident/visits.php?resident_id=${user.id}`, function(visits) {
                let html = '';
                if(visits.length === 0) html = '<p class="text-muted text-center py-4">No tienes visitas programadas.</p>';
                visits.forEach(v => {
                    html += `
                    <div class="glass-card p-4 mb-3 d-flex justify-content-between align-items-center" style="border-left: 4px solid var(--primary);">
                        <div>
                            <h5 class="mb-1 fw-bold text-white"><i class="fas fa-user-circle me-2 text-primary"></i>${v.visitor_name}</h5>
                            <small class="text-muted d-block"><i class="far fa-calendar-alt me-2"></i>Inicio: ${v.valid_from}</small>
                            <small class="text-muted d-block"><i class="far fa-clock me-2"></i>Fin: ${v.valid_until}</small>
                        </div>
                        <button class="btn btn-outline-danger rounded-pill btn-cancel-visit" data-id="${v.id}">Revocar</button>
                    </div>`;
                });
                $('#visitsList').html(html);
            });
        }
        loadVisits();

        // Crear Visita
        $('#createVisitForm').submit(function(e) {
            e.preventDefault();
            let data = {
                visitor_name: $('#visitorName').val(),
                valid_from: $('#validFrom').val().replace('T', ' ') + ':00',
                valid_until: $('#validUntil').val().replace('T', ' ') + ':00'
            };

            $.ajax({
                url: `${API_BASE}/resident/visits.php?resident_id=${user.id}`,
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(data),
                success: function(res) {
                    $('#createVisitModal').modal('hide');
                    loadVisits();
                    $('#createVisitForm')[0].reset();
                    // Mostrar código de visita (Para dárselo al visitante)
                    alert(`VISITA CREADA.\nCódigo de acceso para el visitante:\n\n${res.access_token}`);
                }
            });
        });

        // Cancelar Visita
        $(document).on('click', '.btn-cancel-visit', function() {
            let vid = $(this).data('id');
            if(confirm("¿Seguro que deseas revocar el acceso a esta visita?")) {
                $.ajax({
                    url: `${API_BASE}/resident/visits.php?resident_id=${user.id}&visit_id=${vid}`,
                    type: 'DELETE',
                    success: function() { loadVisits(); }
                });
            }
        });
    }

    // 3. DASHBOARD DEL GUARDIA (ESCÁNER)
    if (window.location.pathname.includes('guard.html')) {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || user.role_id != 2) return window.location.href = 'index.html';
        
        $('#guardName').text(user.name);
        
        // Auto-focus para el escáner (Pistola USB)
        $('#scannerInput').focus();
        $(document).click(function() { $('#scannerInput').focus(); });

        $('#scanForm').submit(function(e) {
            e.preventDefault();
            let token = $('#scannerInput').val();
            $('#scannerInput').val(''); // Limpiar rápido para el siguiente escaneo

            // Simulación visual
            $('#scanResult').html('<div class="text-center text-primary mt-4"><div class="spinner-grow" role="status"></div><p>Validando UUID...</p></div>');

            $.ajax({
                url: `${API_BASE}/guard/scan.php`,
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ token: token, guard_id: user.id }),
                success: function(res) {
                    $('#scanResult').html(`
                        <div class="alert alert-success mt-4 glass-card border-success text-center py-5">
                            <i class="fas fa-check-circle text-success" style="font-size: 4rem;"></i>
                            <h2 class="text-success fw-bold mt-3">${res.status}</h2>
                            <h4 class="mb-2 text-white">${res.reason}</h4>
                            <span class="badge bg-secondary px-3 py-2 fs-6">Acceso a: ${res.type}</span>
                        </div>
                    `);
                },
                error: function(xhr) {
                    let res = xhr.responseJSON;
                    $('#scanResult').html(`
                        <div class="alert alert-danger mt-4 glass-card border-danger text-center py-5">
                            <i class="fas fa-times-octagon text-danger" style="font-size: 4rem;"></i>
                            <h2 class="text-danger fw-bold mt-3">${res?.status || 'ERROR'}</h2>
                            <h4 class="mb-2 text-white">${res?.reason || 'Código inválido o error de red'}</h4>
                        </div>
                    `);
                }
            });
        });
    }
    
    // LOGOUT
    $('#btnLogout').click(function() {
        localStorage.clear();
        window.location.href = 'index.html';
    });
});
