/**
 * ApisApp Pro v1.18.0 - Código Unificado Standalone
 * Gestão de Apicultura (Apis mellifera)
 * Suporte a execução por duplo clique (file://) e por servidor local (http://)
 * Compatível com múltiplos serviços de armazenamento gratuito na nuvem (Drive, OneDrive, MEGA, Dropbox, iCloud)
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
  BOX_MODELS: 'apisapp_box_models'
};

// ⚠️ IMPORTANTÍSSIMO: Substitua a string abaixo pelo seu Client ID criado no Google Cloud Console.
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
  harvests: [],
  sales: [],
  expenses: [],
  customers: [],
  manejo: [],
  tasks: [],
  insumos: [],
  recur: [],
  docs: [],
  goals: [],
  foodtypes: [],
  equip: [],
  equipcats: [],
  baits: []
};

const ApisStorage = {
  init() {
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
      harvests: JSON.parse(localStorage.getItem(STORAGE_KEYS.HARVESTS) || '[]'),
      sales: JSON.parse(localStorage.getItem('apisapp_sales') || '[]'),
      expenses: JSON.parse(localStorage.getItem('apisapp_expenses') || '[]'),
      customers: JSON.parse(localStorage.getItem('apisapp_customers') || '[]'),
      manejo: JSON.parse(localStorage.getItem('apisapp_manejo') || '[]'),
      tasks: JSON.parse(localStorage.getItem('apisapp_tasks') || '[]'),
      insumos: JSON.parse(localStorage.getItem('apisapp_insumos') || '[]'),
      recur: JSON.parse(localStorage.getItem('apisapp_recur') || '[]'),
      docs: JSON.parse(localStorage.getItem('apisapp_docs') || '[]'),
      goals: JSON.parse(localStorage.getItem('apisapp_goals') || '[]'),
      foodtypes: JSON.parse(localStorage.getItem('apisapp_foodtypes') || '[]'),
      equip: JSON.parse(localStorage.getItem('apisapp_equip') || '[]'),
      equipcats: JSON.parse(localStorage.getItem('apisapp_equipcats') || '[]'),
      baits: JSON.parse(localStorage.getItem('apisapp_baits') || '[]')
    };
  },

  saveAll(data) {
    localStorage.setItem(STORAGE_KEYS.APIARIES, JSON.stringify(data.apiaries || []));
    localStorage.setItem(STORAGE_KEYS.HIVES, JSON.stringify(data.hives || []));
    localStorage.setItem(STORAGE_KEYS.QUEENS, JSON.stringify(data.queens || []));
    localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(data.inspections || []));
    localStorage.setItem(STORAGE_KEYS.HARVESTS, JSON.stringify(data.harvests || []));
    localStorage.setItem('apisapp_sales', JSON.stringify(data.sales || []));
    localStorage.setItem('apisapp_expenses', JSON.stringify(data.expenses || []));
    localStorage.setItem('apisapp_customers', JSON.stringify(data.customers || []));
    localStorage.setItem('apisapp_manejo', JSON.stringify(data.manejo || []));
    localStorage.setItem('apisapp_tasks', JSON.stringify(data.tasks || []));
    localStorage.setItem('apisapp_insumos', JSON.stringify(data.insumos || []));
    localStorage.setItem('apisapp_recur', JSON.stringify(data.recur || []));
    localStorage.setItem('apisapp_docs', JSON.stringify(data.docs || []));
    localStorage.setItem('apisapp_goals', JSON.stringify(data.goals || []));
    localStorage.setItem('apisapp_foodtypes', JSON.stringify(data.foodtypes || []));
    localStorage.setItem('apisapp_equip', JSON.stringify(data.equip || []));
    localStorage.setItem('apisapp_equipcats', JSON.stringify(data.equipcats || []));
    localStorage.setItem('apisapp_baits', JSON.stringify(data.baits || []));
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
      version: '1.18.0',
      exportedAt: new Date().toISOString(),
      apicultorInfo: JSON.parse(localStorage.getItem(STORAGE_KEYS.APICULTOR_INFO) || 'null'),
      settings: JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || 'null'),
      queenColors: JSON.parse(localStorage.getItem(STORAGE_KEYS.QUEEN_COLORS) || 'null'),
      boxModels: JSON.parse(localStorage.getItem(STORAGE_KEYS.BOX_MODELS) || 'null'),
      packages: JSON.parse(localStorage.getItem('apisapp_packages') || 'null'),
      eqroles: JSON.parse(localStorage.getItem('apisapp_eqroles') || 'null'),
      eqcatcfg: JSON.parse(localStorage.getItem('apisapp_eqcatcfg') || 'null'),
      eqhivecfg: JSON.parse(localStorage.getItem('apisapp_eqcathive') || 'null')
    });
  },

  async shareToDriveOrEmail() {
    const data = this.getFullBackup();
    const today = new Date().toISOString().split('T')[0];
    const fileName = `ApisApp_Backup_${today}.json`;
    const jsonStr = JSON.stringify(data, null, 2);

    let file = new File([jsonStr], fileName, { type: 'application/json' });
    if (navigator.canShare && !navigator.canShare({ files: [file] })) {
      file = new File([jsonStr], fileName, { type: 'text/plain' });
    }

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `Backup ApisApp Pro (${today})`,
          text: `Backup completo dos dados do ApisApp Pro gerado em ${today}. Salve no Google Drive, OneDrive, MEGA, Dropbox ou iCloud.`,
          files: [file]
        });
        return { success: true, method: 'share' };
      } catch (err) {
        if (err.name === 'AbortError') return { success: false, method: 'cancel' };
        console.error("Erro ao compartilhar arquivo de backup:", err);
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
        if (data.packages) localStorage.setItem('apisapp_packages', JSON.stringify(data.packages));
        if (data.eqroles) { localStorage.setItem('apisapp_eqroles', JSON.stringify(data.eqroles)); if (typeof loadEqRoles === 'function') loadEqRoles(); }
        if (data.eqcatcfg) localStorage.setItem('apisapp_eqcatcfg', JSON.stringify(data.eqcatcfg));
        if (data.eqhivecfg) localStorage.setItem('apisapp_eqcathive', JSON.stringify(data.eqhivecfg));
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
  
  const infoApicultor = ApisStorage.getApicultorInfo();
  
  if (!infoApicultor) {
    oferecerRestauracaoNovoAparelho();
  } else {
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
      <div style="background:rgba(30,41,59,0.7); border:1px solid #334155; padding:2.5rem; border-radius:16px; max-width:500px; width:100%; box-shadow:0 10px 25px rgba(0,0,0,0.5); backdrop-filter:blur(10px);">
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

  document.getElementById('form-primeiro-acesso').addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = document.getElementById('init-nome-apicultor').value.trim();
    const apiario = document.getElementById('init-nome-apiario').value.trim();
    
    if (nome && apiario) {
      ApisStorage.saveApicultorInfo(nome, apiario);
      alert('Configuração inicial salva com sucesso! Bem-vindo.');
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
    ApisDrive.autoSync(true);
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

// ==========================================================================
// 3. MÓDULO FINANÇAS, ESTOQUE POR LOTE, VENDAS FRACIONADAS E ALERTAS (v1.3.0)
// ==========================================================================

const FIN_KEYS = { SALES: 'apisapp_sales', EXPENSES: 'apisapp_expenses', CUSTOMERS: 'apisapp_customers', PACKAGES: 'apisapp_packages' };
const DEFAULT_PACKAGES = [
  { id: 'pk-1', name: 'Balde 20 kg', kg: 20 },
  { id: 'pk-2', name: 'Pote 1 kg', kg: 1 },
  { id: 'pk-3', name: 'Pote 500 g', kg: 0.5 },
  { id: 'pk-4', name: 'Pote 300 g', kg: 0.3 },
  { id: 'pk-5', name: 'Pote 250 g', kg: 0.25 },
  { id: 'pk-6', name: 'Bisnaga 30 g', kg: 0.03 }
];
const EXPENSE_CATEGORIES = ['Alimentação (açúcar/xarope/proteico)', 'Equipamentos e madeira', 'Embalagens e rótulos', 'Sanidade / medicamentos', 'Transporte e combustível', 'Mão de obra', 'Energia / água', 'Taxas e certificações', 'Manutenção', 'Outros'];
const SALE_CHANNELS = ['Varejo', 'Atacado', 'Feira', 'Entrega', 'Encomenda'];
const PAY_METHODS = ['Pix', 'Dinheiro', 'Cartão', 'Fiado'];
const LOSS_REASONS = ['Amostra', 'Doação', 'Consumo próprio', 'Fermentado / descartado', 'Outro'];

const FinStore = {
  get(k) { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch (e) { return []; } },
  put(k, list) { localStorage.setItem(k, JSON.stringify(list)); },
  save(k, item, prefix) {
    const l = this.get(k);
    if (item.id) {
      const i = l.findIndex(x => x.id === item.id);
      if (i > -1) l[i] = item; else l.push(item);
    } else {
      item.id = prefix + '-' + Date.now() + Math.floor(Math.random() * 1000);
      l.push(item);
    }
    this.put(k, l);
    return item;
  },
  del(k, id) { this.put(k, this.get(k).filter(x => x.id !== id)); }
};

function getPackages() {
  const l = FinStore.get(FIN_KEYS.PACKAGES);
  return l.length ? l : DEFAULT_PACKAGES;
}

const brl = v => 'R$ ' + (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = d => d ? String(d).split('-').reverse().join('/') : '-';
const todayISO = () => new Date().toISOString().split('T')[0];
const sumBy = (arr, fn) => arr.reduce((a, x) => a + (fn(x) || 0), 0);

function saleTotal(s) { return Math.max(0, sumBy(s.items || [], i => i.units * i.unitPrice) - (parseFloat(s.discount) || 0)); }
function saleKg(s) { return sumBy(s.items || [], i => i.units * i.pkgKg); }

function lotStock(data) {
  return data.harvests.map(h => {
    let sold = 0, lost = 0;
    (data.sales || []).forEach(s => (s.items || []).forEach(i => {
      if (i.harvestId === h.id) {
        const q = i.units * i.pkgKg;
        if (s.kind === 'perda') lost += q; else sold += q;
      }
    }));
    return { h, sold, lost, balance: (parseFloat(h.quantityKg) || 0) - sold - lost };
  });
}

// ---------- Alertas do painel ----------
function buildAlertsHtml(data) {
  const A = [];
  const today = new Date();
  const yr = today.getFullYear();
  const unrev = [];
  const lastInsp = {};
  data.inspections.forEach(i => { if (!lastInsp[i.hiveId] || i.date > lastInsp[i.hiveId]) lastInsp[i.hiveId] = i.date; });
  data.hives.forEach(h => {
    const li = lastInsp[h.id];
    const days = li ? Math.floor((today - new Date(li + 'T12:00:00')) / 864e5) : null;
    if (days === null) unrev.push({ ap: h.apiaryId, code: h.code, days: 99999, txt: 'nunca inspecionada' });
    else if (days > 30) unrev.push({ ap: h.apiaryId, code: h.code, days: days, txt: 'sem inspeção há ' + days + ' dias' });
    const qy = parseInt(h.queen && h.queen.year, 10);
    if (qy && yr - qy >= 2) A.push('👑 ' + esc(h.code) + ': rainha de ' + qy + ' — avaliar troca');
    if (h.status === 'Atenção') A.push('⚠️ ' + esc(h.code) + ' está em status Atenção');
  });
  if (unrev.length) {
    const groups = {};
    unrev.forEach(u => { (groups[u.ap] = groups[u.ap] || []).push(u); });
    const blocks = Object.keys(groups)
      .map(id => ({ name: (data.apiaries.find(x => x.id === id) || {}).name || 'Sem núcleo', list: groups[id].sort((x, y) => y.days - x.days) }))
      .sort((x, y) => y.list.length - x.list.length);
    const html = blocks.map(g => '<div style="margin-top:0.5rem;"><strong style="color:var(--honey-400);">🏞️ ' + esc(g.name) + ' — ' + g.list.length + (g.list.length === 1 ? ' caixa' : ' caixas') + '</strong>' +
      '<ul style="margin:0.2rem 0 0 1.2rem; padding:0; list-style:disc; font-size:0.85rem;">' + g.list.map(u => '<li>' + esc(u.code) + ' — ' + u.txt + '</li>').join('') + '</ul></div>').join('');
    A.unshift('🔎 <strong>' + unrev.length + (unrev.length === 1 ? ' caixa sem revisão' : ' caixas sem revisão') + '</strong> em ' + blocks.length + (blocks.length === 1 ? ' núcleo' : ' núcleos') +
      ' <button type="button" class="btn btn-secondary" style="padding:0.2rem 0.6rem; font-size:0.75rem; margin-left:0.5rem;" onclick="var l=document.getElementById(\'unrev-list\');var o=l.style.display===\'none\';l.style.display=o?\'block\':\'none\';this.textContent=o?\'Ocultar\':\'Ver quais\';">Ver quais</button>' +
      '<div id="unrev-list" style="display:none;">' + html + '</div>');
  }
  data.harvests.filter(h => h.product === 'Mel' && parseFloat(h.moisturePct) > 20)
    .forEach(h => A.push('💧 Lote ' + esc(h.batchNumber) + ' com umidade ' + h.moisturePct + '% (acima de 20%, risco de fermentar)'));
  const t = todayISO();
  const late = (data.sales || []).filter(s => s.kind !== 'perda' && !s.paid && s.dueDate && s.dueDate < t);
  if (late.length) A.push('💸 ' + late.length + ' venda(s) vencida(s) a receber: ' + brl(sumBy(late, saleTotal)));
  lotStock(data).filter(x => x.balance < -0.0001).forEach(x => A.push('📦 Lote ' + esc(x.h.batchNumber) + ' com saldo negativo — revise as vendas'));
  buildManejoAlerts().forEach(a => A.push(a));
  const nOld = FinStore.get('apisapp_baits').filter(b => b.status === 'ativa' && Math.floor((today - new Date((b.lastCheck || b.date) + 'T12:00:00')) / 864e5) > 15).length;
  if (nOld) A.push('🪤 ' + nOld + ' caixa(s) isca sem verificação há mais de 15 dias');
  FinStore.get('apisapp_docs').forEach(d => { const dd = Math.floor((new Date(d.expires + 'T12:00:00') - today) / 864e5); if (dd < 0) A.push('📄 Documento vencido: ' + esc(d.name)); else if (dd <= 30) A.push('📄 ' + esc(d.name) + ' vence em ' + dd + ' dias'); });
  FinStore.get('apisapp_insumos').filter(i => i.qty <= i.min).forEach(i => A.push('📦 Insumo acabando: ' + esc(i.name) + ' (' + i.qty + ' ' + esc(i.unit) + ')'));
  if (!A.length) return '';
  const shown = A.slice(0, 8).map(a => '<li style="padding:0.25rem 0;">' + a + '</li>').join('');
  return '<div class="glass-panel" style="margin-bottom:1.25rem; border-left:4px solid var(--honey-400);">' +
    '<h3 style="color:var(--honey-400); margin-bottom:0.5rem;">🔔 Alertas do Apiário (' + A.length + ')</h3>' +
    '<ul style="list-style:none; padding:0; margin:0; font-size:0.9rem;">' + shown + '</ul>' +
    (A.length > 8 ? '<div style="color:var(--slate-400); font-size:0.8rem;">+ ' + (A.length - 8) + ' alerta(s)</div>' : '') + '</div>';
}

// ---------- Tela Finanças & Vendas ----------
let finYear = 'all';
let finCharts = [];
const inYear = d => finYear === 'all' || String(d || '').startsWith(finYear);

function renderFinanceView(data) {
  const sales = data.sales.filter(s => inYear(s.date));
  const exps = data.expenses.filter(e => inYear(e.date));
  const vendas = sales.filter(s => s.kind !== 'perda');
  const perdas = sales.filter(s => s.kind === 'perda');
  const receita = sumBy(vendas, saleTotal);
  const aReceber = sumBy(vendas.filter(s => !s.paid), saleTotal);
  const gastos = sumBy(exps.filter(e => !e.investment), e => e.value);
  const invest = sumBy(exps.filter(e => e.investment), e => e.value);
  const lucro = receita - gastos;
  const melKg = sumBy(data.harvests.filter(h => h.product === 'Mel' && inYear(h.date)), h => parseFloat(h.quantityKg));
  const custoKg = melKg > 0 ? gastos / melKg : 0;
  const kgVend = sumBy(vendas, saleKg);
  const precoMedio = kgVend > 0 ? receita / kgVend : 0;
  const equilibrio = precoMedio > 0 ? gastos / precoMedio : 0;
  const stock = lotStock(data);
  const t = todayISO();

  const years = Array.from(new Set([].concat(data.sales, data.expenses, data.harvests).map(x => String(x.date || '').slice(0, 4)).filter(Boolean))).sort();
  const yearOpts = '<option value="all">Todas as safras</option>' + years.map(y => '<option value="' + y + '"' + (finYear === y ? ' selected' : '') + '>' + y + '</option>').join('');

  const byProduct = {};
  vendas.forEach(s => s.items.forEach(i => { byProduct[i.product] = (byProduct[i.product] || 0) + i.units * i.unitPrice; }));
  const productRows = Object.keys(byProduct).map(p => '<li style="display:flex; justify-content:space-between; padding:0.3rem 0; border-bottom:1px solid var(--slate-700);"><span>' + esc(p) + '</span><strong>' + brl(byProduct[p]) + '</strong></li>').join('') || '<li style="color:var(--slate-400);">Sem vendas no período.</li>';

  const lotOfHarvest = {};
  data.harvests.forEach(h => { lotOfHarvest[h.id] = h; });
  const apRows = data.apiaries.map(a => {
    const rec = sumBy(vendas, s => sumBy(s.items, i => (lotOfHarvest[i.harvestId] && lotOfHarvest[i.harvestId].apiaryId === a.id) ? i.units * i.unitPrice : 0));
    const gas = sumBy(exps.filter(e => !e.investment && e.apiaryId === a.id), e => e.value);
    return '<tr><td>' + esc(a.name) + '</td><td>' + brl(rec) + '</td><td>' + brl(gas) + '</td><td style="color:' + (rec - gas >= 0 ? 'var(--emerald-500)' : 'var(--rose-500)') + ';"><strong>' + brl(rec - gas) + '</strong></td></tr>';
  }).join('');

  const stat = (title, val, color) => '<div class="stat-card"><div class="stat-title">' + title + '</div><div class="stat-value" style="color:' + color + '; font-size:1.4rem;">' + val + '</div></div>';
  const btnS = 'padding:0.3rem 0.6rem; font-size:0.75rem;';

  return `
    <div class="glass-panel">
      <div class="section-header">
        <div>
          <h2 class="section-title">💰 Finanças, Estoque & Vendas</h2>
          <p style="color:var(--slate-400); font-size:0.9rem;">Estoque por lote, vendas fracionadas, perdas, gastos, contas a receber e resultado por apiário.</p>
        </div>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center;">
          <select id="fin-year" class="form-control" style="width:auto;">${yearOpts}</select>
          <button class="btn btn-primary" id="btn-new-sale">+ Venda</button>
          <button class="btn btn-secondary" id="btn-new-loss">📉 Perda/Amostra</button>
          <button class="btn btn-secondary" id="btn-new-expense">+ Gasto</button>
          <button class="btn btn-secondary" id="btn-new-package">📦 Embalagem</button>
        </div>
      </div>

      <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); margin-bottom:1.5rem;">
        ${stat('Receita (vendas)', brl(receita), 'var(--honey-400)')}
        ${stat('Gastos operacionais', brl(gastos), 'var(--rose-500)')}
        ${stat('Lucro', brl(lucro), lucro >= 0 ? 'var(--emerald-500)' : 'var(--rose-500)')}
        ${stat('A receber', brl(aReceber), '#fff')}
        ${stat('Custo por kg de mel', brl(custoKg), '#fff')}
        ${stat('Ponto de equilíbrio', equilibrio.toFixed(1) + ' kg', '#fff')}
      </div>
      <div style="color:var(--slate-400); font-size:0.8rem; margin:-0.75rem 0 1.25rem;">Investimentos (fora do lucro): ${brl(invest)} · Perdas/amostras: ${sumBy(perdas, saleKg).toFixed(2)} kg · Preço médio vendido: ${brl(precoMedio)}/kg</div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:1.25rem; margin-bottom:1.5rem;">
        <div style="background:rgba(15,23,42,0.6); padding:1rem; border-radius:12px; border:1px solid var(--slate-700);">
          <h4 style="color:var(--honey-400); margin-bottom:0.5rem;">Receita × Gastos (12 meses)</h4>
          <div style="position:relative; height:240px;"><canvas id="chart-fin-monthly"></canvas></div>
        </div>
        <div style="background:rgba(15,23,42,0.6); padding:1rem; border-radius:12px; border:1px solid var(--slate-700);">
          <h4 style="color:var(--honey-400); margin-bottom:0.5rem;">Vendas por canal</h4>
          <div style="position:relative; height:240px;"><canvas id="chart-fin-channel"></canvas></div>
        </div>
        <div style="background:rgba(15,23,42,0.6); padding:1rem; border-radius:12px; border:1px solid var(--slate-700);">
          <h4 style="color:var(--honey-400); margin-bottom:0.5rem;">Receita por produto</h4>
          <ul style="list-style:none; padding:0; margin:0;">${productRows}</ul>
        </div>
      </div>

      <h3 style="color:var(--honey-400); margin:1rem 0 0.5rem;">📦 Estoque por Lote</h3>
      <div class="table-responsive">
        ${stock.length === 0 ? '<div style="padding:1.5rem; color:var(--slate-400);">Registre colheitas para formar o estoque.</div>' : `
        <table class="data-table"><thead><tr><th>Lote</th><th>Produto</th><th>Colhido</th><th>Vendido</th><th>Perdas</th><th>Saldo</th></tr></thead><tbody>
          ${stock.map(x => '<tr><td><code>' + esc(x.h.batchNumber) + '</code></td><td>' + esc(x.h.product) + '</td><td>' + (parseFloat(x.h.quantityKg) || 0).toFixed(2) + ' kg</td><td>' + x.sold.toFixed(2) + ' kg</td><td>' + x.lost.toFixed(2) + ' kg</td><td><strong style="color:' + (x.balance < -0.0001 ? 'var(--rose-500)' : x.balance < 0.0001 ? 'var(--slate-400)' : 'var(--emerald-500)') + ';">' + x.balance.toFixed(2) + ' kg</strong></td></tr>').join('')}
        </tbody></table>`}
      </div>

      <h3 style="color:var(--honey-400); margin:1.5rem 0 0.5rem;">🧾 Vendas e Saídas</h3>
      <div class="table-responsive">
        ${sales.length === 0 ? '<div style="padding:1.5rem; color:var(--slate-400);">Nenhuma venda no período.</div>' : `
        <table class="data-table"><thead><tr><th>Data</th><th>Cliente / Motivo</th><th>Itens</th><th>Total</th><th>Pagamento</th><th>Situação</th><th>Ações</th></tr></thead><tbody>
          ${sales.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).map(s => {
            const itens = s.items.map(i => i.units + '× ' + esc(i.pkgName) + ' <small style="color:var(--slate-400);">(' + esc(i.batchNumber) + ')</small>').join('<br>');
            const isLoss = s.kind === 'perda';
            const sit = isLoss ? '<span class="tag-badge">' + esc(s.reason) + '</span>' : (s.paid ? '<span class="status-badge status-ativa">Pago</span>' : '<span class="status-badge status-atencao">A receber' + (s.dueDate ? ' · ' + fmtDate(s.dueDate) : '') + (s.dueDate && s.dueDate < t ? ' ⚠️' : '') + '</span>');
            return '<tr><td>' + fmtDate(s.date) + '</td><td>' + esc(isLoss ? s.reason : (s.customerName || 'Consumidor')) + '<br><small style="color:var(--slate-400);">' + esc(s.channel || '') + '</small></td><td>' + itens + '</td><td><strong>' + (isLoss ? saleKg(s).toFixed(2) + ' kg' : brl(saleTotal(s))) + '</strong></td><td>' + (isLoss ? '-' : esc(s.payment)) + '</td><td>' + sit + '</td><td style="white-space:nowrap;">' +
              (!isLoss ? '<button class="btn btn-secondary btn-sale-receipt" data-id="' + s.id + '" style="' + btnS + '" title="Recibo no WhatsApp">🧾</button> ' : '') +
              (!isLoss && !s.paid ? '<button class="btn btn-primary btn-sale-pay" data-id="' + s.id + '" style="' + btnS + '" title="Dar baixa">✅</button> ' : '') +
              '<button class="btn btn-danger btn-sale-del" data-id="' + s.id + '" style="' + btnS + '">🗑️</button></td></tr>';
          }).join('')}
        </tbody></table>`}
      </div>

      <h3 style="color:var(--honey-400); margin:1.5rem 0 0.5rem;">🧮 Gastos</h3>
      <div class="table-responsive">
        ${exps.length === 0 ? '<div style="padding:1.5rem; color:var(--slate-400);">Nenhum gasto no período.</div>' : `
        <table class="data-table"><thead><tr><th>Data</th><th>Categoria</th><th>Descrição</th><th>Apiário</th><th>Tipo</th><th>Valor</th><th></th></tr></thead><tbody>
          ${exps.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).map(e => {
            const ap = data.apiaries.find(a => a.id === e.apiaryId);
            return '<tr><td>' + fmtDate(e.date) + '</td><td>' + esc(e.category) + '</td><td>' + esc(e.desc) + '</td><td>' + esc(ap ? ap.name : 'Geral') + '</td><td>' + (e.investment ? '<span class="tag-badge">Investimento</span>' : esc(e.type)) + '</td><td><strong>' + brl(e.value) + '</strong></td><td><button class="btn btn-danger btn-exp-del" data-id="' + e.id + '" style="' + btnS + '">🗑️</button></td></tr>';
          }).join('')}
        </tbody></table>`}
      </div>

      ${data.apiaries.length ? `
      <h3 style="color:var(--honey-400); margin:1.5rem 0 0.5rem;">🏞️ Resultado por Apiário</h3>
      <div class="table-responsive"><table class="data-table"><thead><tr><th>Apiário</th><th>Receita</th><th>Gastos diretos</th><th>Saldo</th></tr></thead><tbody>${apRows}</tbody></table></div>` : ''}
    </div>`;
}

function bindFinanceEvents() {
  const $ = id => document.getElementById(id);
  $('fin-year')?.addEventListener('change', e => { finYear = e.target.value; renderApp(); });
  $('btn-new-sale')?.addEventListener('click', () => openSaleModal('venda'));
  $('btn-new-loss')?.addEventListener('click', () => openSaleModal('perda'));
  $('btn-new-expense')?.addEventListener('click', openExpenseModal);
  $('btn-new-package')?.addEventListener('click', () => {
    const name = (prompt('Nome da embalagem (ex.: Pote 200 g):') || '').trim();
    if (!name) return;
    const kg = parseFloat(String(prompt('Peso em kg (ex.: 0,2):') || '').replace(',', '.'));
    if (!kg || kg <= 0) { alert('Peso inválido.'); return; }
    const list = FinStore.get(FIN_KEYS.PACKAGES);
    const base = list.length ? list : DEFAULT_PACKAGES.slice();
    base.push({ id: 'pk-' + Date.now(), name, kg });
    FinStore.put(FIN_KEYS.PACKAGES, base);
    alert('Embalagem adicionada!');
  });
  document.querySelectorAll('.btn-sale-del').forEach(b => b.addEventListener('click', () => {
    if (confirm('Excluir este registro? O saldo do lote será devolvido ao estoque.')) { FinStore.del(FIN_KEYS.SALES, b.dataset.id); renderApp(); }
  }));
  document.querySelectorAll('.btn-exp-del').forEach(b => b.addEventListener('click', () => {
    if (confirm('Excluir este gasto?')) { FinStore.del(FIN_KEYS.EXPENSES, b.dataset.id); renderApp(); }
  }));
  document.querySelectorAll('.btn-sale-pay').forEach(b => b.addEventListener('click', () => {
    const s = FinStore.get(FIN_KEYS.SALES).find(x => x.id === b.dataset.id);
    if (s) { s.paid = true; s.paidDate = todayISO(); FinStore.save(FIN_KEYS.SALES, s, 'sale'); renderApp(); }
  }));
  document.querySelectorAll('.btn-sale-receipt').forEach(b => b.addEventListener('click', () => {
    const s = FinStore.get(FIN_KEYS.SALES).find(x => x.id === b.dataset.id);
    if (!s) return;
    const info = ApisStorage.getApicultorInfo() || {};
    const txt = '🍯 *' + (info.apiarioPrincipal || 'ApisApp Pro') + '* — Recibo\nData: ' + fmtDate(s.date) + '\nCliente: ' + (s.customerName || '-') + '\n' +
      s.items.map(i => '• ' + i.units + '× ' + i.pkgName + ' ' + i.product + ' (lote ' + i.batchNumber + ') — ' + brl(i.units * i.unitPrice)).join('\n') +
      (s.discount ? '\nDesconto: ' + brl(s.discount) : '') + '\n*Total: ' + brl(saleTotal(s)) + '*\nPagamento: ' + s.payment +
      (s.paid ? ' (pago)' : ' (a receber' + (s.dueDate ? ' até ' + fmtDate(s.dueDate) : '') + ')') + '\nObrigado pela preferência!';
    const phone = ((FinStore.get(FIN_KEYS.CUSTOMERS).find(c => c.id === s.customerId) || {}).phone || '').replace(/\D/g, '');
    window.open('https://wa.me/' + (phone ? (phone.length <= 11 ? '55' + phone : phone) : '') + '?text=' + encodeURIComponent(txt), '_blank');
  }));
  drawFinCharts(ApisStorage.getAll());
}

function drawFinCharts(data) {
  if (typeof Chart === 'undefined') return;
  finCharts.forEach(c => c.destroy());
  finCharts = [];
  Chart.defaults.color = '#94a3b8';
  const months = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
  }
  const vend = data.sales.filter(s => s.kind !== 'perda');
  const rec = months.map(m => sumBy(vend.filter(s => String(s.date).startsWith(m)), saleTotal));
  const gas = months.map(m => sumBy(data.expenses.filter(e => !e.investment && String(e.date).startsWith(m)), e => e.value));
  const c1 = document.getElementById('chart-fin-monthly');
  if (c1) finCharts.push(new Chart(c1, { type: 'bar', data: { labels: months, datasets: [{ label: 'Receita', data: rec, backgroundColor: '#f59e0b' }, { label: 'Gastos', data: gas, backgroundColor: '#ef4444' }] }, options: { responsive: true, maintainAspectRatio: false } }));
  const ch = {};
  vend.forEach(s => { ch[s.channel || 'Varejo'] = (ch[s.channel || 'Varejo'] || 0) + saleTotal(s); });
  const c2 = document.getElementById('chart-fin-channel');
  if (c2 && Object.keys(ch).length) finCharts.push(new Chart(c2, { type: 'doughnut', data: { labels: Object.keys(ch), datasets: [{ data: Object.values(ch), backgroundColor: ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#a855f7'] }] }, options: { responsive: true, maintainAspectRatio: false } }));
}

// ---------- Modal de Venda fracionada / Perda ----------
function openSaleModal(kind) {
  const data = ApisStorage.getAll();
  const stock = lotStock(data).filter(x => x.balance > 0.0001);
  if (!stock.length) { alert('Não há lotes com saldo em estoque. Registre uma colheita primeiro.'); return; }
  const pk = getPackages();
  const isLoss = kind === 'perda';
  const lotOpts = stock.map(x => '<option value="' + x.h.id + '">' + esc(x.h.batchNumber) + ' · ' + esc(x.h.product) + ' · saldo ' + x.balance.toFixed(2) + ' kg</option>').join('');
  const pkOpts = pk.map(p => '<option value="' + p.id + '">' + esc(p.name) + '</option>').join('');
  const customers = FinStore.get(FIN_KEYS.CUSTOMERS);
  const rowHtml = () => '<div class="sale-row" style="display:grid; grid-template-columns:2fr 1.4fr 0.8fr 1fr auto; gap:0.4rem; margin-bottom:0.4rem;">' +
    '<select class="form-control s-lot">' + lotOpts + '</select><select class="form-control s-pk">' + pkOpts + '</select>' +
    '<input type="number" class="form-control s-units" min="1" step="1" value="1" title="Unidades">' +
    '<input type="number" class="form-control s-price" min="0" step="0.01" title="Preço da unidade (R$)"' + (isLoss ? ' value="0" disabled' : '') + '>' +
    '<button type="button" class="btn btn-danger s-del">✕</button></div>';

  const html = `
    <form id="form-sale" class="form-grid">
      <div class="form-group"><label>Data:</label><input type="date" id="sale-date" class="form-control" value="${todayISO()}" required></div>
      ${isLoss ? `
        <div class="form-group"><label>Motivo:</label><select id="sale-reason" class="form-control">${LOSS_REASONS.map(r => '<option>' + r + '</option>').join('')}</select></div>
      ` : `
        <div class="form-group"><label>Cliente:</label><input type="text" id="sale-customer" class="form-control" list="dl-customers" placeholder="Nome (opcional)"><datalist id="dl-customers">${customers.map(c => '<option value="' + esc(c.name) + '">').join('')}</datalist></div>
        <div class="form-group"><label>Telefone (WhatsApp):</label><input type="tel" id="sale-phone" class="form-control" placeholder="(88) 99999-0000"></div>
        <div class="form-group"><label>Canal:</label><select id="sale-channel" class="form-control">${SALE_CHANNELS.map(c => '<option>' + c + '</option>').join('')}</select></div>
        <div class="form-group"><label>Pagamento:</label><select id="sale-payment" class="form-control">${PAY_METHODS.map(c => '<option>' + c + '</option>').join('')}</select></div>
        <div class="form-group"><label>Vencimento (se a receber):</label><input type="date" id="sale-due" class="form-control"></div>
        <div class="form-group"><label>Desconto (R$):</label><input type="number" id="sale-discount" class="form-control" min="0" step="0.01" value="0"></div>
      `}
      <div style="grid-column:1 / -1;">
        <label style="font-weight:600;">Itens (lote · embalagem · unidades · preço da unidade):</label>
        <div id="sale-rows"></div>
        <button type="button" class="btn btn-secondary" id="btn-add-row" style="font-size:0.8rem;">+ Item</button>
        <div id="sale-total" style="text-align:right; font-weight:700; margin-top:0.5rem;"></div>
      </div>
      <div style="grid-column:1 / -1; display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.5rem;">
        <button type="button" class="btn btn-secondary" id="btn-cancel-sale">Cancelar</button>
        <button type="submit" class="btn btn-primary">${isLoss ? 'Registrar Saída' : 'Registrar Venda'}</button>
      </div>
    </form>`;
  openModal(isLoss ? '📉 Perda / Amostra / Consumo' : '🧾 Nova Venda', html);

  const rowsEl = document.getElementById('sale-rows');
  const recalc = () => {
    if (isLoss) return;
    let tot = 0;
    rowsEl.querySelectorAll('.sale-row').forEach(r => { tot += (parseInt(r.querySelector('.s-units').value, 10) || 0) * (parseFloat(r.querySelector('.s-price').value) || 0); });
    tot -= parseFloat(document.getElementById('sale-discount').value) || 0;
    document.getElementById('sale-total').textContent = 'Total: ' + brl(Math.max(0, tot));
  };
  const autoPrice = row => {
    if (isLoss) return;
    const h = data.harvests.find(x => x.id === row.querySelector('.s-lot').value);
    const p = pk.find(x => x.id === row.querySelector('.s-pk').value);
    if (h && p) row.querySelector('.s-price').value = ((parseFloat(h.unitPriceBrl) || 0) * p.kg).toFixed(2);
    recalc();
  };
  const addRow = () => {
    rowsEl.insertAdjacentHTML('beforeend', rowHtml());
    const row = rowsEl.lastElementChild;
    row.querySelector('.s-lot').addEventListener('change', () => autoPrice(row));
    row.querySelector('.s-pk').addEventListener('change', () => autoPrice(row));
    row.querySelector('.s-units').addEventListener('input', recalc);
    row.querySelector('.s-price').addEventListener('input', recalc);
    row.querySelector('.s-del').addEventListener('click', () => { if (rowsEl.children.length > 1) { row.remove(); recalc(); } });
    autoPrice(row);
  };
  addRow();
  document.getElementById('btn-add-row').addEventListener('click', addRow);
  document.getElementById('sale-discount')?.addEventListener('input', recalc);
  document.getElementById('sale-payment')?.addEventListener('change', e => {
    const due = document.getElementById('sale-due');
    if (e.target.value === 'Fiado' && !due.value) due.value = new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0];
  });
  document.getElementById('btn-cancel-sale').addEventListener('click', closeModal);

  document.getElementById('form-sale').addEventListener('submit', e => {
    e.preventDefault();
    const items = [];
    const used = {};
    let invalid = false;
    rowsEl.querySelectorAll('.sale-row').forEach(r => {
      const h = data.harvests.find(x => x.id === r.querySelector('.s-lot').value);
      const p = pk.find(x => x.id === r.querySelector('.s-pk').value);
      const units = parseInt(r.querySelector('.s-units').value, 10);
      const price = isLoss ? 0 : (parseFloat(r.querySelector('.s-price').value) || 0);
      if (!h || !p || !units || units < 1) { invalid = true; return; }
      used[h.id] = (used[h.id] || 0) + units * p.kg;
      items.push({ harvestId: h.id, batchNumber: h.batchNumber, product: h.product, pkgName: p.name, pkgKg: p.kg, units, unitPrice: price });
    });
    if (invalid || !items.length) { alert('Confira os itens: informe lote, embalagem e unidades.'); return; }
    for (const id of Object.keys(used)) {
      const st = stock.find(x => x.h.id === id);
      if (used[id] > st.balance + 0.0001) { alert('Quantidade acima do saldo do lote ' + st.h.batchNumber + ' (saldo ' + st.balance.toFixed(2) + ' kg).'); return; }
    }
    const sale = { date: document.getElementById('sale-date').value, kind: isLoss ? 'perda' : 'venda', items };
    if (isLoss) {
      sale.reason = document.getElementById('sale-reason').value;
      sale.paid = true;
    } else {
      const name = document.getElementById('sale-customer').value.trim();
      const phone = document.getElementById('sale-phone').value.trim();
      sale.channel = document.getElementById('sale-channel').value;
      sale.payment = document.getElementById('sale-payment').value;
      sale.discount = parseFloat(document.getElementById('sale-discount').value) || 0;
      sale.paid = sale.payment !== 'Fiado';
      sale.dueDate = sale.paid ? '' : document.getElementById('sale-due').value;
      sale.customerName = name;
      if (name) {
        const list = FinStore.get(FIN_KEYS.CUSTOMERS);
        let c = list.find(x => x.name.toLowerCase() === name.toLowerCase());
        if (!c) c = { name, phone };
        else if (phone) c.phone = phone;
        FinStore.save(FIN_KEYS.CUSTOMERS, c, 'cli');
        sale.customerId = c.id;
      }
    }
    FinStore.save(FIN_KEYS.SALES, sale, 'sale');
    closeModal();
    renderApp();
  });
}

// ---------- Modal de Gasto ----------
function openExpenseModal() {
  const data = ApisStorage.getAll();
  const html = `
    <form id="form-expense" class="form-grid">
      <div class="form-group"><label>Data:</label><input type="date" id="exp-date" class="form-control" value="${todayISO()}" required></div>
      <div class="form-group"><label>Categoria:</label><select id="exp-cat" class="form-control">${EXPENSE_CATEGORIES.map(c => '<option>' + c + '</option>').join('')}</select></div>
      <div class="form-group"><label>Descrição:</label><input type="text" id="exp-desc" class="form-control" placeholder="Ex.: 50 kg de açúcar" required></div>
      <div class="form-group"><label>Valor total (R$):</label><input type="number" id="exp-value" class="form-control" min="0.01" step="0.01" required></div>
      <div class="form-group"><label>Apiário (opcional):</label><select id="exp-apiary" class="form-control"><option value="">Geral</option>${data.apiaries.map(a => '<option value="' + a.id + '">' + esc(a.name) + '</option>').join('')}</select></div>
      <div class="form-group"><label>Tipo:</label><select id="exp-type" class="form-control"><option>Variável</option><option>Fixo</option></select></div>
      <div class="form-group"><label>Parcelas (mensais):</label><input type="number" id="exp-inst" class="form-control" min="1" max="36" step="1" value="1"></div>
      <div class="form-group"><label><input type="checkbox" id="exp-invest"> Investimento (equipamento/caixas)</label></div>
      <div style="grid-column:1 / -1; display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.5rem;">
        <button type="button" class="btn btn-secondary" id="btn-cancel-exp">Cancelar</button>
        <button type="submit" class="btn btn-primary">Salvar Gasto</button>
      </div>
    </form>`;
  openModal('🧮 Novo Gasto', html);
  document.getElementById('btn-cancel-exp').addEventListener('click', closeModal);
  document.getElementById('form-expense').addEventListener('submit', e => {
    e.preventDefault();
    const total = parseFloat(document.getElementById('exp-value').value);
    const n = Math.max(1, parseInt(document.getElementById('exp-inst').value, 10) || 1);
    if (!total || total <= 0) { alert('Informe um valor válido.'); return; }
    const [y, m, d] = document.getElementById('exp-date').value.split('-').map(Number);
    const base = {
      category: document.getElementById('exp-cat').value,
      apiaryId: document.getElementById('exp-apiary').value,
      type: document.getElementById('exp-type').value,
      investment: document.getElementById('exp-invest').checked
    };
    const desc = document.getElementById('exp-desc').value.trim();
    for (let i = 0; i < n; i++) {
      const dt = new Date(y, m - 1 + i, Math.min(d, 28), 12);
      FinStore.save(FIN_KEYS.EXPENSES, Object.assign({}, base, {
        date: dt.toISOString().split('T')[0],
        desc: n > 1 ? desc + ' (' + (i + 1) + '/' + n + ')' : desc,
        value: Math.round((total / n) * 100) / 100
      }), 'exp');
    }
    closeModal();
    renderApp();
  });
}

// ==========================================================================
// 4. MÓDULO MANEJO (alimentação, tratamentos, pesagem, divisão), TAREFAS E RELATÓRIO (v1.4.0)
// ==========================================================================

const MAN_KEYS = { MAN: 'apisapp_manejo', TASKS: 'apisapp_tasks' };
const MAN_KINDS = { alim: '🍬 Alimentação', trat: '💊 Tratamento', peso: '⚖️ Pesagem', divisao: '🔀 Divisão/Junção' };
let manFilter = 'all';

const FOOD_KEY = 'apisapp_foodtypes';

function foodUnitCost(f, ins) {
  if (f.ingredients && f.ingredients.length && f.yieldQty > 0) {
    const tot = f.ingredients.reduce((s, g) => { const it = ins.find(x => x.id === g.insId); return s + (it ? convUnit(g.qty, g.un, it.unit) * (it.cost || 0) : 0); }, 0);
    return tot / f.yieldQty;
  }
  return f.cost || 0;
}

function deductFoodStock(itens, n) {
  const foods = FinStore.get(FOOD_KEY);
  const ins = FinStore.get('apisapp_insumos');
  itens.forEach(i => {
    const f = foods.find(x => x.id === i.foodId);
    if (!f || !f.ingredients || !f.ingredients.length || !f.yieldQty) return;
    const frac = convUnit(i.qtd * n, i.un, f.unit) / f.yieldQty;
    f.ingredients.forEach(g => {
      const it = ins.find(x => x.id === g.insId);
      if (it) it.qty = Math.round((it.qty - convUnit(g.qty * frac, g.un, it.unit)) * 1000) / 1000;
    });
  });
  FinStore.put('apisapp_insumos', ins);
}

function openFoodTypesModal(editId) {
  const list = FinStore.get(FOOD_KEY);
  const ins = FinStore.get('apisapp_insumos');
  const ed = list.find(x => x.id === editId) || { name: '', unit: 'L', yieldQty: '', waterL: '', cost: '', ingredients: [] };
  const bs = 'padding:0.3rem 0.6rem; font-size:0.75rem;';
  const unitOpts = sel => ['L', 'ml', 'kg', 'g', 'un'].map(u => '<option' + (u === sel ? ' selected' : '') + '>' + u + '</option>').join('');
  const table = list.length
    ? '<table class="data-table"><thead><tr><th>Alimento / receita</th><th>Rende</th><th>Custo</th><th></th></tr></thead><tbody>' + list.map(f =>
        '<tr><td><strong>' + esc(f.name) + '</strong>' + (f.ingredients && f.ingredients.length ? '<br><small style="color:var(--slate-400);">' + f.ingredients.map(g => { const it = ins.find(x => x.id === g.insId); return esc(it ? it.name : '?') + ' ' + g.qty + ' ' + esc(g.un); }).join(' + ') + (f.waterL ? ' + água ' + f.waterL + ' L' : '') + '</small>' : '') + '</td><td>' + (f.yieldQty ? f.yieldQty + ' ' + esc(f.unit) : '-') + '</td><td>' + brl(foodUnitCost(f, ins)) + ' / ' + esc(f.unit) + '</td><td style="white-space:nowrap;"><button type="button" class="btn btn-secondary ft-edit" data-id="' + f.id + '" style="' + bs + '">✏️</button> <button type="button" class="btn btn-danger ft-del" data-id="' + f.id + '" style="' + bs + '">🗑️</button></td></tr>').join('') + '</tbody></table>'
    : '<div style="color:var(--slate-400); padding:0.5rem;">Nenhum tipo cadastrado.</div>';
  openModal('🍬 Tipos de alimentação (receitas)', `
    <div class="table-responsive">${table}</div>
    <form id="form-food" class="form-grid" style="margin-top:1rem;">
      <div class="form-group"><label>${editId ? 'Editando:' : 'Novo alimento:'}</label><input type="text" id="ft-name" class="form-control" value="${esc(ed.name)}" placeholder="Ex.: Xarope 1:1, Proteico" required></div>
      <div class="form-group"><label>Unidade do produto pronto:</label><select id="ft-unit" class="form-control">${unitOpts(ed.unit)}</select></div>
      <div style="grid-column:1 / -1;">
        <label style="font-weight:600;">Receita — matéria-prima do estoque de Insumos (opcional):</label>
        <div id="ft-ings"></div>
        <button type="button" class="btn btn-secondary" id="ft-add-ing" style="font-size:0.8rem;">+ Ingrediente</button>
      </div>
      <div class="form-group"><label>Água usada (L):</label><input type="number" id="ft-water" class="form-control" min="0" step="any" value="${ed.waterL || ''}"></div>
      <div class="form-group"><label>Rendimento: quanto fica pronto (na unidade acima):</label><input type="number" id="ft-yield" class="form-control" min="0" step="any" value="${ed.yieldQty || ''}"><button type="button" class="btn btn-secondary" id="ft-est" style="font-size:0.75rem; margin-top:0.3rem;">🧮 Estimar volume do xarope</button></div>
      <div class="form-group"><label>Custo fixo por unidade (R$) — só se não usar receita:</label><input type="number" id="ft-cost" class="form-control" min="0" step="0.0001" value="${ed.cost || ''}"></div>
      <div style="grid-column:1 / -1; display:flex; justify-content:flex-end; gap:0.75rem;">
        <button type="button" class="btn btn-secondary" id="ft-close">Fechar</button>
        <button type="submit" class="btn btn-primary">${editId ? 'Salvar' : '+ Adicionar'}</button>
      </div>
    </form>`);
  const ingBox = document.getElementById('ft-ings');
  const insOptsF = ins.map(i => '<option value="' + i.id + '" data-un="' + esc(i.unit) + '">' + esc(i.name) + ' (' + esc(i.unit) + ')</option>').join('');
  const addIng = g => {
    ingBox.insertAdjacentHTML('beforeend', '<div class="ing-row" style="display:grid; grid-template-columns:minmax(0,2fr) minmax(0,1fr) minmax(0,1fr) auto; gap:0.4rem; margin-bottom:0.4rem;"><select class="form-control g-ins" style="min-width:0;">' + insOptsF + '</select><input type="number" class="form-control g-qty" min="0" step="any" placeholder="Qtd" style="min-width:0;"><select class="form-control g-un" style="min-width:0;">' + unitOpts(g ? g.un : (ins[0] ? ins[0].unit : 'kg')) + '</select><button type="button" class="btn btn-danger g-del">✕</button></div>');
    const row = ingBox.lastElementChild;
    if (g) { row.querySelector('.g-ins').value = g.insId; row.querySelector('.g-qty').value = g.qty; }
    row.querySelector('.g-ins').addEventListener('change', e => { row.querySelector('.g-un').value = e.target.selectedOptions[0].dataset.un; });
    row.querySelector('.g-del').addEventListener('click', () => row.remove());
  };
  (ed.ingredients || []).forEach(addIng);
  document.getElementById('ft-add-ing').addEventListener('click', () => {
    if (!ins.length) { alert('Cadastre antes a matéria-prima (açúcar, milho, soja...) na aba 📦 Insumos, com o custo.'); return; }
    addIng();
  });
  document.getElementById('ft-est').addEventListener('click', () => {
    if (document.getElementById('ft-unit').value !== 'L') { alert('A estimativa vale para xarope em litros.'); return; }
    let sugarKg = 0;
    ingBox.querySelectorAll('.ing-row').forEach(r => {
      const it = ins.find(x => x.id === r.querySelector('.g-ins').value);
      if (it && /a[çc][uú]car/i.test(it.name)) sugarKg += convUnit(parseFloat(r.querySelector('.g-qty').value) || 0, r.querySelector('.g-un').value, 'kg');
    });
    const water = parseFloat(document.getElementById('ft-water').value) || 0;
    if (!sugarKg || !water) { alert('Informe o açúcar nos ingredientes e a água usada em litros.'); return; }
    document.getElementById('ft-yield').value = (water + 0.63 * sugarKg).toFixed(2);
  });
  document.getElementById('ft-close').addEventListener('click', () => { closeModal(); renderApp(); });
  document.getElementById('form-food').addEventListener('submit', e => {
    e.preventDefault();
    const ingredients = Array.from(ingBox.querySelectorAll('.ing-row')).map(r => ({ insId: r.querySelector('.g-ins').value, qty: parseFloat(r.querySelector('.g-qty').value) || 0, un: r.querySelector('.g-un').value })).filter(g => g.insId && g.qty > 0);
    const yieldQty = parseFloat(document.getElementById('ft-yield').value) || 0;
    if (ingredients.length && !yieldQty) { alert('Informe o rendimento (ou use Estimar volume).'); return; }
    const rec = { name: document.getElementById('ft-name').value.trim(), unit: document.getElementById('ft-unit').value, ingredients, waterL: parseFloat(document.getElementById('ft-water').value) || 0, yieldQty, cost: parseFloat(document.getElementById('ft-cost').value) || 0 };
    if (editId) rec.id = editId;
    FinStore.save(FOOD_KEY, rec, 'food');
    openFoodTypesModal();
  });
  document.querySelectorAll('.ft-edit').forEach(b => b.addEventListener('click', () => openFoodTypesModal(b.dataset.id)));
  document.querySelectorAll('.ft-del').forEach(b => b.addEventListener('click', () => {
    if (confirm('Excluir este tipo? Registros antigos não são alterados.')) { FinStore.del(FOOD_KEY, b.dataset.id); openFoodTypesModal(); }
  }));
}

function convUnit(q, from, to) {
  const f = { g: ['m', 1], kg: ['m', 1000], ml: ['v', 1], l: ['v', 1000] };
  const a = f[String(from).toLowerCase()], b = f[String(to).toLowerCase()];
  return (a && b && a[0] === b[0]) ? q * a[1] / b[1] : q;
}

function manDetail(r, all) {
  if (r.kind === 'alim') return (r.itens && r.itens.length ? r.itens.map(i => esc(i.tipo) + ' ' + i.qtd + ' ' + esc(i.un)).join(' + ') : esc(r.tipo) + ' ' + r.qtd) + ' por colmeia';
  if (r.kind === 'trat') return esc(r.produto) + (r.dose ? ' (' + esc(r.dose) + ')' : '') + (r.motivo ? ' — ' + esc(r.motivo) : '') + (r.carenciaAte ? '<br><small style="color:var(--honey-400);">Carência até ' + fmtDate(r.carenciaAte) + '</small>' : '');
  if (r.kind === 'peso') {
    const prev = all.filter(x => x.kind === 'peso' && x.hiveId === r.hiveId && x.date < r.date).sort((a, b) => b.date.localeCompare(a.date))[0];
    const d = prev ? r.pesoKg - prev.pesoKg : null;
    return r.pesoKg + ' kg' + (d === null ? '' : ' <small style="color:' + (d >= 0 ? 'var(--emerald-500)' : 'var(--rose-500)') + ';">(' + (d >= 0 ? '+' : '') + d.toFixed(1) + ' kg)</small>');
  }
  return esc(r.sub) + (r.destino ? ' → ' + esc(r.destino) : '') + (r.notas ? ' — ' + esc(r.notas) : '');
}

function renderManejoView(data) {
  const recs = FinStore.get(MAN_KEYS.MAN);
  const tasks = FinStore.get(MAN_KEYS.TASKS);
  const pend = tasks.filter(t => !t.done).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const t = todayISO();
  const ym = t.slice(0, 7);
  const carencia = recs.filter(r => r.kind === 'trat' && r.carenciaAte && r.carenciaAte >= t);
  const shown = recs.filter(r => manFilter === 'all' || r.kind === manFilter).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const btnS = 'padding:0.3rem 0.6rem; font-size:0.75rem;';
  const stat = (title, val, color) => '<div class="stat-card"><div class="stat-title">' + title + '</div><div class="stat-value" style="color:' + color + '; font-size:1.4rem;">' + val + '</div></div>';

  return `
    <div class="glass-panel">
      <div class="section-header">
        <div>
          <h2 class="section-title">🛠️ Manejo & Tarefas</h2>
          <p style="color:var(--slate-400); font-size:0.9rem;">Alimentação, tratamentos com carência, pesagem, divisão/junção de enxames e lembretes.</p>
        </div>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          ${Object.keys(MAN_KINDS).map(k => '<button class="btn btn-primary btn-new-man" data-kind="' + k + '">+ ' + MAN_KINDS[k] + '</button>').join('')}
          <button class="btn btn-secondary" id="btn-new-task">⏰ Tarefa</button>
          <button class="btn btn-secondary" id="btn-food-types">🍬 Tipos de alimentação</button>
          <button class="btn btn-secondary" id="btn-report">🖨️ Relatório anual</button>
        </div>
      </div>

      <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); margin-bottom:1.5rem;">
        ${stat('Alimentações no mês', recs.filter(r => r.kind === 'alim' && r.date.startsWith(ym)).length, 'var(--honey-400)')}
        ${stat('Colmeias em carência', new Set(carencia.map(r => r.hiveId)).size, carencia.length ? 'var(--rose-500)' : 'var(--emerald-500)')}
        ${stat('Tarefas pendentes', pend.length, '#fff')}
      </div>

      <h3 style="color:var(--honey-400); margin-bottom:0.5rem;">⏰ Tarefas e Lembretes</h3>
      <div style="margin-bottom:1.5rem;">
        ${pend.length === 0 ? '<div style="color:var(--slate-400); padding:0.5rem;">Nenhuma tarefa pendente.</div>' : pend.map(k => '<div style="display:flex; align-items:center; gap:0.6rem; padding:0.4rem 0.6rem; background:rgba(30,41,59,0.4); border-radius:8px; margin-bottom:0.4rem;"><button class="btn btn-primary btn-task-done" data-id="' + k.id + '" style="' + btnS + '">✔</button><span style="flex:1;' + (k.date < t ? ' color:var(--rose-500);' : '') + '">' + esc(k.title) + (k.hiveCode ? ' <small>(' + esc(k.hiveCode) + ')</small>' : '') + '</span><small>' + fmtDate(k.date) + (k.date < t ? ' ⚠️' : '') + '</small><button class="btn btn-danger btn-task-del" data-id="' + k.id + '" style="' + btnS + '">🗑️</button></div>').join('')}
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
        <h3 style="color:var(--honey-400); margin:0;">📒 Registros de Manejo</h3>
        <select id="man-filter" class="form-control" style="width:auto;"><option value="all">Todos</option>${Object.keys(MAN_KINDS).map(k => '<option value="' + k + '"' + (manFilter === k ? ' selected' : '') + '>' + MAN_KINDS[k] + '</option>').join('')}</select>
      </div>
      <div class="table-responsive">
        ${shown.length === 0 ? '<div style="padding:1.5rem; color:var(--slate-400);">Nenhum registro.</div>' : `
        <table class="data-table"><thead><tr><th>Data</th><th>Tipo</th><th>Colmeia</th><th>Detalhes</th><th></th></tr></thead><tbody>
          ${shown.map(r => '<tr><td>' + fmtDate(r.date) + '</td><td>' + MAN_KINDS[r.kind] + '</td><td>' + esc(r.hiveCode || '-') + '</td><td>' + manDetail(r, recs) + '</td><td><button class="btn btn-danger btn-man-del" data-id="' + r.id + '" style="' + btnS + '">🗑️</button></td></tr>').join('')}
        </tbody></table>`}
      </div>
    </div>`;
}

function bindManejoEvents() {
  const $ = id => document.getElementById(id);
  document.querySelectorAll('.btn-new-man').forEach(b => b.addEventListener('click', () => openManejoModal(b.dataset.kind)));
  $('man-filter')?.addEventListener('change', e => { manFilter = e.target.value; renderApp(); });
  $('btn-report')?.addEventListener('click', openAnnualReport);
  $('btn-food-types')?.addEventListener('click', openFoodTypesModal);
  $('btn-new-task')?.addEventListener('click', () => {
    const title = (prompt('Tarefa / lembrete (ex.: revisar apiário Sede):') || '').trim();
    if (!title) return;
    const date = (prompt('Data (AAAA-MM-DD):', todayISO()) || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { alert('Data inválida. Use o formato AAAA-MM-DD.'); return; }
    const code = (prompt('Código da colmeia (opcional):') || '').trim();
    FinStore.save(MAN_KEYS.TASKS, { title, date, hiveCode: code, done: false }, 'task');
    renderApp();
  });
  document.querySelectorAll('.btn-task-done').forEach(b => b.addEventListener('click', () => {
    const k = FinStore.get(MAN_KEYS.TASKS).find(x => x.id === b.dataset.id);
    if (k) { k.done = true; FinStore.save(MAN_KEYS.TASKS, k, 'task'); renderApp(); }
  }));
  document.querySelectorAll('.btn-task-del').forEach(b => b.addEventListener('click', () => { FinStore.del(MAN_KEYS.TASKS, b.dataset.id); renderApp(); }));
  document.querySelectorAll('.btn-man-del').forEach(b => b.addEventListener('click', () => {
    if (confirm('Excluir este registro?')) { FinStore.del(MAN_KEYS.MAN, b.dataset.id); renderApp(); }
  }));
}

function openManejoModal(kind) {
  const data = ApisStorage.getAll();
  if (!data.hives.length) { alert('Cadastre ao menos uma colmeia antes de registrar manejo.'); return; }
  const hiveOpts = data.hives.map(h => '<option value="' + h.id + '" data-ap="' + h.apiaryId + '">' + esc(h.code) + ' — ' + esc(h.name) + '</option>').join('');
  let extra = '';
  if (kind === 'alim') extra = `
      <div style="grid-column:1 / -1;">
        <label style="font-weight:600;">Alimentos fornecidos neste dia (quantidade por colmeia):</label>
        <div id="alim-rows"></div>
        <button type="button" class="btn btn-secondary" id="btn-add-alim" style="font-size:0.8rem;">+ Outro alimento</button>
      </div>
      <div class="form-group"><label>Custo total (R$) — calculado pelos tipos cadastrados, pode ajustar:</label><input type="number" id="m-custo" class="form-control" min="0" step="0.01"><small id="m-custo-hint" style="color:var(--slate-400);"></small></div>`;
  if (kind === 'trat') extra = `
      <div class="form-group"><label>Produto:</label><input type="text" id="m-produto" class="form-control" required></div>
      <div class="form-group"><label>Dose:</label><input type="text" id="m-dose" class="form-control"></div>
      <div class="form-group"><label>Motivo / praga:</label><input type="text" id="m-motivo" class="form-control" placeholder="Ex.: traça, formiga"></div>
      <div class="form-group"><label>Carência (dias sem colher mel):</label><input type="number" id="m-carencia" class="form-control" min="0" step="1" value="0"></div>`;
  if (kind === 'peso') extra = `<div class="form-group"><label>Peso da colmeia (kg):</label><input type="number" id="m-peso" class="form-control" min="0" step="0.1" required></div>`;
  if (kind === 'divisao') extra = `
      <div class="form-group"><label>Operação:</label><select id="m-sub" class="form-control"><option>Divisão</option><option>Captura de enxame</option><option>Junção</option></select></div>
      <div class="form-group"><label>Destino / nova colmeia:</label><input type="text" id="m-destino" class="form-control" placeholder="Código ou descrição"></div>
      <div class="form-group"><label>Notas:</label><input type="text" id="m-notas" class="form-control"></div>`;
  const allOpt = kind === 'divisao' ? '' : '<option value="__all__">Todas do apiário</option>';
  openModal(MAN_KINDS[kind], `
    <form id="form-man" class="form-grid">
      <div class="form-group"><label>Data:</label><input type="date" id="m-date" class="form-control" value="${todayISO()}" required></div>
      <div class="form-group"><label>Apiário:</label><select id="m-ap" class="form-control">${data.apiaries.map(a => '<option value="' + a.id + '">' + esc(a.name) + '</option>').join('')}</select></div>
      <div class="form-group"><label>Colmeia${kind === 'divisao' ? ' (origem)' : ''}:</label><select id="m-hive" class="form-control">${allOpt}${hiveOpts}</select></div>
      ${extra}
      <div style="grid-column:1 / -1; display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.5rem;">
        <button type="button" class="btn btn-secondary" id="btn-cancel-man">Cancelar</button>
        <button type="submit" class="btn btn-primary">Salvar</button>
      </div>
    </form>`);
  const apSel = document.getElementById('m-ap'), hvSel = document.getElementById('m-hive');
  const filterHives = () => {
    Array.from(hvSel.options).forEach(o => { o.hidden = o.value !== '__all__' && o.dataset.ap !== apSel.value; });
    const first = Array.from(hvSel.options).find(o => !o.hidden);
    if (first) hvSel.value = first.value;
  };
  apSel.addEventListener('change', filterHives);
  filterHives();
  if (kind === 'alim') {
    const insOpts = '<option value="">Sem baixa no estoque</option>' + FinStore.get('apisapp_insumos').map(i => '<option value="' + i.id + '">' + esc(i.name) + ' (' + i.qty + ' ' + esc(i.unit) + ')</option>').join('');
    const foods = FinStore.get(FOOD_KEY);
    const insAll = FinStore.get('apisapp_insumos');
    const typeOpts = (foods.length
      ? foods.map(f => '<option value="' + f.id + '" data-un="' + esc(f.unit) + '" data-cost="' + foodUnitCost(f, insAll) + '">' + esc(f.name) + '</option>')
      : ['Xarope 1:1', 'Xarope 2:1', 'Proteico', 'Candi'].map(n => '<option value="' + n + '" data-un="' + (/Xarope/.test(n) ? 'L' : 'g') + '" data-cost="0">' + n + '</option>')
    ).join('') + '<option value="__other__" data-un="L" data-cost="0">Outro (sem custo cadastrado)</option>';
    const rowsEl = document.getElementById('alim-rows');
    const custoEl = document.getElementById('m-custo');
    custoEl.addEventListener('input', () => { custoEl.dataset.manual = '1'; });
    const targetCount = () => hvSel.value === '__all__' ? data.hives.filter(x => x.apiaryId === apSel.value).length : 1;
    const recalcCost = () => {
      let per = 0;
      const n = targetCount();
      rowsEl.querySelectorAll('.alim-row').forEach(r => {
        const sel = r.querySelector('.a-tipo');
        const opt = sel.selectedOptions[0];
        const qty = parseFloat(r.querySelector('.a-qtd').value) || 0;
        const un = r.querySelector('.a-un').value;
        per += convUnit(qty, un, opt.dataset.un) * (parseFloat(opt.dataset.cost) || 0);
        const f = foods.find(x => x.id === sel.value);
        let hint = '';
        if (f && f.ingredients && f.ingredients.length && f.yieldQty) {
          const frac = convUnit(qty * n, un, f.unit) / f.yieldQty;
          hint = 'Desconta do estoque: ' + f.ingredients.map(g => { const it = insAll.find(x => x.id === g.insId); return it ? esc(it.name) + ' ' + (Math.round(convUnit(g.qty * frac, g.un, it.unit) * 1000) / 1000) + ' ' + esc(it.unit) : ''; }).filter(Boolean).join(' · ');
        }
        r.querySelector('.a-stock-hint').innerHTML = hint;
      });
      if (!custoEl.dataset.manual) custoEl.value = per * n > 0 ? (per * n).toFixed(2) : '';
      document.getElementById('m-custo-hint').textContent = per > 0 ? 'Calculado: ' + brl(per) + ' por colmeia × ' + n + ' colmeia(s)' : (foods.length ? '' : 'Cadastre os tipos de alimentação (botão 🍬) para calcular o custo automaticamente.');
    };
    const addRow = () => {
      rowsEl.insertAdjacentHTML('beforeend', '<div class="alim-row" style="display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:0.5rem; margin-bottom:0.75rem; padding-bottom:0.75rem; border-bottom:1px dashed var(--slate-700);">' +
        '<div style="grid-column:1 / -1; min-width:0;"><select class="form-control a-tipo" style="width:100%;">' + typeOpts + '</select><input type="text" class="form-control a-outro" placeholder="Qual alimento?" style="display:none; margin-top:0.3rem; width:100%;"></div>' +
        '<input type="number" class="form-control a-qtd" min="0" step="any" placeholder="Quantidade" value="1" style="min-width:0; width:100%;">' +
        '<select class="form-control a-un" style="min-width:0; width:100%;"><option>L</option><option>ml</option><option>kg</option><option>g</option></select>' +
        '<div class="a-stock-hint" style="grid-column:1 / -1; font-size:0.78rem; color:var(--slate-400);"></div>' +
        '<button type="button" class="btn btn-danger a-del" style="grid-column:1 / -1;">✕ Remover</button></div>');
      const row = rowsEl.lastElementChild;
      const tipo = row.querySelector('.a-tipo');
      row.querySelector('.a-un').value = tipo.selectedOptions[0].dataset.un;
      tipo.addEventListener('change', () => {
        row.querySelector('.a-outro').style.display = tipo.value === '__other__' ? 'block' : 'none';
        row.querySelector('.a-un').value = tipo.selectedOptions[0].dataset.un;
        recalcCost();
      });
      row.querySelector('.a-qtd').addEventListener('input', recalcCost);
      row.querySelector('.a-un').addEventListener('change', recalcCost);
      row.querySelector('.a-del').addEventListener('click', () => { if (rowsEl.children.length > 1) { row.remove(); recalcCost(); } });
      recalcCost();
    };
    addRow();
    document.getElementById('btn-add-alim').addEventListener('click', addRow);
    apSel.addEventListener('change', recalcCost);
    hvSel.addEventListener('change', recalcCost);
  }
  document.getElementById('btn-cancel-man').addEventListener('click', closeModal);
  document.getElementById('form-man').addEventListener('submit', e => {
    e.preventDefault();
    const date = document.getElementById('m-date').value;
    const apId = apSel.value;
    const targets = hvSel.value === '__all__' ? data.hives.filter(h => h.apiaryId === apId) : data.hives.filter(h => h.id === hvSel.value);
    if (!targets.length) { alert('Nenhuma colmeia neste apiário.'); return; }
    const v = id => (document.getElementById(id) || {}).value;
    const itens = kind === 'alim' ? Array.from(document.querySelectorAll('.alim-row')).map(r => {
      const sel = r.querySelector('.a-tipo');
      const opt = sel.selectedOptions[0];
      const un = r.querySelector('.a-un').value;
      const qtd = parseFloat(r.querySelector('.a-qtd').value) || 0;
      return {
        tipo: sel.value === '__other__' ? (r.querySelector('.a-outro').value.trim() || 'Outro') : opt.textContent,
        qtd, un, foodId: sel.value,
        custo: convUnit(qtd, un, opt.dataset.un) * (parseFloat(opt.dataset.cost) || 0)
      };
    }).filter(i => i.qtd > 0) : [];
    if (kind === 'alim' && !itens.length) { alert('Informe ao menos um alimento com quantidade.'); return; }
    targets.forEach(h => {
      const r = { date, kind, hiveId: h.id, hiveCode: h.code, apiaryId: h.apiaryId };
      if (kind === 'alim') r.itens = itens.map(i => ({ tipo: i.tipo, qtd: i.qtd, un: i.un, custo: Math.round(i.custo * 100) / 100 }));
      if (kind === 'trat') {
        const dias = parseInt(v('m-carencia'), 10) || 0;
        const fim = new Date(date + 'T12:00:00'); fim.setDate(fim.getDate() + dias);
        Object.assign(r, { produto: v('m-produto').trim(), dose: v('m-dose').trim(), motivo: v('m-motivo').trim(), carenciaAte: dias ? fim.toISOString().split('T')[0] : '' });
      }
      if (kind === 'peso') r.pesoKg = parseFloat(v('m-peso')) || 0;
      if (kind === 'divisao') Object.assign(r, { sub: v('m-sub'), destino: v('m-destino').trim(), notas: v('m-notas').trim() });
      FinStore.save(MAN_KEYS.MAN, r, 'man');
    });
    if (kind === 'alim') deductFoodStock(itens, targets.length);
    const custo = parseFloat(v('m-custo')) || 0;
    if (kind === 'alim' && custo > 0) {
      FinStore.save(FIN_KEYS.EXPENSES, { date, category: EXPENSE_CATEGORIES[0], desc: 'Alimentação ' + itens.map(i => i.tipo).join(' + '), value: custo, apiaryId: apId, type: 'Variável', investment: false }, 'exp');
    }
    closeModal();
    renderApp();
  });
}

// ---------- Relatório anual (imprimir / salvar em PDF) ----------
function openAnnualReport() {
  const year = (prompt('Ano do relatório:', String(new Date().getFullYear())) || '').trim();
  if (!/^\d{4}$/.test(year)) return;
  const data = ApisStorage.getAll();
  const info = ApisStorage.getApicultorInfo() || {};
  const inY = d => String(d || '').startsWith(year);
  const harv = data.harvests.filter(h => inY(h.date));
  const vend = data.sales.filter(s => inY(s.date) && s.kind !== 'perda');
  const perdas = data.sales.filter(s => inY(s.date) && s.kind === 'perda');
  const exps = data.expenses.filter(e => inY(e.date));
  const man = FinStore.get(MAN_KEYS.MAN).filter(r => inY(r.date));
  const receita = sumBy(vend, saleTotal);
  const gastos = sumBy(exps.filter(e => !e.investment), e => e.value);
  const prods = {};
  harv.forEach(h => { prods[h.product] = (prods[h.product] || 0) + (parseFloat(h.quantityKg) || 0); });
  const row = (a, b) => '<tr><td>' + a + '</td><td style="text-align:right;">' + b + '</td></tr>';
  const html = '<html><head><meta charset="utf-8"><title>Relatório ' + year + '</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{color:#b45309}h2{border-bottom:2px solid #f59e0b;padding-bottom:4px;margin-top:22px}table{width:100%;border-collapse:collapse}td{padding:5px;border-bottom:1px solid #ddd}</style></head><body>' +
    '<h1>🍯 Relatório Anual ' + year + '</h1><p><strong>' + esc(info.nomeApicultor || '') + '</strong> — ' + esc(info.apiarioPrincipal || '') + '<br>Gerado em ' + fmtDate(todayISO()) + ' pelo ApisApp Pro</p>' +
    '<h2>Estrutura</h2><table>' + row('Apiários/núcleos', data.apiaries.length) + row('Colmeias', data.hives.length) + row('Rainhas cadastradas', data.queens.length) + row('Inspeções no ano', data.inspections.filter(i => inY(i.date)).length) + '</table>' +
    '<h2>Produção</h2><table>' + (Object.keys(prods).map(p => row(esc(p), prods[p].toFixed(2) + ' kg')).join('') || row('Sem colheitas', '-')) + '</table>' +
    '<h2>Vendas e Resultado</h2><table>' + row('Vendas realizadas', vend.length) + row('Quantidade vendida', sumBy(vend, saleKg).toFixed(2) + ' kg') + row('Perdas/amostras', sumBy(perdas, saleKg).toFixed(2) + ' kg') + row('Receita', brl(receita)) + row('Gastos operacionais', brl(gastos)) + row('Investimentos', brl(sumBy(exps.filter(e => e.investment), e => e.value))) + row('<strong>Lucro</strong>', '<strong>' + brl(receita - gastos) + '</strong>') + '</table>' +
    '<h2>Estoque atual por lote</h2><table>' + (lotStock(data).filter(x => x.balance > 0.0001).map(x => row('Lote ' + esc(x.h.batchNumber) + ' (' + esc(x.h.product) + ')', x.balance.toFixed(2) + ' kg')).join('') || row('Sem saldo', '-')) + '</table>' +
    '<h2>Manejo</h2><table>' + Object.keys(MAN_KINDS).map(k => row(MAN_KINDS[k], man.filter(r => r.kind === k).length)).join('') + '</table>' +
    '<script>window.onload=function(){window.print();}<\/script></body></html>';
  const w = window.open('', '_blank');
  if (!w) { alert('Permita pop-ups para gerar o relatório.'); return; }
  w.document.write(html);
  w.document.close();
}

// ---------- Alertas extras (tarefas e carência) ----------
function buildManejoAlerts() {
  const A = [];
  const t = todayISO();
  FinStore.get(MAN_KEYS.TASKS).filter(k => !k.done && k.date <= t).forEach(k => A.push('⏰ ' + (k.date < t ? 'Atrasada: ' : 'Hoje: ') + esc(k.title)));
  FinStore.get(MAN_KEYS.MAN).filter(r => r.kind === 'trat' && r.carenciaAte && r.carenciaAte >= t)
    .forEach(r => A.push('💊 ' + esc(r.hiveCode) + ' em carência até ' + fmtDate(r.carenciaAte) + ' — não colher mel desta colmeia'));
  return A;
}

// ==========================================================================
// 5. CLIMA REAL, FICHA DA COLMEIA + RANKING, ESTOQUE DE INSUMOS (v1.5.0)
// ==========================================================================

// ---------- Clima real (Open-Meteo, sem chave) ----------
function parseCoords(s) {
  const m = String(s || '').trim().match(/^([-+]?\d+(\.\d+)?),\s*([-+]?\d+(\.\d+)?)$/);
  return m ? { lat: +m[1], lon: +m[3] } : null;
}
function getWeatherCache() {
  try { return JSON.parse(localStorage.getItem('apisapp_weather') || 'null'); } catch (e) { return null; }
}
async function refreshWeather() {
  if (!navigator.onLine) return;
  const ap = ApisStorage.getApiaries().find(a => parseCoords(a.location));
  if (!ap) return;
  const c = getWeatherCache();
  if (c && Date.now() - c.at < 1800000) return;
  try {
    const co = parseCoords(ap.location);
    const r = await fetch('https://api.open-meteo.com/v1/forecast?latitude=' + co.lat + '&longitude=' + co.lon + '&current=temperature_2m,wind_speed_10m&daily=precipitation_sum&past_days=7&forecast_days=1&timezone=auto');
    const j = await r.json();
    const rain7 = (j.daily.precipitation_sum || []).slice(0, 7).reduce((a, b) => a + (b || 0), 0);
    localStorage.setItem('apisapp_weather', JSON.stringify({ at: Date.now(), temp: Math.round(j.current.temperature_2m), wind: Math.round(j.current.wind_speed_10m), rain7: Math.round(rain7), place: ap.name }));
    if (currentTab === 'dashboard') renderApp();
  } catch (e) { /* offline: mantém o último valor salvo */ }
}

// ---------- Estoque de insumos ----------
const INS_KEY = 'apisapp_insumos';

function renderInsumosView(data) {
  const list = FinStore.get(INS_KEY);
  const btnS = 'padding:0.3rem 0.6rem; font-size:0.75rem;';
  return `
    <div class="glass-panel">
      <div class="section-header">
        <div>
          <h2 class="section-title">📦 Estoque de Insumos</h2>
          <p style="color:var(--slate-400); font-size:0.9rem;">Açúcar, potes, rótulos, cera alveolada etc. Alimentações registradas podem dar baixa automática.</p>
        </div>
        <button class="btn btn-primary" id="btn-new-ins">+ Insumo</button>
      </div>
      <div class="table-responsive">
        ${list.length === 0 ? '<div style="padding:1.5rem; color:var(--slate-400);">Nenhum insumo cadastrado.</div>' : `
        <table class="data-table"><thead><tr><th>Insumo</th><th>Saldo</th><th>Custo</th><th>Mínimo</th><th>Situação</th><th>Ações</th></tr></thead><tbody>
          ${list.map(i => {
            const low = i.qty <= i.min;
            return '<tr><td><strong>' + esc(i.name) + '</strong></td><td>' + i.qty + ' ' + esc(i.unit) + '</td><td>' + brl(i.cost || 0) + ' / ' + esc(i.unit) + '</td><td>' + i.min + ' ' + esc(i.unit) + '</td><td>' + (low ? '<span class="status-badge status-atencao">Acabando</span>' : '<span class="status-badge status-ativa">OK</span>') + '</td><td style="white-space:nowrap;"><button class="btn btn-primary btn-ins-in" data-id="' + i.id + '" style="' + btnS + '">＋ Entrada</button> <button class="btn btn-secondary btn-ins-out" data-id="' + i.id + '" style="' + btnS + '">－ Baixa</button> <button class="btn btn-secondary btn-ins-cost" data-id="' + i.id + '" style="' + btnS + '" title="Atualizar custo">💲</button> <button class="btn btn-danger btn-ins-del" data-id="' + i.id + '" style="' + btnS + '">🗑️</button></td></tr>';
          }).join('')}
        </tbody></table>`}
      </div>
    </div>`;
}

function bindInsumosEvents() {
  const num = txt => parseFloat(String(prompt(txt) || '').replace(',', '.'));
  document.getElementById('btn-new-ins')?.addEventListener('click', () => {
    const name = (prompt('Nome do insumo (ex.: Açúcar, Pote 500 g, Rótulo):') || '').trim();
    if (!name) return;
    const unit = (prompt('Unidade (kg, L, un):', 'un') || 'un').trim();
    const qty = num('Quantidade atual:');
    const min = num('Quantidade mínima para alertar:');
    const cost = num('Custo por ' + unit + ' (R$):');
    FinStore.save(INS_KEY, { name, unit, qty: qty || 0, min: min || 0, cost: cost || 0 }, 'ins');
    renderApp();
  });
  const adjust = (id, sign) => {
    const it = FinStore.get(INS_KEY).find(x => x.id === id);
    const q = num(sign > 0 ? 'Quantidade que entrou:' : 'Quantidade que saiu:');
    if (!it || !q || q <= 0) return;
    it.qty = Math.round((it.qty + sign * q) * 1000) / 1000;
    if (sign > 0) { const c = parseFloat(String(prompt('Preço pago por ' + it.unit + ' (R$) — deixe vazio para manter:') || '').replace(',', '.')); if (!isNaN(c) && c >= 0) it.cost = c; }
    FinStore.save(INS_KEY, it, 'ins');
    renderApp();
  };
  document.querySelectorAll('.btn-ins-in').forEach(b => b.addEventListener('click', () => adjust(b.dataset.id, 1)));
  document.querySelectorAll('.btn-ins-out').forEach(b => b.addEventListener('click', () => adjust(b.dataset.id, -1)));
  document.querySelectorAll('.btn-ins-cost').forEach(b => b.addEventListener('click', () => {
    const it = FinStore.get(INS_KEY).find(x => x.id === b.dataset.id);
    const c = it ? parseFloat(String(prompt('Novo custo por ' + it.unit + ' (R$):', it.cost || 0) || '').replace(',', '.')) : NaN;
    if (it && !isNaN(c) && c >= 0) { it.cost = c; FinStore.save(INS_KEY, it, 'ins'); renderApp(); }
  }));
  document.querySelectorAll('.btn-ins-del').forEach(b => b.addEventListener('click', () => {
    if (confirm('Excluir este insumo?')) { FinStore.del(INS_KEY, b.dataset.id); renderApp(); }
  }));
}

// ---------- Ficha da colmeia + ranking de produtividade ----------
let hiveCardId = '';
let hiveCardChart = null;

function renderHiveCardView(data) {
  if (!data.hives.length) return '<div class="glass-panel"><h2 class="section-title">🐝 Fichas das Colmeias</h2><p style="color:var(--slate-400);">Cadastre colmeias para ver as fichas.</p></div>';
  if (!data.hives.some(h => h.id === hiveCardId)) hiveCardId = data.hives[0].id;
  const h = data.hives.find(x => x.id === hiveCardId);
  const ap = data.apiaries.find(a => a.id === h.apiaryId);
  const man = FinStore.get(MAN_KEYS.MAN);

  const ev = [];
  data.inspections.filter(i => i.hiveId === h.id).forEach(i => ev.push({ d: i.date, t: '📋 Inspeção', x: (i.actionsTaken || '') + (i.pestsFound ? ' · Pragas: ' + i.pestsFound : '') }));
  man.filter(r => r.hiveId === h.id).forEach(r => ev.push({ d: r.date, t: MAN_KINDS[r.kind], x: manDetail(r, man).replace(/<[^>]+>/g, ' ') }));
  data.harvests.filter(x => x.hiveId === h.id).forEach(x => ev.push({ d: x.date, t: '🍯 Colheita', x: x.product + ' ' + x.quantityKg + ' kg (lote ' + x.batchNumber + ')' }));
  ev.sort((a, b) => String(b.d).localeCompare(String(a.d)));

  const honeyBy = {};
  data.harvests.filter(x => x.product === 'Mel' && x.hiveId).forEach(x => { honeyBy[x.hiveId] = (honeyBy[x.hiveId] || 0) + (parseFloat(x.quantityKg) || 0); });
  const rank = data.hives.map(x => ({ x, kg: honeyBy[x.id] || 0 })).sort((a, b) => b.kg - a.kg);
  const unassigned = sumBy(data.harvests.filter(x => x.product === 'Mel' && !x.hiveId), x => parseFloat(x.quantityKg));
  const pesos = man.filter(r => r.kind === 'peso' && r.hiveId === h.id).length;

  return `
    <div class="glass-panel">
      <div class="section-header">
        <div>
          <h2 class="section-title">🐝 Ficha da Colmeia</h2>
          <p style="color:var(--slate-400); font-size:0.9rem;">Histórico completo e produtividade. Para o ranking, informe a colmeia ao registrar a colheita.</p>
        </div>
        <select id="hive-card-sel" class="form-control" style="width:auto;">${data.hives.map(x => '<option value="' + x.id + '"' + (x.id === h.id ? ' selected' : '') + '>' + esc(x.code) + ' — ' + esc(x.name) + '</option>').join('')}</select>
      </div>
      <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); margin-bottom:1.25rem;">
        <div class="stat-card"><div class="stat-title">Apiário</div><div class="stat-value" style="font-size:1.1rem;">${esc(ap ? ap.name : '-')}</div></div>
        <div class="stat-card"><div class="stat-title">Rainha</div><div class="stat-value" style="font-size:1.1rem;">👑 ${esc((h.queen && h.queen.year) || 'N/A')}</div></div>
        <div class="stat-card"><div class="stat-title">Status / Saúde</div><div class="stat-value" style="font-size:1.1rem;">${esc(h.status)} · ${esc(h.healthScore || '-')}</div></div>
        <div class="stat-card"><div class="stat-title">Mel da colmeia</div><div class="stat-value" style="font-size:1.1rem; color:var(--honey-400);">${(honeyBy[h.id] || 0).toFixed(1)} kg</div></div>
      </div>
      ${pesos > 1 ? '<div style="background:rgba(15,23,42,0.6); padding:1rem; border-radius:12px; border:1px solid var(--slate-700); margin-bottom:1.25rem;"><h4 style="color:var(--honey-400); margin-bottom:0.5rem;">⚖️ Curva de peso</h4><div style="position:relative; height:220px;"><canvas id="chart-hive-weight"></canvas></div></div>' : ''}
      <h3 style="color:var(--honey-400); margin-bottom:0.5rem;">🕒 Linha do tempo</h3>
      <div class="table-responsive" style="margin-bottom:1.5rem;">
        ${ev.length === 0 ? '<div style="padding:1rem; color:var(--slate-400);">Sem eventos para esta colmeia.</div>' : '<table class="data-table"><thead><tr><th>Data</th><th>Evento</th><th>Detalhes</th></tr></thead><tbody>' + ev.slice(0, 60).map(e => '<tr><td>' + fmtDate(e.d) + '</td><td>' + e.t + '</td><td>' + esc(e.x) + '</td></tr>').join('') + '</tbody></table>'}
      </div>
      <h3 style="color:var(--honey-400); margin-bottom:0.5rem;">🏆 Ranking de produtividade (mel)</h3>
      <div class="table-responsive">
        <table class="data-table"><thead><tr><th>#</th><th>Colmeia</th><th>Rainha</th><th>Mel (kg)</th></tr></thead><tbody>
          ${rank.map((r, i) => '<tr><td>' + (i + 1) + '</td><td>' + esc(r.x.code) + ' — ' + esc(r.x.name) + '</td><td>' + esc((r.x.queen && r.x.queen.year) || '-') + '</td><td><strong>' + r.kg.toFixed(1) + '</strong></td></tr>').join('')}
        </tbody></table>
      </div>
      ${unassigned > 0 ? '<div style="color:var(--slate-400); font-size:0.8rem; margin-top:0.5rem;">' + unassigned.toFixed(1) + ' kg de mel colhidos sem colmeia informada (não entram no ranking).</div>' : ''}
    </div>`;
}

function bindHiveCardEvents() {
  document.getElementById('hive-card-sel')?.addEventListener('change', e => { hiveCardId = e.target.value; renderApp(); });
  const cv = document.getElementById('chart-hive-weight');
  if (!cv || typeof Chart === 'undefined') return;
  if (hiveCardChart) hiveCardChart.destroy();
  const pts = FinStore.get(MAN_KEYS.MAN).filter(r => r.kind === 'peso' && r.hiveId === hiveCardId).sort((a, b) => a.date.localeCompare(b.date));
  Chart.defaults.color = '#94a3b8';
  hiveCardChart = new Chart(cv, { type: 'line', data: { labels: pts.map(p => fmtDate(p.date)), datasets: [{ label: 'Peso (kg)', data: pts.map(p => p.pesoKg), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.2)', fill: true, tension: 0.3 }] }, options: { responsive: true, maintainAspectRatio: false } });
}

// ==========================================================================
// 6. PLANEJAMENTO: PRECIFICAÇÃO, METAS, CAIXA, RECORRÊNCIA, DOCUMENTOS, CSV (v1.18.0)
// ==========================================================================

const REC_KEY = 'apisapp_recur';
const DOC_KEY = 'apisapp_docs';
const GOAL_KEY = 'apisapp_goals';
let planMargin = 40;

// Gera tarefas das regras recorrentes que venceram
function runRecurringTasks() {
  const t = todayISO();
  const rules = FinStore.get(REC_KEY);
  let changed = false;
  rules.forEach(r => {
    if (!r.nextDate || r.nextDate > t) return;
    const exists = FinStore.get(MAN_KEYS.TASKS).some(k => !k.done && k.ruleId === r.id);
    if (!exists) FinStore.save(MAN_KEYS.TASKS, { title: r.title, date: r.nextDate, hiveCode: r.hiveCode || '', done: false, ruleId: r.id }, 'task');
    let d = new Date(r.nextDate + 'T12:00:00');
    const step = Math.max(1, parseInt(r.everyDays, 10) || 30);
    while (d.toISOString().split('T')[0] <= t) d.setDate(d.getDate() + step);
    r.nextDate = d.toISOString().split('T')[0];
    changed = true;
  });
  if (changed) FinStore.put(REC_KEY, rules);
}

function downloadCSV(name, rows) {
  const csv = '\ufeff' + rows.map(r => r.map(c => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(';')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = name + '_' + todayISO() + '.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function renderPlanView(data) {
  const now = new Date();
  const yr = String(now.getFullYear());
  const t = todayISO();
  const gastos = sumBy(data.expenses.filter(e => !e.investment && String(e.date).startsWith(yr)), e => e.value);
  const melKg = sumBy(data.harvests.filter(h => h.product === 'Mel' && String(h.date).startsWith(yr)), h => parseFloat(h.quantityKg));
  const custoKg = melKg > 0 ? gastos / melKg : 0;
  const vend = data.sales.filter(s => s.kind !== 'perda' && String(s.date).startsWith(yr));
  const kgV = sumBy(vend, saleKg), rec = sumBy(vend, saleTotal);
  const medio = kgV > 0 ? rec / kgV : 0;
  const sug = planMargin < 100 ? custoKg / (1 - planMargin / 100) : 0;
  const goal = FinStore.get(GOAL_KEY).find(g => g.id === 'goal-' + yr) || { kg: 0, receita: 0 };
  const bar = (v, max) => {
    const p = max > 0 ? Math.min(100, Math.round(v / max * 100)) : 0;
    return '<div style="background:var(--slate-700); border-radius:6px; height:10px; margin:0.3rem 0;"><div style="width:' + p + '%; background:var(--honey-400); height:10px; border-radius:6px;"></div></div><small>' + p + '%</small>';
  };

  // Projeção de caixa (próximos 3 meses)
  const ym = t.slice(0, 7);
  const months = [0, 1, 2].map(i => { const d = new Date(now.getFullYear(), now.getMonth() + i, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); });
  let acc = 0;
  const cashRows = months.map(m => {
    const inflow = sumBy(data.sales.filter(s => s.kind !== 'perda' && !s.paid && ((s.dueDate || t).slice(0, 7) < ym ? ym : (s.dueDate || t).slice(0, 7)) === m), saleTotal);
    const out = sumBy(data.expenses.filter(e => e.date > t && e.date.slice(0, 7) === m), e => e.value);
    acc += inflow - out;
    return '<tr><td>' + m + '</td><td>' + brl(inflow) + '</td><td>' + brl(out) + '</td><td style="color:' + (inflow - out >= 0 ? 'var(--emerald-500)' : 'var(--rose-500)') + ';">' + brl(inflow - out) + '</td><td><strong>' + brl(acc) + '</strong></td></tr>';
  }).join('');

  const pk = getPackages();
  const rules = FinStore.get(REC_KEY);
  const docs = FinStore.get(DOC_KEY).sort((a, b) => String(a.expires).localeCompare(String(b.expires)));
  const btnS = 'padding:0.3rem 0.6rem; font-size:0.75rem;';
  const box = 'background:rgba(15,23,42,0.6); padding:1rem; border-radius:12px; border:1px solid var(--slate-700);';

  return `
    <div class="glass-panel">
      <div class="section-header">
        <div>
          <h2 class="section-title">🎯 Planejamento ${yr}</h2>
          <p style="color:var(--slate-400); font-size:0.9rem;">Preço sugerido, metas da safra, projeção de caixa, tarefas recorrentes, documentos e exportação.</p>
        </div>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button class="btn btn-secondary btn-csv" data-k="vendas">⬇️ CSV Vendas</button>
          <button class="btn btn-secondary btn-csv" data-k="gastos">⬇️ CSV Gastos</button>
          <button class="btn btn-secondary btn-csv" data-k="manejo">⬇️ CSV Manejo</button>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:1.25rem;">
        <div style="${box}">
          <h4 style="color:var(--honey-400); margin-bottom:0.5rem;">💲 Precificação do mel</h4>
          <div style="font-size:0.85rem; color:var(--slate-400);">Custo por kg (gastos do ano ÷ mel colhido): <strong style="color:#fff;">${brl(custoKg)}</strong> · Preço médio vendido: <strong style="color:#fff;">${brl(medio)}/kg</strong></div>
          <div class="form-group" style="margin:0.6rem 0;"><label>Margem desejada (%):</label><input type="number" id="plan-margin" class="form-control" min="0" max="95" step="1" value="${planMargin}"></div>
          ${custoKg > 0 ? '<table class="data-table"><thead><tr><th>Embalagem</th><th>Custo</th><th>Preço sugerido</th></tr></thead><tbody>' + pk.map(p => '<tr><td>' + esc(p.name) + '</td><td>' + brl(custoKg * p.kg) + '</td><td><strong>' + brl(sug * p.kg) + '</strong></td></tr>').join('') + '</tbody></table>' + (medio > 0 && medio < sug ? '<div style="color:var(--rose-500); font-size:0.8rem; margin-top:0.4rem;">⚠️ Seu preço médio está ' + brl(sug - medio) + '/kg abaixo do sugerido.</div>' : '') : '<div style="color:var(--slate-400);">Registre colheitas de mel e gastos no ano para calcular o custo por kg.</div>'}
        </div>

        <div style="${box}">
          <h4 style="color:var(--honey-400); margin-bottom:0.5rem;">🏁 Metas da safra <button class="btn btn-secondary" id="btn-goal" style="${btnS} margin-left:0.5rem;">Definir</button></h4>
          <div>Mel colhido: <strong>${melKg.toFixed(1)} kg</strong> / ${goal.kg || 0} kg</div>${bar(melKg, goal.kg)}
          <div style="margin-top:0.6rem;">Receita: <strong>${brl(rec)}</strong> / ${brl(goal.receita || 0)}</div>${bar(rec, goal.receita)}
        </div>

        <div style="${box}">
          <h4 style="color:var(--honey-400); margin-bottom:0.5rem;">💵 Projeção de caixa (3 meses)</h4>
          <table class="data-table"><thead><tr><th>Mês</th><th>A receber</th><th>Parcelas</th><th>Saldo</th><th>Acum.</th></tr></thead><tbody>${cashRows}</tbody></table>
          <small style="color:var(--slate-400);">Considera vendas a receber (vencidas entram no mês atual) e parcelas de gastos futuras.</small>
        </div>
      </div>

      <h3 style="color:var(--honey-400); margin:1.5rem 0 0.5rem;">🔁 Tarefas recorrentes <button class="btn btn-primary" id="btn-new-rule" style="${btnS} margin-left:0.5rem;">+ Regra</button></h3>
      ${rules.length === 0 ? '<div style="color:var(--slate-400);">Ex.: "Revisar apiário" a cada 15 dias; "Iniciar alimentação" a cada 365 dias.</div>' : rules.map(r => '<div style="display:flex; gap:0.6rem; align-items:center; padding:0.4rem 0.6rem; background:rgba(30,41,59,0.4); border-radius:8px; margin-bottom:0.4rem;"><span style="flex:1;">' + esc(r.title) + ' <small style="color:var(--slate-400);">a cada ' + r.everyDays + ' dias · próxima ' + fmtDate(r.nextDate) + '</small></span><button class="btn btn-danger btn-rule-del" data-id="' + r.id + '" style="' + btnS + '">🗑️</button></div>').join('')}

      <h3 style="color:var(--honey-400); margin:1.5rem 0 0.5rem;">📄 Documentos e validades <button class="btn btn-primary" id="btn-new-doc" style="${btnS} margin-left:0.5rem;">+ Documento</button></h3>
      ${docs.length === 0 ? '<div style="color:var(--slate-400);">Cadastre licenças, registros, laudos e certificados para ser avisado antes de vencerem.</div>' : docs.map(d => { const days = Math.floor((new Date(d.expires + 'T12:00:00') - now) / 864e5); return '<div style="display:flex; gap:0.6rem; align-items:center; padding:0.4rem 0.6rem; background:rgba(30,41,59,0.4); border-radius:8px; margin-bottom:0.4rem;"><span style="flex:1;">' + esc(d.name) + '</span><span class="status-badge ' + (days < 0 ? 'status-atencao' : days <= 30 ? 'status-atencao' : 'status-ativa') + '">' + (days < 0 ? 'Vencido' : days + ' dias') + ' · ' + fmtDate(d.expires) + '</span><button class="btn btn-danger btn-doc-del" data-id="' + d.id + '" style="' + btnS + '">🗑️</button></div>'; }).join('')}
    </div>`;
}

function bindPlanEvents() {
  const $ = id => document.getElementById(id);
  $('plan-margin')?.addEventListener('change', e => { planMargin = Math.min(95, Math.max(0, parseFloat(e.target.value) || 0)); renderApp(); });
  $('btn-goal')?.addEventListener('click', () => {
    const kg = parseFloat(String(prompt('Meta de mel do ano (kg):') || '').replace(',', '.'));
    const receita = parseFloat(String(prompt('Meta de receita do ano (R$):') || '').replace(',', '.'));
    FinStore.save(GOAL_KEY, { id: 'goal-' + new Date().getFullYear(), kg: kg || 0, receita: receita || 0 }, 'goal');
    renderApp();
  });
  $('btn-new-rule')?.addEventListener('click', () => {
    const title = (prompt('Tarefa recorrente (ex.: Revisar apiário Sede):') || '').trim();
    if (!title) return;
    const everyDays = parseInt(prompt('Repetir a cada quantos dias?', '15'), 10);
    const nextDate = (prompt('Primeira data (AAAA-MM-DD):', todayISO()) || '').trim();
    if (!everyDays || !/^\d{4}-\d{2}-\d{2}$/.test(nextDate)) { alert('Dados inválidos.'); return; }
    FinStore.save(REC_KEY, { title, everyDays, nextDate }, 'rec');
    runRecurringTasks();
    renderApp();
  });
  $('btn-new-doc')?.addEventListener('click', () => {
    const name = (prompt('Documento (ex.: Licença sanitária, Laudo de mel):') || '').trim();
    if (!name) return;
    const expires = (prompt('Validade (AAAA-MM-DD):') || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expires)) { alert('Data inválida.'); return; }
    FinStore.save(DOC_KEY, { name, expires }, 'doc');
    renderApp();
  });
  document.querySelectorAll('.btn-rule-del').forEach(b => b.addEventListener('click', () => { FinStore.del(REC_KEY, b.dataset.id); renderApp(); }));
  document.querySelectorAll('.btn-doc-del').forEach(b => b.addEventListener('click', () => { FinStore.del(DOC_KEY, b.dataset.id); renderApp(); }));
  document.querySelectorAll('.btn-csv').forEach(b => b.addEventListener('click', () => {
    const d = ApisStorage.getAll();
    const k = b.dataset.k;
    if (k === 'vendas') downloadCSV('vendas', [['Data', 'Tipo', 'Cliente/Motivo', 'Canal', 'Pagamento', 'Pago', 'Lote', 'Produto', 'Embalagem', 'Unidades', 'Preço unit.', 'Subtotal']]
      .concat(d.sales.flatMap(s => s.items.map(i => [fmtDate(s.date), s.kind, s.customerName || s.reason || '', s.channel || '', s.payment || '', s.paid ? 'Sim' : 'Não', i.batchNumber, i.product, i.pkgName, i.units, String(i.unitPrice).replace('.', ','), String(i.units * i.unitPrice).replace('.', ',')]))));
    if (k === 'gastos') downloadCSV('gastos', [['Data', 'Categoria', 'Descrição', 'Tipo', 'Investimento', 'Valor']]
      .concat(d.expenses.map(e => [fmtDate(e.date), e.category, e.desc, e.type, e.investment ? 'Sim' : 'Não', String(e.value).replace('.', ',')])));
    if (k === 'manejo') downloadCSV('manejo', [['Data', 'Tipo', 'Colmeia', 'Detalhes']]
      .concat(FinStore.get(MAN_KEYS.MAN).map(r => [fmtDate(r.date), MAN_KINDS[r.kind], r.hiveCode, manDetail(r, []).replace(/<[^>]+>/g, ' ')])));
  }));
}

// ==========================================================================
// 7. ESTOQUE DE CAIXAS E EQUIPAMENTOS (caixas vazias, melgueiras, coletores...) (v1.18.0)
// ==========================================================================

const EQ_KEY = 'apisapp_equip';
const EQ_CAT_KEY = 'apisapp_equipcats';
const EQ_ROLES_KEY = 'apisapp_eqroles';
const DEFAULT_ROLES = { box: 'Caixa (colmeia)', sup: 'Melgueira', col: 'Melgueira com coletor de própolis', big: 'Melgueirão', nest: 'Sobreninho' };
let BOX_CAT, SUPER_CAT, COLLECTOR_CAT, BIG_CAT, NEST_CAT;
function getEqRoles() {
  try { return Object.assign({}, DEFAULT_ROLES, JSON.parse(localStorage.getItem(EQ_ROLES_KEY) || '{}')); } catch (e) { return Object.assign({}, DEFAULT_ROLES); }
}
function loadEqRoles() {
  const r = getEqRoles();
  BOX_CAT = r.box; SUPER_CAT = r.sup; COLLECTOR_CAT = r.col; BIG_CAT = r.big; NEST_CAT = r.nest;
}
loadEqRoles();
let eqFilter = 'all';

const eqCats = () => Array.from(new Set([BOX_CAT, SUPER_CAT, COLLECTOR_CAT, BIG_CAT, NEST_CAT].concat(FinStore.get(EQ_CAT_KEY).map(c => c.name), FinStore.get(EQ_KEY).map(x => x.cat))));
const EQ_CFG_KEY = 'apisapp_eqcatcfg';
const getEqCfg = () => { try { return JSON.parse(localStorage.getItem(EQ_CFG_KEY) || '{}'); } catch (e) { return {}; } };
const setEqCfg = c => localStorage.setItem(EQ_CFG_KEY, JSON.stringify(c));
const eqIsNumbered = cat => { const c = getEqCfg(); if (c[cat] !== undefined) return !!c[cat]; return [SUPER_CAT, COLLECTOR_CAT, BIG_CAT, NEST_CAT].indexOf(cat) === -1; };
const EQ_HIVE_KEY = 'apisapp_eqcathive';
const getEqHiveCfg = () => { try { return JSON.parse(localStorage.getItem(EQ_HIVE_KEY) || '{}'); } catch (e) { return {}; } };
const setEqHiveCfg = c => localStorage.setItem(EQ_HIVE_KEY, JSON.stringify(c));
const eqInHive = cat => { const c = getEqHiveCfg(); return c[cat] !== undefined ? !!c[cat] : true; };
const eqSort = (a, b) => String(a.number).localeCompare(String(b.number), undefined, { numeric: true });
const eqHive = (it, hives) => it.hiveId ? hives.find(h => h.id === it.hiveId) : null;

// Coloca (ou devolve, com hiveId vazio) itens em uma colmeia e atualiza os contadores da colmeia
function equipSetHive(ids, hiveId) {
  const list = FinStore.get(EQ_KEY);
  const touched = new Set();
  let acc = false;
  list.forEach(it => {
    if (ids.indexOf(it.id) === -1) return;
    if (it.hiveId) touched.add(it.hiveId);
    it.hiveId = hiveId || '';
    if (hiveId) touched.add(hiveId);
    if (it.cat !== BOX_CAT) acc = true;
  });
  FinStore.put(EQ_KEY, list);
  if (!acc) return;
  touched.forEach(hid => {
    const hv = ApisStorage.getHives().find(h => h.id === hid);
    if (!hv) return;
    const mine = list.filter(x => x.hiveId === hid);
    const col = mine.filter(x => x.cat === COLLECTOR_CAT).length;
    const tracked = c => list.some(x => x.cat === c);
    if (tracked(COLLECTOR_CAT)) hv.collectorSupers = col;
    if (tracked(SUPER_CAT)) hv.supersCount = mine.filter(x => x.cat === SUPER_CAT).length + (hv.collectorSupers || 0);
    else if ((hv.collectorSupers || 0) > (hv.supersCount || 0)) hv.supersCount = hv.collectorSupers;
    if (tracked(BIG_CAT)) hv.supersBig = mine.filter(x => x.cat === BIG_CAT).length;
    if (tracked(NEST_CAT)) hv.nestExtenders = mine.filter(x => x.cat === NEST_CAT).length;
    if (!hv.propolisCollectors && col > 0) hv.propolisCollectors = col;
    if (col > 0) hv.propolisProducer = true;
    ApisStorage.saveHive(hv);
  });
}

function numberingPanelHtml(items, hives) {
  const fmt = (pre, n) => pre + String(n).padStart(2, '0');
  const blocks = [];
  eqCats().filter(c => eqIsNumbered(c)).forEach(cat => {
    const groups = {};
    items.filter(x => x.cat === cat && x.number).forEach(x => {
      const m = String(x.number).match(/^(.*?)(\d+)$/);
      if (!m) return;
      (groups[m[1]] = groups[m[1]] || []).push({ n: parseInt(m[2], 10), used: !!(x.hiveId && hives.some(h => h.id === x.hiveId)) || baitBoxIds().has(x.id) });
    });
    if (cat === BOX_CAT) hives.forEach(hv => {
      const m = String(hv.code).match(/^(.*?)(\d+)$/);
      if (m) { groups[m[1]] = groups[m[1]] || []; groups[m[1]].push({ n: parseInt(m[2], 10), used: true, code: true }); }
    });
    Object.keys(groups).forEach(pre => {
      const g = groups[pre];
      const usedSet = new Set(g.filter(x => x.used).map(x => x.n));
      const allSet = new Set(g.map(x => x.n));
      const stockFree = g.filter(x => !x.used && !x.code && !usedSet.has(x.n)).map(x => x.n).sort((a, b) => a - b);
      const max = Math.max.apply(null, Array.from(allSet));
      const maxUsed = usedSet.size ? Math.max.apply(null, Array.from(usedSet)) : 0;
      const gaps = [];
      for (let i = 1; i <= max; i++) if (!allSet.has(i)) gaps.push(i);
      const list = arr => arr.length ? arr.slice(0, 25).map(n => fmt(pre, n)).join(', ') + (arr.length > 25 ? ' … +' + (arr.length - 25) : '') : 'nenhum';
      blocks.push('<div class="stat-card" style="text-align:left;"><div class="stat-title">🔢 ' + esc(cat) + (pre ? ' — ' + esc(pre) : '') + '</div><div style="font-size:0.85rem; line-height:1.7;">Maior número em uso: <strong>' + (maxUsed ? fmt(pre, maxUsed) : '—') + '</strong><br>Maior cadastrado: <strong>' + fmt(pre, max) + '</strong><br>Próximo número: <strong style="color:var(--honey-400);">' + fmt(pre, max + 1) + '</strong><br>Livres no estoque (sem uso): ' + list(stockFree) + '<br>Números sem cadastro no intervalo: ' + list(gaps) + '</div></div>');
    });
  });
  if (!blocks.length) return '';
  return '<h3 style="color:var(--honey-400); margin-bottom:0.5rem;">🔢 Numeração do estoque</h3><div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); margin-bottom:1.5rem;">' + blocks.join('') + '</div>';
}

function hiveExtrasHtml(hive) {
  const roleNames = [BOX_CAT, SUPER_CAT, COLLECTOR_CAT, BIG_CAT, NEST_CAT];
  const counts = {};
  FinStore.get(EQ_KEY).filter(x => x.hiveId === hive.id && roleNames.indexOf(x.cat) === -1).forEach(x => { counts[x.cat] = (counts[x.cat] || 0) + 1; });
  Object.keys(hive.extras || {}).forEach(c => { if (!counts[c]) counts[c] = hive.extras[c]; });
  return Object.keys(counts).map(c => '<div class="hive-metric-item"><span>' + esc(c) + '</span><strong>' + counts[c] + ' un</strong></div>').join('');
}

function equipLinkHives(apply) {
  const hives = ApisStorage.getHives();
  const list = FinStore.get(EQ_KEY);
  const hiveIds = new Set(hives.map(h => h.id));
  const stats = { hives: new Set(), boxNew: 0, boxReuse: 0, boxConflict: 0, acc: {} };
  const isFree = x => !(x.hiveId && hiveIds.has(x.hiveId)) && !baitBoxIds().has(x.id);
  const norm = s => String(s).toLowerCase().replace(/(\D*)0*(\d+)$/, '$1$2');
  const uid = () => 'eq-' + Date.now() + '-' + Math.floor(Math.random() * 1e6);
  const newItem = (cat, hiveId) => {
    let number = '';
    if (eqIsNumbered(cat)) {
      const pre = cat === BOX_CAT ? 'CX-' : cat.slice(0, 2).toUpperCase() + '-';
      const max = list.filter(x => x.cat === cat && String(x.number).startsWith(pre)).reduce((m, x) => Math.max(m, parseInt(String(x.number).slice(pre.length), 10) || 0), 0);
      number = pre + String(max + 1).padStart(2, '0');
    }
    list.push({ id: uid(), cat, number, hiveId });
  };
  hives.forEach(h => {
    if (!list.some(x => x.cat === BOX_CAT && x.hiveId === h.id)) {
      const same = list.find(x => x.cat === BOX_CAT && norm(x.number) === norm(h.code));
      if (same && isFree(same)) { same.hiveId = h.id; stats.boxReuse++; stats.hives.add(h.id); }
      else if (!same) { list.push({ id: uid(), cat: BOX_CAT, number: h.code, hiveId: h.id }); stats.boxNew++; stats.hives.add(h.id); }
      else stats.boxConflict++;
    }
    const sup = parseInt(h.supersCount, 10) || 0;
    const colInit = h.propolisProducer === true ? (h.collectorSupers !== undefined ? (parseInt(h.collectorSupers, 10) || 0) : Math.min(parseInt(h.propolisCollectors, 10) || 0, sup)) : 0;
    const want = { [SUPER_CAT]: Math.max(sup, colInit) - colInit, [COLLECTOR_CAT]: colInit, [BIG_CAT]: parseInt(h.supersBig, 10) || 0, [NEST_CAT]: parseInt(h.nestExtenders, 10) || 0 };
    Object.keys(h.extras || {}).forEach(c => { want[c] = parseInt(h.extras[c], 10) || 0; });
    Object.keys(want).forEach(cat => {
      let need = want[cat] - list.filter(x => x.cat === cat && x.hiveId === h.id).length;
      if (need <= 0) return;
      stats.hives.add(h.id);
      stats.acc[cat] = stats.acc[cat] || { reuse: 0, created: 0 };
      list.filter(x => x.cat === cat && isFree(x)).sort(eqSort).slice(0, need).forEach(x => { x.hiveId = h.id; need--; stats.acc[cat].reuse++; });
      while (need-- > 0) { newItem(cat, h.id); stats.acc[cat].created++; }
    });
  });
  if (apply) FinStore.put(EQ_KEY, list);
  return stats;
}

function openEqLinkModal() {
  const s = equipLinkHives(false);
  const lines = ['Colmeias a vincular: <strong>' + s.hives.size + '</strong>'];
  if (s.boxNew || s.boxReuse) lines.push('📦 Caixas: ' + s.boxNew + ' criada(s) no estoque já como povoada(s) e ' + s.boxReuse + ' do estoque marcada(s) como povoada(s)');
  Object.keys(s.acc).forEach(c => lines.push('🔧 ' + esc(c) + ': ' + s.acc[c].created + ' criado(s) e ' + s.acc[c].reuse + ' aproveitado(s) do estoque'));
  if (s.boxConflict) lines.push('⚠️ ' + s.boxConflict + ' colmeia(s) com código igual ao de uma caixa já usada por outra colmeia — serão ignoradas');
  const nothing = !s.hives.size;
  openModal('🔗 Vincular colmeias existentes ao estoque', `
    <p style="color:var(--slate-400); font-size:0.9rem;">Usa o que já foi preenchido nas colmeias (código, melgueiras, coletores, melgueirões e sobreninhos) para montar o estoque. Pode ser repetido sem duplicar.</p>
    <ul style="line-height:1.7;">${nothing ? '<li>Todas as colmeias já estão vinculadas ao estoque.</li>' : lines.map(l => '<li>' + l + '</li>').join('')}</ul>
    <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1rem;">
      <button type="button" class="btn btn-secondary" id="lk-cancel">${nothing ? 'Fechar' : 'Cancelar'}</button>
      ${nothing ? '' : '<button type="button" class="btn btn-primary" id="lk-ok">Vincular agora</button>'}
    </div>`);
  document.getElementById('lk-cancel').addEventListener('click', closeModal);
  document.getElementById('lk-ok')?.addEventListener('click', () => { equipLinkHives(true); closeModal(); renderApp(); });
}

function equipPlan(hiveId, desired, preferred) {
  const items = FinStore.get(EQ_KEY);
  const hives = ApisStorage.getHives();
  const out = { assign: [], release: [], errors: [], preview: {} };
  const lab = arr => { const nums = arr.filter(x => x.number).map(x => x.number); const un = arr.length - nums.length; return nums.concat(un ? [un + ' un.'] : []); };
  Object.keys(desired).forEach(cat => {
    const all = items.filter(x => x.cat === cat);
    if (!all.length) { out.preview[cat] = null; return; }
    const mine = all.filter(x => hiveId && x.hiveId === hiveId).sort(eqSort);
    const pref = (preferred && preferred[cat]) || [];
    const free = all.filter(x => !(x.hiveId && hives.some(h => h.id === x.hiveId))).sort((a, b) => ((pref.indexOf(a.id) > -1 ? 0 : 1) - (pref.indexOf(b.id) > -1 ? 0 : 1)) || eqSort(a, b));
    const want = Math.max(0, desired[cat] || 0);
    if (want > mine.length) {
      const need = want - mine.length;
      if (need > free.length) out.errors.push(cat + ': pedido de ' + want + ', mas só há ' + (mine.length + free.length) + ' disponível(is) no estoque.');
      const pick = free.slice(0, need);
      pick.forEach(x => out.assign.push(x.id));
      out.preview[cat] = { free: free.length, mine: lab(mine), add: lab(pick), remove: [] };
    } else {
      const drop = mine.slice(want);
      drop.forEach(x => out.release.push(x.id));
      out.preview[cat] = { free: free.length, mine: lab(mine), add: [], remove: lab(drop) };
    }
  });
  return out;
}

function eqNumberInfo(prefix, hives, boxes) {
  const re = new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\d+)$');
  const num = s => { const m = String(s).match(re); return m ? parseInt(m[1], 10) : null; };
  const usedH = new Set(hives.map(h => num(h.code)).filter(n => n !== null));
  const all = new Set(Array.from(usedH).concat(boxes.map(b => num(b.number)).filter(n => n !== null)));
  const max = all.size ? Math.max.apply(null, Array.from(all)) : 0;
  const maxUsed = usedH.size ? Math.max.apply(null, Array.from(usedH)) : 0;
  const gaps = [];
  for (let i = 1; i <= max; i++) if (!all.has(i)) gaps.push(i);
  return { maxUsed, max, next: max + 1, gaps };
}

function renderEquipView(data) {
  const items = FinStore.get(EQ_KEY);
  const cats = eqCats();
  const hives = data.hives;
  const used = it => !!eqHive(it, hives);
  const card = c => {
    const l = items.filter(x => x.cat === c);
    const u = l.filter(used).length;
    const box = c === BOX_CAT;
    return '<div class="stat-card"><div class="stat-title">' + esc(c) + '</div><div class="stat-value" style="font-size:1.4rem;">' + l.length + '</div><div style="font-size:0.8rem; color:var(--slate-400);">' +
      (box ? '🐝 ' + u + ' povoadas · 📦 ' + (l.length - u) + ' vazias' : '🔧 ' + u + ' em uso · 📦 ' + (l.length - u) + ' sem uso') + '</div></div>';
  };
  const shown = items.filter(x => eqFilter === 'all' || x.cat === eqFilter).sort((a, b) => a.cat.localeCompare(b.cat) || eqSort(a, b));
  const btnS = 'padding:0.3rem 0.6rem; font-size:0.75rem;';
  const short = c => c === COLLECTOR_CAT ? 'Melg. c/ coletor' : c;

  const rows = shown.filter(it => it.number).map(it => {
    const hv = eqHive(it, hives);
    const ap = hv ? data.apiaries.find(a => a.id === hv.apiaryId) : null;
    const box = it.cat === BOX_CAT;
    const sit = hv ? (box ? '🐝 Povoada — ' : '🔧 Em uso — ') + esc(hv.code) + (ap ? ' (' + esc(ap.name) + ')' : '') : (box ? (baitBoxIds().has(it.id) ? '🪤 Isca em campo' : '📦 Vazia (estoque)') : '📦 Sem uso (estoque)');
    return '<tr><td><strong>' + esc(it.number) + '</strong></td><td>' + esc(it.cat) + '</td><td>' + sit + '</td><td style="white-space:nowrap;">' +
      (box && !hv && !baitBoxIds().has(it.id) ? '<button class="btn btn-primary eq-populate" data-id="' + it.id + '" style="' + btnS + '">🐝 Povoar</button> ' : '') +
      (hv ? '<button class="btn btn-secondary eq-free" data-id="' + it.id + '" style="' + btnS + '">↩ Liberar</button> ' : '') +
      '<button class="btn btn-danger eq-del" data-id="' + it.id + '" style="' + btnS + '">🗑️</button></td></tr>';
  }).join('');

  const unGroups = {};
  shown.filter(it => !it.number).forEach(it => { (unGroups[it.cat] = unGroups[it.cat] || []).push(it); });
  const unRows = cats.filter(c => !eqIsNumbered(c) && (eqFilter === 'all' || eqFilter === c)).map(c => {
    const l = unGroups[c] || [];
    const u = l.filter(used).length;
    return '<tr><td><strong>' + l.length + ' un.</strong></td><td>' + esc(c) + ' <small style="color:var(--slate-400);">(sem numeração)</small></td><td>🔧 ' + u + ' em uso · 📦 ' + (l.length - u) + ' livres</td><td style="white-space:nowrap;"><button class="btn btn-primary eq-add-qty" data-cat="' + esc(c) + '" style="' + btnS + '">＋ Adicionar</button> <button class="btn btn-secondary eq-sub-free" data-cat="' + esc(c) + '" style="' + btnS + '">－ 1 livre</button></td></tr>';
  }).join('');
  const chipsOf = acc => {
    const num = acc.filter(x => x.number).map(x => '<span class="tag-badge" style="margin:0.1rem;">' + esc(short(x.cat)) + ' ' + esc(x.number) + ' <a href="#" class="eq-free" data-id="' + x.id + '" title="Devolver ao estoque" style="color:var(--rose-500); text-decoration:none;">✕</a></span>');
    const g = {};
    acc.filter(x => !x.number).forEach(x => { (g[x.cat] = g[x.cat] || []).push(x); });
    return num.concat(Object.keys(g).map(c => '<span class="tag-badge" style="margin:0.1rem;">' + esc(short(c)) + ' ×' + g[c].length + ' <a href="#" class="eq-free" data-id="' + g[c][0].id + '" title="Devolver 1 ao estoque" style="color:var(--rose-500); text-decoration:none;">✕</a></span>')).join('');
  };
  const hiveRows = hives.map(h => {
    const ap = data.apiaries.find(a => a.id === h.apiaryId);
    const acc = items.filter(x => x.hiveId === h.id && x.cat !== BOX_CAT).sort(eqSort);
    return '<tr><td><strong>' + esc(h.code) + '</strong><br><small style="color:var(--slate-400);">' + esc(ap ? ap.name : '') + '</small></td><td>' +
      (chipsOf(acc) || '<span style="color:var(--slate-400);">—</span>') +
      '</td><td><button class="btn btn-secondary eq-add-acc" data-id="' + h.id + '" style="' + btnS + '">＋ Acessório</button></td></tr>';
  }).join('');

  return `
    <div class="glass-panel">
      <div class="section-header">
        <div>
          <h2 class="section-title">🧰 Caixas & Equipamentos</h2>
          <p style="color:var(--slate-400); font-size:0.9rem;">Estoque numerado de caixas vazias, melgueiras, coletores de própolis, mangueirões e o que mais você cadastrar.</p>
        </div>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button class="btn btn-primary" id="btn-eq-batch">+ Cadastrar no estoque</button>
          <button class="btn btn-secondary" id="btn-eq-cat">🏷️ Categorias</button>
          <button class="btn btn-secondary" id="btn-eq-link">🔗 Vincular colmeias existentes</button>
        </div>
      </div>
      <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-bottom:1.5rem;">${cats.map(card).join('')}</div>

      ${numberingPanelHtml(items, hives)}
      <h3 style="color:var(--honey-400); margin-bottom:0.5rem;">🐝 Acessórios por colmeia</h3>
      <div class="table-responsive" style="margin-bottom:1.5rem;">
        ${hives.length === 0 ? '<div style="padding:1rem; color:var(--slate-400);">Nenhuma colmeia cadastrada.</div>' : '<table class="data-table"><thead><tr><th>Colmeia</th><th>Em uso nela</th><th></th></tr></thead><tbody>' + hiveRows + '</tbody></table>'}
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
        <h3 style="color:var(--honey-400); margin:0;">📋 Itens do estoque</h3>
        <select id="eq-filter" class="form-control" style="width:auto;"><option value="all">Todas as categorias</option>${cats.map(c => '<option value="' + esc(c) + '"' + (eqFilter === c ? ' selected' : '') + '>' + esc(c) + '</option>').join('')}</select>
      </div>
      <div class="table-responsive">
        ${shown.length === 0 && !unRows ? '<div style="padding:1.5rem; color:var(--slate-400);">Nada cadastrado. Use "+ Cadastrar no estoque" para criar, por exemplo, CX-01 a CX-20.</div>' : '<table class="data-table"><thead><tr><th>Número</th><th>Categoria</th><th>Situação</th><th></th></tr></thead><tbody>' + unRows + rows + '</tbody></table>'}
      </div>
    </div>`;
}

function openEqCatModal(editName) {
  const items = FinStore.get(EQ_KEY);
  const hives = ApisStorage.getHives();
  const roles = getEqRoles();
  const roleOf = name => Object.keys(roles).find(k => roles[k] === name);
  const bs = 'padding:0.3rem 0.6rem; font-size:0.75rem;';
  const editing = typeof editName === 'string' && eqCats().indexOf(editName) > -1;
  const rows = eqCats().map(c => {
    const l = items.filter(x => x.cat === c);
    const u = l.filter(x => x.hiveId && hives.some(h => h.id === x.hiveId)).length;
    const locked = !!roleOf(c);
    return '<tr><td><strong>' + esc(c) + '</strong>' + (locked ? '<br><small style="color:var(--slate-400);">🔒 alimenta os campos da colmeia (pode renomear)</small>' : '') + '</td><td>' + (eqIsNumbered(c) ? 'Sim' : 'Não') + '</td><td>' + (eqInHive(c) ? 'Sim' : 'Não') + '</td><td>' + l.length + '</td><td>' + u + '</td><td style="white-space:nowrap;"><button type="button" class="btn btn-secondary ec-edit" data-n="' + esc(c) + '" style="' + bs + '">✏️</button> ' + (locked ? '' : '<button type="button" class="btn btn-danger ec-del" data-n="' + esc(c) + '" style="' + bs + '">🗑️</button>') + '</td></tr>';
  }).join('');
  const numV = editing ? eqIsNumbered(editName) : true;
  const hiveV = editing ? eqInHive(editName) : true;
  openModal('🏷️ Categorias do estoque', `
    <div class="table-responsive"><table class="data-table"><thead><tr><th>Categoria</th><th>Enumera</th><th>Na colmeia</th><th>Itens</th><th>Em uso</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
    <form id="form-eqcat" class="form-grid" style="margin-top:1rem; border-top:1px solid var(--slate-700); padding-top:1rem;">
      <div class="form-group" style="grid-column:1 / -1;"><label>${editing ? 'Editando a categoria "' + esc(editName) + '":' : 'Nova categoria:'}</label><input type="text" id="ec-name" class="form-control" value="${editing ? esc(editName) : ''}" placeholder="Ex.: Alimentador, Tampa, Piso" required></div>
      <div class="form-group" style="grid-column:1 / -1;"><label>Enumerar os itens?</label>
        <select id="ec-num" class="form-control"><option value="1"${numV ? ' selected' : ''}>Sim — cada item tem um número (ex.: CX-01)</option><option value="0"${numV ? '' : ' selected'}>Não — controlar apenas a quantidade</option></select></div>
      <div class="form-group" style="grid-column:1 / -1;"><label>Pertence ao uso na colmeia?</label>
        <select id="ec-hive" class="form-control"${editing && roleOf(editName) ? ' disabled' : ''}><option value="1"${hiveV ? ' selected' : ''}>Sim — aparece no cadastro da colmeia e em ＋ Acessório</option><option value="0"${hiveV ? '' : ' selected'}>Não — só controle de estoque geral</option></select></div>
      <div style="grid-column:1 / -1; display:flex; justify-content:flex-end; gap:0.75rem; flex-wrap:wrap;">
        <button type="button" class="btn btn-secondary" id="ec-close">Fechar</button>
        ${editing ? '<button type="button" class="btn btn-secondary" id="ec-cancel-edit">Cancelar edição</button>' : ''}
        <button type="submit" class="btn btn-primary">${editing ? 'Salvar alterações' : '+ Adicionar'}</button>
      </div>
    </form>`);
  document.getElementById('ec-close').addEventListener('click', () => { closeModal(); renderApp(); });
  document.getElementById('ec-cancel-edit')?.addEventListener('click', () => openEqCatModal());
  document.getElementById('form-eqcat').addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('ec-name').value.trim();
    const numbered = document.getElementById('ec-num').value === '1';
    const inHive = document.getElementById('ec-hive').value === '1';
    if (!name) return;
    if (eqCats().some(c => c.toLowerCase() === name.toLowerCase() && c !== editName)) { alert('Já existe uma categoria com esse nome.'); return; }
    const cfg = getEqCfg();
    if (editing) {
      if (name !== editName) {
        const r = getEqRoles();
        const k = Object.keys(r).find(x => r[x] === editName);
        if (k) { r[k] = name; localStorage.setItem(EQ_ROLES_KEY, JSON.stringify(r)); loadEqRoles(); }
        else {
          const cl = FinStore.get(EQ_CAT_KEY);
          const rec = cl.find(x => x.name === editName);
          if (rec) { rec.name = name; FinStore.put(EQ_CAT_KEY, cl); } else FinStore.save(EQ_CAT_KEY, { name }, 'eqc');
        }
        const list = FinStore.get(EQ_KEY);
        list.forEach(x => { if (x.cat === editName) x.cat = name; });
        FinStore.put(EQ_KEY, list);
        delete cfg[editName];
        if (eqFilter === editName) eqFilter = name;
      }
    } else {
      FinStore.save(EQ_CAT_KEY, { name }, 'eqc');
    }
    cfg[name] = numbered;
    setEqCfg(cfg);
    const hm = getEqHiveCfg();
    if (editing && name !== editName) delete hm[editName];
    hm[name] = inHive;
    setEqHiveCfg(hm);
    openEqCatModal();
  });
  document.querySelectorAll('.ec-edit').forEach(b => b.addEventListener('click', () => openEqCatModal(b.dataset.n)));
  document.querySelectorAll('.ec-del').forEach(b => b.addEventListener('click', () => {
    const name = b.dataset.n;
    const list = FinStore.get(EQ_KEY);
    const mine = list.filter(x => x.cat === name);
    if (mine.some(x => x.hiveId && hives.some(h => h.id === x.hiveId))) { alert('Há itens desta categoria em uso em colmeias. Libere-os antes de excluir.'); return; }
    if (!confirm('Excluir a categoria "' + name + '"' + (mine.length ? ' e seus ' + mine.length + ' item(ns) do estoque' : '') + '?')) return;
    FinStore.put(EQ_KEY, list.filter(x => x.cat !== name));
    FinStore.put(EQ_CAT_KEY, FinStore.get(EQ_CAT_KEY).filter(x => x.name !== name));
    const cfg = getEqCfg(); delete cfg[name]; setEqCfg(cfg);
    const hmd = getEqHiveCfg(); delete hmd[name]; setEqHiveCfg(hmd);
    if (eqFilter === name) eqFilter = 'all';
    openEqCatModal();
  }));
}

function openEquipBatchModal(preCat) {
  const cats = eqCats();
  const items = FinStore.get(EQ_KEY);
  const prefOf = c => ({ [BOX_CAT]: 'CX-', [SUPER_CAT]: 'ML-', [COLLECTOR_CAT]: 'MC-', [BIG_CAT]: 'MG-', [NEST_CAT]: 'SN-' }[c] || c.slice(0, 2).toUpperCase() + '-');
  const nextNum = (c, pre) => items.filter(x => x.cat === c && String(x.number).startsWith(pre)).reduce((m, x) => Math.max(m, parseInt(String(x.number).slice(pre.length), 10) || 0), 0) + 1;
  openModal('📦 Cadastrar no estoque', `
    <form id="form-eq" class="form-grid">
      <div class="form-group"><label>Categoria:</label><select id="eq-cat" class="form-control">${cats.map(c => '<option>' + esc(c) + '</option>').join('')}</select></div>
      <div class="form-group" id="eq-pre-wrap"><label>Prefixo do número:</label><input type="text" id="eq-pre" class="form-control"></div>
      <div class="form-group" id="eq-start-wrap"><label>Número inicial:</label><input type="number" id="eq-start" class="form-control" min="0" step="1"></div>
      <div class="form-group"><label>Quantidade:</label><input type="number" id="eq-qty" class="form-control" min="1" max="500" step="1" value="1"></div>
      <div style="grid-column:1 / -1; display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.5rem;">
        <button type="button" class="btn btn-secondary" id="eq-cancel">Cancelar</button>
        <button type="submit" class="btn btn-primary">Cadastrar</button>
      </div>
    </form>`);
  const catEl = document.getElementById('eq-cat'), preEl = document.getElementById('eq-pre'), startEl = document.getElementById('eq-start');
  const fill = () => { const num = eqIsNumbered(catEl.value); document.getElementById('eq-pre-wrap').style.display = num ? '' : 'none'; document.getElementById('eq-start-wrap').style.display = num ? '' : 'none'; preEl.value = prefOf(catEl.value); startEl.value = nextNum(catEl.value, preEl.value); };
  catEl.addEventListener('change', fill);
  preEl.addEventListener('change', () => { startEl.value = nextNum(catEl.value, preEl.value); });
  if (typeof preCat === 'string' && cats.indexOf(preCat) > -1) catEl.value = preCat;
  fill();
  document.getElementById('eq-cancel').addEventListener('click', closeModal);
  document.getElementById('form-eq').addEventListener('submit', e => {
    e.preventDefault();
    const list = FinStore.get(EQ_KEY);
    const cat = catEl.value, pre = preEl.value.trim();
    const start = parseInt(startEl.value, 10) || 0;
    const qty = Math.min(500, Math.max(1, parseInt(document.getElementById('eq-qty').value, 10) || 1));
    let added = 0;
    const numbered = eqIsNumbered(cat);
    for (let i = 0; i < qty; i++) {
      const number = numbered ? pre + String(start + i).padStart(2, '0') : '';
      if (numbered && list.some(x => x.cat === cat && x.number === number)) continue;
      list.push({ id: 'eq-' + Date.now() + '-' + i, cat, number, hiveId: '' });
      added++;
    }
    FinStore.put(EQ_KEY, list);
    closeModal();
    if (added < qty) alert((qty - added) + ' número(s) já existiam nesta categoria e foram ignorados.');
    renderApp();
  });
}

function openHiveAccessoryModal(hiveId) {
  const data = ApisStorage.getAll();
  const hv = data.hives.find(h => h.id === hiveId);
  if (!hv) return;
  const items = FinStore.get(EQ_KEY);
  const cats = eqCats().filter(c => c !== BOX_CAT && eqInHive(c));
  const holder = x => eqHive(x, data.hives);
  const free = c => items.filter(x => x.cat === c && !holder(x)).sort(eqSort);
  if (!cats.length) { alert('Nenhuma categoria está marcada como uso na colmeia. Ajuste em 🏷️ Categorias.'); return; }
  openModal('＋ Acessório na colmeia ' + esc(hv.code), `
    <form id="form-acc" class="form-grid">
      <div class="form-group" style="grid-column:1 / -1;"><label>Categoria:</label>
        <select id="acc-cat" class="form-control">${cats.map(c => '<option value="' + esc(c) + '">' + esc(c) + ' — ' + free(c).length + ' livre(s) de ' + items.filter(x => x.cat === c).length + '</option>').join('')}</select></div>
      <div class="form-group" style="grid-column:1 / -1;"><label>Item do estoque:</label>
        <select id="acc-item" class="form-control"></select>
        <small id="acc-hint" style="color:var(--slate-400);"></small></div>
      <div class="form-group"><label>Quantidade:</label><input type="number" id="acc-qty" class="form-control" min="1" step="1" value="1"></div>
      <div style="grid-column:1 / -1; display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.5rem;">
        <button type="button" class="btn btn-secondary" id="acc-cancel">Cancelar</button>
        <button type="submit" class="btn btn-primary">Colocar na colmeia</button>
      </div>
    </form>`);
  const catEl = document.getElementById('acc-cat'), itemEl = document.getElementById('acc-item'), qtyEl = document.getElementById('acc-qty'), hintEl = document.getElementById('acc-hint');
  const refresh = () => {
    const c = catEl.value;
    const all = items.filter(x => x.cat === c).sort(eqSort);
    const numbered = all.filter(x => x.number);
    const fr = free(c);
    itemEl.innerHTML = '<option value="">Automático — ' + (numbered.length ? 'os menores números livres' : 'unidades livres') + ' (' + fr.length + ' livre(s))</option>' +
      numbered.map(x => { const hh = holder(x); const ap = hh ? data.apiaries.find(a => a.id === hh.apiaryId) : null; return '<option value="' + x.id + '"' + (hh ? ' disabled' : '') + '>' + esc(x.number) + ' — ' + (hh ? '🔧 em uso na ' + esc(hh.code) + (ap ? ' (' + esc(ap.name) + ')' : '') : '📦 livre no estoque') + '</option>'; }).join('');
    qtyEl.disabled = false;
    qtyEl.value = 1;
    hintEl.textContent = all.length ? 'No estoque: ' + all.length + ' no total · ' + (all.length - fr.length) + ' em uso · ' + fr.length + ' livre(s).' : 'Esta categoria ainda não tem itens no estoque (cadastre na aba 🧰).';
  };
  catEl.addEventListener('change', refresh);
  itemEl.addEventListener('change', () => { if (itemEl.value) { qtyEl.value = 1; qtyEl.disabled = true; } else qtyEl.disabled = false; });
  refresh();
  document.getElementById('acc-cancel').addEventListener('click', closeModal);
  document.getElementById('form-acc').addEventListener('submit', e => {
    e.preventDefault();
    let ids;
    if (itemEl.value) ids = [itemEl.value];
    else {
      const avail = free(catEl.value);
      const qty = parseInt(qtyEl.value, 10) || 0;
      if (qty < 1 || qty > avail.length) { alert('Quantidade acima do que há livre no estoque (' + avail.length + ').'); return; }
      ids = avail.slice(0, qty).map(x => x.id);
    }
    equipSetHive(ids, hiveId);
    closeModal();
    renderApp();
  });
}

function bindEquipEvents() {
  const $ = id => document.getElementById(id);
  $('btn-eq-batch')?.addEventListener('click', () => openEquipBatchModal());
  $('btn-eq-cat')?.addEventListener('click', () => openEqCatModal());
  $('btn-eq-link')?.addEventListener('click', openEqLinkModal);
  $('eq-filter')?.addEventListener('change', e => { eqFilter = e.target.value; renderApp(); });
  document.querySelectorAll('.eq-add-acc').forEach(b => b.addEventListener('click', () => openHiveAccessoryModal(b.dataset.id)));
  document.querySelectorAll('.eq-free').forEach(b => b.addEventListener('click', e => { e.preventDefault(); equipSetHive([b.dataset.id], ''); renderApp(); }));
  document.querySelectorAll('.eq-populate').forEach(b => b.addEventListener('click', () => {
    const it = FinStore.get(EQ_KEY).find(x => x.id === b.dataset.id);
    if (!it) return;
    const data = ApisStorage.getAll();
    if (!data.apiaries.length) { alert('Cadastre primeiro um núcleo para receber a colmeia.'); return; }
    openHiveModal(data, null, { code: it.number, boxId: it.id });
  }));
  document.querySelectorAll('.eq-add-qty').forEach(b => b.addEventListener('click', () => openEquipBatchModal(b.dataset.cat)));
  document.querySelectorAll('.eq-sub-free').forEach(b => b.addEventListener('click', () => {
    const list = FinStore.get(EQ_KEY);
    const hv = ApisStorage.getHives();
    const i = list.findIndex(x => x.cat === b.dataset.cat && !x.number && !(x.hiveId && hv.some(h => h.id === x.hiveId)));
    if (i === -1) { alert('Não há unidade livre desta categoria para remover.'); return; }
    list.splice(i, 1);
    FinStore.put(EQ_KEY, list);
    renderApp();
  }));
  document.querySelectorAll('.eq-del').forEach(b => b.addEventListener('click', () => {
    if (!confirm('Excluir este item do estoque?')) return;
    equipSetHive([b.dataset.id], '');
    FinStore.del(EQ_KEY, b.dataset.id);
    renderApp();
  }));
}

// ==========================================================================
// 8. CAIXAS ISCAS: LOCALIZAÇÃO POR GPS, RADAR E BÚSSOLA OFFLINE (v1.18.0)
// ==========================================================================

const BAIT_KEY = 'apisapp_baits';
const baitBoxIds = () => new Set(FinStore.get(BAIT_KEY).filter(b => b.status === 'ativa').map(b => b.boxId));
let baitView = 'list';
const baitState = { me: null, prev: null, heading: null, headingSrc: '', target: '', watchId: null, compassOn: false, lastDraw: 0, near: false };

const toRad = d => d * Math.PI / 180;
function geoDist(a, b) {
  const R = 6371000, dLat = toRad(b.lat - a.lat), dLon = toRad(b.lon - a.lon);
  const s = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.pow(Math.sin(dLon / 2), 2);
  return 2 * R * Math.asin(Math.sqrt(s));
}
function geoBearing(a, b) {
  const y = Math.sin(toRad(b.lon - a.lon)) * Math.cos(toRad(b.lat));
  const x = Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) - Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lon - a.lon));
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}
const fmtDist = m => m < 1000 ? Math.round(m) + ' m' : (m / 1000).toFixed(2).replace('.', ',') + ' km';
const compassName = d => ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'][Math.round(d / 45) % 8];

function baitFreeBoxes() {
  const hives = ApisStorage.getHives();
  const busy = baitBoxIds();
  return FinStore.get(EQ_KEY).filter(x => x.cat === BOX_CAT && !(x.hiveId && hives.some(h => h.id === x.hiveId)) && !busy.has(x.id)).sort(eqSort);
}

function gpsCapture(onOk, onStatus) {
  if (!navigator.geolocation) { onStatus('Este aparelho/navegador não oferece GPS.'); return; }
  onStatus('⏳ Buscando satélites… (pode levar até 30 s a céu aberto)');
  navigator.geolocation.getCurrentPosition(p => {
    onOk(p.coords.latitude, p.coords.longitude, p.coords.accuracy);
    onStatus('✅ Local capturado (precisão ±' + Math.round(p.coords.accuracy) + ' m)');
  }, err => {
    onStatus('⚠️ ' + ({ 1: 'Permissão negada — libere a localização no navegador.', 2: 'Sem sinal de GPS.', 3: 'Tempo esgotado — tente de novo a céu aberto.' }[err.code] || 'Erro de GPS.'));
  }, { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 });
}

// ---------- tela principal ----------
function renderBaitView(data) {
  const baits = FinStore.get(BAIT_KEY);
  const active = baits.filter(b => b.status === 'ativa');
  const colN = baits.filter(b => b.status === 'colonizada').length;
  const btnS = 'padding:0.3rem 0.6rem; font-size:0.75rem;';
  const now = new Date();
  const days = d => Math.max(0, Math.floor((now - new Date(d + 'T12:00:00')) / 864e5));
  const stat = (t, v) => '<div class="stat-card"><div class="stat-title">' + t + '</div><div class="stat-value" style="font-size:1.4rem;">' + v + '</div></div>';
  const head = `
    <div class="section-header">
      <div>
        <h2 class="section-title">🪤 Caixas Iscas</h2>
        <p style="color:var(--slate-400); font-size:0.9rem;">Caixas vazias do estoque espalhadas para atrair enxames. O GPS e a bússola do aparelho funcionam sem internet.</p>
      </div>
      <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
        <button class="btn btn-primary" id="btn-new-bait">+ Colocar caixa isca</button>
        <button class="btn btn-secondary" id="btn-bait-view">${baitView === 'radar' ? '📋 Ver lista' : '🧭 Radar / Navegar'}</button>
      </div>
    </div>
    <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); margin-bottom:1.25rem;">
      ${stat('Em campo', active.length)}${stat('Colonizadas', colN)}${stat('Taxa de sucesso', baits.length ? Math.round(colN / baits.length * 100) + '%' : '—')}
    </div>`;

  if (baitView === 'radar') {
    return `<div class="glass-panel">${head}
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1rem;">
        <div style="background:rgba(15,23,42,0.6); padding:1rem; border-radius:12px; border:1px solid var(--slate-700);">
          <label style="font-weight:600;">Ir até a caixa:</label>
          <select id="radar-target" class="form-control" style="margin:0.4rem 0;">${active.map(b => '<option value="' + b.id + '"' + (baitState.target === b.id ? ' selected' : '') + '>' + esc(b.number) + ' — ' + esc(b.name) + '</option>').join('') || '<option value="">Nenhuma caixa em campo</option>'}</select>
          <div style="text-align:center;"><svg id="radar-arrow" viewBox="-100 -100 200 200" width="190" height="190"><circle r="92" fill="none" stroke="#475569"/><text x="-4" y="-78" fill="#94a3b8" font-size="11">▲</text><g id="arrow-g"><path d="M0,-72 L24,-24 L9,-24 L9,64 L-9,64 L-9,-24 L-24,-24 Z" fill="#f59e0b"/></g></svg></div>
          <div id="radar-info" style="line-height:1.6;"></div>
          <button class="btn btn-secondary" id="btn-compass" style="margin-top:0.5rem; font-size:0.8rem;">🧭 Ativar bússola</button>
        </div>
        <div style="background:rgba(15,23,42,0.6); padding:1rem; border-radius:12px; border:1px solid var(--slate-700);">
          <svg id="radar-map" viewBox="0 0 300 300" style="width:100%; max-width:420px; display:block; margin:0 auto;"><g id="radar-rings"></g><g id="radar-dots"></g><g id="radar-me" transform="translate(150,150)"><path d="M0,-14 L8,8 L0,3 L-8,8 Z" fill="#38bdf8" stroke="#fff" stroke-width="1"/></g></svg>
          <div id="radar-legend" style="font-size:0.8rem; color:var(--slate-400); margin-top:0.5rem;"></div>
        </div>
      </div>
      <p style="color:var(--slate-400); font-size:0.8rem; margin-top:0.75rem;">Mapa relativo (norte no topo): você é o ponto azul e a seta azul mostra para onde está indo. Não usa internet nem imagem de satélite. Segure o celular na vertical enquanto anda.</p>
    </div>`;
  }

  const rows = baits.slice().sort((a, b) => (a.status === 'ativa' ? 0 : 1) - (b.status === 'ativa' ? 0 : 1) || String(b.date).localeCompare(String(a.date))).map(b => {
    const hv = b.hiveId ? data.hives.find(h => h.id === b.hiveId) : null;
    const dist = baitState.me && typeof b.lat === 'number' ? fmtDist(geoDist(baitState.me, b)) : '—';
    const st = b.status === 'ativa' ? '<span class="status-badge status-atencao">Em campo</span>' : b.status === 'colonizada' ? '<span class="status-badge status-ativa">🐝 Colonizada' + (hv ? ' — ' + esc(hv.code) : '') + '</span>' : '<span class="tag-badge">Recolhida</span>';
    const on = b.status === 'ativa';
    return '<tr><td><strong>' + esc(b.number) + '</strong></td><td>' + esc(b.name) + (b.note ? '<br><small style="color:var(--slate-400);">' + esc(b.note) + '</small>' : '') + '</td><td><small>' + b.lat.toFixed(6) + ', ' + b.lon.toFixed(6) + (b.acc ? '<br>±' + b.acc + ' m' : '') + '</small></td><td>' + fmtDate(b.date) + (on ? '<br><small style="color:var(--slate-400);">' + days(b.date) + ' dias · verificada ' + fmtDate(b.lastCheck || b.date) + '</small>' : '') + '</td><td>' + dist + '</td><td>' + st + '</td><td style="white-space:nowrap;">' +
      (on ? '<button class="btn btn-primary bt-go" data-id="' + b.id + '" style="' + btnS + '" title="Navegar até a caixa">🧭</button> <button class="btn btn-secondary bt-chk" data-id="' + b.id + '" style="' + btnS + '" title="Marcar como verificada hoje">👁️</button> <button class="btn btn-secondary bt-gps" data-id="' + b.id + '" style="' + btnS + '" title="Atualizar localização com o GPS">📍</button> <button class="btn btn-primary bt-col" data-id="' + b.id + '" style="' + btnS + '" title="Enxame entrou: cadastrar colmeia">🐝</button> <button class="btn btn-secondary bt-ret" data-id="' + b.id + '" style="' + btnS + '" title="Recolher caixa">↩</button> ' : '') +
      '<button class="btn btn-danger bt-del" data-id="' + b.id + '" style="' + btnS + '">🗑️</button></td></tr>';
  }).join('');
  return `<div class="glass-panel">${head}
    <div class="table-responsive">
      ${baits.length === 0 ? '<div style="padding:1.5rem; color:var(--slate-400);">Nenhuma caixa isca cadastrada. Use "+ Colocar caixa isca" no local onde deixar a caixa para capturar a posição pelo GPS.</div>' : '<table class="data-table"><thead><tr><th>Caixa</th><th>Ponto</th><th>Coordenadas</th><th>Colocada</th><th>Dist.</th><th>Situação</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>'}
    </div>
    <p style="color:var(--slate-400); font-size:0.8rem; margin-top:0.75rem;">🐝 = enxame entrou (abre o cadastro da colmeia com a caixa) · ↩ = recolher (a caixa volta ao estoque) · 👁️ = verificada hoje · 📍 = atualizar local.</p>
  </div>`;
}

// ---------- cadastro de caixa isca ----------
function openBaitModal() {
  const boxes = baitFreeBoxes();
  if (!boxes.length) { alert('Não há caixas vazias livres no estoque. Cadastre caixas na aba 🧰 Caixas & Equip.'); return; }
  openModal('🪤 Colocar caixa isca', `
    <form id="form-bait" class="form-grid">
      <div class="form-group"><label>Caixa do estoque:</label><select id="bt-box" class="form-control">${boxes.map(b => '<option value="' + b.id + '">' + esc(b.number) + '</option>').join('')}</select></div>
      <div class="form-group"><label>Nome do ponto:</label><input type="text" id="bt-name" class="form-control" placeholder="Ex.: Mata do açude, árvore 3" required></div>
      <div class="form-group"><label>Data:</label><input type="date" id="bt-date" class="form-control" value="${todayISO()}" required></div>
      <div class="form-group"><label>Observação:</label><input type="text" id="bt-note" class="form-control" placeholder="Altura, isca usada, referência..."></div>
      <div style="grid-column:1 / -1;">
        <button type="button" class="btn btn-primary" id="bt-capture">📍 Capturar minha localização (GPS)</button>
        <div id="bt-status" style="font-size:0.85rem; color:var(--slate-400); margin-top:0.3rem;">Fique ao lado da caixa, a céu aberto, e aguarde a precisão melhorar.</div>
      </div>
      <div class="form-group"><label>Latitude:</label><input type="text" id="bt-lat" class="form-control" placeholder="-5.123456" required></div>
      <div class="form-group"><label>Longitude:</label><input type="text" id="bt-lon" class="form-control" placeholder="-38.123456" required></div>
      <input type="hidden" id="bt-acc">
      <div style="grid-column:1 / -1; display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.5rem;">
        <button type="button" class="btn btn-secondary" id="bt-cancel">Cancelar</button>
        <button type="submit" class="btn btn-primary">Salvar caixa isca</button>
      </div>
    </form>`);
  document.getElementById('bt-cancel').addEventListener('click', closeModal);
  document.getElementById('bt-capture').addEventListener('click', () => gpsCapture((la, lo, ac) => {
    document.getElementById('bt-lat').value = la.toFixed(6);
    document.getElementById('bt-lon').value = lo.toFixed(6);
    document.getElementById('bt-acc').value = Math.round(ac);
  }, t => { document.getElementById('bt-status').textContent = t; }));
  document.getElementById('form-bait').addEventListener('submit', e => {
    e.preventDefault();
    const lat = parseFloat(document.getElementById('bt-lat').value.replace(',', '.'));
    const lon = parseFloat(document.getElementById('bt-lon').value.replace(',', '.'));
    if (isNaN(lat) || isNaN(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) { alert('Latitude/longitude inválidas. Use graus decimais, por exemplo -5.123456.'); return; }
    const sel = document.getElementById('bt-box');
    FinStore.save(BAIT_KEY, { boxId: sel.value, number: sel.selectedOptions[0].textContent, name: document.getElementById('bt-name').value.trim(), note: document.getElementById('bt-note').value.trim(), date: document.getElementById('bt-date').value, lastCheck: document.getElementById('bt-date').value, lat, lon, acc: parseInt(document.getElementById('bt-acc').value, 10) || 0, status: 'ativa' }, 'bait');
    closeModal();
    renderApp();
  });
}

// ---------- GPS, bússola e radar ----------
function onBaitPos(p) {
  const c = p.coords;
  const me = { lat: c.latitude, lon: c.longitude, acc: c.accuracy };
  const st = baitState;
  if (!st.compassOn) {
    if (typeof c.heading === 'number' && !isNaN(c.heading) && (c.speed || 0) > 0.6) { st.heading = c.heading; st.headingSrc = 'GPS (movimento)'; }
    else if (st.prev && geoDist(st.prev, me) > 6) { st.heading = geoBearing(st.prev, me); st.headingSrc = 'GPS (deslocamento)'; st.prev = me; }
  }
  if (!st.prev) st.prev = me;
  st.me = me;
  updateRadar(true);
}

function compassHeading(alpha, beta, gamma) {
  const a = toRad(alpha), b = toRad(beta), g = toRad(gamma);
  const rA = -Math.cos(a) * Math.sin(g) - Math.sin(a) * Math.sin(b) * Math.cos(g);
  const rB = -Math.sin(a) * Math.sin(g) + Math.cos(a) * Math.sin(b) * Math.cos(g);
  if (Math.hypot(rA, rB) < 0.15) return (360 - alpha) % 360;
  let h = Math.atan(rA / rB);
  if (rB < 0) h += Math.PI; else if (rA < 0) h += 2 * Math.PI;
  return h * 180 / Math.PI;
}

function onOrient(e) {
  let hd = null;
  if (typeof e.webkitCompassHeading === 'number') hd = e.webkitCompassHeading;
  else if (e.absolute && typeof e.alpha === 'number') hd = compassHeading(e.alpha, e.beta || 0, e.gamma || 0);
  if (hd === null || isNaN(hd)) return;
  const st = baitState;
  if (st.heading !== null && st.headingSrc === 'bússola') {
    const diff = ((hd - st.heading + 540) % 360) - 180;
    hd = (st.heading + diff * 0.3 + 360) % 360;
  }
  st.heading = hd;
  st.headingSrc = 'bússola';
  updateRadar(false);
}

function enableCompass() {
  const start = () => {
    baitState.compassOn = true;
    window.addEventListener('deviceorientationabsolute', onOrient, true);
    window.addEventListener('deviceorientation', onOrient, true);
    const b = document.getElementById('btn-compass');
    if (b) b.textContent = '🧭 Bússola ativa';
  };
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission().then(r => { if (r === 'granted') start(); else alert('Permissão da bússola negada.'); }).catch(() => alert('Bússola indisponível neste aparelho.'));
  } else start();
}

function startBaitWatch() {
  if (baitState.watchId !== null || !navigator.geolocation) return;
  baitState.watchId = navigator.geolocation.watchPosition(onBaitPos, e => {
    const i = document.getElementById('radar-info');
    if (i) i.innerHTML = '⚠️ GPS: ' + ({ 1: 'permissão negada — libere a localização no navegador.', 2: 'sem sinal.', 3: 'tempo esgotado.' }[e.code] || 'erro.');
  }, { enableHighAccuracy: true, maximumAge: 1000, timeout: 40000 });
}

function stopBaitWatch() {
  if (baitState.watchId !== null && navigator.geolocation) navigator.geolocation.clearWatch(baitState.watchId);
  baitState.watchId = null;
  window.removeEventListener('deviceorientationabsolute', onOrient, true);
  window.removeEventListener('deviceorientation', onOrient, true);
  baitState.compassOn = false;
}

function updateRadar(force) {
  const map = document.getElementById('radar-map');
  if (!map) return;
  const st = baitState;
  if (!force && Date.now() - st.lastDraw < 150) return;
  st.lastDraw = Date.now();
  const info = document.getElementById('radar-info');
  const baits = FinStore.get(BAIT_KEY).filter(b => b.status === 'ativa' && typeof b.lat === 'number');
  if (!st.me) { info.innerHTML = '⏳ Aguardando sinal de GPS… vá para céu aberto.'; return; }
  const me = st.me;
  const pts = baits.map(b => ({ b, dx: (b.lon - me.lon) * Math.cos(toRad(me.lat)) * 111320, dy: (b.lat - me.lat) * 110540, d: geoDist(me, b), brg: geoBearing(me, b) })).sort((a, b) => a.d - b.d);
  let tgt = pts.find(p => p.b.id === st.target) || null;
  if (!tgt && pts.length) { tgt = pts[0]; st.target = tgt.b.id; const sel = document.getElementById('radar-target'); if (sel) sel.value = st.target; }
  const maxD = Math.max(60, tgt ? tgt.d : (pts.length ? pts[pts.length - 1].d : 60)) * 1.2;
  const sc = 120 / maxD;
  let rings = '';
  [1 / 3, 2 / 3, 1].forEach(k => { rings += '<circle cx="150" cy="150" r="' + (120 * k) + '" fill="none" stroke="#475569" stroke-dasharray="3 3"/><text x="153" y="' + (150 - 120 * k + 11) + '" fill="#94a3b8" font-size="9">' + fmtDist(maxD * k) + '</text>'; });
  rings += '<text x="146" y="14" fill="#f59e0b" font-size="12" font-weight="700">N</text>';
  document.getElementById('radar-rings').innerHTML = rings;
  document.getElementById('radar-dots').innerHTML = pts.map(p => {
    const r = Math.hypot(p.dx, p.dy) * sc, k = r > 135 ? 135 / r : 1;
    const x = 150 + p.dx * sc * k, y = 150 - p.dy * sc * k, isT = tgt && p.b.id === tgt.b.id;
    return (isT ? '<line x1="150" y1="150" x2="' + x + '" y2="' + y + '" stroke="#f59e0b" stroke-dasharray="4 3"/>' : '') + '<circle cx="' + x + '" cy="' + y + '" r="' + (isT ? 8 : 5) + '" fill="' + (isT ? '#f59e0b' : '#10b981') + '"' + (k < 1 ? ' fill-opacity="0.4"' : '') + '/><text x="' + (x + 9) + '" y="' + (y + 4) + '" fill="#e2e8f0" font-size="10">' + esc(p.b.number) + '</text>';
  }).join('');
  document.getElementById('radar-me').setAttribute('transform', 'translate(150,150) rotate(' + (st.heading || 0) + ')');
  const hasH = st.heading !== null;
  let h = '<div>📍 Precisão do GPS: ±' + Math.round(me.acc) + ' m</div>';
  h += hasH ? '<div>🧭 Você está indo para <strong>' + compassName(st.heading) + ' (' + Math.round(st.heading) + '°)</strong> <small style="color:var(--slate-400);">— ' + st.headingSrc + '</small></div>' : '<div style="color:var(--slate-400);">🧭 Direção ainda desconhecida: ative a bússola ou ande alguns metros. A seta aponta em relação ao Norte (topo).</div>';
  const arrow = document.getElementById('arrow-g');
  if (tgt) {
    arrow.setAttribute('transform', 'rotate(' + (tgt.brg - (hasH ? st.heading : 0)) + ')');
    let turn = '';
    if (hasH) { const diff = ((tgt.brg - st.heading + 540) % 360) - 180; turn = Math.abs(diff) < 15 ? ' · <strong>siga em frente</strong>' : ' · vire ' + Math.round(Math.abs(diff)) + '° à ' + (diff > 0 ? 'direita' : 'esquerda'); }
    h += '<div style="font-size:1.1rem; margin-top:0.4rem;">🪤 <strong>' + esc(tgt.b.number) + '</strong> — ' + esc(tgt.b.name) + '<br><span style="color:var(--honey-400); font-weight:700;">' + fmtDist(tgt.d) + '</span> · rumo ' + compassName(tgt.brg) + ' (' + Math.round(tgt.brg) + '°)' + turn + '</div>';
    if (tgt.d <= 25) {
      h += '<div style="color:var(--emerald-500); font-weight:700;">✅ Você está a menos de 25 m da caixa!</div>';
      if (!st.near && navigator.vibrate) navigator.vibrate([200, 100, 200]);
      st.near = true;
    } else st.near = false;
  } else { arrow.setAttribute('transform', 'scale(0)'); h += '<div style="color:var(--slate-400);">Nenhuma caixa isca em campo.</div>'; }
  info.innerHTML = h;
  document.getElementById('radar-legend').innerHTML = pts.slice(0, 8).map(p => esc(p.b.number) + ' — ' + fmtDist(p.d) + ' (' + compassName(p.brg) + ')').join(' · ');
}

function bindBaitEvents() {
  const $ = id => document.getElementById(id);
  $('btn-new-bait')?.addEventListener('click', openBaitModal);
  $('btn-bait-view')?.addEventListener('click', () => { baitView = baitView === 'radar' ? 'list' : 'radar'; renderApp(); });
  $('radar-target')?.addEventListener('change', e => { baitState.target = e.target.value; updateRadar(true); });
  $('btn-compass')?.addEventListener('click', enableCompass);
  if (baitView === 'radar') {
    startBaitWatch();
    if (baitState.compassOn && $('btn-compass')) $('btn-compass').textContent = '🧭 Bússola ativa';
    updateRadar(true);
  } else stopBaitWatch();
  const find = id => FinStore.get(BAIT_KEY).find(x => x.id === id);
  const update = (id, fn) => { const l = FinStore.get(BAIT_KEY); const b = l.find(x => x.id === id); if (b) { fn(b); FinStore.put(BAIT_KEY, l); } };
  document.querySelectorAll('.bt-go').forEach(b => b.addEventListener('click', () => { baitState.target = b.dataset.id; baitView = 'radar'; renderApp(); }));
  document.querySelectorAll('.bt-chk').forEach(b => b.addEventListener('click', () => { update(b.dataset.id, x => { x.lastCheck = todayISO(); }); renderApp(); }));
  document.querySelectorAll('.bt-ret').forEach(b => b.addEventListener('click', () => {
    if (confirm('Recolher esta caixa? Ela volta para o estoque como caixa vazia.')) { update(b.dataset.id, x => { x.status = 'recolhida'; }); renderApp(); }
  }));
  document.querySelectorAll('.bt-del').forEach(b => b.addEventListener('click', () => {
    if (confirm('Excluir este registro de caixa isca?')) { FinStore.del(BAIT_KEY, b.dataset.id); renderApp(); }
  }));
  document.querySelectorAll('.bt-gps').forEach(b => b.addEventListener('click', () => {
    gpsCapture((la, lo, ac) => { update(b.dataset.id, x => { x.lat = la; x.lon = lo; x.acc = Math.round(ac); }); renderApp(); }, t => { b.title = t; if (t.indexOf('⚠️') === 0) alert(t); });
  }));
  document.querySelectorAll('.bt-col').forEach(b => b.addEventListener('click', () => {
    const bt = find(b.dataset.id);
    const data = ApisStorage.getAll();
    if (!bt) return;
    if (!data.apiaries.length) { alert('Cadastre primeiro um núcleo para receber a colmeia.'); return; }
    openHiveModal(data, null, { code: bt.number, boxId: bt.boxId });
  }));
}

function renderApp() {
  const mainContent = document.getElementById('main-view');
  if (!mainContent) return;

  if (currentTab !== 'baits') stopBaitWatch();
  runRecurringTasks();
  const data = ApisStorage.getAll();

  switch (currentTab) {
    case 'baits':
      mainContent.innerHTML = renderBaitView(data);
      bindBaitEvents();
      break;

    case 'equip':
      mainContent.innerHTML = renderEquipView(data);
      bindEquipEvents();
      break;

    case 'planejamento':
      mainContent.innerHTML = renderPlanView(data);
      bindPlanEvents();
      break;

    case 'hivecard':
      mainContent.innerHTML = renderHiveCardView(data);
      bindHiveCardEvents();
      break;

    case 'insumos':
      mainContent.innerHTML = renderInsumosView(data);
      bindInsumosEvents();
      break;

    case 'manejo':
      mainContent.innerHTML = renderManejoView(data);
      bindManejoEvents();
      break;

    case 'finance':
      mainContent.innerHTML = renderFinanceView(data);
      bindFinanceEvents();
      break;

    case 'dashboard':
      mainContent.innerHTML = buildAlertsHtml(data) + renderDashboardView(data);
      bindDashboardEvents(data);
      refreshWeather();
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
      mainContent.innerHTML = buildAlertsHtml(data) + renderDashboardView(data);
      break;
  }
}

/* ==========================================================================
   QUEENS & COLORS VIEW
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

  const _w = getWeatherCache();
  const tempSimulated = _w ? _w.temp : 26;
  const windSimulated = _w ? _w.wind : 11;
  const flightCondition = (tempSimulated >= 20 && windSimulated < 20) 
    ? { label: 'Ótima para Voo & Revisão', color: 'var(--emerald-500)', icon: '☀️' }
    : { label: 'Cuidado (Vento/Frio)', color: 'var(--rose-500)', icon: '🌧️' };

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
      
      const boxCount = hivesInAp.length;
      const supersSum = hivesInAp.reduce((acc, h) => acc + (parseInt(h.supersCount) || 0), 0);
      const collectorsSum = hivesInAp.reduce((acc, h) => acc + (parseInt(h.propolisCollectors) || 0), 0);

      const locStr = (ap.location || '').trim();
      const hasCoordinates = locStr && /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/.test(locStr);

      const mapButtonHtml = hasCoordinates 
        ? `<div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
             <button type="button" class="btn btn-secondary btn-view-dashboard-map" data-coords="${locStr}" data-name="${ap.name}" style="padding:0.4rem 0.6rem; font-size:0.8rem; background:rgba(59,130,246,0.15); color:#60a5fa; border:1px solid rgba(59,130,246,0.3);">🗺️ Ver no Mapa</button>
             <button type="button" class="btn btn-primary btn-route-dashboard-map" data-coords="${locStr}" data-name="${ap.name}" style="padding:0.4rem 0.6rem; font-size:0.8rem; background:rgba(16,185,129,0.15); color:#34d399; border:1px solid rgba(16,185,129,0.3);">🚗 Ver rotas</button>
           </div>`
        : '';

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
              <td>${h.framesBrood} N / ${h.framesHoney} M (${h.supersCount} Melg.${h.supersBig ? ' · ' + h.supersBig + ' Melgueirão' : ''}${h.nestExtenders ? ' · ' + h.nestExtenders + ' Sobreninho' : ''})</td>
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
          <span class="tag-badge">☁️ Backup NATIVO na Nuvem (Drive, OneDrive, MEGA, iCloud)</span>
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
        <div class="stat-sub">${tempSimulated}°C | Vento: ${windSimulated} km/h${_w ? ' | Chuva 7d: ' + _w.rain7 + ' mm' : ' | (sem dados reais: informe coordenadas do apiário)'}</div>
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
            <strong style="color:var(--emerald-500); font-size:0.85rem;">☁️ BACKUP EM QUALQUER NUVEM</strong>
            <p style="font-size:0.8rem; color:var(--slate-200); margin-top:0.25rem;">
              Envie ou guarde facilmente seus backups no <strong>Google Drive, OneDrive, MEGA, Dropbox ou iCloud</strong> diretamente no seu celular ou computador.
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

  document.querySelectorAll('.btn-view-dashboard-map').forEach(btn => {
    btn.addEventListener('click', () => {
      const coords = btn.getAttribute('data-coords');
      const name = btn.getAttribute('data-name');
      
      const mapModalContent = `
        <div style="background: rgba(15,23,42,0.8); padding: 1rem; border-radius: 12px; border: 1px solid var(--slate-700);">
          <p style="color: var(--slate-300); font-size: 0.9rem; margin-bottom: 1rem;">
            Exibindo localização geográfica registrada para: <strong style="color: var(--honey-400);">${name}</strong> 
          </p>
          <div id="apiary-map-container" style="width: 100%; height: auto; border-radius: 8px; overflow: hidden; border: 1px solid var(--slate-600); background: #0f172a;">
            <div style="padding: 2rem; text-align: center; color: var(--slate-400); font-size: 0.9rem;">
              Sintonizando satélites...
            </div>
          </div>
        </div>
      `;
      
      openModal(`🗺️ Mapa do Núcleo: ${name}`, mapModalContent);
      
      setTimeout(() => {
        renderDynamicMapForCoords(coords, name);
      }, 100);
    });
  });

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
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lat + ',' + lng)}`;
  const googleDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(lat + ',' + lng)}&travelmode=driving`;

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
          (hive.collectorSupers ? '<div class="hive-metric-item"><span>Melg. c/ coletor</span><strong>' + hive.collectorSupers + ' un</strong></div>' : '') +
          (hive.supersBig ? '<div class="hive-metric-item"><span>Melgueirões</span><strong>' + hive.supersBig + ' un</strong></div>' : '') +
          (hive.nestExtenders ? '<div class="hive-metric-item"><span>Sobreninhos</span><strong>' + hive.nestExtenders + ' un</strong></div>' : '') +
          hiveExtrasHtml(hive) +
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
                    <button class="btn btn-secondary btn-edit-harvest" data-id="${harv.id}" style="padding:0.3rem 0.6rem; font-size:0.75rem;">✏️</button>
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
  document.querySelectorAll('.btn-edit-harvest').forEach(btn => {
    btn.addEventListener('click', () => {
      const h = data.harvests.find(x => x.id === btn.getAttribute('data-id'));
      if (h) openHarvestModal(data, h);
    });
  });

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
        ${months.map((m, mi) => `
          <div style="background:rgba(15,23,42,0.6); border:${mi === new Date().getMonth() ? '2px solid var(--honey-400)' : '1px solid var(--glass-border)'}; padding:1.2rem; border-radius:var(--radius-lg);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
              <strong style="font-family:var(--font-heading); font-size:1.1rem; color:var(--honey-400);">${m.name}${mi === new Date().getMonth() ? ' • mês atual' : ''}</strong>
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
        <label>Colmeia (opcional, para o ranking):</label>
        <select id="harv-hiveId" class="form-control">
          <option value="">Apiário todo / não informar</option>
          ${(data.hives || []).map(x => `<option value="${x.id}" ${harv.hiveId === x.id ? 'selected' : ''}>${x.code} — ${x.name}</option>`).join('')}
        </select>
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
      hiveId: document.getElementById('harv-hiveId').value,
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

  openModal(isEdit ? `✏️ Editar Núcleo: ${ap.name}` : '🏞️ Cadastrar Novo Núcleo de Produção', html);
  document.getElementById('btn-cancelar-apiary')?.addEventListener('click', closeModal);

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

    const gpsOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
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

  const boxModels = ApisStorage.getBoxModels();

  let apiaryOptions = '';
  if (data.apiaries && data.apiaries.length > 0) {
    for (let i = 0; i < data.apiaries.length; i++) {
      const a = data.apiaries[i];
      const selected = h.apiaryId === a.id ? 'selected' : '';
      apiaryOptions += '<option value="' + a.id + '" ' + selected + '>' + a.name + '</option>';
    }
  }

  const modelOptions = (boxModels.length === 0 ? '<option value="">Nenhum modelo cadastrado</option>' : '') + boxModels.map(model => {
    const selected = h.type === model ? 'selected' : '';
    return `<option value="${model}" ${selected}>${model}</option>`;
  }).join('');

  const hiveEqId = isEdit ? h.id : null;
  const eqBoxes = FinStore.get('apisapp_equip').filter(x => x.cat === BOX_CAT && ((hiveEqId && x.hiveId === hiveEqId) || (!data.hives.some(hv => hv.id === x.hiveId) && (!baitBoxIds().has(x.id) || h.boxId === x.id)))).sort((a, b) => String(a.number).localeCompare(String(b.number), undefined, { numeric: true }));
  const boxSelectHtml = '<div class="form-group" style="grid-column:1 / -1;"><label>Caixa do estoque:</label><select id="hv-box" class="form-control"><option value="">— Sem caixa do estoque (digitar o código) —</option>' +
    eqBoxes.map(b => '<option value="' + b.id + '" data-num="' + esc(b.number) + '"' + ((h.boxId === b.id || (isEdit && b.hiveId === h.id)) ? ' selected' : '') + '>' + esc(b.number) + (isEdit && b.hiveId === h.id ? ' (atual)' : '') + '</option>').join('') +
    '</select><small style="color:var(--slate-400);">' + (eqBoxes.length ? 'Ao salvar, a caixa fica marcada como povoada por esta colmeia.' : 'Nenhuma caixa vazia no estoque (cadastre na aba 🧰 Caixas & Equip.).') + '</small>' +
    '<div id="hv-num-info" style="margin-top:0.4rem; font-size:0.8rem; color:var(--slate-400); line-height:1.5;"></div></div>';

  const html = `
    <form id="form-edit-hive" class="form-grid">
      ${boxSelectHtml}
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
        <label>Quantidade de Melgueiras (total, incluindo as com coletor):</label>
        <input type="number" id="hv-supersCount" class="form-control" min="0" max="10" value="${h.supersCount || 0}">
      </div>
      <div class="form-group">
        <label>Quantidade de Melgueirões:</label>
        <input type="number" id="hv-supersBig" class="form-control" min="0" max="10" value="${h.supersBig || 0}">
      </div>
      <div class="form-group">
        <label>Quantidade de Sobreninhos:</label>
        <input type="number" id="hv-nestExtenders" class="form-control" min="0" max="10" value="${h.nestExtenders || 0}">
      </div>
      <div class="form-group">
        <label>Produtora de Própolis?</label>
        <select id="hv-propolisProducer" class="form-control">
          <option value="false" ${h.propolisProducer === false ? 'selected' : ''}>Não</option>
          <option value="true" ${h.propolisProducer === true ? 'selected' : ''}>Sim</option>
        </select>
      </div>
      <div class="form-group" id="hv-collsup-wrap" style="${h.propolisProducer === true ? '' : 'display:none;'}">
        <label>Quantas melgueiras com coletor?</label>
        <input type="number" id="hv-collectorSupers" class="form-control" min="0" max="10" value="${h.collectorSupers || 0}">
      </div>
      <div class="form-group" id="hv-coll-wrap" style="${h.propolisProducer === true ? '' : 'display:none;'}">
        <label>Quantidade de Coletores:</label>
        <input type="number" id="hv-propolisCollectors" class="form-control" min="0" max="10" value="${h.propolisCollectors || 0}">
      </div>
      <div style="grid-column:1 / -1;">
        <label style="font-weight:600;">Outros equipamentos desta colmeia (cavalete, suporte de óleo, telha de cobertura...):</label>
        <div id="hv-extra-rows" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:0.5rem; margin-top:0.4rem;"></div>
        <div style="display:flex; gap:0.4rem; flex-wrap:wrap; margin-top:0.6rem; align-items:center;">
          <input type="text" id="hv-newcat-name" class="form-control" placeholder="Nova categoria (ex.: Cavalete com suporte de óleo)" style="flex:1; min-width:200px;">
          <select id="hv-newcat-num" class="form-control" style="width:auto;"><option value="0">Sem numeração</option><option value="1">Numerada</option></select>
          <button type="button" class="btn btn-secondary" id="btn-hv-newcat">+ Categoria</button>
        </div>
      </div>
      <div id="hv-eq-hints" style="grid-column:1 / -1; font-size:0.8rem; color:var(--slate-400); background:rgba(15,23,42,0.5); padding:0.6rem 0.8rem; border-radius:10px; line-height:1.6;"></div>
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
  const boxSel = document.getElementById('hv-box');
  if (boxSel) boxSel.addEventListener('change', () => { const o = boxSel.selectedOptions[0]; if (o && o.dataset.num) { document.getElementById('hv-code').value = o.dataset.num; updateNumInfo(); } });
  
  const prodSel = document.getElementById('hv-propolisProducer');
  const codeEl = document.getElementById('hv-code');
  const numInfoEl = document.getElementById('hv-num-info');
  const hintsEl = document.getElementById('hv-eq-hints');
  const intVal = id => parseInt(document.getElementById(id).value, 10) || 0;
  const colInit = h.propolisProducer === true ? (parseInt(h.collectorSupers, 10) || 0) : 0;
  const initEq = { [SUPER_CAT]: Math.max(0, Math.max(parseInt(h.supersCount, 10) || 0, colInit) - colInit), [COLLECTOR_CAT]: colInit, [BIG_CAT]: parseInt(h.supersBig, 10) || 0, [NEST_CAT]: parseInt(h.nestExtenders, 10) || 0 };
  const desiredEq = () => {
    const col = prodSel.value === 'true' ? intVal('hv-collectorSupers') : 0;
    const total = Math.max(intVal('hv-supersCount'), col);
    const d = { [SUPER_CAT]: total - col, [COLLECTOR_CAT]: col, [BIG_CAT]: intVal('hv-supersBig'), [NEST_CAT]: intVal('hv-nestExtenders') };
    document.querySelectorAll('.hv-x-input').forEach(i => { d[i.dataset.cat] = parseInt(i.value, 10) || 0; });
    return d;
  };
  const eqChanged = () => { const d = desiredEq(), o = {}; Object.keys(d).forEach(c => { if (d[c] !== initEq[c]) o[c] = d[c]; }); return o; };
  const refreshEqHints = () => {
    const plan = equipPlan(isEdit ? h.id : null, eqChanged(), preferred);
    const lines = Object.keys(initEq).map(cat => {
      const pv = plan.preview[cat];
      if (pv === undefined) return '• ' + esc(cat) + ': sem alteração';
      if (pv === null) return '• ' + esc(cat) + ': sem itens no estoque (vale o número digitado)';
      return '• ' + esc(cat) + ': ' + pv.free + ' livre(s)' + (pv.mine.length ? ' · na colmeia: ' + pv.mine.map(esc).join(', ') : '') + (pv.add.length ? ' · <span style="color:var(--emerald-500);">entram: ' + pv.add.map(esc).join(', ') + '</span>' : '') + (pv.remove.length ? ' · <span style="color:var(--rose-500);">voltam: ' + pv.remove.map(esc).join(', ') + '</span>' : '');
    });
    if (plan.errors.length) lines.push('<span style="color:var(--rose-500);">⚠️ ' + plan.errors.map(esc).join(' ') + '</span>');
    hintsEl.innerHTML = '<strong>📦 Do estoque:</strong><br>' + lines.join('<br>');
  };
  const updateNumInfo = () => {
    const m = String(codeEl.value).match(/^(.*?)(\d+)$/);
    const prefix = m ? m[1] : 'CX-';
    const info = eqNumberInfo(prefix, data.hives.filter(x => !isEdit || x.id !== h.id), FinStore.get('apisapp_equip').filter(x => x.cat === BOX_CAT));
    const fmt = n => prefix + String(n).padStart(2, '0');
    numInfoEl.innerHTML = '🔢 <strong>Numeração ' + esc(prefix) + '</strong> — maior em colmeias: ' + (info.maxUsed ? fmt(info.maxUsed) : '—') + ' · maior cadastrado: ' + (info.max ? fmt(info.max) : '—') + ' · <strong>próximo: ' + fmt(info.next) + '</strong> <button type="button" id="btn-use-next" class="btn btn-secondary" style="padding:0.15rem 0.5rem; font-size:0.72rem;">Usar</button><br>Números sem uso no intervalo: ' + (info.gaps.length ? info.gaps.slice(0, 20).map(fmt).join(', ') + (info.gaps.length > 20 ? ' … +' + (info.gaps.length - 20) : '') : 'nenhum');
    document.getElementById('btn-use-next').addEventListener('click', () => { codeEl.value = fmt(info.next); updateNumInfo(); });
  };
  codeEl.addEventListener('input', updateNumInfo);
  prodSel.addEventListener('change', () => {
    const on = prodSel.value === 'true';
    document.getElementById('hv-collsup-wrap').style.display = on ? '' : 'none';
    document.getElementById('hv-coll-wrap').style.display = on ? '' : 'none';
    refreshEqHints();
  });
  ['hv-supersCount', 'hv-supersBig', 'hv-nestExtenders', 'hv-collectorSupers'].forEach(id => document.getElementById(id).addEventListener('input', refreshEqHints));
  const roleNames = [BOX_CAT, SUPER_CAT, COLLECTOR_CAT, BIG_CAT, NEST_CAT];
  const extraRowsEl = document.getElementById('hv-extra-rows');
  const holderOf = x => x.hiveId ? data.hives.find(hv => hv.id === x.hiveId) : null;
  const preferred = {};
  const renderPick = (cat, block) => {
    const stock = FinStore.get('apisapp_equip').filter(x => x.cat === cat).sort(eqSort);
    const sel = block.querySelector('.hv-x-pick');
    const pref = preferred[cat] || (preferred[cat] = []);
    if (sel) {
      sel.innerHTML = '<option value="">Escolher item do estoque…</option>' + stock.filter(x => x.number).map(x => {
        const hh = holderOf(x);
        const mine = isEdit && hh && hh.id === h.id;
        const chosen = pref.indexOf(x.id) > -1;
        const ap = hh ? data.apiaries.find(a => a.id === hh.apiaryId) : null;
        const txt = mine ? '✅ já nesta colmeia' : chosen ? '☑️ selecionado' : hh ? '🔧 em uso na ' + esc(hh.code) + (ap ? ' (' + esc(ap.name) + ')' : '') : '📦 livre no estoque';
        return '<option value="' + x.id + '"' + (mine || chosen || hh ? ' disabled' : '') + '>' + esc(x.number) + ' — ' + txt + '</option>';
      }).join('');
    }
    block.querySelector('.hv-x-chips').innerHTML = pref.map(id => { const it = stock.find(x => x.id === id); return it ? '<span class="tag-badge" style="margin:0.1rem;">' + esc(it.number) + ' <a href="#" class="hv-x-del" data-id="' + id + '" style="color:var(--rose-500); text-decoration:none;">✕</a></span>' : ''; }).join('');
    block.querySelector('.hv-x-info').textContent = stock.length ? 'Estoque: ' + stock.length + ' no total · ' + stock.filter(x => !holderOf(x)).length + ' livre(s)' : 'Sem itens no estoque (vale o número digitado)';
  };
  const addExtraRow = cat => {
    if (Array.from(extraRowsEl.querySelectorAll('.hv-x-input')).some(i => i.dataset.cat === cat)) return;
    const stock = FinStore.get('apisapp_equip');
    const tracked = stock.some(x => x.cat === cat);
    const attached = isEdit ? stock.filter(x => x.cat === cat && x.hiveId === h.id).length : 0;
    const val = tracked ? attached : ((h.extras && h.extras[cat]) || 0);
    initEq[cat] = val;
    extraRowsEl.insertAdjacentHTML('beforeend', '<div class="form-group hv-x-block" style="margin:0; grid-column:1 / -1;"><label>' + esc(cat) + ':</label>' +
      '<div style="display:flex; gap:0.4rem; flex-wrap:wrap;"><input type="number" class="form-control hv-x-input" data-cat="' + esc(cat) + '" min="0" max="50" value="' + val + '" style="width:90px;" title="Quantidade">' +
      (stock.some(x => x.cat === cat && x.number) ? '<select class="form-control hv-x-pick" style="flex:1; min-width:200px;"></select>' : '') + '</div>' +
      '<div class="hv-x-chips"></div><small class="hv-x-info" style="color:var(--slate-400);"></small></div>');
    const block = extraRowsEl.lastElementChild;
    const input = block.querySelector('.hv-x-input');
    input.addEventListener('input', refreshEqHints);
    const pick = block.querySelector('.hv-x-pick');
    if (pick) pick.addEventListener('change', () => {
      if (!pick.value) return;
      (preferred[cat] = preferred[cat] || []).push(pick.value);
      input.value = (parseInt(input.value, 10) || 0) + 1;
      renderPick(cat, block);
      refreshEqHints();
    });
    block.addEventListener('click', e => {
      const del = e.target.closest('.hv-x-del');
      if (!del) return;
      e.preventDefault();
      preferred[cat] = (preferred[cat] || []).filter(id => id !== del.dataset.id);
      input.value = Math.max(0, (parseInt(input.value, 10) || 0) - 1);
      renderPick(cat, block);
      refreshEqHints();
    });
    renderPick(cat, block);
  };
  eqCats().filter(c => roleNames.indexOf(c) === -1 && eqInHive(c)).forEach(addExtraRow);
  const collectExtras = () => {
    const out = {};
    const stock = FinStore.get('apisapp_equip');
    document.querySelectorAll('.hv-x-input').forEach(i => {
      const v = parseInt(i.value, 10) || 0;
      if (v > 0 && !stock.some(x => x.cat === i.dataset.cat)) out[i.dataset.cat] = v;
    });
    return out;
  };
  document.getElementById('btn-hv-newcat').addEventListener('click', () => {
    const nameEl = document.getElementById('hv-newcat-name');
    const name = nameEl.value.trim();
    if (!name) return;
    if (eqCats().some(c => c.toLowerCase() === name.toLowerCase())) { alert('Já existe uma categoria com esse nome.'); return; }
    FinStore.save(EQ_CAT_KEY, { name }, 'eqc');
    const cfg = getEqCfg();
    cfg[name] = document.getElementById('hv-newcat-num').value === '1';
    setEqCfg(cfg);
    const hmx = getEqHiveCfg(); hmx[name] = true; setEqHiveCfg(hmx);
    nameEl.value = '';
    addExtraRow(name);
    refreshEqHints();
  });
  updateNumInfo();
  refreshEqHints();

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
      supersBig: num('hv-supersBig'),
      nestExtenders: num('hv-nestExtenders'),
      collectorSupers: num('hv-collectorSupers'),
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
      supersBig: parseInt(document.getElementById('hv-supersBig').value, 10) || 0,
      extras: collectExtras(),
      nestExtenders: parseInt(document.getElementById('hv-nestExtenders').value, 10) || 0,
      collectorSupers: document.getElementById('hv-propolisProducer').value === 'true' ? (parseInt(document.getElementById('hv-collectorSupers').value, 10) || 0) : 0,
      propolisProducer: document.getElementById('hv-propolisProducer').value === 'true',
      propolisCollectors: document.getElementById('hv-propolisProducer').value === 'true' ? (parseInt(document.getElementById('hv-propolisCollectors').value, 10) || 0) : 0,
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

    if (hiveData.collectorSupers > hiveData.supersCount) hiveData.supersCount = hiveData.collectorSupers;
    const eqPlan = equipPlan(isEdit ? h.id : null, eqChanged(), preferred);
    if (eqPlan.errors.length) { alert(eqPlan.errors.join('\n')); return; }
    ApisStorage.saveHive(hiveData);
    const bxSel = document.getElementById('hv-box');
    if (bxSel) {
      const prevBox = FinStore.get('apisapp_equip').find(x => x.cat === BOX_CAT && x.hiveId === hiveData.id);
      if ((prevBox ? prevBox.id : '') !== bxSel.value) {
        if (prevBox) equipSetHive([prevBox.id], '');
        if (bxSel.value) equipSetHive([bxSel.value], hiveData.id);
      }
    }
    if (bxSel && bxSel.value) {
      const bl = FinStore.get(BAIT_KEY);
      const bt = bl.find(x => x.boxId === bxSel.value && x.status === 'ativa');
      if (bt) { bt.status = 'colonizada'; bt.hiveId = hiveData.id; bt.colonizedDate = todayISO(); FinStore.put(BAIT_KEY, bl); }
    }
    if (eqPlan.release.length) equipSetHive(eqPlan.release, '');
    if (eqPlan.assign.length) equipSetHive(eqPlan.assign, hiveData.id);
    closeModal();
    renderApp();
  });
}

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
      if (formDraft) formDraft.type = name;
      reopen();
    } else {
      alert('Formato inválido.');
    }
  };
  document.getElementById('btn-save-new-model').addEventListener('click', addModel);
  document.getElementById('new-model-name').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addModel(); }
  });

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

  document.getElementById('btn-close-models').addEventListener('click', () => {
    openHiveModal(ApisStorage.getAll(), currentHive, formDraft);
  });
};

// ==========================================================================
// BACKUP MULTI-NUVEM & GOOGLE DRIVE AUTO SYNC
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
        Guarde e restaure o seu projeto no serviço de armazenamento na nuvem: 
        <strong>Google Drive, OneDrive, MEGA, Dropbox ou iCloud</strong>.
      </p>

      <!-- SEÇÃO 1: COMPARTILHAMENTO UNIVERSAL -->
      <div style="background:rgba(30,41,59,0.7); border:1px solid var(--slate-700); padding:1rem; border-radius:10px;">
        <strong style="color:var(--honey-400); font-size:0.9rem;">☁️ Salvar em Qualquer Nuvem</strong>
        <p style="font-size:0.8rem; color:var(--slate-300); margin:0.4rem 0 0.8rem 0;">
          Abre as opções do seu celular/computador para enviar manualmente para qualquer aplicativo.
        </p>
        <button class="btn btn-primary" id="btn-backup-send-universal" style="width:100%; justify-content:center;">
          📤 Enviar / Compartilhar Backup
        </button>
      </div>

      <!-- SEÇÃO 2: RESTAURAÇÃO DE BACKUPS DO DRIVE OU ARQUIVO LOCAL -->
      <div style="background:rgba(30,41,59,0.7); border:1px solid var(--slate-700); padding:1rem; border-radius:10px;">
        <strong style="color:#60a5fa; font-size:0.9rem;">📥 Restaurar Dados</strong>
        <p style="font-size:0.8rem; color:var(--slate-300); margin:0.4rem 0 0.8rem 0;">
          Escolha um backup salvo na pasta do seu Google Drive ou um arquivo <code>.json</code> baixado.
        </p>
        <div style="display:flex; flex-direction:column; gap:0.5rem;">
          <button class="btn btn-primary" id="btn-list-drive-backups" style="width:100%; justify-content:center; background:#2563eb;">
            🔍 Ver Backups Disponíveis no Google Drive
          </button>
          <button class="btn btn-secondary" id="btn-backup-restore-universal" style="width:100%; justify-content:center;">
            📂 Escolher Arquivo Local (.json)
          </button>
        </div>
      </div>

      <!-- SEÇÃO 3: AUTO-SYNC DIÁRIO AUTOMÁTICO -->
      <div style="background:rgba(16,185,129,0.1); border-left:4px solid var(--emerald-500); padding:0.85rem; border-radius:8px;">
        <strong style="color:var(--emerald-500); font-size:0.85rem;">🔄 AUTO-SYNC DIÁRIO (1X POR DIA)</strong>
        <p style="font-size:0.8rem; color:var(--slate-200); margin:0.35rem 0;" id="drive-status-text">${ApisDrive.statusText()}</p>
        ${ApisDrive.isConnected()
          ? `<div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:0.5rem;">
               <button class="btn btn-primary" id="btn-drive-sync-now">Enviar Agora</button>
               <button class="btn btn-secondary" id="btn-drive-disconnect">Desligar Auto-Sync</button>
             </div>`
          : `<button class="btn btn-primary" id="btn-drive-connect" style="margin-top:0.5rem; width:100%;">Ligar Backup Diário Automático</button>`}
      </div>

      <p style="font-size:0.75rem; color:var(--slate-400); margin:0; text-align:center;">Último backup local gerado: ${ultimo}</p>
    </div>`;
    
  openModal('☁️ Backup & Restauração na Nuvem', html);

  document.getElementById('btn-backup-send-universal')?.addEventListener('click', async () => {
    const r = await ApisStorage.shareToDriveOrEmail();
    if (r.method === 'download') {
      alert('O arquivo de backup foi baixado. Salve-o no seu serviço de nuvem preferido.');
    }
  });

  document.getElementById('btn-backup-restore-universal')?.addEventListener('click', () => {
    if (!confirm('Restaurar o backup vai substituir os dados atuais deste dispositivo. Deseja continuar?')) return;
    escolherArquivoBackup((ok) => {
      if (ok) {
        alert('Backup restaurado com sucesso!');
        location.reload();
      } else {
        alert('Arquivo inválido. Escolha um arquivo válido no formato ApisApp_Backup_....json.');
      }
    });
  });

  // NOVO: Visualizar os arquivos do Google Drive e selecionar qual restaurar
  document.getElementById('btn-list-drive-backups')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-list-drive-backups');
    btn.innerText = '⏳ Carregando backups do Google Drive...';
    btn.disabled = true;

    try {
      const files = await ApisDrive.listBackups();
      if (files.length === 0) {
        alert('Nenhum backup foi encontrado na pasta do seu apiário no Google Drive.');
        openBackupModal();
        return;
      }

      let optionsHtml = files.map(f => {
        const dataFormatada = new Date(f.date).toLocaleString('pt-BR');
        return `
          <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(15,23,42,0.8); border:1px solid var(--slate-700); padding:0.75rem; border-radius:8px;">
            <div>
              <strong style="color:var(--honey-400); font-size:0.85rem;">📄 ${f.name}</strong>
              <div style="font-size:0.75rem; color:var(--slate-400);">Criado em: ${dataFormatada}</div>
            </div>
            <button class="btn btn-primary btn-restore-file" data-id="${f.id}" style="padding:0.4rem 0.75rem; font-size:0.8rem;">
              Restaurar
            </button>
          </div>`;
      }).join('');

      openModal('📥 Selecione o Backup para Restaurar', `
        <div style="display:flex; flex-direction:column; gap:0.75rem;">
          <p style="font-size:0.85rem; color:var(--slate-300);">Estes são os backups armazenados na pasta do seu apiário no Google Drive:</p>
          ${optionsHtml}
          <button class="btn btn-secondary" onclick="openBackupModal()" style="margin-top:0.5rem;">Voltar</button>
        </div>
      `);

      document.querySelectorAll('.btn-restore-file').forEach(b => {
        b.addEventListener('click', async () => {
          const id = b.getAttribute('data-id');
          if (confirm('Restaurar este arquivo irá substituir todos os dados atuais do aplicativo. Confirmar?')) {
            b.innerText = 'Restaurando...';
            b.disabled = true;
            try {
              await ApisDrive.restoreFromDrive(id);
              alert('Backup restaurado com sucesso do Google Drive!');
              location.reload();
            } catch (err) {
              alert('Erro ao restaurar: ' + err.message);
              openBackupModal();
            }
          }
        });
      });

    } catch (e) {
      alert('Erro ao buscar backups: ' + e.message);
      openBackupModal();
    }
  });

  document.getElementById('btn-drive-connect')?.addEventListener('click', async () => {
    try {
      await ApisDrive.connect();
      alert('Sincronização diária ativada! O sistema enviará 1 backup automático por dia quando estiver online.');
      openBackupModal();
    } catch (e) {
      alert('Erro ao conectar: ' + e.message);
    }
  });

  document.getElementById('btn-drive-sync-now')?.addEventListener('click', async () => {
    try { 
      await ApisDrive.upload(true); 
      alert('Backup de hoje enviado com sucesso para o Google Drive!'); 
      openBackupModal(); 
    } catch (e) { 
      alert('Falha ao enviar: ' + e.message); 
    }
  });

  document.getElementById('btn-drive-disconnect')?.addEventListener('click', () => {
    ApisDrive.disconnect(); 
    openBackupModal();
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
        Já usava o app em outro dispositivo? Restaure seu backup salvo no <strong>Google Drive, OneDrive, MEGA, Dropbox ou iCloud</strong>.
      </p>
      <button class="btn btn-primary" id="btn-novo-restaurar">📥 Escolher Arquivo de Backup (.json)</button>
      <button class="btn btn-secondary" id="btn-novo-comecar">Começar do Zero</button>
    </div>`;
  document.body.appendChild(tela);

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
// AUTOMATIZAÇÃO E SINCRONIZAÇÃO EM SEGUNDO PLANO (GOOGLE DRIVE)
// ==========================================================================
const GOOGLE_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxxkU07G3dExu-2hFgQejDs_pIOe9XCYEBumnrnEnEYwd9XBAZ5JoKqzKoSUUgqVJvO/exec';

const ApisDrive = {
  KEY_CONNECTED: 'apisapp_drive_connected',
  KEY_LAST_SYNC_DATE: 'apisapp_drive_last_sync_date',
  _timer: null,

  isConnected() { 
    return localStorage.getItem(this.KEY_CONNECTED) === '1'; 
  },

  statusText() {
    if (typeof GOOGLE_WEBAPP_URL === 'undefined' || GOOGLE_WEBAPP_URL.includes('SUA_URL_AQUI')) {
      return '⚠️ Configure a URL do seu Google Apps Script na variável GOOGLE_WEBAPP_URL para ativar o envio diário.';
    }
    if (!this.isConnected()) {
      return 'Desligado. Ligue para enviar automaticamente 1 backup diário ao Google Drive quando houver internet.';
    }
    const t = localStorage.getItem(this.KEY_LAST_SYNC_DATE);
    const hoje = new Date().toISOString().split('T')[0];
    const enviadoHoje = (t === hoje);
    return 'Conectado ✅ Auto-Sync Diário Ativo. ' + (enviadoHoje ? 'Backup de hoje já foi enviado!' : 'Aguardando envio do dia...');
  },

  async upload(force = false) {
    if (typeof GOOGLE_WEBAPP_URL === 'undefined' || GOOGLE_WEBAPP_URL.includes('SUA_URL_AQUI')) {
      throw new Error('URL do Google Apps Script não configurada.');
    }
    
    if (!navigator.onLine) return false;

    const hoje = new Date().toISOString().split('T')[0];
    const ultimoEnvio = localStorage.getItem(this.KEY_LAST_SYNC_DATE);

    // Regra: Envia apenas 1 vez por dia se não for um clique forçado ("Enviar Agora")
    if (!force && ultimoEnvio === hoje) {
      return false;
    }

    const backup = ApisStorage.getFullBackup();

    const response = await fetch(GOOGLE_WEBAPP_URL, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(backup)
    });

    const result = await response.json();
    if (result.status === 'success') {
      localStorage.setItem(this.KEY_LAST_SYNC_DATE, hoje);
      return true;
    } else {
      throw new Error(result.message || 'Erro ao guardar no Google Drive.');
    }
  },

  async listBackups() {
    if (!navigator.onLine) throw new Error('Conecte-se à internet para carregar os backups do Google Drive.');
    
    const info = ApisStorage.getApicultorInfo();
    const apiario = info ? info.apiarioPrincipal : 'Geral';
    const url = `${GOOGLE_WEBAPP_URL}?action=list&apiario=${encodeURIComponent(apiario)}`;

    const response = await fetch(url);
    const result = await response.json();
    if (result.status === 'success') {
      return result.files || [];
    } else {
      throw new Error(result.message || 'Erro ao listar backups.');
    }
  },

  async restoreFromDrive(fileId) {
    if (!navigator.onLine) throw new Error('Conecte-se à internet para restaurar o backup.');
    
    const url = `${GOOGLE_WEBAPP_URL}?action=download&fileId=${encodeURIComponent(fileId)}`;
    const response = await fetch(url);
    const text = await response.text();

    const ok = ApisStorage.importJSON(text);
    if (!ok) throw new Error('O arquivo selecionado não contém dados válidos.');
    return true;
  },

  connect() {
    localStorage.setItem(this.KEY_CONNECTED, '1');
    this.startAuto();
    return this.upload(true);
  },

  disconnect() {
    localStorage.removeItem(this.KEY_CONNECTED);
    localStorage.removeItem(this.KEY_LAST_SYNC_DATE);
  },

  async autoSync() {
    if (!this.isConnected() || !navigator.onLine) return;
    try {
      await this.upload(false);
    } catch (e) {
      console.warn('Falha na sincronização diária em segundo plano:', e);
    }
  },

  startAuto() {
    if (!this.isConnected()) return;

    if (navigator.onLine) {
      this.autoSync();
    }

    if (!this._timer) {
      this._timer = setInterval(() => this.autoSync(), 3600000); // Verifica a cada 1 hora se mudou o dia
    }

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.autoSync();
    });
  }
};