/**
 * 營建管理系統 - Motion-Driven (動態敘事驅動) UI/UX Pro Max 旗艦版 (V10)
 * 嚴格遵循使用者規範：
 * 1. 第 1 頁【01_專案管理】(首頁)：簡潔挑選案子，包含拾光薈二期、華泰三期、陸光二期
 * 2. 第 2 頁【02_日期天氣工期】：施工日期、契約工期與已施工天數主動計算、上下午天氣 Chips
 * 3. 第 3~7 頁主要填寫流程：今日進度多排標籤雲、明日記事、人機料預設只保留人員與機具兩項
 * 4. 底部常駐導覽列：⚡ 快速首頁 | 📊 專案總報表 | 🏠 模型 | ⚙️ 設定
 * 5. 設定頁面：帳號登入、續費時間、訂閱時間、通用版/客製版方案、LINE客服連結、材料/代工進階開關
 * 6. 專案總報表：橫向滑動山積圖 (長條堆疊 + 累積折線) + 區間 6 欄全量統計總表
 * 7. 日報表手機版一條式展示，輸出 PDF 時自動適配 A4 規格排版
 */

const STORAGE_KEY = 'SITE_REPORT_V10_MOTION';
const PHRASES_KEY = 'SITE_CUSTOM_WORK_PHRASES_V10';
const SETTINGS_KEY = 'SITE_UI_SETTINGS_V10';
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

// 預設三大示範專案 (拾光薈二期、華泰三期、陸光二期)
const DEFAULT_PROJECTS = [
  {
    id: 'proj_shiguang',
    name: '拾光薈二期新建工程 (範例)',
    contractorCompany: '安家營造股份有限公司',
    contractDays: 540,
    usedDays: 312,
    startDateISO: '2026-01-15',
    endDateISO: '2027-07-08',
    reports: []
  },
  {
    id: 'proj_huatai',
    name: '華泰三期新建工程 (範例)',
    contractorCompany: '遠見營建機構',
    contractDays: 480,
    usedDays: 198,
    startDateISO: '2026-03-01',
    endDateISO: '2027-06-23',
    reports: []
  },
  {
    id: 'proj_luguang',
    name: '陸光二期新建工程 (範例)',
    contractorCompany: '大信工程營造有限公司',
    contractDays: 360,
    usedDays: 86,
    startDateISO: '2026-06-10',
    endDateISO: '2027-06-05',
    reports: []
  }
];

// 工種與機具基準清單
const BASE_WORKERS = [
  { id: 'w1', name: '施工架工程', unit: '人', defaultQty: 6, cum: 186 },
  { id: 'w2', name: '鋼筋工 (加工綁紮)', unit: '人', defaultQty: 8, cum: 245 },
  { id: 'w3', name: '模板工 (組立支撐)', unit: '人', defaultQty: 6, cum: 190 },
  { id: 'w4', name: '泥水粉刷工', unit: '人', defaultQty: 4, cum: 120 },
  { id: 'w5', name: '機電水電工', unit: '人', defaultQty: 5, cum: 140 },
  { id: 'w6', name: '普通工 (環境整理)', unit: '人', defaultQty: 6, cum: 180 }
];

const BASE_MACHINES = [
  { id: 'm1', name: '挖掘機 (怪手 PC200)', unit: '台', defaultQty: 2, cum: 64 },
  { id: 'm2', name: '吊車 (25T 全吊)', unit: '台', defaultQty: 1, cum: 32 },
  { id: 'm3', name: '預拌混凝土壓送車', unit: '台', defaultQty: 2, cum: 48 },
  { id: 'm4', name: '點井抽水沉水馬達', unit: '組', defaultQty: 4, cum: 128 },
  { id: 'm5', name: '發電機 (150kW)', unit: '台', defaultQty: 2, cum: 60 }
];

const BASE_MATERIALS = [
  { id: 'mat1', name: '高爐水泥砂漿 (1:3)', unit: '包', defaultQty: 40, cum: 1200 },
  { id: 'mat2', name: '鋼筋 (SD420W 異形)', unit: '噸', defaultQty: 12, cum: 380 },
  { id: 'mat3', name: '預拌混凝土 3000psi', unit: 'M3', defaultQty: 85, cum: 2450 }
];

const DEFAULT_PHRASES = [
  '擋土柱施作及安全防護',
  '基礎鋼筋加工與地樑綁紮',
  '施工架搭設及安全巡檢',
  '點井抽水觀測與水位監測',
  '模板垂直度校正與加固',
  '混凝土澆置及坍度試驗'
];

function generateSampleReportsForProject(proj, count = 20) {
  const reps = [];
  const baseDate = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const dayFactor = 0.8 + ((i * 37) % 50) / 100;

    const workers = BASE_WORKERS.map(b => ({
      id: b.id + '_' + i,
      category: 'workers',
      name: b.name,
      unit: b.unit,
      todayQty: Math.max(1, Math.round(b.defaultQty * dayFactor)),
      priorCumulative: b.cum + (count - i) * 6,
      isSubcontracted: false,
      vendorName: '協力工班',
      todayWorkNote: b.name + '現場施作',
      tomorrowWorkNote: b.name + '明日續作'
    }));

    const machines = BASE_MACHINES.map(b => ({
      id: b.id + '_' + i,
      category: 'machinery',
      name: b.name,
      unit: b.unit,
      todayQty: Math.max(0, Math.round(b.defaultQty * (dayFactor > 0.9 ? 1 : 0.5))),
      priorCumulative: b.cum + (count - i) * 2,
      isSubcontracted: false,
      vendorName: '租賃工程',
      todayWorkNote: b.name + '正常運轉',
      tomorrowWorkNote: b.name + '例行巡檢'
    }));

    const materials = BASE_MATERIALS.map(b => ({
      id: b.id + '_' + i,
      category: 'materials',
      name: b.name,
      unit: b.unit,
      todayQty: Math.round(b.defaultQty * dayFactor),
      priorCumulative: b.cum + (count - i) * 30,
      isSubcontracted: false,
      vendorName: '材料原廠',
      todayWorkNote: '進場抽驗',
      tomorrowWorkNote: '出庫施作'
    }));

    reps.push({
      id: 'rep_' + proj.id + '_' + iso,
      reportDateISO: iso,
      weatherAM: i % 4 === 0 ? '雨' : (i % 3 === 0 ? '多雲' : '晴'),
      weatherPM: i % 5 === 0 ? '多雲' : '晴',
      todayProgressSummary: '工區外牆鷹架搭設、地樑鋼筋加工綁紮，抽水機組常態運轉。',
      tomorrowPlanSummary: '進行地下室側模組立及保護層墊塊查驗，準備排程混凝土澆置。',
      importantNotes: '無重大公安事故，工區安全巡檢完畢。',
      tradeRecords: [...workers, ...machines, ...materials],
      photos: []
    });
  }
  return reps;
}

// 全域 State
let state = {
  activeBottomTab: 'home', // 'home' | 'report' | 'stats' | 'model' | 'settings'
  currentStep: 1, // 1~7 主要填寫順序
  activeProjId: 'proj_shiguang',
  activeReportId: null,
  activeTradeTab: 'workers', // 'workers' | 'machinery' | 'materials'
  projects: [],
  customPhrases: [...DEFAULT_PHRASES],
  statsStartDate: '',
  statsEndDate: '',
  statsPresetRange: 'all',
  
  // 帳號與付費系統
  account: {
    name: '工務所主任 (huangyihong0327-bot)',
    planType: 'standard', // 'standard' (通用版) | 'custom' (客製版)
    subscribeDate: '2026/01/01',
    renewDate: '2027/01/01',
    lineSupportUrl: '' // 客服 LINE
  },

  // 設定裡的進階功能開關 (預設關閉，只保留人員與機具兩項)
  enableMaterials: false,
  enableSubcontractorNotes: false,
  
  toastMessage: ''
};

function formatDateWestern(isoStr, mode = 'slash_weekday') {
  if (!isoStr) return '';
  const parts = isoStr.split('-').map(Number);
  if (parts.length !== 3 || isNaN(parts[0])) return isoStr;
  const [y, m, d] = parts;
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  const dt = new Date(y, m - 1, d);
  const w = WEEKDAYS[dt.getDay()] || '一';

  if (mode === 'slash_weekday') {
    return y + '/' + mm + '/' + dd + ' (' + w + ')';
  }
  if (mode === 'chinese') {
    return y + '年' + mm + '月' + dd + '日';
  }
  if (mode === 'dash') {
    return y + '-' + mm + '-' + dd;
  }
  return y + '/' + mm + '/' + dd;
}

function getTodayQty(item) {
  if (!item) return 0;
  if (typeof item.todayQty === 'number' && !isNaN(item.todayQty)) {
    return Number(item.todayQty.toFixed(1));
  }
  return 0;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = Object.assign(state, parsed);
    }
  } catch (e) {
    console.warn('Load state fallback', e);
  }

  // 若尚無專案，自動初始化三個指定範例專案
  if (!state.projects || state.projects.length === 0) {
    state.projects = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
    state.projects.forEach(p => {
      p.reports = generateSampleReportsForProject(p, 15);
    });
  }

  // 確保當前作用專案與日報存在
  const curProj = getActiveProject();
  if (curProj && (!state.activeReportId || !curProj.reports.find(r => r.id === state.activeReportId))) {
    if (curProj.reports.length > 0) {
      state.activeReportId = curProj.reports[curProj.reports.length - 1].id;
    }
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Save state error', e);
  }
}

function getActiveProject() {
  return state.projects.find(p => p.id === state.activeProjId) || state.projects[0];
}

function getActiveReport() {
  const proj = getActiveProject();
  if (!proj || !proj.reports || proj.reports.length === 0) return null;
  return proj.reports.find(r => r.id === state.activeReportId) || proj.reports[proj.reports.length - 1];
}

// =========================================================================
// 核心頁面渲染分流
// =========================================================================
function renderApp() {
  const root = document.getElementById('app-root');
  if (!root) return;

  const proj = getActiveProject();
  const rep = getActiveReport();

  let bodyContent = '';

  // 依據底部常駐標籤判斷主要頁面
  if (state.activeBottomTab === 'home') {
    bodyContent = renderPage01ProjectManagement();
  } else if (state.activeBottomTab === 'stats') {
    bodyContent = renderPageStatsView();
  } else if (state.activeBottomTab === 'model') {
    bodyContent = renderPageBimModelView();
  } else if (state.activeBottomTab === 'settings') {
    bodyContent = renderPageSettingsView();
  } else {
    // 進入填報主流程 (Steps 2~7)
    if (state.currentStep === 2) {
      bodyContent = renderPage02DateWeatherSchedule(proj, rep);
    } else if (state.currentStep === 3) {
      bodyContent = renderPage03TodayProgress(rep);
    } else if (state.currentStep === 4) {
      bodyContent = renderPage04TomorrowNotes(rep);
    } else if (state.currentStep === 5) {
      bodyContent = renderPage05WorkersMachines(rep);
    } else if (state.currentStep === 6) {
      bodyContent = renderPage06SitePhotos(rep);
    } else if (state.currentStep === 7) {
      bodyContent = renderPage07DailyReportAndA4(proj, rep);
    } else {
      bodyContent = renderPage02DateWeatherSchedule(proj, rep);
    }
  }

  root.innerHTML = `
    ${renderHeaderNav()}
    <main class="main-content-flow">
      ${bodyContent}
    </main>
    ${renderBottomQuickTabBar()}
    ${renderToastNotice()}
  `;
}

// 頂部導覽列
function renderHeaderNav() {
  const isHome = state.activeBottomTab === 'home';
  const proj = getActiveProject();

  return `
    <header class="app-header-nav no-print">
      <div class="header-brand-title" onclick="window.appActions.navigateTab('home')">
        <span>🏗️</span>
        <h1 style="font-size:18px;font-weight:900;">${isHome ? '營建管理系統' : '營建日報'}</h1>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        ${!isHome ? `<span style="font-size:11.5px;font-weight:700;color:var(--text-sub);background:#E0F2FE;border:1.5px solid var(--border-color);border-radius:4px;padding:2px 8px;">${proj.name.slice(0, 4)}...</span>` : ''}
        <button class="header-login-btn" onclick="window.appActions.navigateTab('settings')">
          <span>👤</span> 登入
        </button>
      </div>
    </header>
  `;
}

// 底部常駐 4 鍵導覽列 (420×88px 規格)
function renderBottomQuickTabBar() {
  const cur = state.activeBottomTab;
  return `
    <nav class="bottom-quick-tabbar no-print" aria-label="主要快速導覽">
      <button class="quick-tab-item ${cur === 'home' ? 'active' : ''}" onclick="window.appActions.navigateTab('home')">
        <span class="quick-tab-icon">⚡</span>
        <span class="quick-tab-label">快速首頁</span>
      </button>
      <button class="quick-tab-item ${cur === 'stats' ? 'active' : ''}" onclick="window.appActions.navigateTab('stats')">
        <span class="quick-tab-icon">📊</span>
        <span class="quick-tab-label">專案總報表</span>
      </button>
      <button class="quick-tab-item ${cur === 'model' ? 'active' : ''}" onclick="window.appActions.navigateTab('model')">
        <span class="quick-tab-icon">🏠</span>
        <span class="quick-tab-label">模型</span>
      </button>
      <button class="quick-tab-item ${cur === 'settings' ? 'active' : ''}" onclick="window.appActions.navigateTab('settings')">
        <span class="quick-tab-icon">⚙️</span>
        <span class="quick-tab-label">設定</span>
      </button>
    </nav>
  `;
}

// =========================================================================
// 📱 第 1 頁【01_專案管理】(393×852px 輔助線 Y=759)
// =========================================================================
function renderPage01ProjectManagement() {
  const projCardsHtml = state.projects.map((p, idx) => {
    const reps = p.reports || [];
    const latestRep = reps[reps.length - 1];
    const latestDate = latestRep ? formatDateWestern(latestRep.reportDateISO, 'slash_weekday') : '尚未填寫';

    // 主動計算進度
    const pct = Math.min(100, Math.round((p.usedDays / Math.max(1, p.contractDays)) * 100));

    return `
      <div class="project-card-item" onclick="window.appActions.selectProjectAndEnter('${p.id}')">
        <div class="proj-title-row">
          <div class="proj-name-heading">${p.name}</div>
          <span class="proj-badge-active">進行中</span>
        </div>
        
        <div class="proj-meta-grid">
          <div>📅 工期：${p.usedDays} / ${p.contractDays} 天</div>
          <div>📈 進度：<strong>${pct}%</strong></div>
          <div style="grid-column:1 / -1;">🏢 ${p.contractorCompany} · 共 ${reps.length} 份日報</div>
        </div>

        <div class="proj-action-bar">
          <span style="font-size:11.5px;color:var(--text-muted);">最近更新：${latestDate}</span>
          <span class="proj-enter-link">進入填寫 ❯</span>
        </div>
      </div>
    `;
  }).join('');

  return `
    <!-- 9. [poster] 填寫步驟教學 (Motion-Driven 引導海報) -->
    <div class="poster-tutorial-card">
      <span class="poster-tag">STEP-BY-STEP TUTORIAL</span>
      <div class="poster-title">營建工程日報 · 快速填寫步驟</div>
      <p class="poster-desc">專為工務所打造的極速填報流程，數據主動累算，隨時產出 A4 正式 PDF 報表。</p>
      
      <div class="poster-steps-row">
        <div class="poster-step-pill">1.選專案</div>
        <div class="poster-step-pill">2.工期天候</div>
        <div class="poster-step-pill">3.今日進度</div>
        <div class="poster-step-pill">4.出工機具</div>
      </div>
    </div>

    <!-- 3. [button] ＋ 建立新工程專案 (空白日報) -->
    <button class="btn-create-proj-locked" onclick="window.appActions.openCreateProjectModal()">
      <span>＋</span> 建立新工程專案 (空白日報)
    </button>

    <!-- 5. [btnrow] 匯出 / 匯入專案備份檔 -->
    <div class="backup-btn-row-locked">
      <button class="btn-backup-item" onclick="window.appActions.exportBackup()">
        <span>💾</span> 匯出專案備份檔
      </button>
      <button class="btn-backup-item" onclick="window.appActions.importBackup()">
        <span>📥</span> 匯入專案備份檔
      </button>
    </div>

    <!-- 8. [divider] 分隔線 -->
    <div class="section-divider"></div>

    <!-- 專案列表 (拾光薈二期、華泰三期、陸光二期) -->
    <div style="margin-bottom:8px;">
      <h2 style="font-size:15px;font-weight:800;color:var(--text-main);margin-bottom:8px;display:flex;align-items:center;gap:6px;">
        <span>📋</span> 工程專案清單 (點擊直接進入填報)
      </h2>
      ${projCardsHtml}
    </div>
  `;
}

// =========================================================================
// 📱 第 2 頁【02_日期天氣工期】(393×852px 規範)
// =========================================================================
function renderPage02DateWeatherSchedule(proj, rep) {
  if (!rep) return '<div class="motion-card">請先建立或選擇日報</div>';

  // 主動計算工期數據
  const contractDays = Number(proj.contractDays) || 540;
  const usedDays = Number(proj.usedDays) || 312;
  const remainDays = Math.max(0, contractDays - usedDays);
  const progressPct = Number(((usedDays / Math.max(1, contractDays)) * 100).toFixed(1));

  const weatherChips = ['☀️ 晴', '⛅ 多雲', '🌧️ 雨', '🌪️ 強風'];

  const renderWeatherChips = (period, curVal) => `
    <div class="weather-chips-grid">
      ${weatherChips.map(w => {
        const rawW = w.split(' ')[1];
        const isActive = curVal === rawW || curVal === w;
        return `
          <button class="chip-weather-btn ${isActive ? 'active' : ''}" onclick="window.appActions.setWeather('${period}', '${rawW}')">
            <span>${w.split(' ')[0]}</span>
            <span>${rawW}</span>
          </button>
        `;
      }).join('')}
    </div>
  `;

  return `
    <!-- 2. [tabstrip] 步驟膠囊列 -->
    <div class="tabstrip-steps-row">
      <button class="tabstrip-pill" onclick="window.appActions.navigateTab('home')">1.專案管理</button>
      <button class="tabstrip-pill active">2.日期天氣工期</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(3)">3.今日進度</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(4)">4.明日進度</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(5)">5.人機料紀錄</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(6)">6.現場照片</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(7)">7.日報預覽PDF</button>
    </div>

    <!-- 3. [sectiontitle] 工期・日期・天氣 -->
    <div class="section-title-box">
      <span class="section-title-text">工期・日期・天氣</span>
      <span style="font-size:12px;font-weight:700;color:var(--primary-dark);">${proj.name}</span>
    </div>

    <!-- 7. [progress] 工期進度 (主動計算) -->
    <div class="progress-schedule-card">
      <div class="progress-header-row">
        <span style="font-size:13px;font-weight:800;color:var(--text-main);">📊 契約工期總進度</span>
        <span class="progress-pct-badge">${progressPct}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-bar-fill" style="width: ${progressPct}%;"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);font-weight:600;">
        <span>開工日：${proj.startDateISO}</span>
        <span>預定完工：${proj.endDateISO}</span>
      </div>
    </div>

    <!-- 5. [input] 契約工期與已施工天數 (主動計算與即時微調) -->
    <div class="field-input-card">
      <div class="field-label-small">
        <span>⏱️ 契約工期天數設定 (主動計算剩餘天數)</span>
        <span style="color:var(--accent-cta);font-weight:800;">尚餘 ${remainDays} 天</span>
      </div>
      <div class="field-interactive-row">
        <div style="flex:1;">
          <input type="number" class="native-input-box" value="${contractDays}"
                 onchange="window.appActions.updateProjectDays('contractDays', this.value)" />
          <div style="font-size:10.5px;color:var(--text-muted);margin-top:2px;text-align:center;">契約總工期 (天)</div>
        </div>
        <span style="font-weight:900;color:var(--text-muted);">·</span>
        <div style="flex:1;">
          <input type="number" class="native-input-box" value="${usedDays}"
                 onchange="window.appActions.updateProjectDays('usedDays', this.value)" />
          <div style="font-size:10.5px;color:var(--text-muted);margin-top:2px;text-align:center;">已施工天數 (天)</div>
        </div>
      </div>
    </div>

    <!-- 4. [input] 施工日期 (西元格式，點擊外框開日曆，具備快速調整按鈕) -->
    <div class="field-input-card">
      <div class="field-label-small">
        <span>📅 本日施工日期 (西元格式)</span>
        <span style="color:var(--primary-dark);font-weight:800;">${formatDateWestern(rep.reportDateISO, 'slash_weekday')}</span>
      </div>
      <div class="field-interactive-row">
        <input type="date" class="native-input-box" value="${rep.reportDateISO}"
               onchange="window.appActions.setReportDate(this.value)" style="flex:1;" />
        <div style="display:flex;gap:4px;">
          <button class="phrase-chip-item" style="padding:4px 8px;font-size:11px;" onclick="window.appActions.shiftReportDate(-1)">◀ -1天</button>
          <button class="phrase-chip-item" style="padding:4px 8px;font-size:11px;" onclick="window.appActions.setReportDateToToday()">今天</button>
          <button class="phrase-chip-item" style="padding:4px 8px;font-size:11px;" onclick="window.appActions.shiftReportDate(1)">+1天 ▶</button>
        </div>
      </div>
    </div>

    <!-- 13. [divider] 分隔線 -->
    <div class="section-divider"></div>

    <!-- 10. [heading] 上午天氣 ＆ 8. [chips] -->
    <div class="weather-heading">☀️ 上午天候狀況</div>
    ${renderWeatherChips('weatherAM', rep.weatherAM)}

    <!-- 11. [heading] 下午天氣 ＆ 9. [chips] -->
    <div class="weather-heading">🌤️ 下午天候狀況</div>
    ${renderWeatherChips('weatherPM', rep.weatherPM)}

    <!-- 6. [button] 下一步：今日進度 → -->
    <button class="btn-next-action-locked" onclick="window.appActions.goToStep(3)">
      下一步：今日進度 →
    </button>
  `;
}

// =========================================================================
// 📱 第 3 頁【今日進度】(保持優秀機制：多排標籤雲 + 文字框不遮擋)
// =========================================================================
function renderPage03TodayProgress(rep) {
  const phraseChips = state.customPhrases.map((p, idx) => `
    <span class="phrase-chip-item" onclick="window.appActions.appendPhraseTo('todayProgressSummary', '${p.replace(/'/g, "\\'")}')">
      ＋ ${p}
      <span class="chip-del-x" onclick="event.stopPropagation();window.appActions.removePhrase(${idx})">×</span>
    </span>
  `).join('');

  return `
    <div class="tabstrip-steps-row">
      <button class="tabstrip-pill" onclick="window.appActions.navigateTab('home')">1.專案管理</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(2)">2.日期天氣工期</button>
      <button class="tabstrip-pill active">3.今日進度</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(4)">4.明日進度</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(5)">5.人機料紀錄</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(6)">6.現場照片</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(7)">7.日報預覽PDF</button>
    </div>

    <div class="section-title-box">
      <span class="section-title-text">今日施工進度內容</span>
      <span style="font-size:11.5px;color:var(--text-muted);">多排常用工項點擊即加入</span>
    </div>

    <div class="motion-card">
      <div style="display:flex;gap:6px;margin-bottom:8px;">
        <input id="input-new-phrase-3" class="native-input-box" placeholder="輸入常用工項 (例: 鋼筋綁紮)..."
               onkeydown="if(event.key==='Enter'){event.preventDefault();window.appActions.addPhrase('input-new-phrase-3');}" />
        <button class="btn-create-proj-locked" style="width:auto;height:42px;padding:0 14px;margin-bottom:0;"
                onclick="window.appActions.addPhrase('input-new-phrase-3')">＋新增</button>
      </div>

      <div class="phrase-chips-wrap">
        ${phraseChips}
      </div>

      <textarea id="ta-today-progress" class="motion-textarea" rows="6"
                placeholder="點擊此處輸入今日施作項目與部位進度（文字完整在框內顯示，支援語音轉換）..."
                oninput="window.appActions.updateReportField('todayProgressSummary', this.value)">${rep.todayProgressSummary || ''}</textarea>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      <button class="btn-backup-item" style="height:48px;" onclick="window.appActions.goToStep(2)">← 上一步 (工期)</button>
      <button class="btn-next-action-locked" style="margin-top:0;" onclick="window.appActions.goToStep(4)">下一步：明日進度 →</button>
    </div>
  `;
}

// =========================================================================
// 📱 第 4 頁【明日進度與重要記事】
// =========================================================================
function renderPage04TomorrowNotes(rep) {
  const phraseChips = state.customPhrases.map((p, idx) => `
    <span class="phrase-chip-item" onclick="window.appActions.appendPhraseTo('tomorrowPlanSummary', '${p.replace(/'/g, "\\'")}')">
      ＋ ${p}
    </span>
  `).join('');

  return `
    <div class="tabstrip-steps-row">
      <button class="tabstrip-pill" onclick="window.appActions.navigateTab('home')">1.專案管理</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(2)">2.日期天氣工期</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(3)">3.今日進度</button>
      <button class="tabstrip-pill active">4.明日進度</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(5)">5.人機料紀錄</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(6)">6.現場照片</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(7)">7.日報預覽PDF</button>
    </div>

    <div class="section-title-box">
      <span class="section-title-text">明日預定進度與重要記事</span>
    </div>

    <div class="motion-card">
      <div style="font-size:12.5px;font-weight:800;color:var(--text-main);margin-bottom:6px;">📋 明日預定施工項目</div>
      <div class="phrase-chips-wrap">
        ${phraseChips}
      </div>
      <textarea class="motion-textarea" rows="4" style="margin-bottom:12px;"
                placeholder="輸入明日預定施作之工項進度..."
                oninput="window.appActions.updateReportField('tomorrowPlanSummary', this.value)">${rep.tomorrowPlanSummary || ''}</textarea>

      <div style="font-size:12.5px;font-weight:800;color:var(--text-main);margin-bottom:6px;">📝 本日重要記事 / 缺失督導備註</div>
      <textarea class="motion-textarea" rows="3"
                placeholder="輸入工區重要安全巡檢、監造指示或備忘事項..."
                oninput="window.appActions.updateReportField('importantNotes', this.value)">${rep.importantNotes || ''}</textarea>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      <button class="btn-backup-item" style="height:48px;" onclick="window.appActions.goToStep(3)">← 上一步</button>
      <button class="btn-next-action-locked" style="margin-top:0;" onclick="window.appActions.goToStep(5)">下一步：出工與機具 →</button>
    </div>
  `;
}

// =========================================================================
// 📱 第 5 頁【出工與機具管理】(只保留人員與機具兩項，其餘移至設定)
// =========================================================================
function renderPage05WorkersMachines(rep) {
  // 分類標籤：預設只保留 人員 ＆ 機具
  const tabs = [
    { key: 'workers', label: '👷 工班出工 (人員)' },
    { key: 'machinery', label: '🚜 施工機具 (機具)' }
  ];

  // 若在設定中啟用材料，才顯示材料 Tab
  if (state.enableMaterials) {
    tabs.push({ key: 'materials', label: '🧱 營建材料 (材料)' });
  }

  const activeCategory = state.activeTradeTab || 'workers';
  const records = rep.tradeRecords.filter(r => r.category === activeCategory);

  const rowsHtml = records.map(item => {
    const todayQty = getTodayQty(item);
    const cum = Number(((item.priorCumulative || 0) + todayQty).toFixed(1));

    return `
      <div class="trade-row-card">
        <div class="trade-row-name">${item.name}</div>
        <div class="trade-row-unit">${item.unit}</div>
        <input type="number" class="trade-row-qty-input" value="${todayQty}" step="0.5"
               oninput="window.appActions.updateTradeQty('${item.id}', this.value)" />
        <div class="trade-row-cum-badge">累計 ${cum}${item.unit}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="tabstrip-steps-row">
      <button class="tabstrip-pill" onclick="window.appActions.navigateTab('home')">1.專案管理</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(2)">2.日期天氣工期</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(3)">3.今日進度</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(4)">4.明日進度</button>
      <button class="tabstrip-pill active">5.人機料紀錄</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(6)">6.現場照片</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(7)">7.日報預覽PDF</button>
    </div>

    <!-- 分類切換按鈕 (只保留人員與機具兩項) -->
    <div style="display:flex;gap:6px;margin-bottom:10px;">
      ${tabs.map(t => `
        <button class="chip-weather-btn ${activeCategory === t.key ? 'active' : ''}"
                style="flex:1;height:42px;flex-direction:row;gap:6px;"
                onclick="window.appActions.setTradeCategoryTab('${t.key}')">
          ${t.label}
        </button>
      `).join('')}
    </div>

    <div class="motion-card" style="padding:10px;">
      <div style="display:grid;grid-template-columns:1fr 48px 84px 96px;gap:6px;font-size:11px;font-weight:800;color:var(--text-muted);padding:4px 6px;text-align:center;">
        <span style="text-align:left;">工種 / 設備名稱</span>
        <span>單位</span>
        <span>今日數量</span>
        <span>累計數量</span>
      </div>

      ${rowsHtml}

      ${!state.enableMaterials ? `
        <div style="font-size:11.5px;color:var(--text-muted);text-align:center;margin-top:8px;padding-top:6px;border-top:1px dashed var(--border-light);">
          💡 營建材料與代工明細已移至「⚙️ 設定」中，可依需求在設定中一鍵開啟。
        </div>
      ` : ''}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      <button class="btn-backup-item" style="height:48px;" onclick="window.appActions.goToStep(4)">← 上一步</button>
      <button class="btn-next-action-locked" style="margin-top:0;" onclick="window.appActions.goToStep(6)">下一步：現場照片 →</button>
    </div>
  `;
}

// =========================================================================
// 📱 第 6 頁【現場施工照片】
// =========================================================================
function renderPage06SitePhotos(rep) {
  const photos = rep.photos || [];

  return `
    <div class="tabstrip-steps-row">
      <button class="tabstrip-pill" onclick="window.appActions.navigateTab('home')">1.專案管理</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(2)">2.日期天氣工期</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(3)">3.今日進度</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(4)">4.明日進度</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(5)">5.人機料紀錄</button>
      <button class="tabstrip-pill active">6.現場照片</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(7)">7.日報預覽PDF</button>
    </div>

    <div class="section-title-box">
      <span class="section-title-text">現場施工照片紀錄 (共 ${photos.length} 張)</span>
    </div>

    <div class="motion-card">
      <input type="file" id="photo-upload-input" accept="image/*" capture="environment" style="display:none;"
             onchange="window.appActions.handlePhotoUpload(this)" />
      
      <button class="btn-create-proj-locked" onclick="document.getElementById('photo-upload-input').click()">
        <span>📷</span> 拍攝 / 上傳現場施工照片
      </button>

      ${photos.length === 0 ? `
        <div style="text-align:center;padding:24px 12px;color:var(--text-muted);font-size:13px;border:2px dashed var(--border-light);border-radius:6px;">
          本日尚未上傳照片，點擊上方按鈕即可拍照記錄現場施工品質。
        </div>
      ` : `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;">
          ${photos.map((ph, idx) => `
            <div style="border:2px solid var(--border-light);border-radius:6px;overflow:hidden;background:#F8FAFC;">
              <img src="${ph.dataUrl}" style="width:100%;height:110px;object-fit:cover;display:block;" />
              <div style="padding:4px 6px;font-size:11px;">
                <input class="native-input-box" style="height:28px;font-size:11px;" value="${ph.desc || '施工現況'}"
                       onchange="window.appActions.updatePhotoDesc(${idx}, this.value)" />
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      <button class="btn-backup-item" style="height:48px;" onclick="window.appActions.goToStep(5)">← 上一步</button>
      <button class="btn-next-action-locked" style="margin-top:0;" onclick="window.appActions.goToStep(7)">預覽日報與輸出 A4 →</button>
    </div>
  `;
}

// =========================================================================
// 📱 第 7 頁【日報表一條式展示 & 輸出 A4 正式版面】
// =========================================================================
function renderPage07DailyReportAndA4(proj, rep) {
  const workers = rep.tradeRecords.filter(r => r.category === 'workers');
  const machines = rep.tradeRecords.filter(r => r.category === 'machinery');

  const totalWorkers = workers.reduce((acc, r) => acc + getTodayQty(r), 0);
  const totalMachines = machines.reduce((acc, r) => acc + getTodayQty(r), 0);

  return `
    <div class="tabstrip-steps-row no-print">
      <button class="tabstrip-pill" onclick="window.appActions.navigateTab('home')">1.專案管理</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(2)">2.日期天氣工期</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(3)">3.今日進度</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(4)">4.明日進度</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(5)">5.人機料紀錄</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(6)">6.現場照片</button>
      <button class="tabstrip-pill active">7.日報預覽PDF</button>
    </div>

    <!-- 輸出與分享行動列 (手機端展示) -->
    <div class="no-print" style="display:flex;gap:8px;margin-bottom:12px;">
      <button class="btn-create-proj-locked" style="flex:1;height:46px;margin-bottom:0;" onclick="window.print()">
        <span>🖨️</span> 輸出正式 A4 日報表 (PDF)
      </button>
      <button class="btn-backup-item" style="height:46px;padding:0 14px;" onclick="window.appActions.openLineShareModal()">
        <span>💬</span> 複製 LINE
      </button>
    </div>

    <!-- 手機版一條式頁面展示 (同時作為 A4 列印主體) -->
    <div class="motion-card a4-print-sheet" style="padding:14px;">
      <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:6px;margin-bottom:10px;">
        <h2 style="font-size:18px;font-weight:900;color:#000;">${proj.contractorCompany || '營造工程股份有限公司'}</h2>
        <h3 style="font-size:16px;font-weight:800;color:#000;">營 建 工 程 施 工 日 報 表</h3>
      </div>

      <!-- 基本資訊表格 -->
      <table class="a4-report-table">
        <tr>
          <th style="width:16%;">工程名稱</th>
          <td colspan="3"><strong>${proj.name}</strong></td>
          <th style="width:16%;">填報日期</th>
          <td style="width:22%;">${formatDateWestern(rep.reportDateISO, 'slash_weekday')}</td>
        </tr>
        <tr>
          <th>契約工期</th>
          <td>${proj.contractDays} 天</td>
          <th style="width:16%;">已施工天數</th>
          <td>${proj.usedDays} 天</td>
          <th>天候狀況</th>
          <td>上午：${rep.weatherAM} / 下午：${rep.weatherPM}</td>
        </tr>
      </table>

      <!-- 今日進度與明日記事 -->
      <table class="a4-report-table" style="margin-top:6px;">
        <tr>
          <th style="width:16%;height:64px;">本日施作進度</th>
          <td colspan="5" style="vertical-align:top;line-height:1.5;">${rep.todayProgressSummary || '依進度排程施作。'}</td>
        </tr>
        <tr>
          <th style="width:16%;height:54px;">明日預定進度</th>
          <td colspan="5" style="vertical-align:top;line-height:1.5;">${rep.tomorrowPlanSummary || '明日按工項排程續作。'}</td>
        </tr>
        <tr>
          <th style="width:16%;height:40px;">重要記事/巡檢</th>
          <td colspan="5" style="vertical-align:top;line-height:1.4;">${rep.importantNotes || '現場無異常狀況。'}</td>
        </tr>
      </table>

      <!-- 出工與機具統計 (單行緊湊排版) -->
      <div style="font-size:12px;font-weight:900;color:#000;margin:8px 0 4px;">一、人員出工統計 (本日合計：${totalWorkers} 人)</div>
      <table class="a4-report-table">
        <tr>
          <th>工種項目</th>
          <th>單位</th>
          <th>今日出工</th>
          <th>累計出工</th>
          <th>備註</th>
        </tr>
        ${workers.map(w => `
          <tr>
            <td>${w.name}</td>
            <td style="text-align:center;">${w.unit}</td>
            <td style="text-align:center;font-weight:bold;">${getTodayQty(w)}</td>
            <td style="text-align:center;">${(w.priorCumulative || 0) + getTodayQty(w)}</td>
            <td>${w.todayWorkNote || ''}</td>
          </tr>
        `).join('')}
      </table>

      <div style="font-size:12px;font-weight:900;color:#000;margin:8px 0 4px;">二、施工機具設備統計 (本日合計：${totalMachines} 台/組)</div>
      <table class="a4-report-table">
        <tr>
          <th>機具型號規格</th>
          <th>單位</th>
          <th>今日使用</th>
          <th>累計台日</th>
          <th>運轉狀態</th>
        </tr>
        ${machines.map(m => `
          <tr>
            <td>${m.name}</td>
            <td style="text-align:center;">${m.unit}</td>
            <td style="text-align:center;font-weight:bold;">${getTodayQty(m)}</td>
            <td style="text-align:center;">${(m.priorCumulative || 0) + getTodayQty(m)}</td>
            <td>正常運轉</td>
          </tr>
        `).join('')}
      </table>

      <!-- 簽核欄位 -->
      <table class="a4-report-table" style="margin-top:10px;">
        <tr style="height:48px;">
          <th style="width:25%;">工地主任</th>
          <th style="width:25%;">現場工程師</th>
          <th style="width:25%;">品管/安衛人員</th>
          <th style="width:25%;">填表人</th>
        </tr>
        <tr style="height:42px;">
          <td></td><td></td><td></td>
          <td style="text-align:center;font-size:9pt;">${state.account.name.split(' ')[0]}</td>
        </tr>
      </table>
    </div>

    <div class="no-print" style="margin-top:12px;">
      <button class="btn-backup-item" style="width:100%;height:46px;" onclick="window.appActions.navigateTab('home')">
        ← 返回快速首頁
      </button>
    </div>
  `;
}

// =========================================================================
// 📊 專案總報表 (支援頂部快速切換專案 + 橫向滑動山積圖 + 6欄統計總表)
// =========================================================================
function renderPageStatsView() {
  const proj = getActiveProject();
  const reports = [...(proj.reports || [])].sort((a, b) => a.reportDateISO.localeCompare(b.reportDateISO));

  const totalWorkersInRange = reports.reduce((acc, rep) => {
    return acc + rep.tradeRecords.filter(r => r.category === 'workers').reduce((s, r) => s + getTodayQty(r), 0);
  }, 0);

  const totalMachinesInRange = reports.reduce((acc, rep) => {
    return acc + rep.tradeRecords.filter(r => r.category === 'machinery').reduce((s, r) => s + getTodayQty(r), 0);
  }, 0);

  // 橫向滑動山積圖 SVG (對應使用者圖片格式)
  const mountainChartSvg = buildMountainSvg(reports);

  return `
    <div class="section-title-box">
      <span class="section-title-text">專案總報表與區間山積圖</span>
    </div>

    <!-- 頂部快速切換專案下拉選單 -->
    <div class="motion-card" style="padding:10px;">
      <div style="font-size:12px;font-weight:800;color:var(--text-muted);margin-bottom:4px;">⚡ 快速選擇檢視專案：</div>
      <select class="native-input-box" style="height:42px;font-size:14.5px;font-weight:800;"
              onchange="window.appActions.switchStatsProject(this.value)">
        ${state.projects.map(p => `
          <option value="${p.id}" ${p.id === proj.id ? 'selected' : ''}>${p.name}</option>
        `).join('')}
      </select>
    </div>

    <!-- 4 個重點指標卡片 -->
    <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:6px;margin-bottom:10px;">
      <div class="motion-card" style="padding:8px 4px;text-align:center;margin-bottom:0;">
        <div style="font-size:10px;color:var(--text-muted);">總日報數</div>
        <div style="font-size:16px;font-weight:900;color:var(--primary);font-family:var(--font-heading);">${reports.length}日</div>
      </div>
      <div class="motion-card" style="padding:8px 4px;text-align:center;margin-bottom:0;">
        <div style="font-size:10px;color:var(--text-muted);">累計出工</div>
        <div style="font-size:16px;font-weight:900;color:var(--accent-cta);font-family:var(--font-heading);">${totalWorkersInRange}人</div>
      </div>
      <div class="motion-card" style="padding:8px 4px;text-align:center;margin-bottom:0;">
        <div style="font-size:10px;color:var(--text-muted);">累計機具</div>
        <div style="font-size:16px;font-weight:900;color:var(--primary-dark);font-family:var(--font-heading);">${totalMachinesInRange}台</div>
      </div>
      <div class="motion-card" style="padding:8px 4px;text-align:center;margin-bottom:0;">
        <div style="font-size:10px;color:var(--text-muted);">工期進度</div>
        <div style="font-size:16px;font-weight:900;color:var(--text-main);font-family:var(--font-heading);">${Math.round((proj.usedDays/proj.contractDays)*100)}%</div>
      </div>
    </div>

    <!-- 區間每日出工人數山積圖 (參照使用者圖片：長條堆疊 + 累積人日曲線 + 橫向滑動) -->
    <div class="motion-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <div style="font-size:13.5px;font-weight:900;color:var(--text-main);">
          👷 區間每日出工人數山積圖 (各工程堆疊 + 累積折線)
        </div>
        <span style="font-size:11px;color:var(--primary);background:#E0F2FE;padding:2px 8px;border-radius:4px;font-weight:700;">
          ⬅️ 左右滑動檢視全區間 (${reports.length}日) ➡️
        </span>
      </div>

      <!-- 橫向滑動容器 -->
      <div class="mountain-chart-scroll-box">
        ${mountainChartSvg}
      </div>
    </div>

    <!-- 區間全量統計總表 (6 欄位：分類 / 項目 / 區間總計 / 月均 / 單日峰值 / 進場天數) -->
    <div class="motion-card">
      <div style="font-size:13.5px;font-weight:900;color:var(--text-main);margin-bottom:6px;">
        📋 區間已填寫項目全量統計總表
      </div>
      <div style="overflow-x:auto;">
        <table class="rep-table" style="width:100%;font-size:11.5px;border-collapse:collapse;">
          <thead>
            <tr style="background:#E0F2FE;border-bottom:2px solid var(--border-color);height:32px;">
              <th style="padding:4px 6px;text-align:left;">分類</th>
              <th style="padding:4px 6px;text-align:left;">項目</th>
              <th style="padding:4px 6px;text-align:right;">區間總計</th>
              <th style="padding:4px 6px;text-align:right;">月均 (30日)</th>
              <th style="padding:4px 6px;text-align:right;">單日峰值</th>
              <th style="padding:4px 6px;text-align:center;">進場天數</th>
            </tr>
          </thead>
          <tbody>
            ${buildSixColTableRows(reports)}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 繪製對應使用者圖片的山積圖
function buildMountainSvg(reports) {
  if (!reports || reports.length === 0) {
    return '<div style="padding:18px;text-align:center;color:#64748B;">尚無足夠之日報數據</div>';
  }

  const n = reports.length;
  const colW = 44;
  const padL = 36;
  const padR = 38;
  const padT = 24;
  const padB = 46;
  const svgW = Math.max(380, padL + padR + n * colW);
  const svgH = 210;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  // 計算每日工種堆疊與累積
  let cum = 0;
  const daysData = reports.map(r => {
    const workers = r.tradeRecords.filter(t => t.category === 'workers');
    const dayTotal = workers.reduce((sum, w) => sum + getTodayQty(w), 0);
    cum += dayTotal;
    return {
      date: r.reportDateISO.slice(5),
      total: dayTotal,
      cum: cum,
      workers: workers
    };
  });

  const maxDay = Math.max(10, ...daysData.map(d => d.total));
  const maxCum = Math.max(20, cum);

  // 產生 SVG 長條堆疊與折線路徑
  const barSvgParts = [];
  const linePoints = [];

  daysData.forEach((d, i) => {
    const cx = padL + i * colW + colW / 2;
    const barH = (d.total / maxDay) * plotH;
    const yTop = padT + (plotH - barH);

    // 堆疊長條
    barSvgParts.push(`
      <rect x="${cx - 14}" y="${yTop}" width="28" height="${barH}" fill="#2F5D46" rx="2" />
      <text x="${cx}" y="${yTop - 5}" font-size="10" font-weight="bold" fill="#0C4A6E" text-anchor="middle">${d.total}人</text>
      <text x="${cx}" y="${svgH - padB + 14}" font-size="9" fill="#0C4A6E" text-anchor="middle">${d.date}</text>
      <text x="${cx}" y="${svgH - padB + 26}" font-size="8" fill="#64748B" text-anchor="middle">累${d.cum}</text>
    `);

    // 累積折線點
    const cy = padT + plotH - (d.cum / maxCum) * plotH;
    linePoints.push(`${cx},${cy}`);
    barSvgParts.push(`<circle cx="${cx}" cy="${cy}" r="3" fill="#D97706" stroke="#FFFFFF" stroke-width="1.5" />`);
  });

  const polylinePath = linePoints.join(' ');

  return `
    <svg width="${svgW}" height="${svgH}" style="display:block;">
      <!-- 背景格線 -->
      <line x1="${padL}" y1="${padT + plotH}" x2="${svgW - padR}" y2="${padT + plotH}" stroke="#CBD5E1" stroke-width="1" />
      <line x1="${padL}" y1="${padT + plotH * 0.5}" x2="${svgW - padR}" y2="${padT + plotH * 0.5}" stroke="#E2E8F0" stroke-dasharray="3,3" />
      
      <!-- 堆疊柱 -->
      ${barSvgParts.join('')}

      <!-- 累積山積折線 -->
      <polyline points="${polylinePath}" fill="none" stroke="#D97706" stroke-width="2.5" />
    </svg>
  `;
}

// 區間全量統計總表
function buildSixColTableRows(reports) {
  const itemMap = new Map();
  const dayCount = Math.max(1, reports.length);

  reports.forEach(rep => {
    rep.tradeRecords.forEach(tr => {
      const q = getTodayQty(tr);
      if (q > 0 || tr.priorCumulative > 0) {
        const key = tr.name;
        if (!itemMap.has(key)) {
          itemMap.set(key, {
            category: tr.category === 'machinery' ? '機具設備' : '工班出工',
            name: tr.name,
            unit: tr.unit,
            total: 0,
            activeDays: 0,
            maxQty: 0
          });
        }
        const item = itemMap.get(key);
        item.total += q;
        if (q > 0) item.activeDays += 1;
        if (q > item.maxQty) item.maxQty = q;
      }
    });
  });

  const list = Array.from(itemMap.values()).filter(x => x.total > 0);
  if (list.length === 0) {
    return '<tr><td colspan="6" style="padding:12px;text-align:center;color:#64748B;">尚無統計資料</td></tr>';
  }

  return list.map(it => {
    const monthlyAvg = ((it.total / dayCount) * 30).toFixed(1);
    return `
      <tr style="border-bottom:1px solid #E2E8F0;height:30px;">
        <td style="padding:4px 6px;">${it.category}</td>
        <td style="padding:4px 6px;"><strong>${it.name}</strong></td>
        <td style="padding:4px 6px;text-align:right;"><strong>${it.total.toFixed(1)} ${it.unit}</strong></td>
        <td style="padding:4px 6px;text-align:right;">${monthlyAvg} ${it.unit}</td>
        <td style="padding:4px 6px;text-align:right;">${it.maxQty} ${it.unit}</td>
        <td style="padding:4px 6px;text-align:center;">${it.activeDays} 天</td>
      </tr>
    `;
  }).join('');
}

// =========================================================================
// 🏠 模型展示視圖 (BIM / 工地建築模型視角)
// =========================================================================
function renderPageBimModelView() {
  const proj = getActiveProject();

  return `
    <div class="section-title-box">
      <span class="section-title-text">🏠 工地 BIM 輕量化 3D 模型檢視</span>
      <span style="font-size:12px;color:var(--primary-dark);">${proj.name.slice(0, 5)}</span>
    </div>

    <div class="motion-card" style="text-align:center;padding:16px;">
      <!-- 模型視角畫布 -->
      <div style="width:100%;height:240px;background:linear-gradient(180deg,#E0F2FE 0%,#BAE6FD 100%);border:2px solid var(--border-color);border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;overflow:hidden;">
        <div style="font-size:48px;margin-bottom:8px;">🏢</div>
        <div style="font-size:15px;font-weight:900;color:var(--text-main);">${proj.name} 3D 結構模型</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">當前施工進度層：5F 樑板鋼筋綁紮中</div>

        <div style="position:absolute;bottom:8px;right:8px;background:rgba(255,255,255,0.9);padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;">
          旋轉視角 360° · 點擊構件檢視
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:12px;">
        <button class="phrase-chip-item" style="justify-content:center;">📐 1F~3F 結構</button>
        <button class="phrase-chip-item" style="justify-content:center;background:var(--primary);color:#FFF;">🏗️ 4F~6F 施工層</button>
        <button class="phrase-chip-item" style="justify-content:center;">⚡ 機電管線</button>
      </div>
    </div>
  `;
}

// =========================================================================
// ⚙️ 設定視圖 (帳號登入、續費/訂閱時間、通用版/客製版、LINE客服、進階模組)
// =========================================================================
function renderPageSettingsView() {
  const acc = state.account;

  return `
    <div class="section-title-box">
      <span class="section-title-text">系統設定與帳號訂閱</span>
    </div>

    <!-- 帳號登入與訂閱狀態 -->
    <div class="motion-card">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid var(--border-light);padding-bottom:8px;margin-bottom:10px;">
        <div>
          <div style="font-size:16px;font-weight:900;color:var(--text-main);">👤 ${acc.name}</div>
          <div style="font-size:12px;color:var(--text-muted);">會員狀態：已登入認證</div>
        </div>
        <span class="proj-badge-active" style="background:#DCFCE7;color:#059669;font-size:12px;">
          ${acc.planType === 'custom' ? '客製版 (Enterprise)' : '通用版 (Standard)'}
        </span>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12.5px;margin-bottom:12px;">
        <div style="background:#F8FAFC;padding:8px;border-radius:6px;border:1px solid #E2E8F0;">
          <span style="color:var(--text-muted);display:block;font-size:11px;">訂閱起始時間</span>
          <strong>${acc.subscribeDate}</strong>
        </div>
        <div style="background:#F8FAFC;padding:8px;border-radius:6px;border:1px solid #E2E8F0;">
          <span style="color:var(--text-muted);display:block;font-size:11px;">次期續費時間</span>
          <strong style="color:var(--accent-cta);">${acc.renewDate} (自動續約)</strong>
        </div>
      </div>

      <!-- 方案費用說明與切換 -->
      <div style="background:#E0F2FE;border:1.5px solid var(--border-color);border-radius:6px;padding:10px;margin-bottom:12px;">
        <div style="font-size:13px;font-weight:800;color:var(--text-main);margin-bottom:6px;">方案方案等級說明：</div>
        <div style="font-size:12px;color:var(--text-sub);line-height:1.5;">
          • <strong>通用版 ($1,200/月)</strong>：標準工程日報、工期氣候計算、山積圖統計、A4 PDF 列印匯出。<br>
          • <strong>客製版 (依需求報價)</strong>：專屬施工報表欄位自訂、ERP 系統同步、多工地權限管理、專人導入。
        </div>
      </div>

      <!-- 聯繫客服與 LINE 客服跳轉 -->
      <button class="btn-create-proj-locked" style="background:#059669;height:44px;font-size:14px;"
              onclick="window.appActions.openLineSupport()">
        <span>💬</span> 聯繫專屬 LINE 線上客服
      </button>
    </div>

    <!-- 進階工程功能開關 (依使用者規範：預設只保留人員與機具，其他在設定中主動開啟) -->
    <div class="motion-card">
      <div style="font-size:14px;font-weight:900;color:var(--text-main);margin-bottom:8px;">
        🛠️ 進階工程填報模組 (依需求主動開啟)
      </div>

      <label style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F1F5F9;cursor:pointer;">
        <div>
          <strong style="font-size:13px;">啟用營建材料統計模組</strong>
          <div style="font-size:11.5px;color:var(--text-muted);">在第 5 步中增加營建材料進出庫與累計欄位</div>
        </div>
        <input type="checkbox" style="width:20px;height:20px;accent-color:var(--primary);"
               ${state.enableMaterials ? 'checked' : ''}
               onchange="window.appActions.toggleAdvancedFeature('enableMaterials', this.checked)" />
      </label>

      <label style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;cursor:pointer;">
        <div>
          <strong style="font-size:13px;">啟用廠商代工與詳細備註</strong>
          <div style="font-size:11.5px;color:var(--text-muted);">在工種下方增加協力廠商名稱與細項工作內容</div>
        </div>
        <input type="checkbox" style="width:20px;height:20px;accent-color:var(--primary);"
               ${state.enableSubcontractorNotes ? 'checked' : ''}
               onchange="window.appActions.toggleAdvancedFeature('enableSubcontractorNotes', this.checked)" />
      </label>
    </div>
  `;
}

function renderToastNotice() {
  if (!state.toastMessage) return '';
  setTimeout(() => {
    state.toastMessage = '';
    renderApp();
  }, 2200);

  return `
    <div style="position:fixed;bottom:92px;left:50%;transform:translateX(-50%);background:#0C4A6E;color:#FFFFFF;padding:8px 16px;border-radius:20px;font-size:12.5px;font-weight:700;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.25);">
      ${state.toastMessage}
    </div>
  `;
}

// =========================================================================
// 全域動作控制器 (window.appActions)
// =========================================================================
window.appActions = {
  navigateTab(tabKey) {
    state.activeBottomTab = tabKey;
    renderApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  selectProjectAndEnter(projId) {
    state.activeProjId = projId;
    state.activeBottomTab = 'report';
    state.currentStep = 2; // 跳轉 02_日期天氣工期
    renderApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  goToStep(stepNumber) {
    state.currentStep = stepNumber;
    renderApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  switchStatsProject(projId) {
    state.activeProjId = projId;
    renderApp();
  },

  setWeather(period, weatherVal) {
    const rep = getActiveReport();
    if (rep) {
      rep[period] = weatherVal;
      saveState();
      renderApp();
    }
  },

  setReportDate(dateISO) {
    const rep = getActiveReport();
    if (rep && dateISO) {
      rep.reportDateISO = dateISO;
      saveState();
      renderApp();
    }
  },

  shiftReportDate(days) {
    const rep = getActiveReport();
    if (!rep) return;
    const d = new Date(rep.reportDateISO);
    d.setDate(d.getDate() + days);
    rep.reportDateISO = d.toISOString().slice(0, 10);
    saveState();
    renderApp();
  },

  setReportDateToToday() {
    const rep = getActiveReport();
    if (!rep) return;
    rep.reportDateISO = new Date().toISOString().slice(0, 10);
    saveState();
    renderApp();
  },

  updateProjectDays(field, val) {
    const proj = getActiveProject();
    if (proj) {
      proj[field] = Number(val) || 0;
      saveState();
      renderApp();
    }
  },

  updateReportField(field, val) {
    const rep = getActiveReport();
    if (rep) {
      rep[field] = val;
      saveState();
    }
  },

  setTradeCategoryTab(tabKey) {
    state.activeTradeTab = tabKey;
    renderApp();
  },

  updateTradeQty(tradeId, val) {
    const rep = getActiveReport();
    if (rep) {
      const it = rep.tradeRecords.find(r => r.id === tradeId);
      if (it) {
        it.todayQty = Number(val) || 0;
        saveState();
        renderApp();
      }
    }
  },

  appendPhraseTo(field, phrase) {
    const rep = getActiveReport();
    if (rep) {
      const cur = (rep[field] || '').trim();
      rep[field] = cur ? cur + '、' + phrase : phrase;
      saveState();
      renderApp();
    }
  },

  addPhrase(inputId) {
    const el = document.getElementById(inputId);
    if (el && el.value.trim()) {
      state.customPhrases.push(el.value.trim());
      el.value = '';
      saveState();
      renderApp();
    }
  },

  removePhrase(idx) {
    state.customPhrases.splice(idx, 1);
    saveState();
    renderApp();
  },

  toggleAdvancedFeature(featureKey, val) {
    state[featureKey] = val;
    saveState();
    renderApp();
  },

  openLineSupport() {
    const supportLineId = state.account.lineSupportUrl || '@site_support';
    navigator.clipboard.writeText(supportLineId).catch(() => {});
    state.toastMessage = '已複製 LINE 客服 ID：' + supportLineId + '，即將前往 LINE！';
    renderApp();
    setTimeout(() => {
      window.open('https://line.me/R/ti/p/' + encodeURIComponent(supportLineId), '_blank');
    }, 400);
  },

  openLineShareModal() {
    const proj = getActiveProject();
    const rep = getActiveReport();
    const txt = `【${proj.name} 施工日報】
📅 日期：${formatDateWestern(rep.reportDateISO, 'slash_weekday')}
☀️ 天候：上午 ${rep.weatherAM} / 下午 ${rep.weatherPM}
📌 本日施作：${rep.todayProgressSummary}
📝 明日預定：${rep.tomorrowPlanSummary}`;
    navigator.clipboard.writeText(txt).then(() => {
      state.toastMessage = '✅ 已複製 LINE 施工日報摘要文字！';
      renderApp();
    });
  },

  openCreateProjectModal() {
    const name = prompt('請輸入新工程專案名稱：');
    if (name && name.trim()) {
      const newP = {
        id: 'proj_' + Date.now(),
        name: name.trim(),
        contractorCompany: '營造工程股份有限公司',
        contractDays: 360,
        usedDays: 1,
        startDateISO: new Date().toISOString().slice(0, 10),
        endDateISO: '2027-12-31',
        reports: []
      };
      newP.reports = generateSampleReportsForProject(newP, 1);
      state.projects.unshift(newP);
      state.activeProjId = newP.id;
      state.activeReportId = newP.reports[0].id;
      saveState();
      renderApp();
    }
  },

  exportBackup() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = '營建管理系統備份_' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
  },

  importBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const parsed = JSON.parse(ev.target.result);
          state = Object.assign(state, parsed);
          saveState();
          renderApp();
          alert('專案備份檔匯入成功！');
        } catch (err) {
          alert('匯入失敗：無效的 JSON 檔案');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }
};

// 啟動入口
function initApp() {
  loadState();
  renderApp();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
