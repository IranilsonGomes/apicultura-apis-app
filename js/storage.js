/**
 * ApisApp - Sistema de Gestão para Apicultura (Abelhas Apis mellifera)
 * Módulo de Armazenamento Local - Cadastro e Edição Livre de Rainhas e Cores
 */

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

export const ApisStorage = {
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

  // --------------------------------------------------------------------------
  // GESTÃO DIRETA DE RAINHAS (Criar, Editar, Listar, Excluir)
  // --------------------------------------------------------------------------

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

    // Se a rainha estiver vinculada a uma colmeia, atualizar a colmeia também
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

  // --------------------------------------------------------------------------
  // PERSONALIZAÇÃO DE CORES
  // --------------------------------------------------------------------------

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

  // BACKUP DIÁRIO AUTOMÁTICO
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

  // Apiários
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

  // Colmeias
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

    // Auto-sincronizar rainha com a lista de rainhas
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

    // Remover rainha associada
    let queens = this.getQueens();
    queens = queens.filter(q => q.hiveId !== id);
    localStorage.setItem(STORAGE_KEYS.QUEENS, JSON.stringify(queens));
  },

  // Inspeções
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

  // Colheitas
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

  // Exportar Backup
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

  // Importar Backup
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

export function getQueenColorForYear(year) {
  const codes = ApisStorage.getQueenColorCodes();
  const y = parseInt(year, 10);
  if (isNaN(y)) return codes[0];
  const lastDigit = Math.abs(y) % 10;
  if (lastDigit === 1 || lastDigit === 6) return codes[0]; // Branco
  if (lastDigit === 2 || lastDigit === 7) return codes[1]; // Amarelo
  if (lastDigit === 3 || lastDigit === 8) return codes[2]; // Vermelho
  if (lastDigit === 4 || lastDigit === 9) return codes[3]; // Verde
  if (lastDigit === 5 || lastDigit === 0) return codes[4]; // Azul
  return codes[0];
}
