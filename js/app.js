/**
 * ApisApp - Lógica da Aplicação Principal
 * Gestão Integrada de Apicultura (Apis mellifera) - Com Backup Diário Automático & Google Drive
 */

import { ApisStorage, QUEEN_COLOR_CODES, getQueenColorForYear } from './storage.js';

// Estado global da aplicação
let currentTab = 'dashboard';
let selectedApiaryFilter = 'all';
let selectedStatusFilter = 'all';

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  ApisStorage.init();
  setupNavigation();
  setupEventListeners();
  setupNetworkListeners();
  checkAutoBackupBanner();
  renderApp();
});

// Configuração da Navegação de Abas
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

// Configuração dos Event Listeners globais
function setupEventListeners() {
  // Modal Backdrop
  const modalBackdrop = document.getElementById('modal-backdrop');
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        closeModal();
      }
    });
  }

  // Botões de Backup no Cabeçalho
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

  // Banner superior de backup
  document.getElementById('btn-banner-share')?.addEventListener('click', async () => {
    await ApisStorage.shareToDriveOrEmail();
  });

  document.getElementById('btn-close-banner')?.addEventListener('click', () => {
    const banner = document.getElementById('backup-status-banner');
    if (banner) banner.style.display = 'none';
  });
}

// Ouvir alterações de Conexão à Internet (Online / Offline)
function setupNetworkListeners() {
  window.addEventListener('online', () => {
    console.log('[ApisApp] Dispositivo conectado à internet. Verificando backup diário...');
    ApisStorage.checkAutoBackup();
    checkAutoBackupBanner();
  });
}

// Exibir banner de notificação de backup diário se necessário
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

// Renderização Principal conforme Aba Selecionada
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
   MODAL DE BACKUP E GOOGLE DRIVE
   ========================================================================== */
function openBackupModal() {
  const isOnline = navigator.onLine;
  const lastBackup = ApisStorage.getLastBackupDate() || 'Nenhum realizado ainda';
  const history = ApisStorage.getBackupsHistory();

  const html = `
    <div style="display:flex; flex-direction:column; gap:1.25rem;">
      <!-- Status da Conexão & Auto-Backup -->
      <div style="background:rgba(15,23,42,0.8); padding:1.25rem; border-radius:12px; border:1px solid var(--slate-700);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <strong style="color:var(--honey-400); font-size:1.1rem;">☁️ Status do Backup Automático</strong>
          <span class="tag-badge" style="background:${isOnline ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}; color:${isOnline ? 'var(--emerald-500)' : 'var(--rose-500)'}">
            ${isOnline ? '🟢 Conectado à Internet' : '🔴 Offline'}
          </span>
        </div>
        <p style="font-size:0.85rem; color:var(--slate-200); margin-bottom:1rem;">
          O <strong>ApisApp Pro</strong> executa um backup automático 1 vez por dia na memória do celular. Quando houver conexão à internet, você pode salvar o arquivo diretamente no <strong>Google Drive</strong> ou <strong>E-mail</strong> da sua conta com 1 toque.
        </p>
        <div style="font-size:0.8rem; color:var(--slate-400); margin-bottom:1rem;">
          📅 <strong>Último Backup Diário:</strong> ${lastBackup}
        </div>

        <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
          <button class="btn btn-primary" id="btn-share-drive" style="flex:1;">
            ☁️ Enviar para o Google Drive / E-mail
          </button>
          <button class="btn btn-secondary" id="btn-force-backup">
            ⚡ Forçar Backup Agora
          </button>
        </div>
      </div>

      <!-- Histórico dos Backups Diários Salvos -->
      <div>
        <h4 style="color:var(--honey-400); font-size:1rem; margin-bottom:0.75rem;">📜 Histórico de Backups Diários Salvos (Últimos 30 dias)</h4>
        <div class="table-responsive" style="max-height:220px; overflow-y:auto;">
          ${history.length === 0 ? `
            <div style="text-align:center; padding:1.5rem; color:var(--slate-400); font-size:0.85rem;">
              Nenhum histórico de backup gravado ainda.
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Resumo dos Dados</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                ${history.map(snap => `
                  <tr>
                    <td><strong>${snap.date}</strong></td>
                    <td style="font-size:0.8rem;">${snap.summary}</td>
                    <td>
                      <div style="display:flex; gap:0.4rem;">
                        <button class="btn btn-secondary btn-restore-snap" data-id="${snap.id}" style="padding:0.25rem 0.5rem; font-size:0.75rem;" title="Restaurar este backup">
                          🔄 Restaurar
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>
    </div>
  `;

  openModal('☁️ Backup Diário & Google Drive', html);

  document.getElementById('btn-share-drive')?.addEventListener('click', async () => {
    const result = await ApisStorage.shareToDriveOrEmail();
    if (result && result.success) {
      if (result.method === 'download') {
        alert('O arquivo de backup foi baixado! Você pode anexá-lo ao seu Google Drive ou enviá-lo por E-mail.');
      }
    }
  });

  document.getElementById('btn-force-backup')?.addEventListener('click', () => {
    const today = new Date().toISOString().split('T')[0];
    ApisStorage.performAutoBackup(today);
    alert('Backup diário gerado com sucesso!');
    closeModal();
    openBackupModal();
  });

  document.querySelectorAll('.btn-restore-snap').forEach(btn => {
    btn.addEventListener('click', () => {
      const snapId = btn.getAttribute('data-id');
      const history = ApisStorage.getBackupsHistory();
      const snap = history.find(s => s.id === snapId);
      if (snap && confirm(`Tem certeza que deseja restaurar o backup do dia ${snap.date}? Os dados atuais serão substituídos.`)) {
        ApisStorage.saveAll(snap.data);
        alert('Dados restaurados com sucesso!');
        closeModal();
        renderApp();
      }
    });
  });
}

/* ==========================================================================
   1. DASHBOARD VIEW (Painel Geral)
   ========================================================================== */
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
    <!-- Hero Banner -->
    <div class="hero-card">
      <div class="hero-text">
        <h2>Gestão Inteligente de <span>Apicultura</span></h2>
        <p>Acompanhamento preciso de colmeias de abelhas <em>Apis mellifera</em>, sanidade, postura de rainhas e colheitas de mel e própolis com controle de lotes.</p>
        <div class="hero-tags">
          <span class="tag-badge">🐝 Abelhas Apis</span>
          <span class="tag-badge">🍯 Rastreabilidade de Lotes</span>
          <span class="tag-badge">☁️ Backup Diário no Drive</span>
          <span class="tag-badge">📊 Saúde do Apiário: ${avgHealth}%</span>
        </div>
      </div>
      <div class="hero-img-box" style="background: rgba(15,23,42,0.8); display:flex; align-items:center; justify-content:center; text-align:center; padding:1rem; border-radius:18px;">
        <img src="./assets/icon.png" alt="Logo ApisApp" style="max-height:160px; max-width:160px; border-radius:24px; box-shadow:0 8px 20px rgba(245,158,11,0.3); border:3px solid var(--honey-400);">
      </div>
    </div>

    <!-- Cards de KPIs -->
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

    <!-- Resumo de Colmeias e Ações -->
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
                        <span class="queen-badge" style="background:${qColor.color}; color:${qColor.textColor};">
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

      <!-- Lembretes & Alertas -->
      <div class="glass-panel">
        <h3 class="section-title" style="margin-bottom:1rem;">🔔 Painel de Controle</h3>
        
        <div style="display:flex; flex-direction:column; gap:1rem;">
          <div style="background:rgba(245,158,11,0.1); border-left:4px solid var(--honey-400); padding:0.85rem; border-radius:8px;">
            <strong style="color:var(--honey-400); font-size:0.85rem;">☁️ BACKUP DIÁRIO ATIVO</strong>
            <p style="font-size:0.8rem; color:var(--slate-200); margin-top:0.25rem;">
              O sistema salva automaticamente 1 backup por dia. Quando tiver internet, clique em <strong>"Backup & Drive"</strong> para enviar ao seu Google Drive ou E-mail.
            </p>
          </div>

          <div style="background:rgba(16,185,129,0.1); border-left:4px solid var(--emerald-500); padding:0.85rem; border-radius:8px;">
            <strong style="color:var(--emerald-500); font-size:0.85rem;">👑 CÓDIGO INTERNACIONAL DE RAINHAS</strong>
            <p style="font-size:0.8rem; color:var(--slate-200); margin-top:0.25rem;">
              Ao cadastrar uma colmeia, o ano da rainha definirá automaticamente a cor oficial no sistema!
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

/* ==========================================================================
   2. APIARIES & HIVES VIEW (Apiários e Colmeias)
   ========================================================================== */
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

      <!-- Lista de Apiários Cadastrados -->
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

      <!-- Filtros -->
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

      <!-- Cards de Colmeias -->
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

              <!-- Informações da Rainha -->
              <div style="background:rgba(30,41,59,0.7); padding:0.6rem 0.8rem; border-radius:8px; margin-bottom:0.75rem; display:flex; align-items:center; justify-content:space-between;">
                <div>
                  <div style="font-size:0.75rem; color:var(--slate-400);">Linhagem da Rainha</div>
                  <div style="font-size:0.8rem; font-weight:600;">${hive.queen.origin}</div>
                </div>
                <span class="queen-badge" style="background:${queenColor.color}; color:${queenColor.textColor};">
                  👑 Ano ${hive.queen.year}
                </span>
              </div>

              <!-- Métricas da Colmeia -->
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
                  ✏️ Editar
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

/* ==========================================================================
   3. INSPECTIONS VIEW (Inspeções de Campo)
   ========================================================================== */
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

/* ==========================================================================
   4. HARVEST VIEW (Controle de Colheita)
   ========================================================================== */
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

/* ==========================================================================
   5. CALENDAR VIEW (Calendário Floral & Sanidade)
   ========================================================================== */
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

/* ==========================================================================
   6. ANALYTICS VIEW (Relatórios & Gráficos)
   ========================================================================== */
function renderAnalyticsView(data) {
  const totalHoney = data.harvests.filter(h => h.product === 'Mel').reduce((a, b) => a + (parseFloat(b.quantityKg) || 0), 0);
  const totalPropolis = data.harvests.filter(h => h.product.includes('Própolis')).reduce((a, b) => a + (parseFloat(b.quantityKg) || 0), 0);

  return `
    <div class="glass-panel">
      <div class="section-header">
        <h2 class="section-title">📊 Análise de Desempenho e Saúde</h2>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem;">
        <!-- Card 1: Distribuição de Produção -->
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

        <!-- Card 2: Distribuição das Rainhas por Ano -->
        <div style="background:rgba(15,23,42,0.6); padding:1.5rem; border-radius:var(--radius-lg); border:1px solid var(--slate-700);">
          <h3 style="color:var(--honey-400); margin-bottom:1rem; font-size:1.1rem;">👑 Idade do Enxame (Ano da Rainha)</h3>
          <div style="display:flex; flex-direction:column; gap:0.75rem;">
            ${QUEEN_COLOR_CODES.map(qc => {
              const count = data.hives.filter(h => qc.years.includes(parseInt(h.queen.year, 10))).length;
              return `
                <div style="display:flex; align-items:center; justify-content:space-between;">
                  <span class="queen-badge" style="background:${qc.color}; color:${qc.textColor};">
                    ${qc.label}
                  </span>
                  <strong>${count} colmeias</strong>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   7. GUIDE VIEW (Guia Técnico Apis mellifera)
   ========================================================================== */
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

/* ==========================================================================
   MODAIS & FORMULÁRIOS
   ========================================================================== */
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

// Modal Apiário
function openApiaryModal() {
  const html = `
    <form id="form-apiary" class="form-grid">
      <div class="form-group full-width">
        <label>Nome do Apiário:</label>
        <input type="text" id="apiary-name" class="form-control" placeholder="Ex: Apiário Sol Nascente" required>
      </div>
      <div class="form-group full-width">
        <label>Localização / Fazenda:</label>
        <input type="text" id="apiary-location" class="form-control" placeholder="Ex: Sítio Vista Alegre - Zona Rural">
      </div>
      <div class="form-group full-width">
        <label>Florada Predominante:</label>
        <input type="text" id="apiary-flora" class="form-control" placeholder="Ex: Eucalipto, Laranjeira, Vassourinha">
      </div>
      <div class="form-group full-width">
        <label>Observações:</label>
        <textarea id="apiary-notes" class="form-control"></textarea>
      </div>
      <div style="grid-column: 1 / -1; display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1rem;">
        <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-backdrop').classList.remove('active')">Cancelar</button>
        <button type="submit" class="btn btn-primary">Salvar Apiário</button>
      </div>
    </form>
  `;

  openModal('🏕️ Novo Apiário', html);

  document.getElementById('form-apiary').addEventListener('submit', (e) => {
    e.preventDefault();
    const newApiary = {
      name: document.getElementById('apiary-name').value,
      location: document.getElementById('apiary-location').value,
      flora: document.getElementById('apiary-flora').value,
      notes: document.getElementById('apiary-notes').value
    };
    ApisStorage.saveApiary(newApiary);
    closeModal();
    renderApp();
  });
}

// Modal Colmeia
function openHiveModal(data, existingHive = null) {
  const isEdit = !!existingHive;
  const html = `
    <form id="form-hive" class="form-grid">
      <div class="form-group">
        <label>Apiário:</label>
        <select id="hive-apiaryId" class="form-control" required>
          ${data.apiaries.map(a => `
            <option value="${a.id}" ${existingHive && existingHive.apiaryId === a.id ? 'selected' : ''}>
              ${a.name}
            </option>
          `).join('')}
        </select>
      </div>

      <div class="form-group">
        <label>Código da Colmeia:</label>
        <input type="text" id="hive-code" class="form-control" value="${existingHive ? existingHive.code : 'COL-0' + (data.hives.length + 1)}" required>
      </div>

      <div class="form-group">
        <label>Nome / Identificação:</label>
        <input type="text" id="hive-name" class="form-control" value="${existingHive ? existingHive.name : 'Colmeia ' + (data.hives.length + 1)}" required>
      </div>

      <div class="form-group">
        <label>Modelo da Caixa:</label>
        <select id="hive-type" class="form-control">
          <option value="Langstroth Standard">Langstroth Standard</option>
          <option value="Dadant">Dadant</option>
          <option value="Top Bar">Top Bar (Kenyana)</option>
        </select>
      </div>

      <div class="form-group">
        <label>Ano da Rainha (Cor Oficial):</label>
        <select id="hive-queen-year" class="form-control">
          <option value="2026" ${existingHive && existingHive.queen.year == 2026 ? 'selected' : ''}>2026 (Branco)</option>
          <option value="2025" ${existingHive && existingHive.queen.year == 2025 ? 'selected' : ''}>2025 (Azul)</option>
          <option value="2024" ${existingHive && existingHive.queen.year == 2024 ? 'selected' : ''}>2024 (Verde)</option>
          <option value="2023" ${existingHive && existingHive.queen.year == 2023 ? 'selected' : ''}>2023 (Vermelho)</option>
          <option value="2022" ${existingHive && existingHive.queen.year == 2022 ? 'selected' : ''}>2022 (Amarelo)</option>
        </select>
      </div>

      <div class="form-group">
        <label>Origem da Rainha:</label>
        <input type="text" id="hive-queen-origin" class="form-control" value="${existingHive ? existingHive.queen.origin : 'Matriz Selecionada'}" placeholder="Ex: Matriz Selecionada">
      </div>

      <div class="form-group">
        <label>Quadros com Ninho (1 a 10):</label>
        <input type="number" id="hive-framesBrood" class="form-control" min="1" max="10" value="${existingHive ? existingHive.framesBrood : 8}">
      </div>

      <div class="form-group">
        <label>Melgueiras (Superes):</label>
        <input type="number" id="hive-supersCount" class="form-control" min="0" max="10" value="${existingHive ? existingHive.supersCount : 1}">
      </div>

      <div class="form-group">
        <label>Status:</label>
        <select id="hive-status" class="form-control">
          <option value="Ativa" ${existingHive && existingHive.status === 'Ativa' ? 'selected' : ''}>Ativa</option>
          <option value="Atenção" ${existingHive && existingHive.status === 'Atenção' ? 'selected' : ''}>Atenção (Necessita Intervenção)</option>
        </select>
      </div>

      <div class="form-group">
        <label>Saúde Estimada (%):</label>
        <input type="number" id="hive-healthScore" class="form-control" min="0" max="100" value="${existingHive ? existingHive.healthScore : 90}">
      </div>

      <div style="grid-column: 1 / -1; display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1rem;">
        <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-backdrop').classList.remove('active')">Cancelar</button>
        <button type="submit" class="btn btn-primary">Salvar Colmeia</button>
      </div>
    </form>
  `;

  openModal(isEdit ? '✏️ Editar Colmeia' : '📦 Nova Colmeia Apis', html);

  document.getElementById('form-hive').addEventListener('submit', (e) => {
    e.preventDefault();
    const year = parseInt(document.getElementById('hive-queen-year').value, 10);
    const queenColor = getQueenColorForYear(year);

    const hiveData = {
      id: existingHive ? existingHive.id : undefined,
      apiaryId: document.getElementById('hive-apiaryId').value,
      code: document.getElementById('hive-code').value,
      name: document.getElementById('hive-name').value,
      type: document.getElementById('hive-type').value,
      origin: existingHive ? existingHive.origin : 'Divisão de Enxame',
      temperament: existingHive ? existingHive.temperament : 4,
      healthScore: parseInt(document.getElementById('hive-healthScore').value, 10),
      framesBrood: parseInt(document.getElementById('hive-framesBrood').value, 10),
      framesHoney: existingHive ? existingHive.framesHoney : 4,
      supersCount: parseInt(document.getElementById('hive-supersCount').value, 10),
      queen: {
        marked: true,
        year: year,
        color: queenColor.color,
        colorName: queenColor.label,
        origin: document.getElementById('hive-queen-origin').value,
        postureStatus: existingHive ? existingHive.queen.postureStatus : 'Boa postura',
        ageMonths: existingHive ? existingHive.queen.ageMonths : 6
      },
      status: document.getElementById('hive-status').value,
      notes: existingHive ? existingHive.notes : 'Cadastrada no aplicativo.'
    };

    ApisStorage.saveHive(hiveData);
    closeModal();
    renderApp();
  });
}

// Modal Inspeção
function openInspectionModal(data) {
  const html = `
    <form id="form-inspection" class="form-grid">
      <div class="form-group">
        <label>Colmeia:</label>
        <select id="insp-hiveId" class="form-control" required>
          ${data.hives.map(h => `<option value="${h.id}">${h.code} - ${h.name}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label>Data da Inspeção:</label>
        <input type="date" id="insp-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" required>
      </div>

      <div class="form-group">
        <label>Inspetor / Apicultor:</label>
        <input type="text" id="insp-inspector" class="form-control" value="Apicultor Principal" required>
      </div>

      <div class="form-group">
        <label>Reservas de Alimento:</label>
        <select id="insp-food" class="form-control">
          <option value="Alto">Alto (Fartura de Mel e Pólen)</option>
          <option value="Médio">Médio (Suficiente)</option>
          <option value="Baixo">Baixo (Alimentação Necessária)</option>
        </select>
      </div>

      <div class="form-group full-width">
        <label>Checklist do Ninho:</label>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.5rem; margin-top:0.5rem;">
          <label class="checkbox-group">
            <input type="checkbox" id="chk-queen" checked> Rainha Vista
          </label>
          <label class="checkbox-group">
            <input type="checkbox" id="chk-eggs" checked> Ovos e Larvas Presentes
          </label>
          <label class="checkbox-group">
            <input type="checkbox" id="chk-capped" checked> Cria Operculada Saudável
          </label>
          <label class="checkbox-group">
            <input type="checkbox" id="chk-cells"> Presença de Realeiras (Enxameação)
          </label>
        </div>
      </div>

      <div class="form-group full-width">
        <label>Observações / Diagnóstico de Pragas:</label>
        <input type="text" id="insp-pests" class="form-control" value="Nenhuma praga visível" placeholder="Ex: Ausência de Varroa, favos limpos">
      </div>

      <div class="form-group full-width">
        <label>Ações Executadas:</label>
        <input type="text" id="insp-actions" class="form-control" value="Limpeza de estrado; Adição de melgueira" placeholder="Separe por vírgula">
      </div>

      <div style="grid-column: 1 / -1; display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1rem;">
        <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-backdrop').classList.remove('active')">Cancelar</button>
        <button type="submit" class="btn btn-primary">Salvar Inspeção</button>
      </div>
    </form>
  `;

  openModal('📋 Nova Inspeção de Campo', html);

  document.getElementById('form-inspection').addEventListener('submit', (e) => {
    e.preventDefault();
    const actionsRaw = document.getElementById('insp-actions').value;
    const actionsTaken = actionsRaw.split(';').map(s => s.trim()).filter(Boolean);

    const inspection = {
      hiveId: document.getElementById('insp-hiveId').value,
      date: document.getElementById('insp-date').value,
      inspector: document.getElementById('insp-inspector').value,
      queenSpotted: document.getElementById('chk-queen').checked,
      eggsPresent: document.getElementById('chk-eggs').checked,
      larvaePresent: document.getElementById('chk-eggs').checked,
      cappedBrood: document.getElementById('chk-capped').checked,
      queenCellsSpotted: document.getElementById('chk-cells').checked,
      foodReserves: document.getElementById('insp-food').value,
      pestsFound: document.getElementById('insp-pests').value,
      actionsTaken: actionsTaken,
      notes: 'Inspeção efetuada com sucesso.'
    };

    ApisStorage.saveInspection(inspection);
    closeModal();
    renderApp();
  });
}

// Modal Colheita
function openHarvestModal(data) {
  const html = `
    <form id="form-harvest" class="form-grid">
      <div class="form-group">
        <label>Apiário Origem:</label>
        <select id="harv-apiaryId" class="form-control" required>
          ${data.apiaries.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label>Colmeia (Opcional):</label>
        <select id="harv-hiveId" class="form-control">
          <option value="">Todo o Apiário</option>
          ${data.hives.map(h => `<option value="${h.id}">${h.code} - ${h.name}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label>Produto Extraído:</label>
        <select id="harv-product" class="form-control">
          <option value="Mel">Mel</option>
          <option value="Própolis Verde">Própolis Verde</option>
          <option value="Geleia Real">Geleia Real</option>
          <option value="Cera Alveolada / Bruta">Cera Alveolada / Bruta</option>
          <option value="Pólen Apícola">Pólen Apícola</option>
        </select>
      </div>

      <div class="form-group">
        <label>Quantidade (kg):</label>
        <input type="number" step="0.1" id="harv-quantity" class="form-control" value="15.0" required>
      </div>

      <div class="form-group">
        <label>Florada Predominante:</label>
        <input type="text" id="harv-floral" class="form-control" placeholder="Ex: Eucalipto, Laranjeira" required>
      </div>

      <div class="form-group">
        <label>Nº do Lote:</label>
        <input type="text" id="harv-batch" class="form-control" value="LOTE-${new Date().getFullYear()}-0${data.harvests.length + 1}" required>
      </div>

      <div class="form-group">
        <label>Umidade do Mel (%):</label>
        <input type="number" step="0.1" id="harv-moisture" class="form-control" value="17.5">
      </div>

      <div class="form-group">
        <label>Preço Unitário (R$ / kg):</label>
        <input type="number" step="0.5" id="harv-price" class="form-control" value="35.00">
      </div>

      <div style="grid-column: 1 / -1; display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1rem;">
        <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-backdrop').classList.remove('active')">Cancelar</button>
        <button type="submit" class="btn btn-primary">Salvar Colheita</button>
      </div>
    </form>
  `;

  openModal('🍯 Nova Colheita Apícola', html);

  document.getElementById('form-harvest').addEventListener('submit', (e) => {
    e.preventDefault();
    const harvest = {
      apiaryId: document.getElementById('harv-apiaryId').value,
      hiveId: document.getElementById('harv-hiveId').value || 'Apiário Geral',
      date: new Date().toISOString().split('T')[0],
      product: document.getElementById('harv-product').value,
      quantityKg: parseFloat(document.getElementById('harv-quantity').value),
      moisturePct: parseFloat(document.getElementById('harv-moisture').value) || 0,
      floralSource: document.getElementById('harv-floral').value,
      batchNumber: document.getElementById('harv-batch').value,
      unitPriceBrl: parseFloat(document.getElementById('harv-price').value) || 0,
      notes: 'Colheita registrada via app.'
    };

    ApisStorage.saveHarvest(harvest);
    closeModal();
    renderApp();
  });
}
