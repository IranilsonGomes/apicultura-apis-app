/**
 * ApisApp - Sistema de Gestão para Apicultura (Abelhas Apis mellifera)
 * Módulo de Armazenamento Local e Dados Iniciais
 */

const STORAGE_KEYS = {
  APIARIES: 'apisapp_apiaries',
  HIVES: 'apisapp_hives',
  INSPECTIONS: 'apisapp_inspections',
  HARVESTS: 'apisapp_harvests',
  SETTINGS: 'apisapp_settings'
};

// Dados de demonstração realistas para apicultura de Apis mellifera no Brasil
const INITIAL_DEMO_DATA = {
  apiaries: [
    {
      id: 'ap-1',
      name: 'Apiário Sol Nascente',
      location: 'Fazenda Vista Alegre - Zona Rural',
      flora: 'Eucalipto & Florada Silvestre',
      coordinates: '-23.5505, -46.6333',
      notes: 'Local com boa insolação, próximo a açude e mata de eucaliptos adultos.',
      createdAt: '2024-01-15'
    },
    {
      id: 'ap-2',
      name: 'Apiário Vale das Flores',
      location: 'Sítio Primavera - Encosta Sul',
      flora: 'Laranjeira, Vassourinha & Cipó-Uva',
      coordinates: '-23.5610, -46.6400',
      notes: 'Apiário com excelente produção de mel claro na primavera.',
      createdAt: '2024-03-10'
    }
  ],
  hives: [
    {
      id: 'hive-101',
      apiaryId: 'ap-1',
      code: 'COL-01',
      name: 'Colmeia Campeã 01',
      type: 'Langstroth Standard',
      origin: 'Divisão de Enxame Fortalecido',
      temperament: 4, // 1 a 5 (mansidão)
      healthScore: 95, // 0 a 100%
      framesBrood: 8,
      framesHoney: 6,
      supersCount: 2, // Melgueiras
      queen: {
        marked: true,
        year: 2024, // Cor oficial 2024 = Verde
        color: '#10B981', // Verde
        colorName: 'Verde (2024)',
        origin: 'Rainha Selecionada de Matriz',
        postureStatus: 'Excelente (Cria uniforme de canto a canto)',
        ageMonths: 18
      },
      status: 'Ativa',
      notes: 'Colmeia muito forte. Adicionada 2ª melgueira no mês passado.'
    },
    {
      id: 'hive-102',
      apiaryId: 'ap-1',
      code: 'COL-02',
      name: 'Colmeia Alfa 02',
      type: 'Langstroth Standard',
      origin: 'Resgate de Enxame Voador',
      temperament: 3,
      healthScore: 88,
      framesBrood: 7,
      framesHoney: 4,
      supersCount: 1,
      queen: {
        marked: true,
        year: 2025, // Cor oficial 2025 = Azul
        color: '#3B82F6', // Azul
        colorName: 'Azul (2025)',
        origin: 'Fecundada em Campo',
        postureStatus: 'Boa postura',
        ageMonths: 8
      },
      status: 'Ativa',
      notes: 'Desenvolvimento rápido na florada do eucalipto.'
    },
    {
      id: 'hive-103',
      apiaryId: 'ap-1',
      code: 'COL-03',
      name: 'Colmeia Fênix 03',
      type: 'Langstroth Standard',
      origin: 'Divisão',
      temperament: 5,
      healthScore: 68,
      framesBrood: 4,
      framesHoney: 2,
      supersCount: 0,
      queen: {
        marked: false,
        year: 2023, // Cor oficial 2023 = Vermelho
        color: '#EF4444', // Vermelho
        colorName: 'Vermelho (2023 - Sem Marcação)',
        origin: 'Natural',
        postureStatus: 'Falhada / Postura Irregular',
        ageMonths: 28
      },
      status: 'Atenção',
      notes: 'Rainha velha. Recomenda-se introduzir nova rainha fecundada ou realeira.'
    },
    {
      id: 'hive-201',
      apiaryId: 'ap-2',
      code: 'COL-04',
      name: 'Colmeia Citrus 01',
      type: 'Langstroth Standard',
      origin: 'Enxame Capturado',
      temperament: 4,
      healthScore: 92,
      framesBrood: 9,
      framesHoney: 5,
      supersCount: 2,
      queen: {
        marked: true,
        year: 2026, // Cor oficial 2026 = Branco
        color: '#F8FAFC', // Branco
        colorName: 'Branco (2026)',
        origin: 'Matriz Selecionada Cárnica x Africanizada',
        postureStatus: 'Excelente',
        ageMonths: 4
      },
      status: 'Ativa',
      notes: 'Pronta para a safra da florada da laranjeira.'
    },
    {
      id: 'hive-202',
      apiaryId: 'ap-2',
      code: 'COL-05',
      name: 'Colmeia Dourada 02',
      type: 'Langstroth Standard',
      origin: 'Divisão de Enxame',
      temperament: 4,
      healthScore: 82,
      framesBrood: 6,
      framesHoney: 3,
      supersCount: 1,
      queen: {
        marked: true,
        year: 2025,
        color: '#3B82F6',
        colorName: 'Azul (2025)',
        origin: 'Introduzida',
        postureStatus: 'Normal',
        ageMonths: 10
      },
      status: 'Ativa',
      notes: 'Recebeu alimentador interno com xarope 1:1 no outono.'
    }
  ],
  inspections: [
    {
      id: 'insp-1',
      hiveId: 'hive-101',
      date: '2026-09-28',
      inspector: 'Antônio Apicultor',
      queenSpotted: true,
      eggsPresent: true,
      larvaePresent: true,
      cappedBrood: true,
      queenCellsSpotted: false, // Realeiras
      foodReserves: 'Alto',
      pestsFound: 'Nenhuma',
      temperamentObserved: 'Muito Calma',
      actionsTaken: ['Adicionada 2ª melgueira', 'Limpeza do estrado'],
      notes: 'Colmeia em estado zênite de desenvolvimento. Reservas fartas de mel e pão de abelha.'
    },
    {
      id: 'insp-2',
      hiveId: 'hive-103',
      date: '2026-09-30',
      inspector: 'Antônio Apicultor',
      queenSpotted: false,
      eggsPresent: false,
      larvaePresent: true,
      cappedBrood: true,
      queenCellsSpotted: true, // Realeiras de substituição
      foodReserves: 'Baixo',
      pestsFound: 'Vestígios leves de Traça-da-cera no favo lateral',
      temperamentObserved: 'Agitada',
      actionsTaken: ['Alimentação artificial com xarope de açúcar 1:1 (500ml)', 'Fornecido bife proteico de soja e pólen', 'Removido quadro velho'],
      notes: 'Detectadas 2 realeiras de substituição. Enxame preparando troca natural da rainha.'
    },
    {
      id: 'insp-3',
      hiveId: 'hive-201',
      date: '2026-10-02',
      inspector: 'Carlos Auxiliar',
      queenSpotted: true,
      eggsPresent: true,
      larvaePresent: true,
      cappedBrood: true,
      queenCellsSpotted: false,
      foodReserves: 'Alto',
      pestsFound: 'Nenhuma (Acaricida orgânico aplicado em agosto)',
      temperamentObserved: 'Mansidão Alta',
      actionsTaken: ['Verificação de postura da rainha nova', 'Colocação de grade excludente de rainha'],
      notes: 'Rainha com excelente área de postura em favos novos.'
    }
  ],
  harvests: [
    {
      id: 'harv-1',
      apiaryId: 'ap-1',
      hiveId: 'hive-101',
      date: '2026-08-15',
      product: 'Mel',
      quantityKg: 28.5,
      moisturePct: 17.2,
      floralSource: 'Eucalipto',
      batchNumber: 'LOTE-2026-EUC01',
      unitPriceBrl: 35.00,
      notes: 'Mel com excelente viscosidade e cor âmbar claro. Umidade ideal abaixo de 18%.'
    },
    {
      id: 'harv-2',
      apiaryId: 'ap-1',
      hiveId: 'hive-102',
      date: '2026-08-16',
      product: 'Mel',
      quantityKg: 19.0,
      moisturePct: 17.5,
      floralSource: 'Eucalipto',
      batchNumber: 'LOTE-2026-EUC01',
      unitPriceBrl: 35.00,
      notes: 'Favos com mais de 90% de operculação.'
    },
    {
      id: 'harv-3',
      apiaryId: 'ap-2',
      hiveId: 'hive-201',
      date: '2026-09-10',
      product: 'Própolis Verde',
      quantityKg: 0.85, // 850g em kg
      moisturePct: 0,
      floralSource: 'Alecrim-do-Campo (Baccharis dracunculifolia)',
      batchNumber: 'PROP-2026-01',
      unitPriceBrl: 180.00,
      notes: 'Própolis raspada de coletores superiores. Alta qualidade e fragrância intensa.'
    },
    {
      id: 'harv-4',
      apiaryId: 'ap-1',
      hiveId: 'hive-101',
      date: '2026-09-20',
      product: 'Cera Alveolada / Bruta',
      quantityKg: 2.2,
      moisturePct: 0,
      floralSource: 'Diversos',
      batchNumber: 'CERA-2026-01',
      unitPriceBrl: 50.00,
      notes: 'Cera derivada do desoperculamento da safra de mel.'
    }
  ]
};

// Funções do Storage
export const ApisStorage = {
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.APIARIES)) {
      this.saveAll(INITIAL_DEMO_DATA);
    }
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

  resetToDemoData() {
    this.saveAll(INITIAL_DEMO_DATA);
    return this.getAll();
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

    // Remover colmeias associadas
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
  if (lastDigit === 1 || lastDigit === 6) return QUEEN_COLOR_CODES[0]; // Branco
  if (lastDigit === 2 || lastDigit === 7) return QUEEN_COLOR_CODES[1]; // Amarelo
  if (lastDigit === 3 || lastDigit === 8) return QUEEN_COLOR_CODES[2]; // Vermelho
  if (lastDigit === 4 || lastDigit === 9) return QUEEN_COLOR_CODES[3]; // Verde
  if (lastDigit === 5 || lastDigit === 0) return QUEEN_COLOR_CODES[4]; // Azul
  return QUEEN_COLOR_CODES[0];
}
