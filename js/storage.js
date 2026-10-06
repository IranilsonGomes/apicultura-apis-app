/**
 * ApisApp - Sistema de Gestão para Apicultura (Abelhas Apis mellifera)
 * Módulo de Armazenamento Local, Backup Diário Automático e Integração Google Drive / E-mail
 */

const STORAGE_KEYS = {
  APIARIES: 'apisapp_apiaries',
  HIVES: 'apisapp_hives',
  INSPECTIONS: 'apisapp_inspections',
  HARVESTS: 'apisapp_harvests',
  SETTINGS: 'apisapp_settings',
  LAST_BACKUP_DATE: 'apisapp_last_backup_date',
  BACKUPS_HISTORY: 'apisapp_backups_history'
};

const EMPTY_DATA = {
  apiaries: [],
  hives: [],
  inspections: [],
  harvests: []
};

export const ApisStorage = {
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.APIARIES)) {
      this.clearAll();
    }
    // Verificar e executar backup diário automático se necessário
    this.checkAutoBackup();
  },

  getAll() {
    return {
      apiaries: JSON.parse(localStorage.getItem(STORAGE_KEYS.APIARIES) || '[]'),
      hives: JSON.parse(localStorage.getItem(STORAGE_KEYS.HIVES) || '[]'),
      inspections: JSON.parse(localStorage.getItem(STORAGE_KEYS.INSPECTIONS) || '[]'),
      harvests: JSON.parse(localStorage.getItem(STORAGE_KEYS.HARVESTS) || '[]')
    };
  },

  saveAll(data) {
    localStorage.setItem(STORAGE_KEYS.APIARIES, JSON.stringify(data.apiaries || []));
    localStorage.setItem(STORAGE_KEYS.HIVES, JSON.stringify(data.hives || []));
    localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(data.inspections || []));
    localStorage.setItem(STORAGE_KEYS.HARVESTS, JSON.stringify(data.harvests || []));
  },

  clearAll() {
    this.saveAll(EMPTY_DATA);
    return this.getAll();
  },

  // --------------------------------------------------------------------------
  // BACKUP DIÁRIO AUTOMÁTICO & ENVIO PARA GOOGLE DRIVE / E-MAIL
  // --------------------------------------------------------------------------

  getLastBackupDate() {
    return localStorage.getItem(STORAGE_KEYS.LAST_BACKUP_DATE) || null;
  },

  getBackupsHistory() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.BACKUPS_HISTORY) || '[]');
  },

  /**
   * Verifica se o backup de hoje já foi feito. Se não, gera automaticamente um snapshot.
   */
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
      summary: `${data.apiaries.length} apiários, ${data.hives.length} colmeias, ${data.inspections.length} inspeções`,
      data: data
    };

    // Guardar histórico (máximo 30 backups diários)
    history.unshift(snapshot);
    if (history.length > 30) history.pop();

    localStorage.setItem(STORAGE_KEYS.BACKUPS_HISTORY, JSON.stringify(history));
    localStorage.setItem(STORAGE_KEYS.LAST_BACKUP_DATE, snapshot.date);

    console.log(`[ApisApp] Backup diário automático realizado com sucesso para a data: ${snapshot.date}`);
    return snapshot;
  },

  /**
   * Envia o arquivo de Backup diretamente para o Google Drive, Gmail ou E-mail da conta do celular.
   * Utiliza a Web Share API nativa do Android/iOS.
   */
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

    // Fallback se não suportar Web Share API: Download automático
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
    return hive;
  },

  deleteHive(id) {
    let list = this.getHives();
    list = list.filter(h => h.id !== id);
    localStorage.setItem(STORAGE_KEYS.HIVES, JSON.stringify(list));
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
      if (data.apiaries && data.hives) {
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

// Código oficial internacional de cores de marcação de Rainhas Apis mellifera
export const QUEEN_COLOR_CODES = [
  { years: [2021, 2026, 2031], color: '#FFFFFF', textColor: '#0F172A', label: 'Branco (Anos 1 e 6)' },
  { years: [2022, 2027, 2032], color: '#FACC15', textColor: '#0F172A', label: 'Amarelo (Anos 2 e 7)' },
  { years: [2023, 2028, 2033], color: '#EF4444', textColor: '#FFFFFF', label: 'Vermelho (Anos 3 e 8)' },
  { years: [2024, 2029, 2034], color: '#10B981', textColor: '#FFFFFF', label: 'Verde (Anos 4 e 9)' },
  { years: [2025, 2030, 2035], color: '#3B82F6', textColor: '#FFFFFF', label: 'Azul (Anos 5 e 0)' }
];

export function getQueenColorForYear(year) {
  const y = parseInt(year, 10);
  if (isNaN(y)) return QUEEN_COLOR_CODES[0];
  const lastDigit = y % 10;
  if (lastDigit === 1 || lastDigit === 6) return QUEEN_COLOR_CODES[0];
  if (lastDigit === 2 || lastDigit === 7) return QUEEN_COLOR_CODES[1];
  if (lastDigit === 3 || lastDigit === 8) return QUEEN_COLOR_CODES[2];
  if (lastDigit === 4 || lastDigit === 9) return QUEEN_COLOR_CODES[3];
  if (lastDigit === 5 || lastDigit === 0) return QUEEN_COLOR_CODES[4];
  return QUEEN_COLOR_CODES[0];
}
