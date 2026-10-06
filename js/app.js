/**
 * ApisApp Pro v1.0.5 - Código Unificado Standalone
 * Gestão de Apicultura (Apis mellifera)
 * Suporte a execução por duplo clique (file://) e por servidor local (http://)
 */

// ==========================================================================
// 1. MÓDULO DE ARMAZENAMENTO & CORES (storage.js integrado)
// ==========================================================================

const STORAGE_KEYS = {
  APIARIES: 'apisapp_apiaries',
  HIVES: 'apisapp_hives',
  QUEENS: 'apisapp_queens',
  INSPECTIONS: 'apisapp_inspections',
  HARVESTS: 'apisapp_harvests',
  SETTINGS: 'apisapp_settings',
  LAST_BACKUP_DATE: 'apisapp_last_backup_date',
  BACKUPS_HISTORY: 'apisapp_backups_history',
  QUEEN_COLORS: 'apisapp_queen_colors'
};

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
    if (!localStorage.getItem(STORAGE_KEYS.APIARIES)) {
      this.clearAll();
    }
    if (!localStorage.getItem(STORAGE_KEYS.QUEEN_COLORS)) {
      localStorage.setItem(STORAGE_KEYS.QUEEN_COLORS, JSON.stringify(DEFAULT_QUEEN_COLOR_CODES));
    }
    this.checkAutoBackup();
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

  async shareToDriveOrEmail() {
    const data = this.getAll();
    const today = new Date().toISOString().split('T')[0];
    const fileName = `ApisApp_Backup_${today}.json`;
    const jsonStr = JSON.stringify(data, null, 2);

    const file = new File([jsonStr], fileName, { type: 'application/json' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `Backup ApisApp (${today})`,
          text: `Backup diário dos dados de apicultura - Abelhas Apis mellifera (${today}).`,
          files: [file]
        });
        return { success: true, method: 'share' };
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Erro ao compartilhar:", err);
        }
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
    const data = this.getAll();
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
  setupNavigation();
  setupEventListeners();
  setupNetworkListeners();
  checkAutoBackupBanner();
  renderApp();
});

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
        <div class="section-header">
          <h3 class="section-title">📦 Status das Colmeias</h3>
          <div style="display:flex; gap:0.5rem;">
            <button class="btn btn-secondary" id="btn-quick-apiary">+ Novo Apiário</button>
            <button class="btn btn-primary" id="btn-quick-hive">+ Nova Colmeia</button>
          </div>
        </div>
        <div class="table-responsive">
          ${data.hives.length === 0 ? `
            <div style="text-align:center; padding:3rem 1rem; color:var(--slate-400);">
              <div style="font-size:2.5rem; margin-bottom:0.5rem;">📦</div>
              <strong style="font-size:1.1rem; color:#fff;">Nenhum apiário ou colmeia cadastrado ainda.</strong>
              <p style="font-size:0.85rem; margin-top:0.25rem;">Clique no botão acima para cadastrar seu primeiro apiário e adicionar colmeias!</p>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Apiário</th>
                  <th>Rainha (Ano/Cor)</th>
                  <th>Quadros (Ninho/Mel)</th>
                  <th>Saúde</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${data.hives.map(h => {
                  const ap = data.apiaries.find(a => a.id === h.apiaryId);
                  const qColor = getQueenColorForYear(h.queen.year);
                  return `
                    <tr>
                      <td><strong>${h.code}</strong> (${h.name})</td>
                      <td>${ap ? ap.name : 'Sem Apiário'}</td>
                      <td>
                        <span class="queen-badge" style="background:${h.queen.color || qColor.color}; color:${qColor.textColor};">
                          👑 ${h.queen.year}
                        </span>
                      </td>
                      <td>${h.framesBrood} N / ${h.framesHoney} M (${h.supersCount} Melgueiras)</td>
                      <td>
                        <strong style="color:${h.healthScore > 80 ? 'var(--emerald-500)' : 'var(--honey-500)'};">
                          ${h.healthScore}%
                        </strong>
                      </td>
                      <td>
                        <span class="status-badge ${h.status === 'Ativa' ? 'status-ativa' : 'status-atencao'}">
                          ${h.status}
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          `}
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
              O sistema salva automaticamente seus dados todos os dias. Ao ficar online, envie para seu Google Drive com 1 toque.
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
      alert('Por favor, cadastre primeiro pelo menos um Apiário antes de adicionar uma colmeia!');
      openApiaryModal();
    } else {
      openHiveModal(data);
    }
  });
}

function renderApiariesView(data) {
  const filteredHives = data.hives.filter(hive => {
    const matchApiary = selectedApiaryFilter === 'all' || hive.apiaryId === selectedApiaryFilter;
    const matchStatus = selectedStatusFilter === 'all' || hive.status === selectedStatusFilter;
    return matchApiary && matchStatus;
  });

  return `
    <div class="glass-panel">
      <div class="section-header">
        <div>
          <h2 class="section-title">🏞️ Apiários & Colmeias</h2>
          <p style="color:var(--slate-400); font-size:0.9rem;">Gerencie seus locais de instalação e colmeias cadastradas.</p>
        </div>
        <div style="display:flex; gap:0.75rem;">
          <button class="btn btn-secondary" id="btn-add-apiary">+ Novo Apiário</button>
          <button class="btn btn-primary" id="btn-add-hive">+ Nova Colmeia</button>
        </div>
      </div>

      ${data.apiaries.length > 0 ? `
        <div style="margin-bottom:1.5rem; display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap:1rem;">
          ${data.apiaries.map(ap => {
            const count = data.hives.filter(h => h.apiaryId === ap.id).length;
            return `
              <div style="background:rgba(15,23,42,0.7); border:1px solid var(--slate-700); padding:1rem; border-radius:12px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong style="color:var(--honey-400); font-size:1rem;">${ap.name}</strong>
                  <div style="font-size:0.75rem; color:var(--slate-400);">${ap.location || 'Sem localização'}</div>
                  <div style="font-size:0.75rem; color:var(--emerald-500); margin-top:0.2rem;">${count} colmeias instaladas</div>
                </div>
                <button class="btn btn-danger btn-delete-apiary" data-id="${ap.id}" style="padding:0.3rem 0.6rem; font-size:0.75rem;" title="Excluir Apiário">
                  🗑️
                </button>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}

      <div style="display:flex; gap:1rem; margin-bottom:1.5rem; flex-wrap:wrap; background:rgba(15,23,42,0.5); padding:1rem; border-radius:12px;">
        <div class="form-group" style="margin:0; min-width:200px;">
          <label>Filtrar por Apiário:</label>
          <select class="form-control" id="filter-apiary">
            <option value="all">Todos os Apiários</option>
            ${data.apiaries.map(a => `<option value="${a.id}" ${selectedApiaryFilter === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}
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
        ${filteredHives.length === 0 ? `
          <div style="grid-column: 1 / -1; text-align:center; padding:3rem; color:var(--slate-400);">
            Nenhuma colmeia cadastrada. Clique no botão <strong>"+ Nova Colmeia"</strong> para cadastrar!
          </div>
        ` : filteredHives.map(hive => {
          const apiary = data.apiaries.find(a => a.id === hive.apiaryId);
          const queenColor = getQueenColorForYear(hive.queen.year);
          return `
            <div class="hive-card">
              <div class="hive-card-header">
                <div>
                  <div class="hive-code">${hive.code}</div>
                  <div class="hive-apiary">${apiary ? apiary.name : 'Sem Apiário'}</div>
                </div>
                <span class="status-badge ${hive.status === 'Ativa' ? 'status-ativa' : 'status-atencao'}">
                  ${hive.status}
                </span>
              </div>

              <div style="font-size:0.9rem; font-weight:600; margin-bottom:0.5rem;">${hive.name}</div>
              <div style="font-size:0.8rem; color:var(--slate-400); margin-bottom:0.75rem;">
                Modelo: ${hive.type} | Origem: ${hive.origin}
              </div>

              <div style="background:rgba(30,41,59,0.7); padding:0.6rem 0.8rem; border-radius:8px; margin-bottom:0.75rem; display:flex; align-items:center; justify-content:space-between;">
                <div>
                  <div style="font-size:0.75rem; color:var(--slate-400);">Linhagem da Rainha</div>
                  <div style="font-size:0.8rem; font-weight:600;">${hive.queen.origin}</div>
                </div>
                <span class="queen-badge" style="background:${hive.queen.color || queenColor.color}; color:${queenColor.textColor};">
                  👑 Ano ${hive.queen.year}
                </span>
              </div>

              <div class="hive-metrics">
                <div class="hive-metric-item">
                  <span>Quadros Ninho</span>
                  <strong>${hive.framesBrood} / 10</strong>
                </div>
                <div class="hive-metric-item">
                  <span>Melgueiras</span>
                  <strong>${hive.supersCount} un</strong>
                </div>
                <div class="hive-metric-item">
                  <span>Mansidão</span>
                  <strong>${'⭐'.repeat(hive.temperament)} (${hive.temperament}/5)</strong>
                </div>
                <div class="hive-metric-item">
                  <span>Saúde General</span>
                  <strong style="color:${hive.healthScore > 80 ? 'var(--emerald-500)' : 'var(--rose-500)'};">${hive.healthScore}%</strong>
                </div>
              </div>

              <div style="display:flex; gap:0.5rem; margin-top:1rem;">
                <button class="btn btn-secondary btn-edit-hive" data-id="${hive.id}" style="flex:1; padding:0.4rem; font-size:0.8rem;">
                  ✏️ Editar Colmeia
                </button>
                <button class="btn btn-danger btn-delete-hive" data-id="${hive.id}" style="padding:0.4rem 0.75rem; font-size:0.8rem;">
                  🗑️
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
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
      alert('Por favor, cadastre primeiro pelo menos um Apiário!');
      openApiaryModal();
    } else {
      openHiveModal(data);
    }
  });

  document.querySelectorAll('.btn-delete-apiary').forEach(btn => {
    btn.addEventListener('click', () => {
      const apiaryId = btn.getAttribute('data-id');
      if (confirm('Tem certeza que deseja excluir este apiário e suas colmeias associadas?')) {
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

function renderInspectionsView(data) {
  return `
    <div class="glass-panel">
      <div class="section-header">
        <div>
          <h2 class="section-title">📋 Inspeções de Campo</h2>
          <p style="color:var(--slate-400); font-size:0.9rem;">Histórico de revisões periódicas do apiário.</p>
        </div>
        <button class="btn btn-primary" id="btn-new-inspection">+ Registrar Inspeção</button>
      </div>

      <div class="table-responsive">
        ${data.inspections.length === 0 ? `
          <div style="text-align:center; padding:3rem; color:var(--slate-400);">
            Nenhuma inspeção realizada ainda.
          </div>
        ` : `
          <table class="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Colmeia</th>
                <th>Inspetor</th>
                <th>Rainha & Crias</th>
                <th>Alimento</th>
                <th>Pragas / Sanidade</th>
                <th>Ações Tomadas</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${data.inspections.map(insp => {
                const hive = data.hives.find(h => h.id === insp.hiveId);
                return `
                  <tr>
                    <td><strong>${insp.date}</strong></td>
                    <td>${hive ? `${hive.code} (${hive.name})` : 'Colmeia Excluída'}</td>
                    <td>${insp.inspector}</td>
                    <td>
                      ${insp.queenSpotted ? '<span style="color:var(--emerald-500);">👑 Rainha Vista</span>' : '<span style="color:var(--slate-400);">👑 Não Vista</span>'}<br>
                      <small>Ovos/Larvas: ${insp.eggsPresent ? '✅ Sim' : '❌ Não'}</small><br>
                      ${insp.queenCellsSpotted ? '<strong style="color:var(--rose-500);">🚨 Realeiras!</strong>' : ''}
                    </td>
                    <td>
                      <span class="tag-badge" style="font-size:0.75rem;">${insp.foodReserves}</span>
                    </td>
                    <td>${insp.pestsFound}</td>
                    <td>
                      <ul style="padding-left:1rem; font-size:0.8rem;">
                        ${(insp.actionsTaken || []).map(a => `<li>${a}</li>`).join('')}
                      </ul>
                    </td>
                    <td>
                      <button class="btn btn-danger btn-delete-inspection" data-id="${insp.id}" style="padding:0.3rem 0.6rem; font-size:0.75rem;">
                        🗑️
                      </button>
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

function bindInspectionsEvents(data) {
  document.getElementById('btn-new-inspection')?.addEventListener('click', () => {
    if (data.hives.length === 0) {
      alert('Cadastre primeiro uma colmeia para registrar uma inspeção!');
    } else {
      openInspectionModal(data);
    }
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
  document.getElementById('btn-new-harvest')?.addEventListener('click', () => {
    if (data.apiaries.length === 0) {
      alert('Cadastre primeiro um apiário antes de registrar uma colheita!');
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
    { name: 'Janeiro', season: 'Verão', activity: 'Manutenção de Melgueiras & Colheita da Florada de Verão', flora: 'Eucalipto, Silvestre' },
    { name: 'Fevereiro', season: 'Verão', activity: 'Última extração de mel da safra principal', flora: 'Vassourinha, Assa-Peixe' },
    { name: 'Março', season: 'Outono', activity: 'Redução de alvados, controle de formigas e avaliação de reservas', flora: 'Cipó-Uva' },
    { name: 'Abril', season: 'Outono', activity: 'Início da Alimentação Proteica e Energética (Xarope 1:1)', flora: 'Escassez (Entre-safra)' },
    { name: 'Maio', season: 'Outono', activity: 'Monitoramento sanitário contra Varroa e Traça-da-cera', flora: 'Flores do Mato' },
    { name: 'Junho', season: 'Inverno', activity: 'Proteção contra ventos frios, fusão de enxames fracos', flora: 'Bracatinga (em algumas regiões)' },
    { name: 'Julho', season: 'Inverno', activity: 'Revisão rápida em dias ensolarados, preparo de favos novos', flora: 'Eucalipto de Inverno' },
    { name: 'Agosto', season: 'Primavera Próxima', activity: 'Estimulação de postura da rainha (Xarope 2:1 + Promotor)', flora: 'Início das floradas nativas' },
    { name: 'Setembro', season: 'Primavera', activity: 'Expansão do ninho, introdução de cera alveolada, prevenção de enxameação', flora: 'Laranjeira, Frutíferas' },
    { name: 'Outubro', season: 'Primavera', activity: 'Colocação das primeiras melgueiras da grande florada', flora: 'Laranjeira, Silvestre' },
    { name: 'Novembro', season: 'Primavera', activity: 'Acompanhamento da operculação dos favos de mel', flora: 'Alecrim-do-Campo' },
    { name: 'Dezembro', season: 'Verão', activity: 'Pico de colheita de Mel e Própolis Verde', flora: 'Florada Plena Silvestre' }
  ];

  return `
    <div class="glass-panel">
      <div class="section-header">
        <div>
          <h2 class="section-title">🌸 Calendário Floral & Manejo Apícola</h2>
          <p style="color:var(--slate-400); font-size:0.9rem;">Planejamento anual de alimentação pré-safra, colheita e tratamentos para <em>Apis mellifera</em>.</p>
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
  const totalHoney = data.harvests.filter(h => h.product === 'Mel').reduce((a, b) => a + (parseFloat(b.quantityKg) || 0), 0);
  const totalPropolis = data.harvests.filter(h => h.product.includes('Própolis')).reduce((a, b) => a + (parseFloat(b.quantityKg) || 0), 0);

  return `
    <div class="glass-panel">
      <div class="section-header">
        <h2 class="section-title">📊 Análise de Desempenho e Saúde</h2>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem;">
        <div style="background:rgba(15,23,42,0.6); padding:1.5rem; border-radius:var(--radius-lg); border:1px solid var(--slate-700);">
          <h3 style="color:var(--honey-400); margin-bottom:1rem; font-size:1.1rem;">🍯 Rendimento por Produto</h3>
          <ul style="list-style:none; display:flex; flex-direction:column; gap:0.75rem;">
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
          <div style="display:flex; flex-direction:column; gap:0.75rem;">
            ${QUEEN_COLOR_CODES.map(qc => {
              const count = data.queens.filter(q => qc.years.includes(parseInt(q.year, 10))).length;
              return `
                <div style="display:flex; align-items:center; justify-content:space-between;">
                  <span class="queen-badge" style="background:${qc.color}; color:${qc.textColor};">
                    ${qc.label}
                  </span>
                  <strong>${count} rainhas</strong>
                </div>
              `;
            }).join('')}
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
