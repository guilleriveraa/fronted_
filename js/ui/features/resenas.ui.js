// js/ui/features/resenas.ui.js

class ResenasManager {
    constructor(productoId) {
        this.productoId = productoId;
        this.container = document.getElementById('resenas-container');
        this.statsContainer = document.getElementById('resenas-stats');
        this.formContainer = document.getElementById('resenas-form');
    }

    async init() {
        await this.cargarResenas();
        this.setupFormulario();
    }

    async cargarResenas() {
    try {
        const response = await fetch(`${window.API_URL}/productos/${this.productoId}/resenas`);
        const resenas = await response.json();
        
        // Calcular stats a partir de las reseñas
        const stats = this.calcularStats(resenas);
        
        this.renderizarStats(stats);
        this.renderizarResenas(resenas);
        
    } catch (error) {
        console.error('Error cargando reseñas:', error);
    }
}

calcularStats(resenas) {
    if (!resenas || resenas.length === 0) {
        return {
            promedio: 0,
            total: 0,
            cinco_estrellas: 0,
            cuatro_estrellas: 0,
            tres_estrellas: 0,
            dos_estrellas: 0,
            una_estrella: 0
        };
    }

    const total = resenas.length;
    let suma = 0;
    const conteo = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    resenas.forEach(r => {
        // Usar 'puntuacion' (del backend) o 'calificacion' (del frontend)
        const punt = r.puntuacion || r.calificacion;
        suma += punt;
        if (punt >= 5) conteo[5]++;
        else if (punt >= 4) conteo[4]++;
        else if (punt >= 3) conteo[3]++;
        else if (punt >= 2) conteo[2]++;
        else conteo[1]++;
    });

    return {
        promedio: suma / total,
        total: total,
        cinco_estrellas: conteo[5],
        cuatro_estrellas: conteo[4],
        tres_estrellas: conteo[3],
        dos_estrellas: conteo[2],
        una_estrella: conteo[1]
    };
}

    renderizarStats(stats) {
    if (!this.statsContainer) return;
    
    // Si no hay stats o stats.total es 0, mostrar mensaje
    if (!stats || !stats.total || stats.total === 0) {
        this.statsContainer.innerHTML = `
            <div class="resumen-resenas">
                <div class="puntuacion-global">
                    <span class="puntuacion-numero">0.0</span>
                    <div class="estrellas-grandes">
                        <i class="far fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i>
                    </div>
                    <span class="total-resenas">0 reseñas</span>
                </div>
                <div class="distribucion-estrellas">
                    <p class="sin-resenas-texto">Este producto aún no tiene reseñas. ¡Sé el primero en opinar!</p>
                </div>
            </div>
        `;
        return;
    }

    // Asegurar que stats.promedio es un número
    const promedio = stats.promedio ? Number(stats.promedio).toFixed(1) : 0;
    const total = stats.total || 0;
    
    // Calcular porcentajes de forma segura
    const porcentajes = {
        5: total > 0 ? Math.round((stats.cinco_estrellas / total) * 100) : 0,
        4: total > 0 ? Math.round((stats.cuatro_estrellas / total) * 100) : 0,
        3: total > 0 ? Math.round((stats.tres_estrellas / total) * 100) : 0,
        2: total > 0 ? Math.round((stats.dos_estrellas / total) * 100) : 0,
        1: total > 0 ? Math.round((stats.una_estrella / total) * 100) : 0
    };

    this.statsContainer.innerHTML = `
        <div class="resumen-resenas">
            <div class="puntuacion-global">
                <span class="puntuacion-numero">${promedio}</span>
                <div class="estrellas-grandes">
                    ${this.generarEstrellas(promedio)}
                </div>
                <span class="total-resenas">${total} reseñas</span>
            </div>
            <div class="distribucion-estrellas">
                ${[5,4,3,2,1].map(num => `
                    <div class="barra-estrellas">
                        <span class="estrellas-label">${num} estrellas</span>
                        <div class="barra-progreso">
                            <div class="barra-llena" style="width: ${porcentajes[num]}%"></div>
                        </div>
                        <span class="porcentaje">${porcentajes[num]}%</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Función auxiliar para generar estrellas
generarEstrellas(puntuacion) {
    const estrellas = [];
    const valor = parseFloat(puntuacion) || 0;
    
    for (let i = 1; i <= 5; i++) {
        if (i <= valor) {
            estrellas.push('<i class="fas fa-star"></i>');
        } else if (i - 0.5 <= valor) {
            estrellas.push('<i class="fas fa-star-half-alt"></i>');
        } else {
            estrellas.push('<i class="far fa-star"></i>');
        }
    }
    return estrellas.join('');
}

    renderizarResenas(resenas) {
        if (!this.container) return;
        
        if (resenas.length === 0) {
            this.container.innerHTML = `
                <div class="sin-resenas">
                    <i class="fas fa-star"></i>
                    <p>Este producto aún no tiene reseñas.</p>
                    <p>¡Sé el primero en opinar!</p>
                </div>
            `;
            return;
        }

        this.container.innerHTML = resenas.map(resena => `
            <div class="resena-card" data-id="${resena.id}">
                <div class="resena-header">
                    <div class="usuario-info">
                        <span class="usuario-nombre">${resena.usuario_nombre}</span>
                        <span class="fecha-resena">${new Date(resena.fecha).toLocaleDateString()}</span>
                    </div>
                    <div class="estrellas-resena">
                        ${this.generarEstrellas(resena.calificacion)}
                    </div>
                </div>
                ${resena.titulo ? `<h4 class="resena-titulo">${resena.titulo}</h4>` : ''}
                <p class="resena-comentario">${resena.comentario}</p>
                ${resena.imagenes ? this.renderizarImagenes(JSON.parse(resena.imagenes)) : ''}
                <div class="resena-footer">
                    <button class="btn-util" onclick="votarResena(${resena.id}, 'util')">
                        <i class="fas fa-thumbs-up"></i> 
                        Útil (${resena.votos_utiles || 0})
                    </button>
                </div>
            </div>
        `).join('');
    }

    generarEstrellas(puntuacion) {
        const estrellas = [];
        for (let i = 1; i <= 5; i++) {
            if (i <= puntuacion) {
                estrellas.push('<i class="fas fa-star"></i>');
            } else if (i - 0.5 <= puntuacion) {
                estrellas.push('<i class="fas fa-star-half-alt"></i>');
            } else {
                estrellas.push('<i class="far fa-star"></i>');
            }
        }
        return estrellas.join('');
    }

    renderizarImagenes(imagenes) {
        return `
            <div class="resena-imagenes">
                ${imagenes.map(img => `
                    <img src="${img}" alt="Imagen de reseña" class="resena-imagen">
                `).join('')}
            </div>
        `;
    }

    setupFormulario() {
        if (!this.formContainer) return;
        
        const puedeResenar = this.verificarPuedeResenar();
        
        if (!puedeResenar) {
            this.formContainer.innerHTML = `
                <div class="no-puede-resenar">
                    <p>Debes haber comprado y recibido este producto para reseñarlo.</p>
                </div>
            `;
            return;
        }

        this.formContainer.innerHTML = `
            <form id="formulario-resena" class="formulario-resena">
                <h3>Escribe tu reseña</h3>
                <div class="campo-resena">
                    <label>Tu valoración</label>
                    <div class="selector-estrellas" id="selector-estrellas">
                        ${[1,2,3,4,5].map(num => `
                            <i class="far fa-star" data-valor="${num}"></i>
                        `).join('')}
                    </div>
                </div>
                <div class="campo-resena">
                    <label>Título de la reseña (opcional)</label>
                    <input type="text" id="resena-titulo" placeholder="Resume tu experiencia">
                </div>
                <div class="campo-resena">
                    <label>Tu comentario</label>
                    <textarea id="resena-comentario" rows="4" required></textarea>
                </div>
                <button type="submit" class="btn-enviar-resena">Enviar reseña</button>
            </form>
        `;

        this.setupSelectorEstrellas();
        document.getElementById('formulario-resena').addEventListener('submit', this.enviarResena.bind(this));
    }

    setupSelectorEstrellas() {
        const estrellas = document.querySelectorAll('.selector-estrellas i');
        let calificacion = 0;

        estrellas.forEach(estrella => {
            estrella.addEventListener('mouseenter', function() {
                const valor = parseInt(this.dataset.valor);
                estrellas.forEach((e, i) => {
                    if (i < valor) {
                        e.classList.remove('far');
                        e.classList.add('fas');
                    } else {
                        e.classList.remove('fas');
                        e.classList.add('far');
                    }
                });
            });

            estrella.addEventListener('mouseleave', function() {
                estrellas.forEach((e, i) => {
                    if (i < calificacion) {
                        e.classList.remove('far');
                        e.classList.add('fas');
                    } else {
                        e.classList.remove('fas');
                        e.classList.add('far');
                    }
                });
            });

            estrella.addEventListener('click', function() {
                calificacion = parseInt(this.dataset.valor);
                window.calificacionSeleccionada = calificacion;
            });
        });
    }

    async enviarResena(e) {
    e.preventDefault();
    
    const titulo = document.getElementById('resena-titulo').value;
    const comentario = document.getElementById('resena-comentario').value;
    const calificacion = window.calificacionSeleccionada;

    if (!calificacion) {
        alert('Por favor, selecciona una valoración');
        return;
    }

    if (!comentario) {
        alert('Por favor, escribe un comentario');
        return;
    }

    try {
        // 🔴 CAMBIO 1: URL CORRECTA (sin /productos/)
        const response = await fetch(`${window.API_URL}/resenas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + window.sessionService.getToken()
            },
            // 🔴 CAMBIO 2: Cuerpo con los nombres correctos que espera el backend
            body: JSON.stringify({ 
                productoId: this.productoId,  // El backend espera productoId
                puntuacion: calificacion,      // El backend espera puntuacion
                comentario: comentario,
                titulo: titulo || null
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('✅ Reseña enviada correctamente. Pendiente de aprobación.');
            this.formContainer.innerHTML = `
                <div class="resena-enviada">
                    <i class="fas fa-check-circle"></i>
                    <p>¡Gracias por tu reseña! Será visible tras ser aprobada.</p>
                </div>
            `;
            await this.cargarResenas(); // Recargar reseñas
        } else {
            alert(data.message || 'Error al enviar la reseña');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

    async verificarPuedeResenar() {
        if (!window.sessionService?.isLoggedIn()) return false;
        
        try {
            const response = await fetch(`${window.API_URL}/puede-resenar/${this.productoId}`, {
                headers: {
                    'Authorization': 'Bearer ' + window.sessionService.getToken()
                }
            });
            const data = await response.json();
            return data.puede;
        } catch {
            return false;
        }
    }
}

// Funciones globales
window.votarResena = async function(reseñaId, tipo) {
    if (!window.sessionService?.isLoggedIn()) {
        if (window.showAuthModal) window.showAuthModal('login');
        return;
    }

    try {
        const response = await fetch(`${window.API_URL}/resenas/${reseñaId}/votar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + window.sessionService.getToken()
            },
            body: JSON.stringify({ tipo })
        });

        const data = await response.json();
        
        if (response.ok) {
            // Actualizar el contador en la UI
            const btn = document.querySelector(`[data-id="${reseñaId}"] .btn-util`);
            if (btn) {
                btn.innerHTML = `<i class="fas fa-thumbs-up"></i> Útil (${data.votos_utiles})`;
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

window.initResenas = function(productoId) {
    const manager = new ResenasManager(productoId);
    manager.init();
};

console.log('✅ Resenas UI cargado');