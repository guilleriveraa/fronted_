// js/init-manager.js - Sistema de inicialización limpio y estable

class InitManager {

  constructor() {
    this.modules = new Map();
    this.initialized = new Set();
    this.debug = true; // poner false en producción
  }

  /**
   * Registrar módulo
   */
  register(name, initFunction, dependencies = []) {

    if (this.initialized.has(name)) {
      this.log(`⚠️ ${name} ya inicializado`, 'warn');
      return;
    }

    this.modules.set(name, { initFunction, dependencies });
    this.tryInitialize(name);
  }

  /**
   * Intentar inicializar módulo
   */
  tryInitialize(name) {

    const module = this.modules.get(name);
    if (!module) return;

    const missingDeps = module.dependencies.filter(dep => !this.initialized.has(dep));

    if (missingDeps.length > 0) {
      this.log(`⏳ ${name} esperando dependencias: ${missingDeps.join(', ')}`);
      return;
    }

    try {
      this.log(`▶️ Inicializando ${name}`);
      module.initFunction();
      this.initialized.add(name);
      this.modules.delete(name);
      this.log(`✅ ${name} listo`);

      // Intentar inicializar otros módulos pendientes
      this.checkPending();

    } catch (error) {
      this.log(`❌ Error en ${name}: ${error.message}`, 'error');
      console.error(error);
    }
  }

  /**
   * Revisar módulos pendientes
   */
  checkPending() {
    for (const [name] of this.modules.entries()) {
      this.tryInitialize(name);
    }
  }

  /**
   * Ejecutar cuando DOM esté listo
   */
  onDOMReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  /**
   * Log interno
   */
  log(message, type = 'info') {

    if (!this.debug) return;

    const colors = {
      info: 'color:#4CAF50;font-weight:bold;',
      warn: 'color:#FF9800;font-weight:bold;',
      error: 'color:#F44336;font-weight:bold;'
    };

    console.log(`%c[InitManager] ${message}`, colors[type] || colors.info);
  }

  /**
   * Iniciar sistema
   */
  init() {
    this.onDOMReady(() => {
      this.log('🚀 Sistema de módulos iniciado');
    });
  }
}

// Instancia global
window.InitManager = new InitManager();
window.InitManager.init();
