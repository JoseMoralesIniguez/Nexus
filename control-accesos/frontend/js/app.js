const API_BASE = '/control-accesos/api';

$(document).ready(function() {
    
    // ANIMACION INICIAL (FADE IN)
    $('body').hide().fadeIn(800);

    // INYECTAR CONTENEDOR DE NOTIFICACIONES (TOASTS)
    $('body').append(`
        <div class="toast-container position-fixed top-0 end-0 p-4" style="z-index: 1055;">
            <div id="liveToast" class="toast glass-card border-secondary shadow-lg" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header border-bottom border-secondary bg-transparent text-white">
                    <i class="fas fa-bell me-2" id="toastIcon"></i>
                    <strong class="me-auto" id="toastTitle">Notificación</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body text-white fw-medium" id="toastBody" style="line-height: 1.5;"></div>
            </div>
        </div>
    `);

    window.showNotification = function(message, type = 'success') {
        let title = "Notificación";
        let icon = "fa-bell text-primary";

        if(type === 'error') {
            title = "Error";
            icon = "fa-exclamation-circle text-danger";
        } else if(type === 'warning') {
            title = "Atención";
            icon = "fa-exclamation-triangle text-warning";
        } else if(type === 'success') {
            title = "Éxito";
            icon = "fa-check-circle text-success";
        }

        $('#toastTitle').text(title);
        $('#toastIcon').attr('class', `fas ${icon} me-2`);
        $('#toastBody').html(message.replace(/\n/g, '<br>'));
        
        const toastElement = document.getElementById('liveToast');
        const toast = new bootstrap.Toast(toastElement, { delay: 4500 });
        toast.show();
    };

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
                    showNotification("Bienvenido Administrador", "success");
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
            $('#qrCode').html(`<img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=4&data=${profile.access_token}&bgcolor=255-255-255" class="img-fluid rounded shadow-lg border border-3 border-white">`);
        });

        // Estatus Financiero
        $.get(`${API_BASE}/resident/payment_status.php?resident_id=${user.id}`, function(status) {
            let badgeClass = status.status === 'Al corriente' ? 'bg-success' : 'bg-danger';
            $('#paymentStatus').html(`<span class="badge ${badgeClass} fs-5 px-3 py-2 rounded-pill shadow-sm">${status.status}</span>`);
        });

        // Cargar Visitas con Filtro
        function loadVisits(filter = 'active') {
            $.get(`${API_BASE}/resident/visits.php?resident_id=${user.id}&filter=${filter}`, function(visits) {
                let html = '';
                if(visits.length === 0) html = '<p class="text-muted text-center py-4">No se encontraron visitas.</p>';
                visits.forEach(v => {
                    let isInactive = v.status == 0;
                    let opacityClass = isInactive ? 'opacity-50' : '';
                    let borderClass = isInactive ? 'gray' : 'var(--primary)';
                    let btnHtml = isInactive 
                        ? '<span class="badge bg-secondary">Anulado</span>'
                        : `<button class="btn btn-outline-danger rounded-pill btn-cancel-visit" data-id="${v.id}">Revocar</button>`;

                    html += `
                    <div class="glass-card p-3 mb-3 d-flex justify-content-between align-items-center ${opacityClass}" style="border-left: 4px solid ${borderClass};">
                        <div class="d-flex align-items-center">
                            <div class="me-3 bg-white p-1 rounded shadow-sm d-none d-sm-block">
                                <img src="https://api.qrserver.com/v1/create-qr-code/?size=70x70&margin=2&data=${v.access_token}" width="70" height="70" alt="QR">
                            </div>
                            <div>
                                <h5 class="mb-1 fw-bold text-white"><i class="fas fa-user-circle me-2 ${isInactive ? 'text-secondary' : 'text-primary'}"></i>${v.visitor_name}</h5>
                                <small class="text-muted d-block"><i class="far fa-calendar-alt me-2 icon-accent"></i>Inicio: <span class="text-white">${v.valid_from}</span></small>
                                <small class="text-muted d-block"><i class="far fa-clock me-2 icon-accent"></i>Fin: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-white">${v.valid_until}</span></small>
                                <small class="text-muted d-block mt-1" style="font-size: 0.75rem;"><i class="fas fa-key me-1 icon-accent"></i>Token: <span class="text-white-50">${v.access_token}</span></small>
                            </div>
                        </div>
                        <div class="d-flex flex-column gap-2">
                            ${!isInactive ? `<button class="btn btn-sm btn-primary rounded-pill btn-share-visit shadow-sm" data-token="${v.access_token}" data-from="${v.valid_from}" data-until="${v.valid_until}"><i class="fas fa-share-nodes"></i></button>` : ''}
                            ${btnHtml}
                        </div>
                    </div>`;
                });
                $('#visitsList').html(html);
            });
        }
        loadVisits();

        // Switch de filtro
        $('#filterVisitsSwitch').change(function() {
            let filter = $(this).is(':checked') ? 'active' : 'all';
            loadVisits(filter);
        });

        // Crear Visita
        $('#createVisitForm').submit(function(e) {
            e.preventDefault();
            
            let fromStr = $('#validFrom').val();
            let untilStr = $('#validUntil').val();

            if (!fromStr) {
                showNotification("Debes seleccionar la fecha de inicio para continuar.", "warning");
                return;
            }

            let dateFrom = new Date(fromStr);
            let dateUntil;
            let formattedUntil = '';

            if (!untilStr) {
                // Si no hay fecha de fin, sumar 30 minutos a la de inicio
                dateUntil = new Date(dateFrom.getTime() + 30 * 60000);
                
                // Formatear manualmente a formato de BD para evitar cambios de zona horaria
                let Y = dateUntil.getFullYear();
                let M = String(dateUntil.getMonth() + 1).padStart(2, '0');
                let D = String(dateUntil.getDate()).padStart(2, '0');
                let H = String(dateUntil.getHours()).padStart(2, '0');
                let m = String(dateUntil.getMinutes()).padStart(2, '0');
                formattedUntil = `${Y}-${M}-${D} ${H}:${m}:00`;
            } else {
                dateUntil = new Date(untilStr);
                formattedUntil = untilStr.replace('T', ' ') + ':00';
            }
            
            // Validar diferencia mínima de 30 minutos (1800000 milisegundos)
            let diffMs = dateUntil - dateFrom;
            if (diffMs < 1800000) {
                showNotification("La fecha/hora de Fin debe ser al menos 30 minutos posterior a la de Inicio.", "error");
                return;
            }

            let data = {
                visitor_name: $('#visitorName').val(),
                is_single_use: parseInt($('#isSingleUse').val()),
                valid_from: fromStr.replace('T', ' ') + ':00',
                valid_until: formattedUntil
            };

            $.ajax({
                url: `${API_BASE}/resident/visits.php?resident_id=${user.id}`,
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(data),
                success: function(res) {
                    $('#createVisitModal').modal('hide');
                    $('#createVisitForm')[0].reset();
                    
                    // Setear QR y texto en el modal de éxito
                    $('#newVisitQrContainer').html(`<img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=4&data=${res.access_token}&bgcolor=255-255-255" class="img-fluid shadow-sm border border-2 border-white">`);
                    $('#newVisitCodeText').text(res.access_token);
                    $('#btnShareModalPass').data('token', res.access_token);
                    $('#btnShareModalPass').data('from', data.valid_from);
                    $('#btnShareModalPass').data('until', data.valid_until);
                    $('#visitSuccessModal').modal('show');
                    
                    let filter = $('#filterVisitsSwitch').is(':checked') ? 'active' : 'all';
                    loadVisits(filter);
                }
            });
        });

        // Generar Archivo QR Nativo con "Quiet Zone" (Margen Blanco)
        function getQrFile(text) {
            return new Promise((resolve) => {
                let div = document.createElement('div');
                new QRCode(div, { 
                    text: text, 
                    width: 300, 
                    height: 300,
                    colorDark : "#000000",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.M 
                });
                
                setTimeout(() => {
                    let qrCanvas = div.querySelector('canvas');
                    if (qrCanvas) {
                        // Crear canvas nuevo para añadir margen blanco obligatorio para los escáneres
                        let padding = 40;
                        let paddedCanvas = document.createElement('canvas');
                        paddedCanvas.width = qrCanvas.width + (padding * 2);
                        paddedCanvas.height = qrCanvas.height + (padding * 2);
                        let ctx = paddedCanvas.getContext('2d');
                        
                        // Fondo blanco
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height);
                        // Pegar QR en el centro
                        ctx.drawImage(qrCanvas, padding, padding);

                        paddedCanvas.toBlob((blob) => {
                            resolve(new File([blob], "pase_acceso.png", { type: "image/png" }));
                        }, 'image/png');
                    } else {
                        resolve(null);
                    }
                }, 150);
            });
        }

        // Lógica de Compartir Pase con Imagen
        async function sharePass(token, validFrom, validUntil) {
            let passUrl = `${window.location.origin}/control-accesos/frontend/pass.html?token=${token}`;
            let messageText = `🎫 *Pase de Acceso - Nexus*\n\nAquí tienes tu pase de entrada al fraccionamiento. Muéstralo en caseta.\n\n📅 *Válido desde:* ${validFrom}\n⏳ *Hasta:* ${validUntil}\n\n🔑 *Tu Código:* ${token}\n\n🌐 *Abre tu Pase Digital aquí:*\n${passUrl}`;

            // Cambiar íconos temporalmente para mostrar carga
            $('.btn-share-visit[data-token="'+token+'"]').html('<i class="fas fa-spinner fa-spin"></i>');
            $('#btnShareModalPass').html('<i class="fas fa-spinner fa-spin"></i> Generando imagen...');

            let qrFile = await getQrFile(token);

            // Restaurar botones
            $('.btn-share-visit[data-token="'+token+'"]').html('<i class="fas fa-share-nodes"></i>');
            $('#btnShareModalPass').html('<i class="fas fa-share-nodes me-2"></i>Compartir Enlace');

            if (navigator.share) {
                let shareData = { title: 'Pase de Acceso - Nexus', text: messageText };
                if (qrFile && navigator.canShare && navigator.canShare({ files: [qrFile] })) {
                    shareData.files = [qrFile]; // ¡Adjuntar imagen nativa!
                }
                navigator.share(shareData).catch(console.error);
            } else {
                if (qrFile) {
                    try {
                        await navigator.clipboard.write([
                            new ClipboardItem({
                                "text/plain": new Blob([messageText], { type: "text/plain" }),
                                "image/png": qrFile
                            })
                        ]);
                        showNotification("¡IMAGEN Y TEXTO copiados al portapapeles!\n\nVe a WhatsApp Web, da clic derecho y presiona Pegar. Se enviará la foto del QR.", "success");
                        return;
                    } catch (err) { }
                }
                navigator.clipboard.writeText(messageText).then(() => {
                    showNotification("¡Pase copiado al portapapeles!\n\nVe a WhatsApp Web, da clic derecho y presiona Pegar.", "success");
                });
            }
        }

        $(document).on('click', '.btn-share-visit', function() {
            sharePass($(this).data('token'), $(this).data('from'), $(this).data('until'));
        });

        $('#btnShareModalPass').click(function() {
            sharePass($(this).data('token'), $(this).data('from'), $(this).data('until'));
        });

        // Cancelar Visita (Mostrar Modal)
        let visitIdToRevoke = null;
        $(document).on('click', '.btn-cancel-visit', function() {
            visitIdToRevoke = $(this).data('id');
            $('#confirmRevokeModal').modal('show');
        });

        // Ejecutar Revocación
        $('#btnConfirmRevoke').click(function() {
            if(!visitIdToRevoke) return;
            
            let btn = $(this);
            let originalText = btn.html();
            btn.html('<i class="fas fa-spinner fa-spin"></i>').prop('disabled', true);

            $.ajax({
                url: `${API_BASE}/resident/visits.php?resident_id=${user.id}&visit_id=${visitIdToRevoke}`,
                type: 'DELETE',
                success: function() { 
                    $('#confirmRevokeModal').modal('hide');
                    btn.html(originalText).prop('disabled', false);
                    visitIdToRevoke = null;
                    
                    let filter = $('#filterVisitsSwitch').is(':checked') ? 'active' : 'all';
                    loadVisits(filter); 
                },
                error: function() {
                    btn.html(originalText).prop('disabled', false);
                    showNotification("Ocurrió un error al intentar revocar la visita. Verifica tu conexión.", "error");
                }
            });
        });

        // Expandir / Contraer Pase Permanente
        $('#btnExpandPass').click(function() {
            $('#colRight').hide();
            $('#colLeft').removeClass('col-lg-4').addClass('col-lg-12 d-flex flex-column align-items-center');
            $('#residentPassSummary').hide();
            $('#residentPassExpanded').removeClass('d-none').addClass('d-block w-100').css('max-width', '450px');
            
            // Llenar datos en el formato Ticket
            $('#ticketResidentName').text(user.name);
            $('#ticketAddress').text($('#userAddress').text());
            $('#ticketPaymentStatus').html($('#paymentStatus').html()); 
            $('#ticketQrCode').html($('#qrCode').html());
        });

        $('#btnCollapsePass').click(function() {
            $('#colLeft').removeClass('col-lg-12 d-flex flex-column align-items-center').addClass('col-lg-4 transition-all');
            $('#residentPassExpanded').removeClass('d-block w-100').addClass('d-none');
            $('#residentPassSummary').fadeIn();
            setTimeout(() => $('#colRight').fadeIn(), 200);
        });
    }

    // 3. DASHBOARD DEL GUARDIA (ESCÁNER)
    if (window.location.pathname.includes('guard.html')) {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || user.role_id != 2) return window.location.href = 'index.html';
        
        $('#guardName').text(user.name);
        
        // Auto-focus para el escáner (Pistola USB)
        $('#scannerInput').focus();
        $(document).click(function(e) { 
            if(!$(e.target).closest('#camModeArea, #btnModeCam').length && !$('#camModeArea').is(':visible')) {
                $('#scannerInput').focus(); 
            }
        });

        // Alternar entre Pistola y Cámara
        let html5QrcodeScanner = null;

        $('#btnModeCam').click(function() {
            $('#btnModeGun').removeClass('btn-primary').addClass('btn-outline-primary');
            $(this).removeClass('btn-outline-info').addClass('btn-info text-white');
            $('#gunModeArea').addClass('d-none');
            $('#camModeArea').removeClass('d-none');
            
            if(!html5QrcodeScanner) {
                html5QrcodeScanner = new Html5QrcodeScanner(
                    "qr-reader", { 
                        fps: 10, 
                        qrbox: {width: 250, height: 250},
                        rememberLastUsedCamera: true,
                        supportedScanTypes: [
                            Html5QrcodeScanType.SCAN_TYPE_CAMERA,
                            Html5QrcodeScanType.SCAN_TYPE_FILE
                        ]
                    }, false);
                html5QrcodeScanner.render(onScanSuccess, onScanFailure);
            }
        });

        $('#btnModeGun').click(function() {
            $('#btnModeCam').removeClass('btn-info text-white').addClass('btn-outline-info');
            $(this).removeClass('btn-outline-primary').addClass('btn-primary');
            $('#camModeArea').addClass('d-none');
            $('#gunModeArea').removeClass('d-none');
            $('#scannerInput').focus();
            
            if(html5QrcodeScanner) {
                html5QrcodeScanner.clear();
                html5QrcodeScanner = null;
            }
        });

        // Lógica de Procesamiento Centralizada
        let isScanning = false;

        function processToken(token) {
            if(isScanning) return;
            isScanning = true;

            // Simulación visual
            $('#scanResult').html('<div class="text-center text-primary mt-4"><div class="spinner-grow" role="status"></div><p>Validando UUID...</p></div>');

            $.ajax({
                url: `${API_BASE}/guard/scan.php`,
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ token: token, guard_id: user.id }),
                success: function(res) {
                    let isExit = res.action === "SALIDA";
                    let colorCls = isExit ? "warning" : "success";
                    let iconCls = isExit ? "fa-sign-out-alt" : "fa-check-circle";
                    let title = isExit ? "SALIDA REGISTRADA" : "ACCESO AUTORIZADO";
                    let textColor = isExit ? "text-warning" : "text-success";

                    $('#scanResult').html(`
                        <div class="alert alert-${colorCls} mt-4 glass-card border-${colorCls} text-center py-5 shadow-lg" style="background-color: rgba(0,0,0,0.6);">
                            <i class="fas ${iconCls} ${textColor} mb-3" style="font-size: 4rem; filter: drop-shadow(0 0 10px var(--bs-${colorCls}));"></i>
                            <h2 class="fw-bold tracking-wider ${textColor}">${title}</h2>
                            <h4 class="text-white mt-3">${res.type}</h4>
                            <p class="fs-5 mb-0 text-light">${res.reason}</p>
                        </div>
                    `);
                    
                    setTimeout(() => { isScanning = false; $('#scanResult').empty(); }, 5000);
                },
                error: function(xhr) {
                    let res = xhr.responseJSON;
                    $('#scanResult').html(`
                        <div class="alert alert-danger mt-4 glass-card border-danger text-center py-5 shadow-lg">
                            <i class="fas fa-times-circle text-danger" style="font-size: 4rem;"></i>
                            <h2 class="text-danger fw-bold mt-3">${res?.status || 'ERROR'}</h2>
                            <h4 class="mb-2 text-white">${res?.reason || 'Código inválido o error de red'}</h4>
                        </div>
                    `);
                    setTimeout(() => { isScanning = false; $('#scanResult').empty(); }, 5000);
                }
            });
        }

        // Evento de Pistola USB
        $('#scanForm').submit(function(e) {
            e.preventDefault();
            let token = $('#scannerInput').val().trim();
            $('#scannerInput').val(''); // Limpiar rápido para el siguiente escaneo
            if(token) processToken(token);
        });

        // Callback de Cámara Web nativa
        function onScanSuccess(decodedText, decodedResult) {
            isFileScan = false;
            processToken(decodedText);
        }

        let isFileScan = false;
        
        // INTERCEPTOR: Usar jsQR en Fase de Captura (Bypasear a html5-qrcode)
        document.addEventListener('change', function(e) {
            if (e.target && e.target.type === 'file' && e.target.closest('#qr-reader')) {
                isFileScan = true;
                let file = e.target.files[0];
                if (!file) return;
                
                let reader = new FileReader();
                reader.onload = function(event) {
                    let img = new Image();
                    img.onload = function() {
                        let canvas = document.createElement('canvas');
                        let ctx = canvas.getContext('2d');
                        let MAX_WIDTH = 800;
                        let scale = 1;
                        if (img.width > MAX_WIDTH) { scale = MAX_WIDTH / img.width; }
                        canvas.width = img.width * scale;
                        canvas.height = img.height * scale;
                        
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        
                        let code = jsQR(imageData.data, imageData.width, imageData.height, {
                            inversionAttempts: "dontInvert",
                        });
                        
                        if (code && code.data) {
                            isFileScan = false;
                            showNotification("Código leído por motor de respaldo (jsQR).", "success");
                            processToken(code.data);
                        } else {
                            // Si jsQR falla, intentamos invertir colores
                            let invertedCode = jsQR(imageData.data, imageData.width, imageData.height, {
                                inversionAttempts: "invertFirst",
                            });
                            if (invertedCode && invertedCode.data) {
                                isFileScan = false;
                                showNotification("Código invertido leído exitosamente.", "success");
                                processToken(invertedCode.data);
                            }
                        }
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        }, true); // Fase de Captura es crítica aquí

        // Silenciar los errores continuos cuando no detecta un QR
        function onScanFailure(error) {
            // Eliminar agresivamente el banner rojo si aparece
            $('#qr-reader').find('div:contains("MultiFormat"), span:contains("MultiFormat")').hide();
            
            // Si estaba escaneando un archivo estático y falló el motor ZXing original
            if (isFileScan) {
                // No mostrar error inmediato, esperamos a que el interceptor jsQR termine de procesar.
                // Si jsQR también falla, el archivo no sirve.
                setTimeout(() => {
                    if (isFileScan) {
                        showNotification("La imagen subida no es nítida o no es un QR válido. Por favor, intenta de nuevo.", "error");
                        isFileScan = false;
                    }
                }, 1000);
            }
        }

        // Monitor en Tiempo Real
        function loadMonitor() {
            $.get(`${API_BASE}/guard/monitor.php`, function(visits) {
                let html = '';
                if(visits.length === 0) {
                    html = '<tr><td colspan="4" class="text-center text-muted py-4">Sin pases activos actualmente.</td></tr>';
                } else {
                    let now = new Date();
                    visits.forEach(v => {
                        let until = new Date(v.valid_until.replace(' ', 'T'));
                        let isExpired = now > until;
                        
                        let badge = '';
                        if (v.is_inside == 1) {
                            if (isExpired) {
                                badge = '<span class="badge bg-danger shadow-sm"><i class="fas fa-exclamation-triangle me-1"></i>Vencido (Adentro)</span>';
                            } else {
                                badge = '<span class="badge bg-warning text-dark shadow-sm"><i class="fas fa-walking me-1"></i>Adentro</span>';
                            }
                        } else if (v.status == 1) {
                            badge = '<span class="badge bg-primary bg-opacity-25 text-primary border border-primary shadow-sm"><i class="far fa-clock me-1"></i>Por Ingresar</span>';
                        }
                        
                        html += `
                            <tr>
                                <td class="text-white fw-bold"><i class="fas fa-user-circle me-2 text-muted"></i>${v.visitor_name}</td>
                                <td class="text-light small">${v.address}</td>
                                <td>${badge}</td>
                                <td class="small text-muted text-end">Hasta: ${v.valid_until}</td>
                            </tr>
                        `;
                    });
                }
                $('#monitorTableBody').html(html);
            });
        }
        
        loadMonitor();
        setInterval(loadMonitor, 5000); // Polling cada 5 segundos
    }
    
    // LOGOUT
    $('#btnLogout').click(function() {
        localStorage.clear();
        window.location.href = 'index.html';
    });
});
