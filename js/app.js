/**
 * ApisApp Pro v1.0.5 - Código Unificado Standalone
 * Gestão de Apicultura (Apis mellifera)
 * Suporte a execução por duplo clique (file://) e por servidor local (http://)
 */

// ==========================================================================
// 1. MÓDULO DE ARMAZENAMENTO & CORES (storage.js integrado)
// ==========================================================================

const STORAGE_KEYS = {
  APICULTOR_INFO: 'apisapp_apicultor_info',
  APIARIES: 'apisapp_apiaries',
  HIVES: 'apisapp_hives',
  QUEENS: 'apisapp_queens',
  INSPECTIONS: 'apisapp_inspections',
  HARVESTS: 'apisapp_harvests',
  SETTINGS: 'apisapp_settings',
  LAST_BACKUP_DATE: 'apisapp_last_backup_date',
  BACKUPS_HISTORY: 'apisapp_backups_history',
  QUEEN_COLORS: 'apisapp_queen_colors',
  BOX_MODELS: 'apisapp_box_models' //
};

// ID do cliente OAuth do Google (público). Necessário para o backup automático no Google Drive.
const GOOGLE_CLIENT_ID = 'COLE_AQUI_O_CLIENT_ID.apps.googleusercontent.com';

const DEFAULT_QUEEN_COLOR_CODES = [
  { years: [2021, 2026, 2031], color: '#FFFFFF', textColor: '#0F172A', label: 'Branco (Anos 1 e 6)' },
  { years: [2022, 2027, 2032], color: '#FACC15', textColor: '#0F172A', label: 'Amarelo (Anos 2 e 7)' },
  { years: [2023, 2028, 2033], color: '#EF4444', textColor: '#FFFFFF', label: 'Vermelho (Anos 3 e 8)' },
  { years: [2024, 2029, 2034], color: '#10B981', textColor: '#FFFFFF', label: 'Verde (Anos 4 e 9)' },
  { years: [2025, 2030, 2035], color: '#3B82F6', textColor: '#FFFFFF', label: 'Azul (Anos 5 e 0)' }
];

const EMPTY_DATA = {
  apiaries: [],
  hives: [],
  queens: [],
  inspections: [],
  harvests: []
};

const ApisStorage = {
 init() {
    // Inicializa a estrutura básica com segurança sem apagar o cadastro do produtor
    if (!localStorage.getItem(STORAGE_KEYS.APIARIES)) {
      localStorage.setItem(STORAGE_KEYS.APIARIES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.HIVES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.QUEENS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.HARVESTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.QUEEN_COLORS)) {
      localStorage.setItem(STORAGE_KEYS.QUEEN_COLORS, JSON.stringify(DEFAULT_QUEEN_COLOR_CODES));
    }
    // Inicializa os modelos de caixas padrão caso não existam no localStorage
    if (!localStorage.getItem(STORAGE_KEYS.BOX_MODELS)) {
      const defaultModels = ['Langstroth', 'Schenck', 'Top Bar'];
      localStorage.setItem(STORAGE_KEYS.BOX_MODELS, JSON.stringify(defaultModels));
    }
    this.checkAutoBackup();
  },

getBoxModels() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.BOX_MODELS) || '[]');
  },

  saveBoxModel(modelName) {
    const list = this.getBoxModels();
    const trimmed = modelName.trim();
    if (trimmed && !list.includes(trimmed)) {
      list.push(trimmed);
      localStorage.setItem(STORAGE_KEYS.BOX_MODELS, JSON.stringify(list));
      return true;
    }
    return false;
  },

  deleteBoxModel(modelName) {
    let list = this.getBoxModels();
    list = list.filter(m => m !== modelName);
    localStorage.setItem(STORAGE_KEYS.BOX_MODELS, JSON.stringify(list));
  },

  // Renomeia um modelo e atualiza as colmeias que já usavam o nome antigo.
  // Retorna: 'ok' | 'empty' | 'duplicate' | 'notfound'
  renameBoxModel(oldName, newName) {
    const trimmed = String(newName || '').trim();
    if (!trimmed) return 'empty';
    const list = this.getBoxModels();
    const idx = list.indexOf(oldName);
    if (idx === -1) return 'notfound';
    if (trimmed === oldName) return 'ok';
    if (list.some(m => m.toLowerCase() === trimmed.toLowerCase())) return 'duplicate';

    list[idx] = trimmed;
    localStorage.setItem(STORAGE_KEYS.BOX_MODELS, JSON.stringify(list));

    const hives = this.getHives();
    let changed = false;
    hives.forEach(h => {
      if (h.type === oldName) { h.type = trimmed; changed = true; }
    });
    if (changed) localStorage.setItem(STORAGE_KEYS.HIVES, JSON.stringify(hives));
    return 'ok';
  },

  countHivesUsingModel(modelName) {
    return this.getHives().filter(h => h.type === modelName).length;
  },

  getApicultorInfo() {
    const dados = localStorage.getItem(STORAGE_KEYS.APICULTOR_INFO);
    return dados ? JSON.parse(dados) : null;
  },

  saveApicultorInfo(nomeApicultor, apiarioPrincipal) {
    const info = { nomeApicultor, apiarioPrincipal, dataCadastro: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.APICULTOR_INFO, JSON.stringify(info));
    
    // Cadastra automaticamente o Apiário Principal como o primeiro "Núcleo" vinculado à sede inicial
    this.saveApiary({
      name: apiarioPrincipal + " - Sede",
      location: 'Sede Principal',
      notes: 'Núcleo base gerado automaticamente para o apiário ' + apiarioPrincipal + '.'
    });
  },

  getAll() {
    return {
      apiaries: JSON.parse(localStorage.getItem(STORAGE_KEYS.APIARIES) || '[]'),
      hives: JSON.parse(localStorage.getItem(STORAGE_KEYS.HIVES) || '[]'),
      queens: JSON.parse(localStorage.getItem(STORAGE_KEYS.QUEENS) || '[]'),
      inspections: JSON.parse(localStorage.getItem(STORAGE_KEYS.INSPECTIONS) || '[]'),
      harvests: JSON.parse(localStorage.getItem(STORAGE_KEYS.HARVESTS) || '[]')
    };
  },

  saveAll(data) {
    localStorage.setItem(STORAGE_KEYS.APIARIES, JSON.stringify(data.apiaries || []));
    localStorage.setItem(STORAGE_KEYS.HIVES, JSON.stringify(data.hives || []));
    localStorage.setItem(STORAGE_KEYS.QUEENS, JSON.stringify(data.queens || []));
    localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(data.inspections || []));
    localStorage.setItem(STORAGE_KEYS.HARVESTS, JSON.stringify(data.harvests || []));
  },

  clearAll() {
    this.saveAll(EMPTY_DATA);
    return this.getAll();
  },

  getQueens() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.QUEENS) || '[]');
  },

  saveQueen(queen) {
    const list = this.getQueens();
    if (queen.id) {
      const idx = list.findIndex(q => q.id === queen.id);
      if (idx !== -1) list[idx] = queen;
      else list.push(queen);
    } else {
      queen.id = 'queen-' + Date.now();
      list.push(queen);
    }
    localStorage.setItem(STORAGE_KEYS.QUEENS, JSON.stringify(list));

    if (queen.hiveId) {
      const hives = this.getHives();
      const hive = hives.find(h => h.id === queen.hiveId);
      if (hive) {
        hive.queen = {
          year: queen.year,
          color: queen.color,
          marked: queen.marked,
          origin: queen.origin,
          postureStatus: queen.postureStatus,
          ageMonths: queen.ageMonths
        };
        localStorage.setItem(STORAGE_KEYS.HIVES, JSON.stringify(hives));
      }
    }

    return queen;
  },

  deleteQueen(id) {
    let list = this.getQueens();
    list = list.filter(q => q.id !== id);
    localStorage.setItem(STORAGE_KEYS.QUEENS, JSON.stringify(list));
  },

  getQueenColorCodes() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.QUEEN_COLORS) || JSON.stringify(DEFAULT_QUEEN_COLOR_CODES));
  },

  saveQueenColorCodes(colorCodes) {
    localStorage.setItem(STORAGE_KEYS.QUEEN_COLORS, JSON.stringify(colorCodes));
  },

  resetQueenColorCodes() {
    localStorage.setItem(STORAGE_KEYS.QUEEN_COLORS, JSON.stringify(DEFAULT_QUEEN_COLOR_CODES));
    return DEFAULT_QUEEN_COLOR_CODES;
  },

  getLastBackupDate() {
    return localStorage.getItem(STORAGE_KEYS.LAST_BACKUP_DATE) || null;
  },

  getBackupsHistory() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.BACKUPS_HISTORY) || '[]');
  },

  checkAutoBackup() {
    const today = new Date().toISOString().split('T')[0];
    const lastBackup = this.getLastBackupDate();

    if (lastBackup !== today) {
      this.performAutoBackup(today);
    }
  },

  performAutoBackup(dateStr) {
    const data = this.getAll();
    const history = this.getBackupsHistory();

    const snapshot = {
      id: 'snap-' + Date.now(),
      date: dateStr || new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      summary: `${data.apiaries.length} apiários, ${data.hives.length} colmeias, ${data.queens.length} rainhas, ${data.inspections.length} inspeções`,
      data: data
    };

    history.unshift(snapshot);
    if (history.length > 30) history.pop();

    localStorage.setItem(STORAGE_KEYS.BACKUPS_HISTORY, JSON.stringify(history));
    localStorage.setItem(STORAGE_KEYS.LAST_BACKUP_DATE, snapshot.date);

    return snapshot;
  },

  getFullBackup() {
    return Object.assign({}, this.getAll(), {
      _apisapp_backup: true,
      version: '1.0.5',
      exportedAt: new Date().toISOString(),
      apicultorInfo: JSON.parse(localStorage.getItem(STORAGE_KEYS.APICULTOR_INFO) || 'null'),
      settings: JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || 'null'),
      queenColors: JSON.parse(localStorage.getItem(STORAGE_KEYS.QUEEN_COLORS) || 'null'),
      boxModels: JSON.parse(localStorage.getItem(STORAGE_KEYS.BOX_MODELS) || 'null')
    });
  },

  async shareToDriveOrEmail() {
    const data = this.getFullBackup();
    const today = new Date().toISOString().split('T')[0];
    const fileName = `ApisApp_Backup_${today}.json`;
    const jsonStr = JSON.stringify(data, null, 2);

    let file = new File([jsonStr], fileName, { type: 'application/json' });
    // Alguns iPhones não aceitam compartilhar JSON; tenta como texto mantendo a extensão .json
    if (navigator.canShare && !navigator.canShare({ files: [file] })) {
      file = new File([jsonStr], fileName, { type: 'text/plain' });
    }

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `Backup ApisApp (${today})`,
          files: [file]
        });
        return { success: true, method: 'share' };
      } catch (err) {
        if (err.name === 'AbortError') return { success: false, method: 'cancel' };
        console.error("Erro ao compartilhar:", err);
      }
    }

    this.exportJSON();
    return { success: true, method: 'download' };
  },

  getApiaries() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.APIARIES) || '[]');
  },

  saveApiary(apiary) {
    const list = this.getApiaries();
    if (apiary.id) {
      const idx = list.findIndex(a => a.id === apiary.id);
      if (idx !== -1) list[idx] = apiary;
      else list.push(apiary);
    } else {
      apiary.id = 'ap-' + Date.now();
      apiary.createdAt = new Date().toISOString().split('T')[0];
      list.push(apiary);
    }
    localStorage.setItem(STORAGE_KEYS.APIARIES, JSON.stringify(list));
    return apiary;
  },

  deleteApiary(id) {
    let list = this.getApiaries();
    list = list.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.APIARIES, JSON.stringify(list));

    let hives = this.getHives();
    hives = hives.filter(h => h.apiaryId !== id);
    localStorage.setItem(STORAGE_KEYS.HIVES, JSON.stringify(hives));
  },

  getHives() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.HIVES) || '[]');
  },

  saveHive(hive) {
    const list = this.getHives();
    if (hive.id) {
      const idx = list.findIndex(h => h.id === hive.id);
      if (idx !== -1) list[idx] = hive;
      else list.push(hive);
    } else {
      hive.id = 'hive-' + Date.now();
      list.push(hive);
    }
    localStorage.setItem(STORAGE_KEYS.HIVES, JSON.stringify(list));

    if (hive.queen) {
      const queens = this.getQueens();
      let q = queens.find(item => item.hiveId === hive.id);
      if (!q) {
        q = {
          id: 'queen-' + Date.now(),
          name: 'Rainha ' + hive.code,
          hiveId: hive.id,
          apiaryId: hive.apiaryId,
          ...hive.queen
        };
        queens.push(q);
      } else {
        Object.assign(q, hive.queen, { hiveId: hive.id, apiaryId: hive.apiaryId });
      }
      localStorage.setItem(STORAGE_KEYS.QUEENS, JSON.stringify(queens));
    }

    return hive;
  },

  deleteHive(id) {
    let list = this.getHives();
    list = list.filter(h => h.id !== id);
    localStorage.setItem(STORAGE_KEYS.HIVES, JSON.stringify(list));

    let queens = this.getQueens();
    queens = queens.filter(q => q.hiveId !== id);
    localStorage.setItem(STORAGE_KEYS.QUEENS, JSON.stringify(queens));
  },

  getInspections() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.INSPECTIONS) || '[]');
  },

  saveInspection(inspection) {
    const list = this.getInspections();
    if (inspection.id) {
      const idx = list.findIndex(i => i.id === inspection.id);
      if (idx !== -1) list[idx] = inspection;
      else list.push(inspection);
    } else {
      inspection.id = 'insp-' + Date.now();
      list.push(inspection);
    }
    localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(list));
    return inspection;
  },

  deleteInspection(id) {
    let list = this.getInspections();
    list = list.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(list));
  },

  getHarvests() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.HARVESTS) || '[]');
  },

  saveHarvest(harvest) {
    const list = this.getHarvests();
    if (harvest.id) {
      const idx = list.findIndex(h => h.id === harvest.id);
      if (idx !== -1) list[idx] = harvest;
      else list.push(harvest);
    } else {
      harvest.id = 'harv-' + Date.now();
      list.push(harvest);
    }
    localStorage.setItem(STORAGE_KEYS.HARVESTS, JSON.stringify(list));
    return harvest;
  },

  deleteHarvest(id) {
    let list = this.getHarvests();
    list = list.filter(h => h.id !== id);
    localStorage.setItem(STORAGE_KEYS.HARVESTS, JSON.stringify(list));
  },

  exportJSON() {
    const data = this.getFullBackup();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ApisApp_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  importJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.apiaries || data.hives || data.queens) {
        this.saveAll(data);
        if (data.apicultorInfo) localStorage.setItem(STORAGE_KEYS.APICULTOR_INFO, JSON.stringify(data.apicultorInfo));
        if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
        if (data.queenColors) localStorage.setItem(STORAGE_KEYS.QUEEN_COLORS, JSON.stringify(data.queenColors));
        if (data.boxModels) localStorage.setItem(STORAGE_KEYS.BOX_MODELS, JSON.stringify(data.boxModels));
        return true;
      }
      return false;
    } catch (e) {
      console.error("Erro ao importar backup:", e);
      return false;
    }
  }
};

function getQueenColorForYear(year) {
  const codes = ApisStorage.getQueenColorCodes();
  const y = parseInt(year, 10);
  if (isNaN(y)) return codes[0];
  const lastDigit = Math.abs(y) % 10;
  if (lastDigit === 1 || lastDigit === 6) return codes[0];
  if (lastDigit === 2 || lastDigit === 7) return codes[1];
  if (lastDigit === 3 || lastDigit === 8) return codes[2];
  if (lastDigit === 4 || lastDigit === 9) return codes[3];
  if (lastDigit === 5 || lastDigit === 0) return codes[4];
  return codes[0];
}

// ==========================================================================
// 2. LÓGICA DE INTERFACE E NAVEGAÇÃO DA APLICAÇÃO
// ==========================================================================

let currentTab = 'dashboard';
let selectedApiaryFilter = 'all';
let selectedStatusFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  ApisStorage.init();
  
  // Verifica se é o primeiro acesso do cliente
  const infoApicultor = ApisStorage.getApicultorInfo();
  
  if (!infoApicultor) {
    // Aparelho novo: oferece restaurar o backup salvo no Drive antes do cadastro
    oferecerRestauracaoNovoAparelho();
  } else {
    // Se já cadastrado anteriormente, inicia o sistema normalmente
    IniciarAplicativoNormal();
  }
});

function IniciarAplicativoNormal() {
  ApisDrive.startAuto();
  setupNavigation();
  setupEventListeners();
  setupNetworkListeners();
  checkAutoBackupBanner();
  renderApp();
}

function exibirTelaPrimeiroAcesso() {
  document.body.innerHTML = `
    <div style="background:#0f172a; color:#fff; min-height:100vh; display:flex; align-items:center; justify-content:center; font-family:sans-serif; padding:1.5rem; box-sizing:border-box;">
      <div style="background:rgba(30,41,59,0.7); border:1px solid #334155; padding:2.5rem; border-radius:16px; max-width:500px; w_idth:100%; box-shadow:0 10px 25px rgba(0,0,0,0.5); backdrop-filter:blur(10px);">
        <div style="text-align:center; margin-bottom:2rem;">
          <span style="font-size:3.5rem;">🐝</span>
          <h1 style="font-size:1.8rem; color:#facc15; margin-top:0.5rem;">Bem-vindo ao ApisApp Pro</h1>
          <p style="color:#94a3b8; font-size:0.9rem; margin-top:0.25rem;">Configure seu perfil inicial de apicultura para liberar o uso do sistema.</p>
        </div>
        
        <form id="form-primeiro-acesso" style="display:flex; flex-direction:column; gap:1.25rem;">
          <div style="display:flex; flex-direction:column; gap:0.4rem;">
            <label style="font-size:0.85rem; font-weight:600; color:#e2e8f0;">Nome do Apicultor / Produtor:</label>
            <input type="text" id="init-nome-apicultor" style="background:#1e293b; border:1px solid #475569; padding:0.75rem; border-radius:8px; color:#fff; font-size:1rem;" placeholder="Ex: Francisco José" required>
          </div>
          
          <div style="display:flex; flex-direction:column; gap:0.4rem;">
            <label style="font-size:0.85rem; font-weight:600; color:#e2e8f0;">Nome do Apiário Geral:</label>
            <input type="text" id="init-nome-apiario" style="background:#1e293b; border:1px solid #475569; padding:0.75rem; border-radius:8px; color:#fff; font-size:1rem;" placeholder="Ex: Apiário Sol Nascente" required>
          </div>
          
          <button type="submit" style="background:#facc15; color:#0f172a; border:none; padding:0.85rem; border-radius:8px; font-weight:700; font-size:1rem; cursor:pointer; margin-top:1rem; transition:background 0.2s;">
            Salvar e Entrar no Sistema
          </button>
        </form>
      </div>
    </div>
  `;

  // Processa o envio do formulário de entrada
  document.getElementById('form-primeiro-acesso').addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = document.getElementById('init-nome-apicultor').value.trim();
    const apiario = document.getElementById('init-nome-apiario').value.trim();
    
    if (nome && apiario) {
      ApisStorage.saveApicultorInfo(nome, apiario);
      alert('Configuração inicial salva com sucesso! Bem-vindo.');
      
      // Força a recarga limpa do aplicativo já liberado
      window.location.reload();
    }
  });
}

function setupNavigation() {
  const navButtons = document.querySelectorAll('.nav-item button');
  navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetTab = btn.getAttribute('data-tab');
      if (targetTab) {
        currentTab = targetTab;
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderApp();
      }
    });
  });
}

function setupEventListeners() {
  const modalBackdrop = document.getElementById('modal-backdrop');
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        closeModal();
      }
    });
  }

  document.getElementById('btn-cloud-drive')?.addEventListener('click', () => {
    openBackupModal();
  });

  document.getElementById('btn-export-json')?.addEventListener('click', () => {
    ApisStorage.exportJSON();
  });

  document.getElementById('btn-reset-empty')?.addEventListener('click', () => {
    if (confirm('Deseja limpar todos os cadastros e iniciar o sistema do zero?')) {
      ApisStorage.clearAll();
      renderApp();
    }
  });

  const importInput = document.getElementById('file-import-json');
  if (importInput) {
    importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const success = ApisStorage.importJSON(event.target.result);
          if (success) {
            alert('Dados importados com sucesso!');
            renderApp();
          } else {
            alert('Erro ao importar arquivo JSON. Verifique o formato.');
          }
        };
        reader.readAsText(file);
      }
    });
  }

  document.getElementById('btn-banner-share')?.addEventListener('click', async () => {
    await ApisStorage.shareToDriveOrEmail();
  });

  document.getElementById('btn-close-banner')?.addEventListener('click', () => {
    const banner = document.getElementById('backup-status-banner');
    if (banner) banner.style.display = 'none';
  });
}

function setupNetworkListeners() {
  window.addEventListener('online', () => {
    ApisDrive.autoSync();
    ApisStorage.checkAutoBackup();
    checkAutoBackupBanner();
  });
}

function checkAutoBackupBanner() {
  const lastBackup = ApisStorage.getLastBackupDate();
  const today = new Date().toISOString().split('T')[0];

  const banner = document.getElementById('backup-status-banner');
  if (!banner) return;

  if (lastBackup === today && navigator.onLine) {
    banner.style.display = 'block';
  } else {
    banner.style.display = 'none';
  }
}

function renderApp() {
  const mainContent = document.getElementById('main-view');
  if (!mainContent) return;

  const data = ApisStorage.getAll();

  switch (currentTab) {
    case 'dashboard':
      mainContent.innerHTML = renderDashboardView(data);
      bindDashboardEvents(data);
      break;

    case 'apiaries':
      mainContent.innerHTML = renderApiariesView(data);
      bindApiariesEvents(data);
      break;

    case 'queens':
      mainContent.innerHTML = renderQueensView(data);
      bindQueensEvents(data);
      break;

    case 'inspections':
      mainContent.innerHTML = renderInspectionsView(data);
      bindInspectionsEvents(data);
      break;

    case 'harvest':
      mainContent.innerHTML = renderHarvestView(data);
      bindHarvestEvents(data);
      break;

    case 'calendar':
      mainContent.innerHTML = renderCalendarView();
      break;

    case 'analytics':
      mainContent.innerHTML = renderAnalyticsView(data);
      break;

    case 'guide':
      mainContent.innerHTML = renderGuideView();
      break;

    default:
      mainContent.innerHTML = renderDashboardView(data);
      break;
  }
}

/* ==========================================================================
   QUEENS & COLORS VIEW (Gestão & Edição de Rainhas e Cores)
   ========================================================================== */
function renderQueensView(data) {
  const colorCodes = ApisStorage.getQueenColorCodes();
  const queensList = data.queens || [];

  return `
    <div class="glass-panel">
      <div class="section-header">
        <div>
          <h2 class="section-title">👑 Gestão & Edição de Rainhas</h2>
          <p style="color:var(--slate-400); font-size:0.9rem;">Cadastre novas rainhas, edite o ano/cor de marcação e altere a postura a qualquer momento.</p>
        </div>
        <div style="display:flex; gap:0.75rem;">
          <button class="btn btn-secondary" id="btn-customize-colors">
            ⚙️ Personalizar Tabela de Cores
          </button>
          <button class="btn btn-primary" id="btn-add-queen">
            + Cadastrar Nova Rainha
          </button>
        </div>
      </div>

      <div style="background:rgba(15,23,42,0.6); padding:1.25rem; border-radius:var(--radius-lg); border:1px solid var(--slate-700); margin-bottom:1.5rem;">
        <h3 style="font-size:1rem; color:var(--honey-400); margin-bottom:0.75rem;">🎨 Tabela de Marcação por Ano de Nascimento</h3>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:0.75rem;">
          ${colorCodes.map(qc => `
            <div style="background:${qc.color}; color:${qc.textColor}; padding:0.6rem 0.8rem; border-radius:10px; font-weight:700; font-size:0.8rem; text-align:center; box-shadow:0 4px 10px rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.2);">
              ${qc.label}
            </div>
          `).join('')}
        </div>
      </div>

      <div class="table-responsive">
        ${queensList.length === 0 && data.hives.length === 0 ? `
          <div style="text-align:center; padding:3rem; color:var(--slate-400);">
            <div style="font-size:2.5rem; margin-bottom:0.5rem;">👑</div>
            <strong style="color:#fff;">Nenhuma rainha cadastrada ainda.</strong>
            <p style="font-size:0.85rem; margin-top:0.25rem;">Clique no botão acima <strong>"+ Cadastrar Nova Rainha"</strong> para incluir sua primeira rainha com ano e cor!</p>
          </div>
        ` : `
          <table class="data-table">
            <thead>
              <tr>
                <th>Rainha / Identificação</th>
                <th>Colmeia / Apiário</th>
                <th>Ano & Cor da Marcação</th>
                <th>Status da Marcação</th>
                <th>Linhagem / Origem</th>
                <th>Qualidade da Postura</th>
                <th>Idade (Meses)</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${queensList.map(queen => {
                const hive = data.hives.find(h => h.id === queen.hiveId);
                const apiary = data.apiaries.find(a => a.id === (queen.apiaryId || (hive ? hive.apiaryId : null)));
                const qColor = getQueenColorForYear(queen.year || 2026);
                const activeColor = queen.color || qColor.color;
                const activeText = qColor.textColor;

                return `
                  <tr>
                    <td>
                      <strong>${queen.name || 'Rainha Matriz'}</strong>
                    </td>
                    <td>
                      ${hive ? `<strong>${hive.code}</strong> (${hive.name})` : '<span style="color:var(--honey-400);">Estoque / Banco de Rainhas</span>'}<br>
                      <small style="color:var(--slate-400);">${apiary ? apiary.name : ''}</small>
                    </td>
                    <td>
                      <span class="queen-badge" style="background:${activeColor}; color:${activeText}; padding:0.35rem 0.75rem; border-radius:16px;">
                        👑 Ano ${queen.year || 2026}
                      </span>
                    </td>
                    <td>
                      ${queen.marked !== false 
                        ? '<span style="color:var(--emerald-500); font-weight:700;">✅ Marcada no Tórax</span>' 
                        : '<span style="color:var(--rose-500); font-weight:700;">❌ Sem Marcação</span>'}
                    </td>
                    <td><strong>${queen.origin || 'Matriz Selecionada'}</strong></td>
                    <td>
                      <span class="tag-badge" style="background:rgba(245,158,11,0.15); color:var(--honey-400);">
                        ${queen.postureStatus || 'Boa postura'}
                      </span>
                    </td>
                    <td>${queen.ageMonths || 6} meses</td>
                    <td>
                      <div style="display:flex; gap:0.4rem;">
                        <button class="btn btn-primary btn-edit-queen-item" data-id="${queen.id}" style="padding:0.35rem 0.65rem; font-size:0.75rem;">
                          ✏️ Editar
                        </button>
                        <button class="btn btn-danger btn-delete-queen-item" data-id="${queen.id}" style="padding:0.35rem 0.55rem; font-size:0.75rem;">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `}
      </div>
    </div>
  `;
}

function bindQueensEvents(data) {
  document.getElementById('btn-customize-colors')?.addEventListener('click', () => {
    openCustomizeColorsModal();
  });

  document.getElementById('btn-add-queen')?.addEventListener('click', () => {
    openEditQueenModal(null, data);
  });

  document.querySelectorAll('.btn-edit-queen-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const queenId = btn.getAttribute('data-id');
      const queen = data.queens.find(q => q.id === queenId);
      if (queen) openEditQueenModal(queen, data);
    });
  });

  document.querySelectorAll('.btn-delete-queen-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const queenId = btn.getAttribute('data-id');
      if (confirm('Tem certeza que deseja excluir o cadastro desta rainha?')) {
        ApisStorage.deleteQueen(queenId);
        renderApp();
      }
    });
  });
}

function openEditQueenModal(existingQueen = null, data = ApisStorage.getAll()) {
  const isEdit = !!existingQueen;
  const q = existingQueen || {};
  const hives = data.hives || [];
  const defaultYear = q.year || 2026;
  const defaultColorObj = getQueenColorForYear(defaultYear);
  const defaultColorHex = q.color || defaultColorObj.color;

  const html = `
    <form id="form-edit-queen" class="form-grid">
      <div class="form-group">
        <label>Nome / Código da Rainha:</label>
        <input type="text" id="eq-name" class="form-control" value="${q.name || 'Rainha Matriz ' + (data.queens.length + 1)}" required>
      </div>

      <div class="form-group">
        <label>Colmeia Associada:</label>
        <select id="eq-hiveId" class="form-control">
          <option value="">Banco de Rainhas (Sem Colmeia)</option>
          ${hives.map(h => `
            <option value="${h.id}" ${q.hiveId === h.id ? 'selected' : ''}>
              ${h.code} - ${h.name}
            </option>
          `).join('')}
        </select>
      </div>

      <div class="form-group">
        <label>Ano de Nascimento (Qualquer Ano):</label>
        <input type="number" id="eq-year" class="form-control" value="${defaultYear}" min="2010" max="2040" required>
      </div>

      <div class="form-group">
        <label>Cor da Marcação:</label>
        <div style="display:flex; gap:0.5rem; align-items:center;">
          <input type="color" id="eq-color-picker" value="${defaultColorHex}" style="width:45px; height:38px; border:none; border-radius:6px; cursor:pointer;">
          <input type="text" id="eq-color-hex" class="form-control" value="${defaultColorHex}" placeholder="#FFFFFF" style="flex:1;">
        </div>
      </div>

      <div class="form-group">
        <label>Status da Marcação:</label>
        <select id="eq-marked" class="form-control">
          <option value="true" ${q.marked !== false ? 'selected' : ''}>Marcada no Tórax</option>
          <option value="false" ${q.marked === false ? 'selected' : ''}>Não Marcada</option>
        </select>
      </div>

      <div class="form-group">
        <label>Origem / Linhagem:</label>
        <input type="text" id="eq-origin" class="form-control" value="${q.origin || 'Matriz Selecionada Cárnica x Africanizada'}" placeholder="Ex: Matriz Selecionada">
      </div>

      <div class="form-group">
        <label>Qualidade da Postura:</label>
        <select id="eq-posture" class="form-control">
          <option value="Excelente (Cria uniforme de canto a canto)" ${q.postureStatus && q.postureStatus.includes('Excelente') ? 'selected' : ''}>Excelente (Cria uniforme de canto a canto)</option>
          <option value="Boa postura" ${q.postureStatus && q.postureStatus.includes('Boa') ? 'selected' : ''}>Boa postura</option>
          <option value="Regular" ${q.postureStatus && q.postureStatus.includes('Regular') ? 'selected' : ''}>Regular</option>
          <option value="Falhada / Postura Irregular" ${q.postureStatus && q.postureStatus.includes('Falhada') ? 'selected' : ''}>Falhada / Postura Irregular</option>
          <option value="Ausente / Sem Rainha" ${q.postureStatus && q.postureStatus.includes('Ausente') ? 'selected' : ''}>Ausente / Sem Rainha</option>
        </select>
      </div>

      <div class="form-group">
        <label>Idade Estimada (Meses):</label>
        <input type="number" id="eq-age" class="form-control" min="1" max="60" value="${q.ageMonths || 6}">
      </div>

      <div style="grid-column: 1 / -1; display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1rem;">
        <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-backdrop').classList.remove('active')">Cancelar</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Salvar Alterações' : 'Cadastrar Rainha'}</button>
      </div>
    </form>
  `;

  openModal(isEdit ? `👑 Editar Rainha: ${q.name || ''}` : '👑 Cadastrar Nova Rainha', html);

  const yearInput = document.getElementById('eq-year');
  const colorPicker = document.getElementById('eq-color-picker');
  const colorHex = document.getElementById('eq-color-hex');

  if (yearInput && colorPicker && colorHex) {
    yearInput.addEventListener('input', (e) => {
      const y = parseInt(e.target.value, 10);
      if (!isNaN(y)) {
        const autoColor = getQueenColorForYear(y);
        colorPicker.value = autoColor.color;
        colorHex.value = autoColor.color;
      }
    });

    colorPicker.addEventListener('input', (e) => colorHex.value = e.target.value.toUpperCase());
    colorHex.addEventListener('input', (e) => colorPicker.value = e.target.value);
  }

  document.getElementById('form-edit-queen').addEventListener('submit', (e) => {
    e.preventDefault();
    const year = parseInt(document.getElementById('eq-year').value, 10);
    const color = document.getElementById('eq-color-hex').value;

    const queenData = {
      id: isEdit ? existingQueen.id : undefined,
      name: document.getElementById('eq-name').value,
      hiveId: document.getElementById('eq-hiveId').value || null,
      year: year,
      color: color,
      marked: document.getElementById('eq-marked').value === 'true',
      origin: document.getElementById('eq-origin').value,
      postureStatus: document.getElementById('eq-posture').value,
      ageMonths: parseInt(document.getElementById('eq-age').value, 10) || 6
    };

    ApisStorage.saveQueen(queenData);
    closeModal();
    renderApp();
  });
}

function openCustomizeColorsModal() {
  const currentCodes = ApisStorage.getQueenColorCodes();

  const html = `
    <form id="form-customize-colors">
      <p style="font-size:0.85rem; color:var(--slate-400); margin-bottom:1rem;">
        Personalize as cores de marcação de rainha para cada dígito final do ano de nascimento:
      </p>

      <div style="display:flex; flex-direction:column; gap:0.75rem; margin-bottom:1.5rem;">
        ${currentCodes.map((c, idx) => `
          <div style="display:flex; align-items:center; gap:0.75rem; background:rgba(15,23,42,0.7); padding:0.6rem; border-radius:8px; border:1px solid var(--slate-700);">
            <strong style="width:140px; font-size:0.85rem;">${c.label}</strong>
            <input type="color" class="color-picker-item" data-idx="${idx}" value="${c.color}" style="width:40px; height:35px; border:none; border-radius:6px; cursor:pointer;">
            <input type="text" class="color-hex-item form-control" data-idx="${idx}" value="${c.color}" style="width:100px; padding:0.4rem;">
          </div>
        `).join('')}
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center;">
        <button type="button" class="btn btn-secondary" id="btn-reset-colors">Restaurar Padrão Internacional</button>
        <div style="display:flex; gap:0.5rem;">
          <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-backdrop').classList.remove('active')">Cancelar</button>
          <button type="submit" class="btn btn-primary">Salvar Cores</button>
        </div>
      </div>
    </form>
  `;

  openModal('🎨 Personalizar Tabela de Cores de Rainhas', html);

  document.querySelectorAll('.color-picker-item').forEach(picker => {
    picker.addEventListener('input', (e) => {
      const idx = picker.getAttribute('data-idx');
      const hexInput = document.querySelector(`.color-hex-item[data-idx="${idx}"]`);
      if (hexInput) hexInput.value = e.target.value.toUpperCase();
    });
  });

  document.querySelectorAll('.color-hex-item').forEach(hex => {
    hex.addEventListener('input', (e) => {
      const idx = hex.getAttribute('data-idx');
      const pickerInput = document.querySelector(`.color-picker-item[data-idx="${idx}"]`);
      if (pickerInput) pickerInput.value = e.target.value;
    });
  });

  document.getElementById('btn-reset-colors')?.addEventListener('click', () => {
    ApisStorage.resetQueenColorCodes();
    closeModal();
    renderApp();
  });

  document.getElementById('form-customize-colors').addEventListener('submit', (e) => {
    e.preventDefault();
    const updatedCodes = currentCodes.map((c, idx) => {
      const hexVal = document.querySelector(`.color-hex-item[data-idx="${idx}"]`).value;
      return { ...c, color: hexVal };
    });
    ApisStorage.saveQueenColorCodes(updatedCodes);
    closeModal();
    renderApp();
  });
}

function renderDashboardView(data) {
  const totalHives = data.hives.length;
  const activeHives = data.hives.filter(h => h.status === 'Ativa').length;
  const attentionHives = data.hives.filter(h => h.status === 'Atenção').length;
  
  const totalHoneyKg = data.harvests
    .filter(h => h.product === 'Mel')
    .reduce((acc, curr) => acc + (parseFloat(curr.quantityKg) || 0), 0);

  const avgHealth = totalHives > 0 
    ? Math.round(data.hives.reduce((acc, curr) => acc + (parseInt(curr.healthScore) || 0), 0) / totalHives)
    : 0;

  const tempSimulated = 26;
  const windSimulated = 11;
  const flightCondition = (tempSimulated >= 20 && windSimulated < 20) 
    ? { label: 'Ótima para Voo & Revisão', color: 'var(--emerald-500)', icon: '☀️' }
    : { label: 'Cuidado (Vento/Frio)', color: 'var(--rose-500)', icon: '🌧️' };

  // --- CONSTRUÇÃO DO CONSOLIDADO POR NÚCLEO COM OPÇÃO DE DETALHAMENTO ---
  let nucleiConsolidatedHtml = '';
  
  if (data.apiaries.length === 0) {
    nucleiConsolidatedHtml = `
      <div style="text-align:center; padding:2rem; color:var(--slate-400);">
        Nenhum núcleo ou colmeia cadastrado ainda para consolidação.
      </div>
    `;
  } else {
    for (let i = 0; i < data.apiaries.length; i++) {
      const ap = data.apiaries[i];
      const hivesInAp = data.hives.filter(h => h.apiaryId === ap.id);
      
      // Totais somados do Núcleo
      const boxCount = hivesInAp.length;
      const supersSum = hivesInAp.reduce((acc, h) => acc + (parseInt(h.supersCount) || 0), 0);
      const collectorsSum = hivesInAp.reduce((acc, h) => acc + (parseInt(h.propolisCollectors) || 0), 0);

      // Validação das coordenadas (verifica se existem números válidos separados por vírgula)
      const locStr = (ap.location || '').trim();
      const hasCoordinates = locStr && /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/.test(locStr);

      // Botão do mapa: Só gera o HTML se possuir as coordenadas corretas no cadastro
      const mapButtonHtml = hasCoordinates 
        ? `<div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
             <button type="button" class="btn btn-secondary btn-view-dashboard-map" data-coords="${locStr}" data-name="${ap.name}" style="padding:0.4rem 0.6rem; font-size:0.8rem; background:rgba(59,130,246,0.15); color:#60a5fa; border:1px solid rgba(59,130,246,0.3);">🗺️ Ver no Mapa</button>
             <button type="button" class="btn btn-primary btn-route-dashboard-map" data-coords="${locStr}" data-name="${ap.name}" style="padding:0.4rem 0.6rem; font-size:0.8rem; background:rgba(16,185,129,0.15); color:#34d399; border:1px solid rgba(16,185,129,0.3);">🚗 Ver rotas</button>
           </div>`
        : '';

      // Linhas de detalhamento individual de cada caixa (escondidas por padrão)
      let detailedRowsHtml = '';
      if (boxCount === 0) {
        detailedRowsHtml = `
          <tr>
            <td colspan="5" style="text-align:center; color:var(--slate-400); font-size:0.8rem; background:rgba(0,0,0,0.15);">
              Nenhuma colmeia alocada neste núcleo.
            </td>
          </tr>
        `;
      } else {
        for (let j = 0; j < hivesInAp.length; j++) {
          const h = hivesInAp[j];
          const qColor = getQueenColorForYear(h.queen?.year || new Date().getFullYear());
          detailedRowsHtml += `
            <tr style="background:rgba(15,23,42,0.3); font-size:0.85rem;">
              <td style="padding-left:1.5rem;">🔹 <strong>${h.code}</strong> (${h.name})</td>
              <td>
                <span class="queen-badge" style="background:${h.queen?.color || qColor.color}; color:${qColor.textColor}; font-size:0.75rem; padding:0.15rem 0.4rem;">
                  👑 ${h.queen?.year || 'N/A'}
                </span>
              </td>
              <td>${h.framesBrood} N / ${h.framesHoney} M (${h.supersCount} Melg.)</td>
              <td>${h.propolisProducer ? `🌿 Sim (${h.propolisCollectors})` : '❌ Não'}</td>
              <td>
                <span class="status-badge ${h.status === 'Ativa' ? 'status-ativa' : 'status-atencao'}" style="font-size:0.7rem; padding:0.15rem 0.4rem;">
                  ${h.status}
                </span>
              </td>
            </tr>
          `;
        }
      }

      nucleiConsolidatedHtml += `
        <div style="background:rgba(30,41,59,0.3); border:1px solid var(--slate-700); border-radius:12px; padding:1.25rem; margin-bottom:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
            <div>
              <h4 style="color:var(--honey-400); font-size:1.1rem; margin:0;">📍 ${ap.name}</h4>
              <div style="margin-top:0.4rem; display:flex; gap:0.4rem;">
                ${mapButtonHtml}
              </div>
            </div>
            
            <!-- Indicadores Consolidados do Núcleo -->
            <div style="display:flex; gap:1.25rem; background:rgba(15,23,42,0.5); padding:0.5rem 1rem; border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
              <div style="text-align:center;">
                <div style="font-size:0.7rem; color:var(--slate-400); text-transform:uppercase;">Caixas</div>
                <strong style="color:#fff; font-size:1.1rem;">${boxCount}</strong>
              </div>
              <div style="text-align:center; border-left:1px solid var(--slate-700); padding-left:1.25rem;">
                <div style="font-size:0.7rem; color:var(--slate-400); text-transform:uppercase;">Melgueiras</div>
                <strong style="color:var(--honey-400); font-size:1.1rem;">${supersSum}</strong>
              </div>
              <div style="text-align:center; border-left:1px solid var(--slate-700); padding-left:1.25rem;">
                <div style="font-size:0.7rem; color:var(--slate-400); text-transform:uppercase;">Coletores Própolis</div>
                <strong style="color:var(--emerald-400); font-size:1.1rem;">${collectorsSum}</strong>
              </div>
            </div>

            <button class="btn btn-secondary btn-toggle-details" data-target="details-${ap.id}" style="padding:0.4rem 0.8rem; font-size:0.8rem;">
              👁️ Mostrar Detalhes
            </button>
          </div>

          <!-- Tabela Expandível Oculta com Detalhamento por Caixa -->
          <div id="details-${ap.id}" class="table-responsive" style="display:none; margin-top:1.25rem; border-top:1px dashed var(--slate-600); padding-top:0.75rem;">
            <table class="data-table" style="margin:0;">
              <thead>
                <tr style="background:transparent; font-size:0.75rem;">
                  <th style="padding-left:1.5rem;">Colmeia Individual</th>
                  <th>Rainha</th>
                  <th>Quadros / Melgueiras</th>
                  <th>Própolis (Coletores)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${detailedRowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
  }

   return `
    <div class="hero-card">
      <div class="hero-text">
        <h2>Gestão Inteligente de <span>Apicultura</span></h2>
        <p>Acompanhamento preciso de colmeias de abelhas <em>Apis mellifera</em>, sanidade, postura de rainhas e colheitas de mel e própolis com controle de lotes.</p>
        <div class="hero-tags">
          <span class="tag-badge">🐝 Abelhas Apis</span>
          <span class="tag-badge">👑 Gestão & Cores de Rainhas</span>
          <span class="tag-badge">☁️ Backup Diário no Drive</span>
          <span class="tag-badge">📊 Saúde do Apiário: ${avgHealth}%</span>
        </div>
      </div>
      <div class="hero-img-box" style="background: rgba(15,23,42,0.8); display:flex; align-items:center; justify-content:center; text-align:center; padding:1rem; border-radius:18px;">
        <img src="./assets/icon.png" alt="Logo ApisApp" style="max-height:160px; max-width:160px; border-radius:24px; box-shadow:0 8px 20px rgba(245,158,11,0.3); border:3px solid var(--honey-400);">
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">Total de Colmeias</span>
          <div class="stat-icon">📦</div>
        </div>
        <div class="stat-value">${totalHives}</div>
        <div class="stat-sub">${activeHives} Ativas | <span style="color:var(--rose-500);">${attentionHives} sob Atenção</span></div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">Produção de Mel</span>
          <div class="stat-icon">🍯</div>
        </div>
        <div class="stat-value">${totalHoneyKg.toFixed(1)} <span style="font-size:1rem;">kg</span></div>
        <div class="stat-sub">Média de ${(totalHives > 0 ? (totalHoneyKg / totalHives) : 0).toFixed(1)} kg / colmeia</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">Índice de Sanidade</span>
          <div class="stat-icon">🩺</div>
        </div>
        <div class="stat-value">${avgHealth}%</div>
        <div class="health-bar-container">
          <div class="health-bar-fill" style="width: ${avgHealth}%; background: ${avgHealth > 80 ? 'var(--emerald-500)' : 'var(--honey-500)'};"></div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">Condições de Voo</span>
          <div class="stat-icon">${flightCondition.icon}</div>
        </div>
        <div class="stat-value" style="font-size:1.3rem; color:${flightCondition.color}; margin-top:0.4rem;">
          ${flightCondition.label}
        </div>
        <div class="stat-sub">${tempSimulated}°C | Vento: ${windSimulated} km/h | Sol</div>
      </div>
    </div>

    <div style="display:grid; grid-template-columns: 2fr 1fr; gap:1.5rem; align-items:start;">
      <div class="glass-panel">
        <div class="section-header" style="margin-bottom:1.25rem;">
          <div>
            <h3 class="section-title">📊 Consolidado Estatístico por Núcleo</h3>
            <p style="color:var(--slate-400); font-size:0.85rem; margin:0;">Acompanhe o balanço de materiais de produção agrupado.</p>
          </div>
          <div style="display:flex; gap:0.5rem;">
            <button class="btn btn-secondary" id="btn-quick-apiary">+ Novo Núcleo</button>
            <button class="btn btn-primary" id="btn-quick-hive">+ Nova Colmeia</button>
          </div>
        </div>
        
        <!-- Container dos Núcleos Consolidados Expandíveis -->
        <div id="dashboard-nuclei-container">
          ${nucleiConsolidatedHtml}
        </div>
      </div>

      <div class="glass-panel">
        <h3 class="section-title" style="margin-bottom:1rem;">🔔 Painel de Controle</h3>
        <div style="display:flex; flex-direction:column; gap:1rem;">
          <div style="background:rgba(245,158,11,0.1); border-left:4px solid var(--honey-400); padding:0.85rem; border-radius:8px;">
            <strong style="color:var(--honey-400); font-size:0.85rem;">👑 CADASTRO LIBERADO DE RAINHAS</strong>
            <p style="font-size:0.8rem; color:var(--slate-200); margin-top:0.25rem;">
              Agora você pode cadastrar novas rainhas diretamente na aba <strong>Rainhas & Cores</strong> com qualquer ano e cor livre!
            </p>
          </div>

          <div style="background:rgba(16,185,129,0.1); border-left:4px solid var(--emerald-500); padding:0.85rem; border-radius:8px;">
            <strong style="color:var(--emerald-500); font-size:0.85rem;">☁️ BACKUP AUTOMÁTICO NO DRIVE</strong>
            <p style="font-size:0.8rem; color:var(--slate-200); margin-top:0.25rem;">
              O sistema salva automaticamente seus dados todos os dias. Ao fique online, envie para seu Google Drive com 1 toque.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}


function bindDashboardEvents(data) {
  document.getElementById('btn-quick-apiary')?.addEventListener('click', () => {
    openApiaryModal();
  });

  document.getElementById('btn-quick-hive')?.addEventListener('click', () => {
    if (data.apiaries.length === 0) {
      alert('Por favor, cadastre primeiro pelo menos um Núcleo antes de adicionar uma colmeia!');
      openApiaryModal();
    } else {
      openHiveModal(data);
    }
  });

  // Listener dinâmico para abrir e fechar o detalhamento por núcleo
  document.querySelectorAll('.btn-toggle-details').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const targetDiv = document.getElementById(targetId);
      
      if (targetDiv) {
        if (targetDiv.style.display === 'none') {
          targetDiv.style.display = 'block';
          btn.innerText = '👁️ Ocultar Detalhes';
          btn.style.background = 'rgba(255,255,255,0.15)';
        } else {
          targetDiv.style.display = 'none';
          btn.innerText = '👁️ Mostrar Detalhes';
          btn.style.background = '';
        }
      }
    });
  });

  // ---- CONSERTO DO CLIQUE EM "VER NO MAPA" ----
  document.querySelectorAll('.btn-view-dashboard-map').forEach(btn => {
    btn.addEventListener('click', () => {
      const coords = btn.getAttribute('data-coords');
      const name = btn.getAttribute('data-name');
      
      const mapModalContent = `
        <div style="background: rgba(15,23,42,0.8); padding: 1rem; border-radius: 12px; border: 1px solid var(--slate-700);">
          <p style="color: var(--slate-300); font-size: 0.9rem; margin-bottom: 1rem;">
            Exibindo localização geográfica registrada para: <strong style="color: var(--honey-400);">${name}</strong> 
          </p>
          <!-- É aqui dentro que o mapa vai aparecer -->
          <div id="apiary-map-container" style="width: 100%; height: auto; border-radius: 8px; overflow: hidden; border: 1px solid var(--slate-600); background: #0f172a;">
            <div style="padding: 2rem; text-align: center; color: var(--slate-400); font-size: 0.9rem;">
              Sintonizando satélites...
            </div>
          </div>
        </div>
      `;
      
      // 1. Abre a estrutura da janela modal na tela primeiro
      openModal(`🗺️ Mapa do Núcleo: ${name}`, mapModalContent);
      
      // 2. Aguarda a janela existir fisicamente na tela para injetar o mapa com segurança
      setTimeout(() => {
        renderDynamicMapForCoords(coords, name);
      }, 100);
    });
  });

  // Botão "Ver rotas": abre diretamente o Google Maps com o destino do núcleo.
  document.querySelectorAll('.btn-route-dashboard-map').forEach(btn => {
    btn.addEventListener('click', () => {
      const coords = String(btn.getAttribute('data-coords') || '').split(',').map(v => v.trim());
      const lat = parseFloat(coords[0]);
      const lng = parseFloat(coords[1]);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        alert('As coordenadas deste núcleo são inválidas.');
        return;
      }

      const routeUrl =
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(lat + ',' + lng)}&travelmode=driving`;

      window.location.href = routeUrl;
    });
  });
}

function renderDynamicMapForCoords(coordsStr, locationName) {
  const container = document.getElementById('apiary-map-container');
  if (!container) return;

  // Aceita coordenadas no formato: latitude, longitude
  const parts = String(coordsStr || '').split(',').map(c => c.trim());
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) ||
      lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    container.innerHTML = `
      <div style="height:100%; min-height:260px; display:flex; align-items:center; justify-content:center; padding:1.5rem; box-sizing:border-box; text-align:center; color:#fca5a5;">
        <div>
          <div style="font-size:2.5rem; margin-bottom:.5rem;">📍</div>
          <strong>Coordenadas inválidas</strong>
          <div style="font-size:.8rem; margin-top:.4rem; color:var(--slate-400);">
            Verifique o cadastro da latitude e longitude do núcleo.
          </div>
        </div>
      </div>`;
    return;
  }

  const coordinateText = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  // Google Maps: visualização direta da localização.
  const googleMapsUrl =
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lat + ',' + lng)}`;

  // Google Maps: abre a tela de navegação/rotas até o apiário.
  // No celular, o sistema pode oferecer/abrir o aplicativo Google Maps.
  const googleDirectionsUrl =
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(lat + ',' + lng)}&travelmode=driving`;

  // OpenStreetMap para exibição do mapa dentro do aplicativo.
  const delta = 0.005;
  const west = lng - delta;
  const south = lat - delta;
  const east = lng + delta;
  const north = lat + delta;

  const embedUrl =
    `https://www.openstreetmap.org/export/embed.html?bbox=` +
    `${encodeURIComponent(west)},${encodeURIComponent(south)},` +
    `${encodeURIComponent(east)},${encodeURIComponent(north)}` +
    `&layer=mapnik&marker=${encodeURIComponent(lat)},${encodeURIComponent(lng)}`;

  const mapVisualHtml = navigator.onLine
    ? `
      <div style="position:relative; width:100%; height:300px; overflow:hidden; background:#0f172a;">
        <iframe
          title="Mapa de ${String(locationName || 'Núcleo').replace(/"/g, '&quot;')}"
          src="${embedUrl}"
          style="display:block; width:100%; height:330px; border:0; background:#0f172a;"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade">
        </iframe>
      </div>
    `
    : `
      <div style="width:100%; height:300px; background:#0f172a; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:1.5rem; box-sizing:border-box; text-align:center;">
        <div style="font-size:2.5rem; margin-bottom:.5rem;">📶❌</div>
        <div style="color:#fff; font-weight:600; font-size:.95rem;">Mapa indisponível sem internet</div>
        <div style="color:var(--slate-400); font-size:.8rem; margin-top:.35rem; max-width:340px;">
          As coordenadas estão cadastradas, mas o mapa precisa de internet para ser carregado.
        </div>
      </div>
    `;

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; width:100%; background:#1e293b;">
      ${mapVisualHtml}

      <div style="padding:1rem; box-sizing:border-box; text-align:center; background:rgba(30,41,59,.96); border-top:1px solid var(--slate-700);">
        <div style="margin-bottom:.75rem; line-height:1.6;">
          <div style="color:#fff; font-size:1rem; font-weight:700; word-break:break-word;">📍 ${locationName || 'Núcleo'}</div>
          <div style="color:var(--slate-400); font-size:.8rem;">
            Coordenadas: <code style="background:rgba(0,0,0,.3); padding:.15rem .4rem; border-radius:4px; color:#fff; white-space:nowrap;">${coordinateText}</code>
          </div>
          <div style="color:var(--slate-500, #64748b); font-size:.65rem; margin-top:.25rem;">© Colaboradores do OpenStreetMap</div>
        </div>

        <div style="display:flex; gap:.6rem; width:100%; justify-content:center; flex-wrap:wrap;">
          <button type="button" id="btn-mapa-abrir-app" class="btn btn-secondary"
            style="display:inline-flex; align-items:center; gap:.4rem; padding:.55rem 1rem; font-size:.85rem; font-weight:600; color:#60a5fa; background:rgba(59,130,246,.1); border:1px solid rgba(59,130,246,.3); border-radius:6px; cursor:pointer;">
            🗺️ Ver no Google Maps
          </button>

          <button type="button" id="btn-mapa-gerar-rota" class="btn btn-primary"
            style="display:inline-flex; align-items:center; gap:.4rem; padding:.55rem 1rem; font-size:.85rem; font-weight:700; color:#fff; background:#10b981; border:none; border-radius:6px; cursor:pointer;">
            🚗 Ver rotas
          </button>
        </div>
      </div>
    </div>
  `;

  // Usa a própria ação do usuário para abrir o Google Maps,
  // evitando bloqueios de popup em navegadores.
  const btnMapa = document.getElementById('btn-mapa-abrir-app');
  const btnRota = document.getElementById('btn-mapa-gerar-rota');

  if (btnMapa) {
    btnMapa.addEventListener('click', () => {
      window.location.href = googleMapsUrl;
    });
  }

  if (btnRota) {
    btnRota.addEventListener('click', () => {
      window.location.href = googleDirectionsUrl;
    });
  }
}


function renderApiariesView(data) {
  const infoApicultor = ApisStorage.getApicultorInfo() || { nomeApicultor: 'Apicultor', apiarioPrincipal: 'Geral' };
  const filteredHives = data.hives.filter(hive => {
    const matchApiary = selectedApiaryFilter === 'all' || hive.apiaryId === selectedApiaryFilter;
    const matchStatus = selectedStatusFilter === 'all' || hive.status === selectedStatusFilter;
    return matchApiary && matchStatus;
  });

  let nucleiRowsHtml = '';
  if (data.apiaries && data.apiaries.length > 0) {
    for (let i = 0; i < data.apiaries.length; i++) {
      const ap = data.apiaries[i];
      const count = data.hives.filter(h => h.apiaryId === ap.id).length;
      nucleiRowsHtml += '<div style="background:rgba(15,23,42,0.7); border:1px solid var(--slate-700); padding:1rem; border-radius:12px; display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">' +
        '<div>' +
          '<strong style="color:var(--honey-400); font-size:1rem;">📍 Núcleo: ' + ap.name + '</strong>' +
          '<div style="font-size:0.75rem; color:var(--slate-400);">Pertence ao Apiário: ' + infoApicultor.apiarioPrincipal + '</div>' +
          '<div style="font-size:0.75rem; color:var(--emerald-500); margin-top:0.2rem;">' + count + ' colmeias instaladas</div>' +
        '</div>' +
        '<div style="display:flex; gap:0.4rem; align-items:center;">' +
          '<button class="btn btn-secondary btn-edit-apiary" data-id="' + ap.id + '" style="padding:0.3rem 0.55rem; font-size:0.75rem;" title="Editar Núcleo">✏️</button>' +
          '<button class="btn btn-danger btn-delete-apiary" data-id="' + ap.id + '" style="padding:0.3rem 0.6rem; font-size:0.75rem;" title="Excluir Núcleo">🗑️</button>' +
        '</div>' +
      '</div>';
    }
  }

  let filterSelectOptionsHtml = '<option value="all">Todos os Núcleos</option>';
  if (data.apiaries && data.apiaries.length > 0) {
    for (let k = 0; k < data.apiaries.length; k++) {
      const a = data.apiaries[k];
      const selectedAttr = selectedApiaryFilter === a.id ? 'selected' : '';
      filterSelectOptionsHtml += '<option value="' + a.id + '" ' + selectedAttr + '>' + a.name + '</option>';
    }
  }

  let hiveGridHtml = '';
  if (filteredHives.length === 0) {
    hiveGridHtml = '<div style="grid-column: 1 / -1; text-align:center; padding:3rem; color:var(--slate-400);">Nenhuma colmeia encontrada neste Núcleo.</div>';
  } else {
    for (let j = 0; j < filteredHives.length; j++) {
      const hive = filteredHives[j];
      const apiary = data.apiaries.find(a => a.id === hive.apiaryId);
      const queenColor = getQueenColorForYear(hive.queen?.year || new Date().getFullYear());
      
      // Monta o indicador de própolis
      const propolisStatusHtml = hive.propolisProducer 
        ? `<span class="tag-badge" style="background:rgba(16,185,129,0.15); color:var(--emerald-400); font-weight:600;">🌿 Própolis: ${hive.propolisCollectors || 0} col.</span>`
        : `<span class="tag-badge" style="background:rgba(148,163,184,0.1); color:var(--slate-400);">Mel/Subsistência</span>`;

      hiveGridHtml += '<div class="hive-card">' +
        '<div class="hive-card-header">' +
          '<div>' +
            '<div class="hive-code">' + hive.code + '</div>' +
            '<div class="hive-apiary">📍 ' + (apiary ? apiary.name : 'Sem Núcleo') + '</div>' +
          '</div>' +
          '<div style="display:flex; flex-direction:column; align-items:end; gap:0.35rem;">' +
            '<span class="status-badge ' + (hive.status === 'Ativa' ? 'status-ativa' : 'status-atencao') + '">' + hive.status + '</span>' +
            propolisStatusHtml +
          '</div>' +
        '</div>' +
        '<div style="font-size:0.9rem; font-weight:600; margin-bottom:0.5rem;">' + hive.name + '</div>' +
        '<div style="font-size:0.8rem; color:var(--slate-400); margin-bottom:0.75rem;">Modelo: ' + hive.type + ' | Origem: ' + hive.origin + '</div>' +
        '<div style="background:rgba(30,41,59,0.7); padding:0.6rem 0.8rem; border-radius:8px; margin-bottom:0.75rem; display:flex; align-items:center; justify-content:space-between;">' +
          '<div>' +
            '<div style="font-size:0.75rem; color:var(--slate-400);">Linhagem da Rainha</div>' +
            '<div style="font-size:0.8rem; font-weight:600;">' + (hive.queen?.origin || 'Não informada') + '</div>' +
          '</div>' +
          '<span class="queen-badge" style="background:' + (hive.queen?.color || queenColor.color) + '; color:' + queenColor.textColor + ';">👑 Ano ' + (hive.queen?.year || 'N/A') + '</span>' +
        '</div>' +
        '<div class="hive-metrics">' +
          '<div class="hive-metric-item"><span>Quadros Ninho</span><strong>' + hive.framesBrood + ' / 10</strong></div>' +
          '<div class="hive-metric-item"><span>Melgueiras</span><strong>' + hive.supersCount + ' un</strong></div>' +
          '<div class="hive-metric-item"><span>Mansidão</span><strong>' + '⭐'.repeat(hive.temperament) + '</strong></div>' +
          '<div class="hive-metric-item"><span>Saúde</span><strong style="color:' + (hive.healthScore > 80 ? 'var(--emerald-500)' : 'var(--rose-500)') + ';">' + hive.healthScore + '%</strong></div>' +
        '</div>' +
        '<div style="display:flex; gap:0.5rem; margin-top:1rem;">' +
          '<button class="btn btn-secondary btn-edit-hive" data-id="' + hive.id + '" style="flex:1; padding:0.4rem; font-size:0.8rem;">✏️ Editar Colmeia</button>' +
          '<button class="btn btn-danger btn-delete-hive" data-id="' + hive.id + '" style="padding:0.4rem 0.75rem; font-size:0.8rem;">🗑️</button>' +
        '</div>' +
      '</div>';
    }
  }

  return `
    <div class="glass-panel">
      <div class="section-header">
        <div>
          <h2 class="section-title">🏞️ Gerenciamento de Núcleos & Colmeias</h2>
          <p style="color:var(--slate-400); font-size:0.9rem;">Apicultor: <strong>${infoApicultor.nomeApicultor}</strong> | Apiário de Vínculo: <strong>${infoApicultor.apiarioPrincipal}</strong></p>
        </div>
        <div style="display:flex; gap:0.75rem;">
          <button class="btn btn-secondary" id="btn-add-apiary">+ Novo Núcleo</button>
          <button class="btn btn-primary" id="btn-add-hive">+ Nova Colmeia</button>
        </div>
      </div>

      <div style="margin-bottom:1.5rem; display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap:1rem;">
        ${nucleiRowsHtml}
      </div>

      <div style="display:flex; gap:1rem; margin-bottom:1.5rem; flex-wrap:wrap; background:rgba(15,23,42,0.5); padding:1rem; border-radius:12px;">
        <div class="form-group" style="margin:0; min-width:200px;">
          <label>Filtrar por Núcleo:</label>
          <select class="form-control" id="filter-apiary">
            ${filterSelectOptionsHtml}
          </select>
        </div>

        <div class="form-group" style="margin:0; min-width:180px;">
          <label>Status da Colmeia:</label>
          <select class="form-control" id="filter-status">
            <option value="all">Todos os Status</option>
            <option value="Ativa" ${selectedStatusFilter === 'Ativa' ? 'selected' : ''}>Ativa</option>
            <option value="Atenção" ${selectedStatusFilter === 'Atenção' ? 'selected' : ''}>Atenção</option>
          </select>
        </div>
      </div>

      <div class="hives-grid">
        ${hiveGridHtml}
      </div>
    </div>
  `;
}

function renderInspectionsView(data) {
  const inspections = (data.inspections || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const hivesById = {};
  (data.hives || []).forEach(h => { hivesById[h.id] = h; });

  const yesNo = (v, yes, no) => v
    ? `<span style="color:var(--emerald-500);">${yes}</span>`
    : `<span style="color:var(--slate-400);">${no}</span>`;

  const reserveColor = (r) => r === 'Boa' ? 'var(--emerald-500)' : (r === 'Regular' ? 'var(--honey-400)' : 'var(--rose-500)');

  const rowsHtml = inspections.map(insp => {
    const hive = hivesById[insp.hiveId];
    const actions = Array.isArray(insp.actionsTaken) ? insp.actionsTaken : (insp.actionsTaken ? [insp.actionsTaken] : []);
    return `
      <tr>
        <td><strong>${insp.date || '-'}</strong></td>
        <td>${hive ? `<strong>${hive.code || ''}</strong> (${hive.name || 'Colmeia'})` : '<span style="color:var(--slate-400);">Colmeia removida</span>'}</td>
        <td>${insp.inspector || '-'}</td>
        <td>${yesNo(insp.queenSpotted, '👑 Sim', 'Não')}</td>
        <td>${yesNo(insp.eggsPresent, '🥚 Sim', 'Não')}</td>
        <td>${insp.queenCellsSpotted ? '<span style="color:var(--rose-500);">🚨 Sim</span>' : '<span style="color:var(--slate-400);">Não</span>'}</td>
        <td><span style="color:${reserveColor(insp.foodReserves)};">${insp.foodReserves || '-'}</span></td>
        <td>${insp.pestsFound || '-'}</td>
        <td>${actions.length ? actions.join('<br>') : '-'}</td>
        <td style="white-space:nowrap;">
          <button class="btn btn-secondary btn-edit-inspection" data-id="${insp.id}" style="padding:0.3rem 0.6rem; font-size:0.75rem;">✏️</button>
          <button class="btn btn-danger btn-delete-inspection" data-id="${insp.id}" style="padding:0.3rem 0.6rem; font-size:0.75rem;">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div class="glass-panel">
      <div class="section-header">
        <div>
          <h2 class="section-title">📋 Inspeções de Campo</h2>
          <p style="color:var(--slate-400); font-size:0.9rem;">Registro das revisões feitas nas colmeias: rainha, cria, reservas, pragas e ações tomadas.</p>
        </div>
        <button class="btn btn-primary" id="btn-new-inspection">+ Nova Inspeção</button>
      </div>

      <div class="table-responsive">
        ${inspections.length === 0 ? `
          <div style="text-align:center; padding:3rem; color:var(--slate-400);">
            Nenhuma inspeção registrada ainda.
          </div>
        ` : `
          <table class="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Colmeia</th>
                <th>Responsável</th>
                <th>Rainha</th>
                <th>Ovos/Larvas</th>
                <th>Realeiras</th>
                <th>Reservas</th>
                <th>Pragas</th>
                <th>Ações</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        `}
      </div>
    </div>
  `;
}

function bindInspectionsEvents(data) {
  // Corrigido para mapear o ID correto do botão da interface (btn-new-inspection)
  document.getElementById('btn-new-inspection')?.addEventListener('click', () => {
    if (data.hives.length === 0) {
      alert('Cadastre primeiro uma colmeia para registrar uma inspeção!');
    } else {
      openInspectionModal(data);
    }
  });

  document.querySelectorAll('.btn-edit-inspection').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const insp = (data.inspections || []).find(i => i.id === id);
      if (insp) openInspectionModal(data, insp);
    });
  });

  document.querySelectorAll('.btn-delete-inspection').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Excluir este registro de inspeção?')) {
        ApisStorage.deleteInspection(id);
        renderApp();
      }
    });
  });
}

function bindApiariesEvents(data) {
  document.getElementById('filter-apiary')?.addEventListener('change', (e) => {
    selectedApiaryFilter = e.target.value;
    renderApp();
  });

  document.getElementById('filter-status')?.addEventListener('change', (e) => {
    selectedStatusFilter = e.target.value;
    renderApp();
  });

  document.getElementById('btn-add-apiary')?.addEventListener('click', () => {
    openApiaryModal();
  });

  document.getElementById('btn-add-hive')?.addEventListener('click', () => {
    if (data.apiaries.length === 0) {
      alert('Por favor, cadastre primeiro pelo menos um Núcleo de Produção!');
      openApiaryModal();
    } else {
      openHiveModal(data);
    }
  });

  document.querySelectorAll('.btn-edit-apiary').forEach(btn => {
    btn.addEventListener('click', () => {
      const apiaryId = btn.getAttribute('data-id');
      const apiary = data.apiaries.find(a => a.id === apiaryId);
      if (apiary) openApiaryModal(apiary);
    });
  });

  document.querySelectorAll('.btn-delete-apiary').forEach(btn => {
    btn.addEventListener('click', () => {
      const apiaryId = btn.getAttribute('data-id');
      if (confirm('Tem certeza que deseja excluir este núcleo e suas colmeias associadas?')) {
        ApisStorage.deleteApiary(apiaryId);
        renderApp();
      }
    });
  });

  document.querySelectorAll('.btn-edit-hive').forEach(btn => {
    btn.addEventListener('click', () => {
      const hiveId = btn.getAttribute('data-id');
      const hive = data.hives.find(h => h.id === hiveId);
      if (hive) openHiveModal(data, hive);
    });
  });

  document.querySelectorAll('.btn-delete-hive').forEach(btn => {
    btn.addEventListener('click', () => {
      const hiveId = btn.getAttribute('data-id');
      if (confirm('Tem certeza que deseja excluir esta colmeia?')) {
        ApisStorage.deleteHive(hiveId);
        renderApp();
      }
    });
  });
}


function renderHarvestView(data) {
  const totalValue = data.harvests.reduce((acc, h) => {
    return acc + ((parseFloat(h.quantityKg) || 0) * (parseFloat(h.unitPriceBrl) || 0));
  }, 0);

  return `
    <div class="glass-panel">
      <div class="section-header">
        <div>
          <h2 class="section-title">🍯 Controle de Colheitas</h2>
          <p style="color:var(--slate-400); font-size:0.9rem;">Registro de extração de Mel, Própolis, Geleia Real e Cera com controle de lotes e umidade.</p>
        </div>
        <button class="btn btn-primary" id="btn-new-harvest">+ Nova Colheita</button>
      </div>

      <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom:1.5rem;">
        <div class="stat-card">
          <div class="stat-title">Mel Colhido Total</div>
          <div class="stat-value" style="color:var(--honey-400);">
            ${data.harvests.filter(h => h.product === 'Mel').reduce((a, b) => a + (parseFloat(b.quantityKg) || 0), 0).toFixed(1)} kg
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Própolis Verde / Extrato</div>
          <div class="stat-value" style="color:var(--emerald-500);">
            ${(data.harvests.filter(h => h.product.includes('Própolis')).reduce((a, b) => a + (parseFloat(b.quantityKg) || 0), 0) * 1000).toFixed(0)} g
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Valor Estimado das Safras</div>
          <div class="stat-value" style="color:#fff;">
            R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div class="table-responsive">
        ${data.harvests.length === 0 ? `
          <div style="text-align:center; padding:3rem; color:var(--slate-400);">
            Nenhuma colheita registrada ainda.
          </div>
        ` : `
          <table class="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Produto</th>
                <th>Quantidade</th>
                <th>Florada</th>
                <th>Nº do Lote</th>
                <th>Umidade (%)</th>
                <th>Valor Unit. (R$)</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${data.harvests.map(harv => `
                <tr>
                  <td><strong>${harv.date}</strong></td>
                  <td>
                    <span class="tag-badge" style="background:rgba(245,158,11,0.2); color:var(--honey-400);">
                      ${harv.product}
                    </span>
                  </td>
                  <td><strong>${harv.quantityKg} ${harv.product === 'Mel' || harv.product.includes('Cera') ? 'kg' : 'g/kg'}</strong></td>
                  <td>${harv.floralSource}</td>
                  <td><code>${harv.batchNumber}</code></td>
                  <td>
                    <span style="color:${harv.moisturePct > 0 && harv.moisturePct <= 18 ? 'var(--emerald-500)' : 'var(--honey-400)'}">
                      ${harv.moisturePct > 0 ? harv.moisturePct + '%' : 'N/A'}
                    </span>
                  </td>
                  <td>R$ ${parseFloat(harv.unitPriceBrl).toFixed(2)}</td>
                  <td>
                    <button class="btn btn-danger btn-delete-harvest" data-id="${harv.id}" style="padding:0.3rem 0.6rem; font-size:0.75rem;">
                      🗑️
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>
    </div>
  `;
}

function bindHarvestEvents(data) {
  // Corrigido para associar a ação ao botão correto de nova colheita (btn-new-harvest)
  document.getElementById('btn-new-harvest')?.addEventListener('click', () => {
    if (data.apiaries.length === 0) {
      alert('Por favor, cadastre primeiro pelo menos um apiário/núcleo para registrar uma colheita!');
    } else {
      openHarvestModal(data);
    }
  });

  document.querySelectorAll('.btn-delete-harvest').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Excluir este registro de colheita?')) {
        ApisStorage.deleteHarvest(id);
        renderApp();
      }
    });
  });
}

function renderCalendarView() {
  const months = [
    { name: 'Janeiro', season: 'Início das Chuvas', activity: 'Revisão e limpeza de colmeias; instalação de novas caixas para capturar enxames migratórios.', flora: 'Marmeleiro, Velame, Ervas nativas' },
    { name: 'Fevereiro', season: 'Período Chuvoso', activity: 'Acompanhamento do desenvolvimento da cria; monitoramento de pragas (traças e formigas) devido à umidade.', flora: 'Marmeleiro, Jitirana, Malva' },
    { name: 'Março', season: 'Período Chuvoso', activity: 'Monitoramento do espaço do ninho; introdução de cera alveolada para expansão conforme a colônia cresce.', flora: 'Marmeleiro(Final), Angico, Caatinga Plena' },
    { name: 'Abril', season: 'Pico das Chuvas', activity: 'Manejo de espaço; colocação das primeiras melgueiras nos enxames mais fortes e populosos.', flora: 'Jurema Preta, Aroeira, Malva' },
    { name: 'Maio', season: 'Fim das Chuvas', activity: 'Início da colheita do mel da florada do Marmeleiro; monitoramento do peso das melgueiras.', flora: 'Bamburral, Vassorinha de Botão, Malva' },
    { name: 'Junho', season: 'Início da Seca', activity: 'Extração e processamento de mel; preparo de melgueiras vazias para as próximas floradas arbóreas.', flora: 'Bamburral, Aroeira, Unha de Gato, Malva, Vassorinha de Botão' },
    { name: 'Julho', season: 'Período Seco', activity: 'Grande colheita de mel e início da produção/coleta de própolis nas áreas úmidas ou de transição.', flora: 'Cajueiro (início), Silvestre da Caatinga' },
    { name: 'Agosto', season: 'Período Seco', activity: 'Pico da florada do cajueiro; revisões focadas na coleta de mel; controle de ventos fortes nos apiários.', flora: 'Cajueiro (pleno), Trancador, Jameleiro' },
    { name: 'Setembro', season: 'Período Seco', activity: 'Últimas extrações da safra do cajueiro; redução de alvados e preparação para o início da entre-safra severa.', flora: 'Cajueiro (final), Broca, Erva de Passarinho' },
    { name: 'Outubro', season: 'Entre-safra Crítica', activity: 'Início da alimentação artificial de subsistência (xarope de açúcar/promotores); união de enxames fracos.', flora: 'Escassez severa (Caatinga seca)' },
    { name: 'Novembro', season: 'Entre-safra Crítica', activity: 'Alimentação artificial proteica e energética rigorosa; sombreamento de colmeias contra o calor extremo.', flora: 'Escassez severa / Somente polem de subsistência' },
    { name: 'Dezembro', season: 'Pré-safra', activity: 'Manutenção de equipamentos; derretimento de ceras velhas; preparação final para o retorno das chuvas.', flora: 'Juazeiro, início de brotações nativas pós-primeiras chuvas' }
  ];

  return `
    <div class="glass-panel">
      <div class="section-header">
        <div>
          <h2 class="section-title">🌸 Calendário Floral & Manejo Apícola (Ceará/Nordeste)</h2>
          <p style="color:var(--slate-400); font-size:0.9rem;">Planejamento anual adaptado ao semiárido: alimentação na entre-safra seca e colheita nas floradas nativas e de sequeiro.</p>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:1.25rem;">
        ${months.map(m => `
          <div style="background:rgba(15,23,42,0.6); border:1px solid var(--glass-border); padding:1.2rem; border-radius:var(--radius-lg);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
              <strong style="font-family:var(--font-heading); font-size:1.1rem; color:var(--honey-400);">${m.name}</strong>
              <span class="tag-badge">${m.season}</span>
            </div>
            <div style="font-size:0.85rem; color:#fff; margin-bottom:0.5rem;">
              <strong>🎯 Foco:</strong> ${m.activity}
            </div>
            <div style="font-size:0.8rem; color:var(--slate-400);">
              <strong>🌿 Florada:</strong> ${m.flora}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}




function renderAnalyticsView(data) {
  const totalHoney = data.harvests.filter(h => h.product === 'Mel').reduce((acc, curr) => acc + (parseFloat(curr.quantityKg) || 0), 0);
  const totalPropolis = data.harvests.filter(h => h.product.includes('Própolis')).reduce((acc, curr) => acc + (parseFloat(curr.quantityKg) || 0), 0);
  
  const colorCodes = ApisStorage.getQueenColorCodes();
  
  // Monta as linhas de forma 100% segura usando concatenação clássica
  let queenRowsHtml = '';
  for (let i = 0; i < colorCodes.length; i++) {
    const qc = colorCodes[i];
    const count = (data.queens || []).filter(q => qc.years.includes(parseInt(q.year, 10))).length;
    
    queenRowsHtml += '<div style="display:flex; align-items:center; justify-content:space-between; background:rgba(30,41,59,0.4); padding:0.5rem; border-radius:8px; margin-bottom:0.5rem;">' +
      '<span class="queen-badge" style="background:' + qc.color + '; color:' + qc.textColor + '; padding:0.35rem 0.75rem; border-radius:12px; font-weight:700; font-size:0.8rem;">' +
        qc.label +
      '</span>' +
      '<strong style="color:#fff;">' + count + ' rainhas</strong>' +
    '</div>';
  }

  return `
    <div class="glass-panel">
      <div class="section-header">
        <h2 class="section-title">📊 Análise de Desempenho e Saúde</h2>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:1.5rem;">
        <div style="background:rgba(15,23,42,0.6); padding:1.5rem; border-radius:var(--radius-lg); border:1px solid var(--slate-700);">
          <h3 style="color:var(--honey-400); margin-bottom:1rem; font-size:1.1rem;">🍯 Rendimento por Produto</h3>
          <ul style="list-style:none; display:flex; flex-direction:column; gap:0.75rem; padding:0;">
            <li style="display:flex; justify-content:space-between; border-bottom:1px solid var(--slate-700); padding-bottom:0.5rem;">
              <span>Mel Total:</span>
              <strong>${totalHoney.toFixed(1)} kg</strong>
            </li>
            <li style="display:flex; justify-content:space-between; border-bottom:1px solid var(--slate-700); padding-bottom:0.5rem;">
              <span>Própolis Bruta / Extrato:</span>
              <strong>${(totalPropolis * 1000).toFixed(0)} g</strong>
            </li>
          </ul>
        </div>

        <div style="background:rgba(15,23,42,0.6); padding:1.5rem; border-radius:var(--radius-lg); border:1px solid var(--slate-700);">
          <h3 style="color:var(--honey-400); margin-bottom:1rem; font-size:1.1rem;">👑 Idade do Enxame (Ano da Rainha)</h3>
          <div style="display:flex; flex-direction:column; gap:0.25rem;">
            ${queenRowsHtml}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderGuideView() {
  return `
    <div class="glass-panel">
      <div class="section-header">
        <h2 class="section-title">📚 Guia Técnico de Manejo para Abelhas Apis</h2>
      </div>

      <div class="guide-card">
        <h4>👑 Tabela Oficial Internacional de Cores de Marcação de Rainhas</h4>
        <p style="color:var(--slate-400); font-size:0.85rem;">
          Para identificar rapidamente a idade da rainha no apiário, utiliza-se a cor oficial do ano de nascimento no tórax:
        </p>
        <div class="color-table">
          <div class="color-item" style="background:#FFFFFF; color:#0F172A;">Branco (Anos 1 e 6 - Ex: 2026, 2031)</div>
          <div class="color-item" style="background:#FACC15; color:#0F172A;">Amarelo (Anos 2 e 7 - Ex: 2027, 2032)</div>
          <div class="color-item" style="background:#EF4444; color:#FFFFFF;">Vermelho (Anos 3 e 8 - Ex: 2023, 2028)</div>
          <div class="color-item" style="background:#10B981; color:#FFFFFF;">Verde (Anos 4 e 9 - Ex: 2024, 2029)</div>
          <div class="color-item" style="background:#3B82F6; color:#FFFFFF;">Azul (Anos 5 e 0 - Ex: 2025, 2030)</div>
        </div>
      </div>

      <div class="guide-card">
        <h4>🍯 Receitas de Alimentação Artificial para o Período de Escassez</h4>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-top:0.75rem;">
          <div style="background:rgba(15,23,42,0.7); padding:1rem; border-radius:8px;">
            <strong style="color:var(--honey-400);">1. Xarope Estimulante de Postura (1:1)</strong>
            <p style="font-size:0.8rem; color:var(--slate-400); margin-top:0.25rem;">
              - 1 kg de Açúcar Cristal<br>
              - 1 Litro de Água morna<br>
              - Servir em alimentador Boardman ou interno no início da primavera.
            </p>
          </div>
          <div style="background:rgba(15,23,42,0.7); padding:1rem; border-radius:8px;">
            <strong style="color:var(--honey-400);">2. Bife Proteico de Soja e Pólen</strong>
            <p style="font-size:0.8rem; color:var(--slate-400); margin-top:0.25rem;">
              - 60% Extrato de Soja micronizado<br>
              - 20% Levedura de Cerveja<br>
              - 20% Mel puro de boa procedência<br>
              - Colocar sobre os quadros do ninho no outono/inverno.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function closeModal() {
  const modalBackdrop = document.getElementById('modal-backdrop');
  if (modalBackdrop) modalBackdrop.classList.remove('active');
}

function openModal(title, contentHtml) {
  let modalBackdrop = document.getElementById('modal-backdrop');
  if (!modalBackdrop) {
    modalBackdrop = document.createElement('div');
    modalBackdrop.id = 'modal-backdrop';
    modalBackdrop.className = 'modal-backdrop';
    document.body.appendChild(modalBackdrop);
  }

  modalBackdrop.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="close-btn" id="modal-close-x">&times;</button>
      </div>
      <div class="modal-body">
        ${contentHtml}
      </div>
    </div>
  `;

  modalBackdrop.classList.add('active');
  document.getElementById('modal-close-x')?.addEventListener('click', closeModal);
}

// ==========================================================================
// FORMULÁRIOS DE CADASTRO DE APIÁRIOS E COLMEIAS (CORRIGIDOS DE VERDADE)
// ==========================================================================

// ==========================================================================
// FORMULÁRIO DE INSPEÇÃO DE CAMPO
// ==========================================================================
function openInspectionModal(data = ApisStorage.getAll(), existingInspection = null) {
  const isEdit = !!existingInspection;
  const insp = existingInspection || {};
  const hives = data.hives || [];

  if (hives.length === 0) {
    alert('Cadastre primeiro pelo menos uma colmeia para registrar uma inspeção.');
    return;
  }

  const hiveOptions = hives.map(h => {
    const selected = insp.hiveId === h.id ? 'selected' : '';
    return `<option value="${h.id}" ${selected}>${h.code || ''} - ${h.name || 'Colmeia'}</option>`;
  }).join('');

  const actionsText = Array.isArray(insp.actionsTaken) ? insp.actionsTaken.join('\n') : (insp.actionsTaken || '');

  const html = `
    <form id="form-inspection" class="form-grid">
      <div class="form-group">
        <label>Data da Inspeção:</label>
        <input type="date" id="insp-date" class="form-control" value="${insp.date || new Date().toISOString().split('T')[0]}" required>
      </div>

      <div class="form-group">
        <label>Colmeia:</label>
        <select id="insp-hiveId" class="form-control" required>
          <option value="">Selecione a colmeia...</option>
          ${hiveOptions}
        </select>
      </div>

      <div class="form-group">
        <label>Responsável / Inspetor:</label>
        <input type="text" id="insp-inspector" class="form-control" value="${insp.inspector || ''}" placeholder="Nome do responsável" required>
      </div>

      <div class="form-group">
        <label>Reservas de Alimento:</label>
        <select id="insp-foodReserves" class="form-control">
          <option value="Boa" ${insp.foodReserves === 'Boa' ? 'selected' : ''}>Boa</option>
          <option value="Regular" ${insp.foodReserves === 'Regular' ? 'selected' : ''}>Regular</option>
          <option value="Baixa" ${insp.foodReserves === 'Baixa' ? 'selected' : ''}>Baixa</option>
          <option value="Crítica" ${insp.foodReserves === 'Crítica' ? 'selected' : ''}>Crítica</option>
        </select>
      </div>

      <div class="form-group" style="grid-column:1 / -1;">
        <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
          <input type="checkbox" id="insp-queenSpotted" ${insp.queenSpotted ? 'checked' : ''}>
          👑 Rainha visualizada
        </label>
        <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer; margin-top:0.6rem;">
          <input type="checkbox" id="insp-eggsPresent" ${insp.eggsPresent ? 'checked' : ''}>
          🥚 Ovos / larvas presentes
        </label>
        <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer; margin-top:0.6rem;">
          <input type="checkbox" id="insp-queenCellsSpotted" ${insp.queenCellsSpotted ? 'checked' : ''}>
          🚨 Realeiras encontradas
        </label>
      </div>

      <div class="form-group" style="grid-column:1 / -1;">
        <label>Pragas / Problemas Sanitários:</label>
        <textarea id="insp-pestsFound" class="form-control" rows="3" placeholder="Ex.: Nenhuma praga observada; presença de formigas; sinais de traça...">${insp.pestsFound || ''}</textarea>
      </div>

      <div class="form-group" style="grid-column:1 / -1;">
        <label>Ações Tomadas:</label>
        <textarea id="insp-actionsTaken" class="form-control" rows="3" placeholder="Descreva as ações realizadas. Pode colocar uma ação por linha.">${actionsText}</textarea>
      </div>

      <div style="grid-column:1 / -1; display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1rem;">
        <button type="button" class="btn btn-secondary" id="btn-cancelar-inspection">Cancelar</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Salvar Alterações' : 'Registrar Inspeção'}</button>
      </div>
    </form>
  `;

  openModal(isEdit ? '📋 Editar Inspeção' : '📋 Registrar Nova Inspeção', html);

  document.getElementById('btn-cancelar-inspection')?.addEventListener('click', closeModal);

  document.getElementById('form-inspection')?.addEventListener('submit', (e) => {
    e.preventDefault();

    const inspectionData = {
      id: isEdit ? insp.id : undefined,
      date: document.getElementById('insp-date').value,
      hiveId: document.getElementById('insp-hiveId').value,
      inspector: document.getElementById('insp-inspector').value.trim(),
      queenSpotted: document.getElementById('insp-queenSpotted').checked,
      eggsPresent: document.getElementById('insp-eggsPresent').checked,
      queenCellsSpotted: document.getElementById('insp-queenCellsSpotted').checked,
      foodReserves: document.getElementById('insp-foodReserves').value,
      pestsFound: document.getElementById('insp-pestsFound').value.trim(),
      actionsTaken: document.getElementById('insp-actionsTaken').value
        .split('\n')
        .map(v => v.trim())
        .filter(Boolean)
    };

    if (!inspectionData.hiveId) {
      alert('Selecione uma colmeia.');
      return;
    }

    if (!inspectionData.inspector) {
      alert('Informe o responsável pela inspeção.');
      return;
    }

    ApisStorage.saveInspection(inspectionData);
    closeModal();
    renderApp();
  });
}



// ==========================================================================
// FORMULÁRIO DE COLHEITA
// ==========================================================================
function openHarvestModal(data = ApisStorage.getAll(), existingHarvest = null) {
  const isEdit = !!existingHarvest;
  const harv = existingHarvest || {};
  const apiaries = data.apiaries || [];

  if (apiaries.length === 0) {
    alert('Cadastre primeiro pelo menos um apiário para registrar uma colheita.');
    return;
  }

  const apiaryOptions = apiaries.map(a => {
    const selected = harv.apiaryId === a.id ? 'selected' : '';
    return `<option value="${a.id}" ${selected}>${a.name}</option>`;
  }).join('');

  const html = `
    <form id="form-harvest" class="form-grid">
      <div class="form-group">
        <label>Data da Colheita:</label>
        <input type="date" id="harv-date" class="form-control" value="${harv.date || new Date().toISOString().split('T')[0]}" required>
      </div>

      <div class="form-group">
        <label>Apiário:</label>
        <select id="harv-apiaryId" class="form-control" required>
          <option value="">Selecione o apiário...</option>
          ${apiaryOptions}
        </select>
      </div>

      <div class="form-group">
        <label>Produto:</label>
        <select id="harv-product" class="form-control" required>
          <option value="Mel" ${harv.product === 'Mel' ? 'selected' : ''}>🍯 Mel</option>
          <option value="Própolis" ${harv.product === 'Própolis' ? 'selected' : ''}>🌿 Própolis</option>
          <option value="Geleia Real" ${harv.product === 'Geleia Real' ? 'selected' : ''}>👑 Geleia Real</option>
          <option value="Cera" ${harv.product === 'Cera' ? 'selected' : ''}>🕯️ Cera</option>
        </select>
      </div>

      <div class="form-group">
        <label>Quantidade (kg):</label>
        <input type="number" id="harv-quantityKg" class="form-control" min="0" step="0.01" value="${harv.quantityKg || ''}" required>
      </div>

      <div class="form-group">
        <label>Florada / Origem Floral:</label>
        <input type="text" id="harv-floralSource" class="form-control" value="${harv.floralSource || ''}" placeholder="Ex.: Silvestre, Eucalipto, Cajueiro...">
      </div>

      <div class="form-group">
        <label>Nº do Lote:</label>
        <input type="text" id="harv-batchNumber" class="form-control" value="${harv.batchNumber || ''}" placeholder="Ex.: LOTE-2026-001">
      </div>

      <div class="form-group">
        <label>Umidade (%):</label>
        <input type="number" id="harv-moisturePct" class="form-control" min="0" max="100" step="0.1" value="${harv.moisturePct || ''}" placeholder="Ex.: 17,5">
      </div>

      <div class="form-group">
        <label>Valor Unitário (R$/kg):</label>
        <input type="number" id="harv-unitPriceBrl" class="form-control" min="0" step="0.01" value="${harv.unitPriceBrl || ''}" placeholder="Ex.: 18,00">
      </div>

      <div style="grid-column:1 / -1; display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1rem;">
        <button type="button" class="btn btn-secondary" id="btn-cancelar-harvest">Cancelar</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Salvar Alterações' : 'Registrar Colheita'}</button>
      </div>
    </form>
  `;

  openModal(isEdit ? '🍯 Editar Colheita' : '🍯 Registrar Nova Colheita', html);

  document.getElementById('btn-cancelar-harvest')?.addEventListener('click', closeModal);

  document.getElementById('form-harvest')?.addEventListener('submit', (e) => {
    e.preventDefault();

    const quantity = parseFloat(document.getElementById('harv-quantityKg').value);
    const moisture = parseFloat(document.getElementById('harv-moisturePct').value) || 0;
    const price = parseFloat(document.getElementById('harv-unitPriceBrl').value) || 0;

    if (isNaN(quantity) || quantity <= 0) {
      alert('Informe uma quantidade válida maior que zero.');
      return;
    }

    const harvestData = {
      id: isEdit ? harv.id : undefined,
      date: document.getElementById('harv-date').value,
      apiaryId: document.getElementById('harv-apiaryId').value,
      product: document.getElementById('harv-product').value,
      quantityKg: quantity,
      floralSource: document.getElementById('harv-floralSource').value.trim(),
      batchNumber: document.getElementById('harv-batchNumber').value.trim() || `LOTE-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`,
      moisturePct: moisture,
      unitPriceBrl: price
    };

    ApisStorage.saveHarvest(harvestData);
    closeModal();
    renderApp();
  });
}

function openApiaryModal(existingApiary = null) {
  const isEdit = !!existingApiary;
  const ap = existingApiary || {};
  const infoApicultor = ApisStorage.getApicultorInfo() || { apiarioPrincipal: 'Geral' };

  const html = `
    <form id="form-add-apiary" class="form-grid">
      <div class="form-group" style="grid-column:1 / -1;">
        <label>Apiário Vinculado de Origem:</label>
        <input type="text" class="form-control" value="${infoApicultor.apiarioPrincipal}" style="background:rgba(255,255,255,0.05); color:var(--slate-400); cursor:not-allowed;" readonly>
      </div>
      <div class="form-group">
        <label>Nome do Novo Núcleo:</label>
        <input type="text" id="ap-name" class="form-control" value="${ap.name || ''}" placeholder="Ex: Núcleo A - Baixada" required>
      </div>
      <div class="form-group">
        <label>Localização / Coordenadas:</label>
        <div style="display:flex; gap:0.5rem;">
          <input type="text" id="ap-location" class="form-control" value="${ap.location || ''}" placeholder="Ex: -5.1234, -38.5678" style="flex:1;">
          <button type="button" id="btn-capture-gps" class="btn btn-secondary" style="padding:0.5rem; font-size:0.9rem; white-space:nowrap;" title="Capturar GPS do Dispositivo">
            📍 Capturar GPS
          </button>
        </div>
        <small id="gps-status" style="color:var(--slate-400); font-size:0.75rem; display:block; margin-top:0.25rem;">Permite captura offline via chip GPS interno.</small>
      </div>
      <div class="form-group" style="grid-column:1 / -1;">
        <label>Notas da Flora Néctar-Polinífera Próxima:</label>
        <textarea id="ap-notes" class="form-control" rows="2" placeholder="Ex: Próximo à florada de marmeleiro e jurema.">${ap.notes || ''}</textarea>
      </div>
      <div style="grid-column:1 / -1; display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1rem;">
        <button type="button" class="btn btn-secondary" id="btn-cancelar-apiary">Cancelar</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Salvar Alterações' : 'Salvar Núcleo'}</button>
      </div>
    </form>
  `;

  openModal(isEdit ? `✏️ Editar Núcleo: ${ap.name}` : '🏞️ Cadastrar Novo Núcleo de Production', html);
  document.getElementById('btn-cancelar-apiary')?.addEventListener('click', closeModal);

  // --- LÓGICA DE CAPTURA DO GPS OFFLINE NATIVO ---
  document.getElementById('btn-capture-gps')?.addEventListener('click', () => {
    const statusText = document.getElementById('gps-status');
    const locationInput = document.getElementById('ap-location');

    if (!navigator.geolocation) {
      if (statusText) {
        statusText.innerText = "❌ Seu dispositivo não suporta Geolocalização.";
        statusText.style.color = "var(--rose-500)";
      }
      return;
    }

    if (statusText) {
      statusText.innerText = "⏳ Buscando sinal do GPS interno (offline)...";
      statusText.style.color = "var(--honey-400)";
    }

    // Configurações ideais para capturar apenas o hardware do GPS nativo de forma precisa
    const gpsOptions = {
      enableHighAccuracy: true, // Força o uso do hardware GPS integrado (altamente eficaz em campo/offline)
      timeout: 10000,           // Aguarda até 10 segundos pelo sinal dos satélites
      maximumAge: 0             // Não aceita posições antigas em cache
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        const accuracy = position.coords.accuracy.toFixed(0);

        if (locationInput) {
          locationInput.value = `${lat}, ${lng}`;
        }
        if (statusText) {
          statusText.innerText = `✅ Sucesso! Precisão de ${accuracy} metros (Sinal de Satélite).`;
          statusText.style.color = "var(--emerald-500)";
        }
      },
      (error) => {
        console.error("Erro ao capturar GPS:", error);
        if (statusText) {
          statusText.style.color = "var(--rose-500)";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              statusText.innerText = "❌ Permissão negada. Ative a localização no seu navegador.";
              break;
            case error.POSITION_UNAVAILABLE:
              statusText.innerText = "❌ Sinal de GPS indisponível. Vá para uma área aberta.";
              break;
            case error.TIMEOUT:
              statusText.innerText = "❌ Tempo esgotado tentando obter sinal das coordenadas.";
              break;
            default:
              statusText.innerText = "❌ Ocorreu um erro desconhecido ao acessar o hardware.";
              break;
          }
        }
      },
      gpsOptions
    );
  });

  // --- EVENTO DE ENVIO DO FORMULÁRIO ---
  document.getElementById('form-add-apiary').addEventListener('submit', (e) => {
    e.preventDefault();
    const apiaryData = {
      id: isEdit ? ap.id : undefined,
      name: document.getElementById('ap-name').value.trim(),
      location: document.getElementById('ap-location').value.trim(),
      notes: document.getElementById('ap-notes').value.trim()
    };
    if (isEdit && ap.createdAt) apiaryData.createdAt = ap.createdAt;
    ApisStorage.saveApiary(apiaryData);
    closeModal();
    renderApp();
  });
}

function openHiveModal(data = ApisStorage.getAll(), existingHive = null, draft = null) {
  const isEdit = !!existingHive;
  const h = draft || existingHive || {};
  const currentYear = new Date().getFullYear();

  // Carrega os modelos de caixas do banco dinâmico
  const boxModels = ApisStorage.getBoxModels();

  let apiaryOptions = '';
  if (data.apiaries && data.apiaries.length > 0) {
    for (let i = 0; i < data.apiaries.length; i++) {
      const a = data.apiaries[i];
      const selected = h.apiaryId === a.id ? 'selected' : '';
      apiaryOptions += '<option value="' + a.id + '" ' + selected + '>' + a.name + '</option>';
    }
  }

  // Monta as opções do select dinamicamente
  const modelOptions = (boxModels.length === 0 ? '<option value="">Nenhum modelo cadastrado</option>' : '') + boxModels.map(model => {
    const selected = h.type === model ? 'selected' : '';
    return `<option value="${model}" ${selected}>${model}</option>`;
  }).join('');

  const html = `
    <form id="form-edit-hive" class="form-grid">
      <div class="form-group">
        <label>Código da Colmeia:</label>
        <input type="text" id="hv-code" class="form-control" value="${h.code || 'CX-' + (data.hives.length + 1)}" required>
      </div>
      <div class="form-group">
        <label>Nome Apelido:</label>
        <input type="text" id="hv-name" class="form-control" value="${h.name || 'Enxame Forte'}" required>
      </div>
      <div class="form-group">
        <label>Núcleo Alocado:</label>
        <select id="hv-apiaryId" class="form-control" required>
          <option value="">Selecione um Núcleo...</option>
          ${apiaryOptions}
        </select>
      </div>
      <div class="form-group">
        <label>Modelo da Caixa:</label>
        <div style="display:flex; gap:0.5rem;">
          <select id="hv-type" class="form-control" style="flex:1;">
            ${modelOptions}
          </select>
          <button type="button" id="btn-manage-models" class="btn btn-secondary" style="padding:0.5rem; font-size:0.85rem;" title="Gerenciar Modelos">⚙️</button>
        </div>
      </div>
      <div class="form-group">
        <label>Ano de Nasc. da Rainha:</label>
        <input type="number" id="hv-q-year" class="form-control" value="${h.queen?.year || currentYear}" required>
      </div>
      <div class="form-group">
        <label>Origem do Enxame:</label>
        <input type="text" id="hv-origin" class="form-control" value="${h.origin || 'Captura de Resgate'}" placeholder="Ex: Divisão, Captura">
      </div>
      <div class="form-group">
        <label>Quadros com Cria (Ninho):</label>
        <input type="number" id="hv-framesBrood" class="form-control" min="0" max="10" value="${h.framesBrood || 5}">
      </div>
      <div class="form-group">
        <label>Quadros com Mel (Ninho):</label>
        <input type="number" id="hv-framesHoney" class="form-control" min="0" max="10" value="${h.framesHoney || 3}">
      </div>
      <div class="form-group">
        <label>Quantidade de Melgueiras:</label>
        <input type="number" id="hv-supersCount" class="form-control" min="0" max="10" value="${h.supersCount || 0}">
      </div>
      <div class="form-group">
        <label>Produtora de Própolis?</label>
        <select id="hv-propolisProducer" class="form-control">
          <option value="false" ${h.propolisProducer === false ? 'selected' : ''}>Não</option>
          <option value="true" ${h.propolisProducer === true ? 'selected' : ''}>Sim</option>
        </select>
      </div>
      <div class="form-group">
        <label>Quantidade de Coletores:</label>
        <input type="number" id="hv-propolisCollectors" class="form-control" min="0" max="10" value="${h.propolisCollectors || 0}">
      </div>
      <div class="form-group">
        <label>Nível de Mansidão (1 a 5):</label>
        <input type="number" id="hv-temperament" class="form-control" min="1" max="5" value="${h.temperament || 4}">
      </div>
      <div class="form-group">
        <label>Pontuação de Saúde (0% a 100%):</label>
        <input type="number" id="hv-healthScore" class="form-control" min="0" max="100" value="${h.healthScore || 90}">
      </div>
      <div class="form-group">
        <label>Status Atual:</label>
        <select id="hv-status" class="form-control">
          <option value="Ativa" ${h.status === 'Ativa' ? 'selected' : ''}>Ativa</option>
          <option value="Atenção" ${h.status === 'Atenção' ? 'selected' : ''}>Atenção</option>
        </select>
      </div>
      <div style="grid-column: 1 / -1; display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1rem;">
        <button type="button" class="btn btn-secondary" id="btn-cancelar-colmeia">Cancelar</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Salvar Alterações' : 'Cadastrar Colmeia'}</button>
      </div>
    </form>
  `;

  openModal(isEdit ? `✏️ Editar Colmeia: ${h.code}` : '📦 Cadastrar Nova Colmeia', html);

  document.getElementById('btn-cancelar-colmeia').addEventListener('click', closeModal);
  
  // Gatilho para abrir a janela secundária buscando de forma segura do escopo global
  document.getElementById('btn-manage-models').addEventListener('click', () => {
    const val = (id) => document.getElementById(id)?.value;
    const num = (id) => { const n = parseInt(val(id), 10); return Number.isFinite(n) ? n : undefined; };
    const formDraft = {
      ...(existingHive || {}),
      code: val('hv-code'),
      name: val('hv-name'),
      apiaryId: val('hv-apiaryId'),
      type: val('hv-type'),
      origin: val('hv-origin'),
      framesBrood: num('hv-framesBrood'),
      framesHoney: num('hv-framesHoney'),
      supersCount: num('hv-supersCount'),
      propolisProducer: val('hv-propolisProducer') === 'true',
      propolisCollectors: num('hv-propolisCollectors'),
      temperament: num('hv-temperament'),
      healthScore: num('hv-healthScore'),
      status: val('hv-status'),
      queen: { ...((existingHive && existingHive.queen) || {}), year: num('hv-q-year') }
    };
    window.openManageModelsModal(data, existingHive, formDraft);
  });

  document.getElementById('form-edit-hive').addEventListener('submit', (e) => {
    e.preventDefault();
    const qYear = parseInt(document.getElementById('hv-q-year').value, 10);
    const autoColor = getQueenColorForYear(qYear);

    const hiveData = {
      id: isEdit ? h.id : undefined,
      code: document.getElementById('hv-code').value,
      name: document.getElementById('hv-name').value,
      apiaryId: document.getElementById('hv-apiaryId').value,
      type: document.getElementById('hv-type').value,
      origin: document.getElementById('hv-origin').value,
      framesBrood: parseInt(document.getElementById('hv-framesBrood').value, 10) || 0,
      framesHoney: parseInt(document.getElementById('hv-framesHoney').value, 10) || 0,
      supersCount: parseInt(document.getElementById('hv-supersCount').value, 10) || 0,
      propolisProducer: document.getElementById('hv-propolisProducer').value === 'true',
      propolisCollectors: parseInt(document.getElementById('hv-propolisCollectors').value, 10) || 0,
      temperament: parseInt(document.getElementById('hv-temperament').value, 10) || 4,
      healthScore: parseInt(document.getElementById('hv-healthScore').value, 10) || 100,
      status: document.getElementById('hv-status').value,
      queen: h.queen ? { ...h.queen, year: qYear, color: autoColor.color } : {
        year: qYear,
        color: autoColor.color,
        marked: true,
        origin: 'Matriz do Enxame',
        postureStatus: 'Boa postura',
        ageMonths: 6
      }
    };

    ApisStorage.saveHive(hiveData);
    closeModal();
    renderApp();
  });
}

// Injeta diretamente a função no objeto global Window para que fique acessível em qualquer ponto do script
window.openManageModelsModal = function(appData, currentHive = null, formDraft = null, editingIndex = -1) {
  const models = ApisStorage.getBoxModels();
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const reopen = (idx = -1) => window.openManageModelsModal(appData, currentHive, formDraft, idx);

  let rowsHtml = '';
  if (models.length === 0) {
    rowsHtml = '<div style="padding:1rem; text-align:center; color:var(--slate-400); font-size:0.85rem;">Nenhum modelo cadastrado.</div>';
  }
  for (let i = 0; i < models.length; i++) {
    const modelName = models[i];
    const rowStyle = 'display:flex; justify-content:space-between; align-items:center; gap:0.5rem; padding:0.4rem 0.6rem; border-bottom:1px solid rgba(255,255,255,0.05);';

    if (i === editingIndex) {
      rowsHtml += '<div style="' + rowStyle + '">' +
        '<input type="text" id="edit-model-input" class="form-control" value="' + esc(modelName) + '" style="flex:1; padding:0.35rem 0.5rem;">' +
        '<button type="button" class="btn-confirm-edit-model" data-index="' + i + '" style="background:transparent; border:none; color:var(--emerald-500); cursor:pointer; font-size:1rem;" title="Salvar">✔️</button>' +
        '<button type="button" class="btn-cancel-edit-model" style="background:transparent; border:none; color:var(--slate-400); cursor:pointer; font-size:1rem;" title="Cancelar">✖️</button>' +
      '</div>';
    } else {
      rowsHtml += '<div style="' + rowStyle + '">' +
        '<span style="font-size:0.9rem; color:#fff; flex:1; word-break:break-word;">📦 ' + esc(modelName) + '</span>' +
        '<button type="button" class="btn-edit-model" data-index="' + i + '" style="background:transparent; border:none; cursor:pointer; font-size:0.9rem;" title="Editar modelo">✏️</button>' +
        '<button type="button" class="btn-delete-model" data-index="' + i + '" style="background:transparent; border:none; color:var(--rose-500); cursor:pointer; font-size:0.9rem;" title="Deletar modelo">🗑️</button>' +
      '</div>';
    }
  }

  const html = `
    <div style="display:flex; flex-direction:column; gap:1rem;">
      <div style="display:flex; gap:0.5rem;">
        <input type="text" id="new-model-name" class="form-control" placeholder="Ex: Caixa Baiana, OKS" style="flex:1;">
        <button type="button" id="btn-save-new-model" class="btn btn-primary" style="padding:0.6rem 1rem;">Adicionar</button>
      </div>

      <div style="max-height:240px; overflow-y:auto; background:rgba(15,23,42,0.6); border:1px solid var(--slate-700); border-radius:8px; padding:0.5rem;">
        ${rowsHtml}
      </div>

      <div style="display:flex; justify-content:flex-end; margin-top:0.5rem;">
        <button type="button" id="btn-close-models" class="btn btn-secondary">Voltar ao Cadastro</button>
      </div>
    </div>
  `;

  openModal('🛠️ Gerenciar Modelos de Caixas', html);

  // ---- Incluir ----
  const addModel = () => {
    const input = document.getElementById('new-model-name');
    if (!input || !input.value.trim()) return;
    const name = input.value.trim();
    const exists = ApisStorage.getBoxModels().some(m => m.toLowerCase() === name.toLowerCase());
    if (exists) {
      alert('Este modelo já está cadastrado.');
      return;
    }
    if (ApisStorage.saveBoxModel(name)) {
      if (formDraft) formDraft.type = name; // já deixa o novo modelo selecionado no cadastro
      reopen();
    } else {
      alert('Formato inválido.');
    }
  };
  document.getElementById('btn-save-new-model').addEventListener('click', addModel);
  document.getElementById('new-model-name').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addModel(); }
  });

  // ---- Editar ----
  document.querySelectorAll('.btn-edit-model').forEach(btn => {
    btn.addEventListener('click', () => reopen(parseInt(btn.getAttribute('data-index'), 10)));
  });

  document.querySelectorAll('.btn-cancel-edit-model').forEach(btn => {
    btn.addEventListener('click', () => reopen());
  });

  const confirmEdit = (idx) => {
    const oldName = models[idx];
    const newName = document.getElementById('edit-model-input')?.value || '';
    const result = ApisStorage.renameBoxModel(oldName, newName);

    if (result === 'empty') { alert('Informe o nome do modelo.'); return; }
    if (result === 'duplicate') { alert('Já existe um modelo com esse nome.'); return; }
    if (result === 'notfound') { reopen(); return; }

    const finalName = newName.trim();
    if (formDraft && formDraft.type === oldName) formDraft.type = finalName;
    if (currentHive && currentHive.type === oldName) currentHive.type = finalName;
    reopen();
  };

  document.querySelectorAll('.btn-confirm-edit-model').forEach(btn => {
    btn.addEventListener('click', () => confirmEdit(parseInt(btn.getAttribute('data-index'), 10)));
  });
  document.getElementById('edit-model-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); confirmEdit(editingIndex); }
    if (e.key === 'Escape') { reopen(); }
  });
  document.getElementById('edit-model-input')?.focus();

  // ---- Excluir ----
  document.querySelectorAll('.btn-delete-model').forEach(btn => {
    btn.addEventListener('click', () => {
      const modelToDelete = models[parseInt(btn.getAttribute('data-index'), 10)];
      const inUse = ApisStorage.countHivesUsingModel(modelToDelete);
      const extra = inUse > 0
        ? `\n\n${inUse} colmeia(s) já usam este modelo e continuarão exibindo o nome "${modelToDelete}".`
        : '';
      if (confirm(`Deseja mesmo excluir o modelo "${modelToDelete}"?${extra}`)) {
        ApisStorage.deleteBoxModel(modelToDelete);
        if (formDraft && formDraft.type === modelToDelete) formDraft.type = '';
        reopen();
      }
    });
  });

  // ---- Voltar ao cadastro (mantém o que foi digitado) ----
  document.getElementById('btn-close-models').addEventListener('click', () => {
    openHiveModal(ApisStorage.getAll(), currentHive, formDraft);
  });
};

// ==========================================================================
// BACKUP NA NUVEM (Google Drive / iCloud) via tela de compartilhar do celular
// ==========================================================================

function escolherArquivoBackup(onDone) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json,text/plain';
  input.style.display = 'none';
  document.body.appendChild(input);
  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    input.remove();
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onDone(ApisStorage.importJSON(ev.target.result));
    reader.onerror = () => onDone(false);
    reader.readAsText(file);
  });
  input.click();
}

function openBackupModal() {
  const ultimo = ApisStorage.getLastBackupDate() || 'nenhum';
  const html = `
    <div style="display:flex; flex-direction:column; gap:1rem;">
      <p style="font-size:0.85rem; color:var(--slate-200);">
        Guarde uma cópia dos seus dados no <strong>Google Drive</strong> (Android) ou no <strong>Drive/iCloud</strong> (iPhone).
        Se trocar ou perder o celular, basta restaurar o arquivo no aparelho novo.
      </p>
      <div style="background:rgba(16,185,129,0.1); border-left:4px solid var(--emerald-500); padding:0.85rem; border-radius:8px;">
        <strong style="color:var(--emerald-500); font-size:0.85rem;">🔄 BACKUP AUTOMÁTICO NO GOOGLE DRIVE</strong>
        <p style="font-size:0.8rem; color:var(--slate-200); margin:0.35rem 0;" id="drive-status-text">${ApisDrive.statusText()}</p>
        ${ApisDrive.isConnected()
          ? `<div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
               <button class="btn btn-primary" id="btn-drive-sync-now">Enviar agora</button>
               <button class="btn btn-secondary" id="btn-drive-restore">Restaurar do Google Drive</button>
               <button class="btn btn-secondary" id="btn-drive-disconnect">Desligar</button>
             </div>`
          : `<button class="btn btn-primary" id="btn-drive-connect">Ligar com minha conta Google</button>`}
      </div>
      <p style="font-size:0.8rem; color:var(--slate-400); margin:0;">Ou envie manualmente (Drive ou iCloud):</p>
      <button class="btn btn-secondary" id="btn-backup-send">☁️ Enviar arquivo de backup</button>
      <p style="font-size:0.75rem; color:var(--slate-400); margin-top:-0.5rem;">
        Na tela que abrir, escolha <strong>Drive</strong> (ou "Salvar em Arquivos" → iCloud/Drive no iPhone).
      </p>
      <button class="btn btn-secondary" id="btn-backup-restore">📥 Restaurar backup do Drive</button>
      <p style="font-size:0.75rem; color:var(--slate-400); margin-top:-0.5rem;">
        Abre seus arquivos; toque em <strong>Drive</strong> e escolha o arquivo <em>ApisApp_Backup_....json</em>.
        Os dados atuais deste aparelho serão substituídos.
      </p>
      <p style="font-size:0.75rem; color:var(--slate-400);">Último backup local: ${ultimo}</p>
    </div>`;
  openModal('☁️ Backup na Nuvem', html);

  document.getElementById('btn-drive-connect')?.addEventListener('click', async () => {
    try {
      await ApisDrive.connect();
      const existe = await ApisDrive.findFile();
      if (existe && confirm('Encontramos um backup no seu Google Drive. Deseja restaurá-lo agora? (Cancelar = manter os dados deste aparelho e enviar por cima)')) {
        await ApisDrive.restore();
        alert('Backup restaurado do Google Drive!');
        return location.reload();
      }
      await ApisDrive.upload(true);
      alert('Backup automático ligado! Seus dados serão enviados ao Google Drive sozinhos.');
      openBackupModal();
    } catch (e) { alert('Não foi possível ligar o Google Drive: ' + e.message); }
  });
  document.getElementById('btn-drive-sync-now')?.addEventListener('click', async () => {
    try { await ApisDrive.ensureToken(true); await ApisDrive.upload(true); alert('Backup enviado ao Google Drive!'); openBackupModal(); }
    catch (e) { alert('Falha ao enviar: ' + e.message); }
  });
  document.getElementById('btn-drive-restore')?.addEventListener('click', async () => {
    if (!confirm('Restaurar o backup do Google Drive vai substituir os dados deste aparelho. Continuar?')) return;
    try { await ApisDrive.ensureToken(true); await ApisDrive.restore(); alert('Backup restaurado!'); location.reload(); }
    catch (e) { alert('Falha ao restaurar: ' + e.message); }
  });
  document.getElementById('btn-drive-disconnect')?.addEventListener('click', () => {
    ApisDrive.disconnect(); openBackupModal();
  });

  document.getElementById('btn-backup-send')?.addEventListener('click', async () => {
    const r = await ApisStorage.shareToDriveOrEmail();
    if (r.method === 'download') {
      alert('Seu aparelho não abriu a tela de compartilhar. O arquivo foi baixado: abra o app do Drive e envie-o manualmente.');
    }
  });
  document.getElementById('btn-backup-restore')?.addEventListener('click', () => {
    if (!confirm('Restaurar o backup vai substituir os dados deste aparelho. Continuar?')) return;
    escolherArquivoBackup((ok) => {
      if (ok) {
        alert('Backup restaurado com sucesso!');
        location.reload();
      } else {
        alert('Arquivo inválido. Escolha um arquivo ApisApp_Backup_....json.');
      }
    });
  });
}

function oferecerRestauracaoNovoAparelho() {
  const tela = document.createElement('div');
  tela.id = 'tela-restaurar-backup';
  tela.style.cssText = 'position:fixed; inset:0; z-index:9999; display:flex; align-items:center; justify-content:center; padding:1.5rem; background:var(--slate-900, #0F172A);';
  tela.innerHTML = `
    <div class="glass-panel" style="max-width:420px; width:100%; text-align:center; display:flex; flex-direction:column; gap:1rem;">
      <div style="font-size:2.5rem;">🐝</div>
      <h2 style="margin:0;">Bem-vindo ao ApisApp Pro</h2>
      <p style="font-size:0.9rem; color:var(--slate-200);">
        Já usava o app em outro celular? Restaure seu backup salvo no <strong>Drive</strong> ou <strong>iCloud</strong> e continue de onde parou.
      </p>
      <button class="btn btn-primary" id="btn-novo-google">🔄 Entrar com Google e restaurar</button>
      <button class="btn btn-secondary" id="btn-novo-restaurar">📥 Escolher arquivo de backup</button>
      <button class="btn btn-secondary" id="btn-novo-comecar">Começar do zero</button>
    </div>`;
  document.body.appendChild(tela);

  document.getElementById('btn-novo-google').addEventListener('click', async () => {
    try {
      await ApisDrive.connect();
      const ok = await ApisDrive.restore();
      if (!ok) { alert('Nenhum backup encontrado nesta conta Google. Você pode começar do zero; o backup automático já está ligado.'); return; }
      tela.remove();
      alert('Backup restaurado do Google Drive!');
      if (ApisStorage.getApicultorInfo()) IniciarAplicativoNormal(); else exibirTelaPrimeiroAcesso();
    } catch (e) { alert('Não foi possível acessar o Google Drive: ' + e.message); }
  });

  document.getElementById('btn-novo-restaurar').addEventListener('click', () => {
    escolherArquivoBackup((ok) => {
      if (!ok) { alert('Arquivo inválido. Escolha um arquivo ApisApp_Backup_....json.'); return; }
      tela.remove();
      alert('Backup restaurado com sucesso!');
      if (ApisStorage.getApicultorInfo()) IniciarAplicativoNormal();
      else exibirTelaPrimeiroAcesso();
    });
  });
  document.getElementById('btn-novo-comecar').addEventListener('click', () => {
    tela.remove();
    exibirTelaPrimeiroAcesso();
  });
}


// ==========================================================================
// BACKUP AUTOMÁTICO NO GOOGLE DRIVE (pasta privada do app na conta Google)
// ==========================================================================
const ApisDrive = {
  FILE_NAME: 'apisapp_backup.json',
  KEY_CONNECTED: 'apisapp_drive_connected',
  KEY_LAST_SYNC: 'apisapp_drive_last_sync',
  KEY_LAST_HASH: 'apisapp_drive_last_hash',
  token: null,
  tokenExp: 0,
  _client: null,
  _timer: null,

  isConnected() { return localStorage.getItem(this.KEY_CONNECTED) === '1'; },
  statusText() {
    if (location.protocol === 'file:') return 'Disponível apenas quando o app é aberto por um endereço de internet (https).';
    if (!this.isConnected()) return 'Desligado. Ligue para enviar seus dados ao Google Drive automaticamente.';
    const t = localStorage.getItem(this.KEY_LAST_SYNC);
    return 'Ligado ✅ Último envio: ' + (t ? new Date(t).toLocaleString('pt-BR') : 'ainda não enviado');
  },

  loadGis() {
    if (window.google && google.accounts && google.accounts.oauth2) return Promise.resolve();
    return new Promise((res, rej) => {
      const sc = document.createElement('script');
      sc.src = 'https://accounts.google.com/gsi/client';
      sc.async = true; sc.onload = () => res(); sc.onerror = () => rej(new Error('sem internet'));
      document.head.appendChild(sc);
    });
  },

  async requestToken(prompt) {
    if (location.protocol === 'file:') throw new Error('abra o app por um endereço https');
    if (GOOGLE_CLIENT_ID.indexOf('COLE_AQUI') === 0) throw new Error('ID do Google não configurado');
    await this.loadGis();
    return new Promise((res, rej) => {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.appdata',
        callback: (r) => {
          if (r.error) return rej(new Error(r.error));
          this.token = r.access_token;
          this.tokenExp = Date.now() + (Number(r.expires_in || 3600) - 60) * 1000;
          res(this.token);
        },
        error_callback: (e) => rej(new Error(e.type || 'login cancelado'))
      });
      client.requestAccessToken({ prompt: prompt });
    });
  },

  hasValidToken() { return this.token && Date.now() < this.tokenExp; },

  async ensureToken(fromTap) {
    if (this.hasValidToken()) return this.token;
    if (!fromTap) throw new Error('precisa de um toque');
    return this.requestToken('');
  },

  async connect() {
    await this.requestToken('consent');
    localStorage.setItem(this.KEY_CONNECTED, '1');
    this.startAuto();
  },

  disconnect() {
    if (this.token && window.google) google.accounts.oauth2.revoke(this.token, () => {});
    this.token = null; this.tokenExp = 0;
    localStorage.removeItem(this.KEY_CONNECTED);
    localStorage.removeItem(this.KEY_LAST_HASH);
  },

  async api(url, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ Authorization: 'Bearer ' + this.token }, opts.headers || {});
    const r = await fetch(url, opts);
    if (r.status === 401) { this.token = null; throw new Error('sessão Google expirada'); }
    if (!r.ok) throw new Error('Google Drive respondeu ' + r.status + ': ' + await r.text());
    return r;
  },

  async findFile() {
    const q = encodeURIComponent("name='" + this.FILE_NAME + "'");
    const r = await this.api('https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=' + q + '&fields=files(id,modifiedTime)');
    const j = await r.json();
    return (j.files && j.files[0]) || null;
  },

  hash(str) { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0; return String(h); },

  async upload(force) {
    const backup = ApisStorage.getFullBackup();
    const comparable = JSON.stringify(Object.assign({}, backup, { exportedAt: null }));
    const h = this.hash(comparable);
    if (!force && localStorage.getItem(this.KEY_LAST_HASH) === h) return false;

    const body = JSON.stringify(backup);
    const existing = await this.findFile();
    if (existing) {
      await this.api('https://www.googleapis.com/upload/drive/v3/files/' + existing.id + '?uploadType=media', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: body
      });
    } else {
      const boundary = 'apis' + Date.now();
      const meta = { name: this.FILE_NAME, parents: ['appDataFolder'], mimeType: 'application/json' };
      const multipart = '--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(meta) +
        '\r\n--' + boundary + '\r\nContent-Type: application/json\r\n\r\n' + body + '\r\n--' + boundary + '--';
      await this.api('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + boundary }, body: multipart
      });
    }
    localStorage.setItem(this.KEY_LAST_HASH, h);
    localStorage.setItem(this.KEY_LAST_SYNC, new Date().toISOString());
    return true;
  },

  async restore() {
    const f = await this.findFile();
    if (!f) return false;
    const r = await this.api('https://www.googleapis.com/drive/v3/files/' + f.id + '?alt=media');
    const ok = ApisStorage.importJSON(await r.text());
    if (!ok) throw new Error('arquivo de backup inválido');
    const backup = ApisStorage.getFullBackup();
    localStorage.setItem(this.KEY_LAST_HASH, this.hash(JSON.stringify(Object.assign({}, backup, { exportedAt: null }))));
    return true;
  },

  async autoSync(fromTap) {
    if (!this.isConnected() || !navigator.onLine || location.protocol === 'file:') return;
    try {
      await this.ensureToken(fromTap);
      await this.upload(false);
    } catch (e) { /* tenta de novo no próximo toque ou ciclo */ }
  },

  startAuto() {
    if (this._timer || !this.isConnected()) return;
    // O Google exige um toque para renovar o acesso: aproveita o primeiro toque na tela quando necessário
    document.addEventListener('pointerdown', () => {
      if (this.isConnected() && !this.hasValidToken() && navigator.onLine) this.autoSync(true);
    }, true);
    // Verifica alterações a cada 2 minutos e ao sair do app
    this._timer = setInterval(() => this.autoSync(false), 120000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.autoSync(false);
    });
    setTimeout(() => this.autoSync(false), 3000);
  }
};