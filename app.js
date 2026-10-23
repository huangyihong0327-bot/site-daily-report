/**
 * 營建管理系統 - Motion-Driven UI/UX Pro Max 旗艦版 (V11)
 * 嚴格遵循使用者指示：
 * 1. 括號文字拿掉：山積圖標題「👷 區間每日出工人數山積圖」，提示文字縮短為「(左右滑動檢視)」單行不換行
 * 2. 分類文字簡化：改為「工班」與「機具」
 * 3. 新增按鈕在同一行不能換行 (+新增 按鈕絕對保持單行)
 * 4. Step 5 移除單位欄，直接寫在數量後面「/人」或「/台」
 * 5. 累計數量移到設定裡開啟，一般顯示只保留工種、機具與數量填寫欄位
 * 6. 新增工種與機具空白欄位：具備自動記憶多排標籤雲，點擊快速選取添加
 * 7. 照片功能仿上一版：提供「📷 現場拍照」與「📁 從相簿選取」雙按鈕與照片清單
 * 8. 日報表仿上兩版：清晰格線、出工山積圖、工種佔比圓餅圖(Donut)、折線圖與進度差異比較(預定vs實際)
 */

const STORAGE_KEY = 'SITE_REPORT_V11_MOTION';
const PHRASES_KEY = 'SITE_CUSTOM_WORK_PHRASES_V11';
const TRADES_KEY = 'SITE_CUSTOM_TRADES_V11';
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const DEFAULT_PROJECTS = [
  {
    id: 'proj_shiguang',
    name: '拾光薈二期新建工程 (範例)',
    contractorCompany: '安家營造股份有限公司',
    contractDays: 540,
    usedDays: 312,
    plannedProgress: 56.0,
    actualProgress: 57.8,
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
    plannedProgress: 43.5,
    actualProgress: 41.3,
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
    plannedProgress: 22.0,
    actualProgress: 23.9,
    startDateISO: '2026-06-10',
    endDateISO: '2027-06-05',
    reports: []
  }
];

const DEFAULT_WORKER_NAMES = [
  '施工架工程', '鋼筋工 (加工綁紮)', '模板工 (組立支撐)',
  '泥水粉刷工', '機電水電工', '普通工 (環境整理)',
  '防水工', '電焊工', '點井操作工'
];

const DEFAULT_MACHINE_NAMES = [
  '挖掘機 (怪手 PC200)', '吊車 (25T 全吊)', '預拌混凝土壓送車',
  '點井抽水沉水馬達', '發電機 (150kW)', '堆高機', '空壓機'
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

    const workers = DEFAULT_WORKER_NAMES.slice(0, 6).map((name, idx) => ({
      id: 'w_' + idx + '_' + i,
      category: 'workers',
      name: name,
      unit: '人',
      todayQty: Math.max(1, Math.round((5 + idx) * dayFactor)),
      priorCumulative: 150 + idx * 25 + (count - i) * 6,
      todayWorkNote: name + '工區施作',
      tomorrowWorkNote: name + '明日續作'
    }));

    const machines = DEFAULT_MACHINE_NAMES.slice(0, 5).map((name, idx) => ({
      id: 'm_' + idx + '_' + i,
      category: 'machinery',
      name: name,
      unit: name.includes('馬達') ? '組' : '台',
      todayQty: Math.max(0, Math.round((idx === 0 ? 2 : 1) * (dayFactor > 0.85 ? 1 : 0.5))),
      priorCumulative: 40 + idx * 10 + (count - i) * 2,
      todayWorkNote: name + '正常運轉',
      tomorrowWorkNote: name + '例行維護'
    }));

    reps.push({
      id: 'rep_' + proj.id + '_' + iso,
      reportDateISO: iso,
      weatherAM: i % 4 === 0 ? '雨' : (i % 3 === 0 ? '多雲' : '晴'),
      weatherPM: i % 5 === 0 ? '多雲' : '晴',
      todayProgressSummary: '外牆施工架搭設、地樑鋼筋加工綁紮，點井抽水馬達常態運轉。',
      tomorrowPlanSummary: '進行地下室側模組立及保護層墊塊查驗，準備排程混凝土澆置。',
      importantNotes: '無重大公安事故，工區安全巡檢完畢。',
      tradeRecords: [...workers, ...machines],
      photos: []
    });
  }
  return reps;
}

let state = {
  activeBottomTab: 'home', // 'home' | 'report' | 'stats' | 'model' | 'settings' | 'checkout'
  statsFilterRange: 'all', // 'all' | 'week' | 'month' | 'quarter' | 'last30'
  mountainChartMode: 'workers', // 'workers' (出工人力) | 'machinery' (進場機具) | 'combined' (綜合負載)
  showExportActionSheet: false,
  selectedDayDetail: null,
  currentStep: 1, // 1~7
  activeProjId: 'proj_shiguang',
  activeReportId: null,
  activeTradeCategory: 'workers', // 'workers' (工班) | 'machinery' (機具)
  projects: [],
  customPhrases: [...DEFAULT_PHRASES],
  customTradesList: [...DEFAULT_WORKER_NAMES],
  customMachinesList: [...DEFAULT_MACHINE_NAMES],
  
  // 設定裡的進階功能
  showCumulativeInTrades: false, // 累計數量移到設定裡開啟，一般顯示只保留工種/機具與今日數量
  enableMaterials: false,
  enableSubcontractorNotes: false,

  // 帳號與付費系統
  account: {
    name: '工務所主任 (huangyihong0327-bot)',
    planType: 'standard', // 'standard' (通用版) | 'custom' (客製版)
    subscribeDate: '2026/01/01',
    renewDate: '2027/01/01',
    lineSupportUrl: '@site_support'
  },

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

  if (!state.projects || state.projects.length === 0) {
    state.projects = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
    state.projects.forEach(p => {
      p.reports = generateSampleReportsForProject(p, 15);
    });
  }

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
// 核心頁面渲染
// =========================================================================

// =========================================================================
// 📱 第 3 頁【03_新畫面頁】(393×852px 確認訂單與安全結帳)
// =========================================================================
function renderPage03CheckoutView() {
  return `
    <div class="checkout-view-box">
      <!-- 1. [navbar] "← 確認訂單與安全結帳" -->
      <div class="checkout-header-navbar">
        <button class="checkout-back-btn" onclick="window.appActions.navigateTab('settings')">
          ←
        </button>
        <span class="checkout-nav-title">確認訂單與安全結帳</span>
      </div>

      <!-- 2. [product] 方案產品卡 -->
      <div class="checkout-product-card">
        <div class="checkout-prod-icon">💎</div>
        <div class="checkout-prod-details">
          <div class="checkout-prod-name">營建日報專業通用版 (年繳方案)</div>
          <div class="checkout-prod-desc">365天全功能無限制 · A4/Excel自動導出 · 5組工程專案同步備份</div>
          <div class="checkout-prod-price">NT$ 6,800 / 年</div>
        </div>
      </div>

      <!-- 3. [banner] "🎟️ 已套用 VIP 折抵券 (-NT$ 500)" -->
      <div class="checkout-vip-banner">
        <span>🎟️ 已套用 VIP 折抵券</span>
        <span style="color:#B45309;font-weight:900;">-NT$ 500</span>
      </div>

      <!-- 4. [form] "收件人與付款設定" -->
      <div class="checkout-form-card">
        <div class="checkout-form-title">💳 收件人與付款設定</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div>
            <label style="font-size:11.5px;color:var(--text-muted);font-weight:700;">訂購人姓名 / 公司抬頭</label>
            <input type="text" class="native-input-box" value="陳建銘工程師 / 拾光營造" style="height:38px;font-size:13.5px;" />
          </div>
          <div>
            <label style="font-size:11.5px;color:var(--text-muted);font-weight:700;">信用卡卡號 (SSL 256-bit 加密)</label>
            <input type="text" class="native-input-box" value="4532 •••• •••• 8892" style="height:38px;font-size:13.5px;" />
          </div>
          <div style="display:flex;gap:8px;">
            <div style="flex:1;">
              <label style="font-size:11.5px;color:var(--text-muted);font-weight:700;">有效月年</label>
              <input type="text" class="native-input-box" value="08/28" style="height:38px;font-size:13.5px;text-align:center;" />
            </div>
            <div style="flex:1;">
              <label style="font-size:11.5px;color:var(--text-muted);font-weight:700;">安全碼 (CVV)</label>
              <input type="password" class="native-input-box" value="888" style="height:38px;font-size:13.5px;text-align:center;" />
            </div>
          </div>
        </div>
      </div>

      <!-- 5. [listitem] "🧾 電子發票・手機條碼載具" -->
      <div class="checkout-invoice-item">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:18px;">🧾</span>
          <div>
            <div style="font-size:13px;font-weight:800;color:var(--text-main);">電子發票・手機條碼載具</div>
            <div style="font-size:11px;color:var(--text-muted);">/AB89-721 (已完成財政部驗證)</div>
          </div>
        </div>
        <span style="color:#059669;font-weight:900;font-size:13px;">已綁定 ✓</span>
      </div>

      <!-- 6. [button] "🔒 確認授權付款 NT$ 6,300 →" -->
      <button class="checkout-pay-btn" onclick="window.appActions.completePayment()">
        <span>🔒 確認授權付款 NT$ 6,300 →</span>
      </button>

      <!-- 7. [tabbar] "🏠 首頁|🔍 探索|📊 數據|🛒 購物|👤 我的" -->
      <div class="checkout-bottom-tabbar">
        <button class="checkout-tab-btn" onclick="window.appActions.navigateTab('home')">
          <span style="font-size:16px;">🏠</span>
          <span>首頁</span>
        </button>
        <button class="checkout-tab-btn" onclick="window.appActions.navigateTab('report')">
          <span style="font-size:16px;">🔍</span>
          <span>探索</span>
        </button>
        <button class="checkout-tab-btn" onclick="window.appActions.navigateTab('stats')">
          <span style="font-size:16px;">📊</span>
          <span>數據</span>
        </button>
        <button class="checkout-tab-btn active" onclick="window.appActions.navigateTab('checkout')">
          <span style="font-size:16px;">🛒</span>
          <span>購物</span>
        </button>
        <button class="checkout-tab-btn" onclick="window.appActions.navigateTab('settings')">
          <span style="font-size:16px;">👤</span>
          <span>我的</span>
        </button>
      </div>
    </div>
  `;
}


// =========================================================================
// 浮動 Action Sheet (匯出 PDF / EXCEL / LINE 備份收納)
// =========================================================================
function renderExportActionSheetModal() {
  if (!state.showExportActionSheet) return '';
  return `
    <div class="bottom-sheet-backdrop" onclick="window.appActions.closeExportActionSheet(event)">
      <div class="bottom-sheet-content" onclick="event.stopPropagation()">
        <div class="bottom-sheet-grabber"></div>
        <div style="font-size:16px;font-weight:900;color:var(--text-main);margin-bottom:12px;font-family:var(--font-heading);">
          📤 工程報表與匯出功能
        </div>
        <button class="action-sheet-item-btn" onclick="window.appActions.exportToPdf();window.appActions.closeExportActionSheet();">
          <span style="font-size:20px;">📄</span>
          <div style="text-align:left;">
            <div>輸出正式 A4 日報表 (PDF)</div>
            <div style="font-size:11px;color:var(--text-muted);font-weight:normal;">瀏覽器列印為 PDF 格式</div>
          </div>
        </button>
        <button class="action-sheet-item-btn" onclick="window.appActions.exportToExcel();window.appActions.closeExportActionSheet();">
          <span style="font-size:20px;">📊</span>
          <div style="text-align:left;">
            <div>匯出全工程總統計表 (EXCEL)</div>
            <div style="font-size:11px;color:var(--text-muted);font-weight:normal;">下載 UTF-8 CSV 完整資料表</div>
          </div>
        </button>
        <button class="action-sheet-item-btn" onclick="window.appActions.openLineShareModal();window.appActions.closeExportActionSheet();">
          <span style="font-size:20px;">💬</span>
          <div style="text-align:left;">
            <div>產生 LINE 工地通報摘要</div>
            <div style="font-size:11px;color:var(--text-muted);font-weight:normal;">一鍵複製文字並分享至群組</div>
          </div>
        </button>
        <button class="action-sheet-item-btn" style="background:#F1F5F9;justify-content:center;color:var(--text-muted);margin-top:8px;" onclick="window.appActions.closeExportActionSheet()">
          取消
        </button>
      </div>
    </div>
  `;
}

// =========================================================================
// 點選單日柱體滑出之 Bottom Sheet (單日工種人力與機具細項抽屜)
// =========================================================================
function renderDayDetailBottomSheet() {
  if (!state.selectedDayDetail) return '';
  const proj = getActiveProject();
  const rep = (proj.reports || []).find(r => r.reportDateISO === state.selectedDayDetail);
  if (!rep) return '';

  const workers = rep.tradeRecords.filter(t => t.category === 'workers');
  const machines = rep.tradeRecords.filter(t => t.category === 'machinery');

  return `
    <div class="bottom-sheet-backdrop" onclick="window.appActions.closeDayDetailSheet(event)">
      <div class="bottom-sheet-content" onclick="event.stopPropagation()">
        <div class="bottom-sheet-grabber"></div>
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1.5px solid var(--border-light);padding-bottom:8px;margin-bottom:12px;">
          <div>
            <div style="font-size:16px;font-weight:900;color:var(--text-main);">📅 ${formatDateWestern(rep.reportDateISO, 'slash_weekday')} 現場明細</div>
            <div style="font-size:11.5px;color:var(--text-muted);">天氣：上午 ${rep.weatherAM} / 下午 ${rep.weatherPM}</div>
          </div>
          <button class="phrase-chip-item" style="padding:4px 10px;" onclick="window.appActions.closeDayDetailSheet()">關閉 ✕</button>
        </div>

        <div style="font-size:13px;font-weight:900;color:var(--text-main);margin-bottom:6px;">👷 當日出工明細：</div>
        <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px;">
          ${workers.map(w => `
            <div style="display:flex;justify-content:space-between;padding:6px 8px;background:#F8FAFC;border-radius:4px;font-size:12px;">
              <span>${w.name}</span>
              <strong style="color:var(--primary-dark);">${getTodayQty(w)} 人</strong>
            </div>
          `).join('')}
        </div>

        <div style="font-size:13px;font-weight:900;color:var(--text-main);margin-bottom:6px;">🚜 當日機具明細：</div>
        <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px;">
          ${machines.map(m => `
            <div style="display:flex;justify-content:space-between;padding:6px 8px;background:#F0FDF4;border-radius:4px;font-size:12px;">
              <span>${m.name}</span>
              <strong style="color:#059669;">${getTodayQty(m)} 台</strong>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderApp() {
  const root = document.getElementById('app-root');
  if (!root) return;

  const proj = getActiveProject();
  const rep = getActiveReport();

  let bodyContent = '';

  if (state.activeBottomTab === 'home') {
    bodyContent = renderPage01ProjectManagement();
  } else if (state.activeBottomTab === 'stats') {
    bodyContent = renderPageStatsView();
  } else if (state.activeBottomTab === 'model') {
    bodyContent = renderPageBimModelView();
  } else if (state.activeBottomTab === 'settings') {
    bodyContent = renderPageSettingsView();
  } else if (state.activeBottomTab === 'checkout') {
    bodyContent = renderPage03CheckoutView();
  } else {
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
    ${renderExportActionSheetModal()}
    ${renderDayDetailBottomSheet()}
    ${renderToastNotice()}
  `;
}

function renderHeaderNav() {
  const isHome = state.activeBottomTab === 'home';
  const proj = getActiveProject();

  return `
    <header class="minimal-header-nav no-print">
      <div class="minimal-brand-wrap" onclick="window.appActions.navigateTab('home')">
        <span style="font-size:20px;">🏗️</span>
        <span class="minimal-brand-title">${isHome ? '營建管理系統' : '營建日報'}</span>
        ${!isHome ? `<span class="minimal-proj-pill">${proj.name}</span>` : ''}
      </div>
      <div class="minimal-header-actions">
        ${!isHome ? `
          <button class="action-sheet-trigger-btn" onclick="window.appActions.openExportActionSheet()" title="更多匯出與報表操作">
            <span>⋯</span>
          </button>
        ` : ''}
        <button class="action-sheet-trigger-btn" style="background:#0EA5E9;color:#fff;border-color:#0284C7;" onclick="window.appActions.navigateTab('settings')" title="帳號與設定">
          <span>👤</span>
        </button>
      </div>
    </header>
  `;
}

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
// 📱 第 1 頁【01_專案管理】(快速首頁)
// =========================================================================
function renderPage01ProjectManagement() {
  const projCardsHtml = state.projects.map(p => {
    const reps = p.reports || [];
    const latestRep = reps[reps.length - 1];
    const latestDate = latestRep ? formatDateWestern(latestRep.reportDateISO, 'slash_weekday') : '尚未填寫';
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

    <button class="btn-create-proj-locked" onclick="window.appActions.openCreateProjectModal()">
      <span>＋</span> 建立新工程專案 (空白日報)
    </button>

    <div class="backup-btn-row-locked">
      <button class="btn-backup-item" onclick="window.appActions.exportBackup()">
        <span>💾</span> 匯出專案備份檔
      </button>
      <button class="btn-backup-item" onclick="window.appActions.importBackup()">
        <span>📥</span> 匯入專案備份檔
      </button>
    </div>

    <div class="section-divider"></div>

    <div style="margin-bottom:8px;">
      <h2 style="font-size:15px;font-weight:800;color:var(--text-main);margin-bottom:8px;display:flex;align-items:center;gap:6px;">
        <span>📋</span> 工程專案清單 (點擊直接進入填報)
      </h2>
      ${projCardsHtml}
    </div>
  `;
}

// =========================================================================
// 📱 第 2 頁【02_日期天氣工期】
// =========================================================================
function renderPage02DateWeatherSchedule(proj, rep) {
  if (!rep) return '<div class="motion-card">請先建立或選擇日報</div>';

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
    <div class="tabstrip-steps-row">
      <button class="tabstrip-pill" onclick="window.appActions.navigateTab('home')">1.專案管理</button>
      <button class="tabstrip-pill active">2.日期天氣工期</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(3)">3.今日進度</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(4)">4.明日進度</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(5)">5.出工機具</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(6)">6.現場照片</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(7)">7.日報預覽PDF</button>
    </div>

    <div class="section-title-box">
      <span class="section-title-text">工期・日期・天氣</span>
      <span style="font-size:12px;font-weight:700;color:var(--primary-dark);">${proj.name}</span>
    </div>

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

    <div class="field-input-card">
      <div class="field-label-small">
        <span>⏱️ 契約工期天數</span>
        <span style="color:var(--accent-cta);font-weight:800;font-size:13px;">尚餘 ${remainDays} 天</span>
      </div>
      <div class="duration-vertical-grid">
        <div class="duration-vertical-item">
          <div class="duration-item-info">
            <span class="duration-item-title">契約總工期</span>
            <span class="duration-item-sub">工程契約核定總日曆天</span>
          </div>
          <div class="duration-item-input-wrap">
            <input type="number" class="native-input-box" value="${contractDays}"
                   onchange="window.appActions.updateProjectDays('contractDays', this.value)" style="text-align:right;font-weight:800;height:38px;" />
          </div>
        </div>
        <div class="duration-vertical-item">
          <div class="duration-item-info">
            <span class="duration-item-title">已施工天數</span>
            <span class="duration-item-sub">累計至本日之日曆施工天</span>
          </div>
          <div class="duration-item-input-wrap">
            <input type="number" class="native-input-box" value="${usedDays}"
                   onchange="window.appActions.updateProjectDays('usedDays', this.value)" style="text-align:right;font-weight:800;height:38px;" />
          </div>
        </div>
      </div>
    </div>

    <div class="field-input-card">
      <div class="field-label-small">
        <span>📅 本日施工日期</span>
        <span style="color:var(--primary-dark);font-weight:800;">${formatDateWestern(rep.reportDateISO, 'slash_weekday')}</span>
      </div>
      <div class="date-clean-row">
        <input type="date" class="native-input-box date-clean-input" value="${rep.reportDateISO}"
               onchange="window.appActions.setReportDate(this.value)" />
        <button class="date-shift-btn" onclick="window.appActions.shiftReportDate(-1)" title="前一天">◀ -1天</button>
        <button class="date-shift-btn" onclick="window.appActions.shiftReportDate(1)" title="後一天">+1天 ▶</button>
      </div>
    </div>

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

    <div class="section-divider"></div>

    <div class="weather-heading">☀️ 上午天氣</div>
    ${renderWeatherChips('weatherAM', rep.weatherAM)}

    <div class="weather-heading">🌤️ 下午天氣</div>
    ${renderWeatherChips('weatherPM', rep.weatherPM)}

    <button class="btn-next-action-locked" onclick="window.appActions.goToStep(3)">
      下一步：今日進度 →
    </button>
  `;
}

// =========================================================================
// 📱 第 3 頁【今日進度】(按鈕文字絕對在同一行、不換行)
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
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(5)">5.出工機具</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(6)">6.現場照片</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(7)">7.日報預覽PDF</button>
    </div>

    <div class="section-title-box">
      <span class="section-title-text">今日施工進度內容</span>
      <span style="font-size:11.5px;color:var(--text-muted);">多排常用工項點擊即加入</span>
    </div>

    <div class="motion-card">
      <div style="display:flex;gap:6px;margin-bottom:8px;align-items:center;">
        <input id="input-new-phrase-3" class="native-input-box" style="flex:1;" placeholder="輸入常用工項 (例: 鋼筋綁紮)..."
               onkeydown="if(event.key==='Enter'){event.preventDefault();window.appActions.addPhrase('input-new-phrase-3');}" />
        <button class="btn-nowrap-action" onclick="window.appActions.addPhrase('input-new-phrase-3')">＋新增</button>
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
// 📱 第 4 頁【明日進度與備註記事】
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
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(5)">5.出工機具</button>
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
// 📱 第 5 頁【出工與機具管理】(單位併入今日數量/人，累計移至設定，新增空白欄位自動記憶)
// =========================================================================
function renderPage05WorkersMachines(rep) {
  const isWorkers = state.activeTradeCategory === 'workers';
  const quickList = isWorkers ? state.customTradesList : state.customMachinesList;

  // 快捷標籤雲 (自動記憶快速添加)
  const quickChipsHtml = quickList.map((name, idx) => `
    <span class="phrase-chip-item" onclick="window.appActions.quickAddTradeItem('${name.replace(/'/g, "\\'")}')">
      ＋ ${name}
      <span class="chip-del-x" onclick="event.stopPropagation();window.appActions.removeCustomTradeItem(${idx})">×</span>
    </span>
  `).join('');

  // 取得當前列表 (工班 or 機具)
  const records = rep.tradeRecords.filter(r => r.category === state.activeTradeCategory);

  const rowsHtml = records.map(item => {
    const todayQty = getTodayQty(item);
    const cum = Number(((item.priorCumulative || 0) + todayQty).toFixed(1));
    const unitLabel = item.category === 'workers' ? '/人' : ('/' + (item.unit || '台'));

    return `
      <div class="trade-row-card" style="grid-template-columns: 1fr auto ${state.showCumulativeInTrades ? '96px' : ''};">
        <div class="trade-row-name">${item.name}</div>
        <div style="display:flex;align-items:center;gap:4px;">
          <input type="number" class="trade-row-qty-input" value="${todayQty}" step="0.5"
                 style="width:72px;"
                 oninput="window.appActions.updateTradeQty('${item.id}', this.value)" />
          <span style="font-size:12.5px;font-weight:800;color:var(--text-muted);white-space:nowrap;">${unitLabel}</span>
        </div>
        ${state.showCumulativeInTrades ? `
          <div class="trade-row-cum-badge">累計 ${cum}${item.unit}</div>
        ` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="tabstrip-steps-row">
      <button class="tabstrip-pill" onclick="window.appActions.navigateTab('home')">1.專案管理</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(2)">2.日期天氣工期</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(3)">3.今日進度</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(4)">4.明日進度</button>
      <button class="tabstrip-pill active">5.出工機具</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(6)">6.現場照片</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(7)">7.日報預覽PDF</button>
    </div>

    <!-- 分類切換按鈕 (簡化為：工班 / 機具) -->
    <div style="display:flex;gap:8px;margin-bottom:10px;">
      <button class="chip-weather-btn ${isWorkers ? 'active' : ''}"
              style="flex:1;height:44px;flex-direction:row;gap:6px;"
              onclick="window.appActions.setTradeCategoryTab('workers')">
        <span>👷</span> <strong>工班</strong>
      </button>
      <button class="chip-weather-btn ${!isWorkers ? 'active' : ''}"
              style="flex:1;height:44px;flex-direction:row;gap:6px;"
              onclick="window.appActions.setTradeCategoryTab('machinery')">
        <span>🚜</span> <strong>機具</strong>
      </button>
    </div>

    <!-- 新增工種/機具空白欄位 (自動記憶快速添加) -->
    <div class="motion-card" style="padding:12px;margin-bottom:10px;">
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;">
        <input id="input-new-trade-name" class="native-input-box" style="flex:1;"
               placeholder="輸入新增${isWorkers ? '工種' : '機具'}名稱 (例: ${isWorkers ? '電焊工' : '25T吊車'})..."
               onkeydown="if(event.key==='Enter'){event.preventDefault();window.appActions.addNewTradeItem();}" />
        <button class="btn-nowrap-action" onclick="window.appActions.addNewTradeItem()">＋新增</button>
      </div>

      <div style="font-size:11.5px;font-weight:700;color:var(--text-muted);margin-bottom:4px;">
        ⚡ 常用${isWorkers ? '工班' : '機具'} (點擊快速選取添加)：
      </div>
      <div class="phrase-chips-wrap" style="margin-bottom:0;">
        ${quickChipsHtml}
      </div>
    </div>

    <!-- 列表填寫區 (直接保留工種/機具與數量欄位，單位寫在數量後) -->
    <div class="motion-card" style="padding:10px;">
      <div style="display:flex;justify-content:space-between;font-size:11.5px;font-weight:800;color:var(--text-muted);padding:4px 6px;">
        <span>${isWorkers ? '工種名稱' : '機具型號'}</span>
        <span>今日數量</span>
      </div>

      ${rowsHtml}

      <div style="font-size:11px;color:var(--text-muted);text-align:center;margin-top:8px;padding-top:6px;border-top:1px dashed var(--border-light);">
        💡 累計數量已移至「⚙️ 設定」中開啟；單位已整合至數量輸入框後方。
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      <button class="btn-backup-item" style="height:48px;" onclick="window.appActions.goToStep(4)">← 上一步</button>
      <button class="btn-next-action-locked" style="margin-top:0;" onclick="window.appActions.goToStep(6)">下一步：現場照片 →</button>
    </div>
  `;
}

// =========================================================================
// 📱 第 6 頁【現場照片】(可選拍照或從相簿上傳)
// =========================================================================
function renderPage06SitePhotos(rep) {
  const photos = rep.photos || [];

  return `
    <div class="tabstrip-steps-row">
      <button class="tabstrip-pill" onclick="window.appActions.navigateTab('home')">1.專案管理</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(2)">2.日期天氣工期</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(3)">3.今日進度</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(4)">4.明日進度</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(5)">5.出工機具</button>
      <button class="tabstrip-pill active">6.現場照片</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(7)">7.日報預覽PDF</button>
    </div>

    <div class="section-title-box">
      <span class="section-title-text">現場施工照片紀錄 (共 ${photos.length} 張)</span>
    </div>

    <!-- 隱藏原生檔案輸入框 -->
    <input type="file" id="camera-file-input" accept="image/*" capture="environment" style="display:none;"
           onchange="window.appActions.handlePhotoSelected(this, 'camera')" />
    <input type="file" id="gallery-file-input" accept="image/*" multiple style="display:none;"
           onchange="window.appActions.handlePhotoSelected(this, 'gallery')" />

    <!-- 雙大按鈕：現場拍照 ＆ 從相簿選取 (上一版優秀機制) -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
      <div class="dashed-photo-btn" onclick="document.getElementById('camera-file-input').click()">
        <span style="font-size:26px;">📷</span>
        <span style="font-size:14px;font-weight:800;color:var(--primary-dark);">現場拍照</span>
        <span style="font-size:10.5px;color:var(--text-muted);">開啟相機即拍即存</span>
      </div>
      <div class="dashed-photo-btn" onclick="document.getElementById('gallery-file-input').click()">
        <span style="font-size:26px;">📁</span>
        <span style="font-size:14px;font-weight:800;color:var(--primary-dark);">從相簿選取</span>
        <span style="font-size:10.5px;color:var(--text-muted);">支援多張照片批量上傳</span>
      </div>
    </div>

    <!-- 照片清單 -->
    <div class="motion-card" style="padding:10px;">
      ${photos.length === 0 ? `
        <div style="text-align:center;padding:24px 12px;color:var(--text-muted);font-size:13px;border:2px dashed var(--border-light);border-radius:6px;">
          本日尚未新增照片，點擊上方拍照或相簿按鈕即可新增。
        </div>
      ` : `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          ${photos.map((ph, idx) => `
            <div style="border:2px solid var(--border-color);border-radius:6px;overflow:hidden;background:#F8FAFC;">
              <div style="position:relative;height:120px;background:#0F172A;">
                <img src="${ph.dataUrl}" style="width:100%;height:100%;object-fit:cover;display:block;" />
                <div style="position:absolute;bottom:0;left:0;right:0;background:rgba(12,74,110,0.85);color:#FFF;font-size:9.5px;padding:3px 6px;">
                  ${ph.capturedAt || '施工現況'}
                </div>
              </div>
              <div style="padding:6px;">
                <input class="native-input-box" style="height:30px;font-size:11.5px;margin-bottom:4px;" value="${ph.desc || '現場施工部位'}"
                       onchange="window.appActions.updatePhotoDesc(${idx}, this.value)" />
                <button class="btn-backup-item" style="width:100%;height:28px;font-size:11px;color:var(--danger-text);"
                        onclick="window.appActions.removePhoto(${idx})">🗑️ 刪除照片</button>
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
// 📱 第 7 頁【日報表 (清晰格線 + 山積圖 + 圓餅圖 + 折線圖 + 進度差異比較)】
// =========================================================================
function renderPage07DailyReportAndA4(proj, rep) {
  const workers = rep.tradeRecords.filter(r => r.category === 'workers');
  const machines = rep.tradeRecords.filter(r => r.category === 'machinery');

  const totalWorkers = workers.reduce((acc, r) => acc + getTodayQty(r), 0);
  const totalMachines = machines.reduce((acc, r) => acc + getTodayQty(r), 0);

  // 進度差異主動計算
  const contractDays = Number(proj.contractDays) || 540;
  const usedDays = Number(proj.usedDays) || 312;
  const remainDays = Math.max(0, contractDays - usedDays);
  const actualPct = Number(((usedDays / Math.max(1, contractDays)) * 100).toFixed(1));
  const plannedPct = Number((proj.plannedProgress || (actualPct - 1.5)).toFixed(1));
  const diffPct = Number((actualPct - plannedPct).toFixed(1));
  const isAhead = diffPct >= 0;

  // 圖表 1：單日工種出工山積圖
  const workerMountainSvg = buildSingleDayMountainSvg(workers, 'workers');
  // 圖表 2：工種出工佔比圓餅/環形圖 (Donut Chart)
  const workerDonutHtml = buildDonutChartHtml(workers);
  // 圖表 3：機具使用直方圖
  const machSvg = buildSingleDayMountainSvg(machines, 'machinery');

  return `
    <div class="tabstrip-steps-row no-print">
      <button class="tabstrip-pill" onclick="window.appActions.navigateTab('home')">1.專案管理</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(2)">2.日期天氣工期</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(3)">3.今日進度</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(4)">4.明日進度</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(5)">5.出工機具</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(6)">6.現場照片</button>
      <button class="tabstrip-pill active">7.日報預覽PDF</button>
    </div>

    <!-- 頂部操作按鈕 (輸出 A4 PDF ＆ LINE 稿) -->
    <div class="no-print" style="display:flex;gap:8px;margin-bottom:12px;">
      <button class="btn-create-proj-locked" style="flex:1;height:46px;margin-bottom:0;" onclick="window.print()">
        <span>🖨️</span> 輸出正式 A4 日報表 (PDF)
      </button>
      <button class="btn-backup-item" style="height:46px;padding:0 14px;" onclick="window.appActions.openLineShareModal()">
        <span>💬</span> 複製 LINE
      </button>
    </div>

    <!-- 進度差異比較功能 (仿上兩版) -->
    <div class="motion-card no-print" style="padding:12px;">
      <div style="font-size:13.5px;font-weight:900;color:var(--text-main);margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
        <span>📈 工期與累計進度差異比較分析</span>
        <span class="${isAhead ? 'variance-badge-ahead' : 'variance-badge-behind'}">
          ${isAhead ? '超前 +' + diffPct + '%' : '落後 ' + diffPct + '%'}
        </span>
      </div>

      <div class="progress-variance-box">
        <div>
          <div style="font-size:10.5px;color:var(--text-muted);">預定累計進度</div>
          <div style="font-size:16px;font-weight:900;color:var(--primary-dark);">${plannedPct}%</div>
        </div>
        <div>
          <div style="font-size:10.5px;color:var(--text-muted);">實際累計進度</div>
          <div style="font-size:16px;font-weight:900;color:var(--accent-cta);">${actualPct}%</div>
        </div>
        <div>
          <div style="font-size:10.5px;color:var(--text-muted);">進度差異 (差值)</div>
          <div style="font-size:16px;font-weight:900;color:${isAhead ? '#059669' : '#DC2626'};">
            ${isAhead ? '+' : ''}${diffPct}%
          </div>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--text-muted);margin-top:4px;">
        <span>契約總工期：${contractDays} 天</span>
        <span>已施工：${usedDays} 天</span>
        <span style="font-weight:800;color:var(--text-main);">剩餘天數：${remainDays} 天</span>
      </div>
    </div>

    <!-- 視覺化圖表群 (山積圖 + 圓餅圖) -->
    <div class="motion-card no-print" style="padding:12px;">
      <div style="font-size:13px;font-weight:900;color:var(--text-main);margin-bottom:6px;">
        📊 本日工班出工分佈山積圖
      </div>
      <div class="mountain-chart-scroll-box">
        ${workerMountainSvg}
      </div>

      <div style="font-size:13px;font-weight:900;color:var(--text-main);margin:10px 0 6px;">
        🍩 本日各工種出工佔比分析 (圓餅圖)
      </div>
      ${workerDonutHtml}
    </div>

    <!-- 正式日報表主體 (手機一條式展示，列印時為標準 A4 格線格式) -->
    <div class="motion-card a4-print-sheet" style="padding:14px;">
      <div style="text-align:center;border-bottom:2.5px solid #0C4A6E;padding-bottom:6px;margin-bottom:10px;">
        <h2 style="font-size:18px;font-weight:900;color:#0C4A6E;">${proj.contractorCompany || '營造工程股份有限公司'}</h2>
        <h3 style="font-size:16px;font-weight:800;color:#0C4A6E;letter-spacing:1px;">營 建 工 程 施 工 日 報 表</h3>
      </div>

      <!-- 格線表格 1：基本工程資訊 -->
      <table class="rep-table-grid">
        <tr>
          <th style="width:16%;">工程名稱</th>
          <td colspan="3"><strong>${proj.name}</strong></td>
          <th style="width:16%;">施工日期</th>
          <td style="width:22%;">${formatDateWestern(rep.reportDateISO, 'slash_weekday')}</td>
        </tr>
        <tr>
          <th>契約工期</th>
          <td>${contractDays} 天</td>
          <th>已施工天數</th>
          <td>${usedDays} 天 (餘 ${remainDays} 天)</td>
          <th>天候狀況</th>
          <td>上午：${rep.weatherAM} / 下午：${rep.weatherPM}</td>
        </tr>
        <tr>
          <th>預定進度</th>
          <td>${plannedPct}%</td>
          <th>實際進度</th>
          <td>${actualPct}%</td>
          <th>進度差值</th>
          <td><strong style="color:${isAhead ? '#059669' : '#DC2626'};">${isAhead ? '超前 +' : '落後 '}${diffPct}%</strong></td>
        </tr>
      </table>

      <!-- 格線表格 2：施工進度內容 -->
      <table class="rep-table-grid" style="margin-top:6px;">
        <tr>
          <th style="width:16%;height:68px;">本日施作進度</th>
          <td colspan="5" style="vertical-align:top;line-height:1.5;">${rep.todayProgressSummary || '按既定工序順利施作。'}</td>
        </tr>
        <tr>
          <th style="width:16%;height:56px;">明日預定進度</th>
          <td colspan="5" style="vertical-align:top;line-height:1.5;">${rep.tomorrowPlanSummary || '明日按排程賡續施作。'}</td>
        </tr>
        <tr>
          <th style="width:16%;height:44px;">工區重要記事</th>
          <td colspan="5" style="vertical-align:top;line-height:1.4;">${rep.importantNotes || '本日無特殊異常或公安狀況。'}</td>
        </tr>
      </table>

      <!-- 格線表格 3：出工統計 -->
      <div style="font-size:12.5px;font-weight:900;color:#0C4A6E;margin:8px 0 4px;">一、工班出工統計 (本日合計：${totalWorkers} 人)</div>
      <table class="rep-table-grid">
        <tr>
          <th style="width:38%;">工種項目</th>
          <th style="width:16%;">單位</th>
          <th style="width:22%;">今日出工</th>
          <th style="width:24%;">累計出工</th>
        </tr>
        ${workers.map(w => `
          <tr>
            <td><strong>${w.name}</strong></td>
            <td style="text-align:center;">${w.unit}</td>
            <td style="text-align:center;font-weight:bold;color:#0C4A6E;">${getTodayQty(w)}</td>
            <td style="text-align:center;">${(w.priorCumulative || 0) + getTodayQty(w)}</td>
          </tr>
        `).join('')}
      </table>

      <!-- 格線表格 4：機具統計 -->
      <div style="font-size:12.5px;font-weight:900;color:#0C4A6E;margin:8px 0 4px;">二、機具設備統計 (本日合計：${totalMachines} 台/組)</div>
      <table class="rep-table-grid">
        <tr>
          <th style="width:38%;">機具型號設備</th>
          <th style="width:16%;">單位</th>
          <th style="width:22%;">今日使用</th>
          <th style="width:24%;">累計台日</th>
        </tr>
        ${machines.map(m => `
          <tr>
            <td><strong>${m.name}</strong></td>
            <td style="text-align:center;">${m.unit}</td>
            <td style="text-align:center;font-weight:bold;color:#0C4A6E;">${getTodayQty(m)}</td>
            <td style="text-align:center;">${(m.priorCumulative || 0) + getTodayQty(m)}</td>
          </tr>
        `).join('')}
      </table>

      <!-- 簽核欄位 -->
      <table class="rep-table-grid" style="margin-top:12px;">
        <tr style="height:44px;">
          <th style="width:25%;">工地主任</th>
          <th style="width:25%;">現場工程師</th>
          <th style="width:25%;">品管/安衛</th>
          <th style="width:25%;">填表人</th>
        </tr>
        <tr style="height:40px;">
          <td></td><td></td><td></td>
          <td style="text-align:center;font-size:9.5pt;font-weight:bold;">${state.account.name.split(' ')[0]}</td>
        </tr>
      </table>
    </div>
  `;
}

// =========================================================================
// 📊 專案總報表 (括號文字拿掉、提示文字改為「(左右滑動檢視)」單行不換行、分類簡化)
// =========================================================================
function renderPageStatsView() {
  const proj = getActiveProject();
  const allReports = [...(proj.reports || [])].sort((a, b) => a.reportDateISO.localeCompare(b.reportDateISO));
  
  // 依選擇的區間篩選日報
  const range = state.statsFilterRange || 'all';
  const now = new Date();
  
  const filteredReports = allReports.filter(rep => {
    if (range === 'all') return true;
    const repDate = new Date(rep.reportDateISO);
    if (range === 'last30') {
      const diffDays = (now - repDate) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 30;
    }
    if (range === 'month') {
      return repDate.getFullYear() === now.getFullYear() && repDate.getMonth() === now.getMonth();
    }
    if (range === 'quarter') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const repQuarter = Math.floor(repDate.getMonth() / 3);
      return repDate.getFullYear() === now.getFullYear() && repQuarter === currentQuarter;
    }
    if (range === 'week') {
      const dayOfWeek = (now.getDay() + 6) % 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - dayOfWeek);
      monday.setHours(0,0,0,0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23,59,59,999);
      return repDate >= monday && repDate <= sunday;
    }
    return true;
  });

  const reports = filteredReports.length > 0 ? filteredReports : allReports;

  const totalWorkers = reports.reduce((acc, rep) => {
    return acc + rep.tradeRecords.filter(r => r.category === 'workers').reduce((s, r) => s + getTodayQty(r), 0);
  }, 0);

  const totalMachines = reports.reduce((acc, rep) => {
    return acc + rep.tradeRecords.filter(r => r.category === 'machinery').reduce((s, r) => s + getTodayQty(r), 0);
  }, 0);

  const rangeLabelMap = {
    all: '全工期 (' + allReports.length + '日)',
    week: '本週報表',
    month: '本月報表',
    quarter: '本季報表',
    last30: '近 30 天'
  };

  const plannedPct = Number(proj.plannedProgress || 43.5);
  const actualPct = Number(proj.actualProgress || 41.3);
  const diffPct = Number((actualPct - plannedPct).toFixed(1));
  const isAhead = diffPct >= 0;
  const contractDays = Number(proj.contractDays) || 480;
  const usedDays = Number(proj.usedDays) || 198;
  const remainDays = Math.max(0, contractDays - usedDays);

  const chartMode = state.mountainChartMode || 'workers';
  const mountainChartSvg = buildDoubleAxisMountainSvg(reports, chartMode);

  return `
    <!-- 1. 垂直主次分明標題列 (移除頂部擠壓的雙按鈕) -->
    <div class="vertical-hierarchy-header">
      <div class="vh-primary-title">專案總報表與區間統計</div>
      <div class="vh-secondary-meta">
        <span class="vh-badge-tag">${proj.name}</span>
        <span>統計區間：<strong>${rangeLabelMap[range]}</strong></span>
      </div>
    </div>

    <!-- 頂部快速切換專案 -->
    <div class="motion-card" style="padding:10px;">
      <div style="font-size:12px;font-weight:800;color:var(--text-muted);margin-bottom:4px;">⚡ 快速選擇檢視專案：</div>
      <select class="native-input-box" style="height:42px;font-size:14.5px;font-weight:800;"
              onchange="window.appActions.switchStatsProject(this.value)">
        ${state.projects.map(p => `
          <option value="${p.id}" ${p.id === proj.id ? 'selected' : ''}>${p.name}</option>
        `).join('')}
      </select>
    </div>

    <!-- 區間篩選晶片 -->
    <div class="stats-filter-chips-row">
      <button class="stats-filter-chip ${range === 'all' ? 'active' : ''}" onclick="window.appActions.setStatsRange('all')">全工期 (${allReports.length}日)</button>
      <button class="stats-filter-chip ${range === 'week' ? 'active' : ''}" onclick="window.appActions.setStatsRange('week')">本週報表</button>
      <button class="stats-filter-chip ${range === 'month' ? 'active' : ''}" onclick="window.appActions.setStatsRange('month')">本月報表</button>
      <button class="stats-filter-chip ${range === 'quarter' ? 'active' : ''}" onclick="window.appActions.setStatsRange('quarter')">本季報表</button>
      <button class="stats-filter-chip ${range === 'last30' ? 'active' : ''}" onclick="window.appActions.setStatsRange('last30')">近 30 天</button>
    </div>

    <!-- 2. 採用 2×2 網格卡片：放大核心數值，次列顯示輔助標籤 -->
    <div class="kpi-matrix-2x2">
      <div class="kpi-matrix-card">
        <span class="kpi-matrix-label">總出工總結</span>
        <span class="kpi-matrix-val" style="color:var(--accent-cta);">${totalWorkers} <span style="font-size:13px;color:var(--text-muted);">人·日</span></span>
        <span class="kpi-matrix-sub">日均出工：${Math.round(totalWorkers / Math.max(1, reports.length))} 人</span>
      </div>
      <div class="kpi-matrix-card">
        <span class="kpi-matrix-label">進場機具總計</span>
        <span class="kpi-matrix-val" style="color:var(--primary-dark);">${totalMachines} <span style="font-size:13px;color:var(--text-muted);">台·班</span></span>
        <span class="kpi-matrix-sub">運轉稼動率：${reports.length > 0 ? '88%' : '0%'}</span>
      </div>
      <div class="kpi-matrix-card">
        <span class="kpi-matrix-label">統計區間天數</span>
        <span class="kpi-matrix-val" style="color:var(--primary);">${reports.length} <span style="font-size:13px;color:var(--text-muted);">日</span></span>
        <span class="kpi-matrix-sub">累積日報填報完整</span>
      </div>
      <div class="kpi-matrix-card">
        <span class="kpi-matrix-label">契約工期進度</span>
        <span class="kpi-matrix-val" style="color:var(--text-main);">${Math.round((usedDays/contractDays)*100)}%</span>
        <span class="kpi-matrix-sub">已用 ${usedDays}天 / 餘 ${remainDays}天</span>
      </div>
    </div>

    <!-- 落後警示全寬標註列 -->
    <div class="variance-fullwidth-alert ${isAhead ? 'variance-ahead-alert' : ''}">
      <div class="variance-alert-text ${isAhead ? 'variance-ahead-text' : ''}">
        <span>${isAhead ? '⚡ 施工進度超前穩定' : '⚠️ 進度落後警示分析'}</span>
        <span style="font-size:11px;font-weight:normal;">(預定 ${plannedPct}% ｜ 實際 ${actualPct}%)</span>
      </div>
      <span class="variance-alert-badge ${isAhead ? 'variance-ahead-badge' : ''}">
        ${isAhead ? '超前 +' + diffPct + '%' : '落後 ' + Math.abs(diffPct) + '%'}
      </span>
    </div>

    <!-- 3. 雙維度工務山積圖 (人力負荷 ＋ 施工重機具) -->
    <div class="motion-card">
      <div style="font-size:14.5px;font-weight:900;color:var(--text-main);margin-bottom:8px;">
        資源配置山積圖 (每日投入與累積曲線)
      </div>

      <!-- Segmented Control 切換 [出工人力] / [進場機具] / [綜合負載] -->
      <div class="chart-segmented-control">
        <button class="chart-seg-btn ${chartMode === 'workers' ? 'active' : ''}" onclick="window.appActions.setChartMode('workers')">
          👷 出工人力
        </button>
        <button class="chart-seg-btn ${chartMode === 'machinery' ? 'active' : ''}" onclick="window.appActions.setChartMode('machinery')">
          🚜 進場機具
        </button>
        <button class="chart-seg-btn ${chartMode === 'combined' ? 'active' : ''}" onclick="window.appActions.setChartMode('combined')">
          📈 綜合負載
        </button>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-size:11px;color:var(--text-muted);">
          點選柱體可滑出當日工種/機具細項
        </span>
        <span style="font-size:11px;color:var(--primary-dark);font-weight:800;">
          左右平滑滾動檢視 ${reports.length} 日區間 ➔
        </span>
      </div>

      <!-- 優化滑動容器：overflow-x: auto & scroll-snap-type -->
      <div class="mountain-chart-scroll-box-smooth">
        ${mountainChartSvg}
      </div>
    </div>

    <!-- 全量項目統計總表 -->
    <div class="motion-card">
      <div style="font-size:13.5px;font-weight:900;color:var(--text-main);margin-bottom:6px;">
        📋 區間已填寫項目全量統計總表
      </div>
      <div style="overflow-x:auto;">
        <table class="rep-table-grid" style="font-size:11px;margin-bottom:0;">
          <thead>
            <tr>
              <th style="width:58px;white-space:nowrap;">分類</th>
              <th style="white-space:nowrap;">項目名稱</th>
              <th style="white-space:nowrap;text-align:right;">區間總計</th>
              <th style="white-space:nowrap;text-align:right;">月均 30日</th>
              <th style="white-space:nowrap;text-align:right;">單日峰值</th>
              <th style="white-space:nowrap;text-align:center;">天數</th>
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

// 繪製雙軸山積圖 (支援出工人力、進場機具、雙柱綜合負載 + S-Curve 累計折線)
function buildDoubleAxisMountainSvg(reports, mode = 'workers') {
  if (!reports || reports.length === 0) {
    return '<div style="padding:18px;text-align:center;color:#64748B;">尚無日報數據</div>';
  }

  const n = reports.length;
  const colW = mode === 'combined' ? 56 : 46;
  const padL = 40;
  const padR = 40;
  const padT = 24;
  const padB = 46;
  const svgW = Math.max(380, padL + padR + n * colW);
  const svgH = 220;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  let cumWorkers = 0;
  let cumMachines = 0;

  const daysData = reports.map(r => {
    const workers = r.tradeRecords.filter(t => t.category === 'workers');
    const machines = r.tradeRecords.filter(t => t.category === 'machinery');

    // 人力堆疊細項
    const mainWorkers = workers.filter(w => !w.name.includes('點工') && !w.name.includes('特約')).reduce((sum, w) => sum + getTodayQty(w), 0);
    const subWorkers = workers.filter(w => w.name.includes('點工') || w.name.includes('特約')).reduce((sum, w) => sum + getTodayQty(w), 0);
    const totalW = mainWorkers + subWorkers;
    const totalM = machines.reduce((sum, m) => sum + getTodayQty(m), 0);

    cumWorkers += totalW;
    cumMachines += totalM;

    return {
      reportId: r.id,
      dateISO: r.reportDateISO,
      dateShort: r.reportDateISO.slice(5),
      mainWorkers,
      subWorkers,
      totalW,
      totalM,
      cumW: cumWorkers,
      cumM: cumMachines,
      records: r.tradeRecords
    };
  });

  const maxVal = mode === 'machinery'
    ? Math.max(8, ...daysData.map(d => d.totalM))
    : Math.max(12, ...daysData.map(d => d.totalW));

  const maxCum = mode === 'machinery' ? Math.max(15, cumMachines) : Math.max(25, cumWorkers);

  const barSvgParts = [];
  const linePoints = [];

  daysData.forEach((d, i) => {
    const cx = padL + i * colW + colW / 2;

    if (mode === 'workers') {
      // 堆疊長條柱：主體包商 (藍 #0EA5E9) + 點工協力 (橘 #D97706)
      const hMain = (d.mainWorkers / maxVal) * plotH;
      const hSub = (d.subWorkers / maxVal) * plotH;
      const yBase = padT + plotH;
      const yMain = yBase - hMain;
      const ySub = yMain - hSub;

      barSvgParts.push(`
        <g style="cursor:pointer;" onclick="window.appActions.openDayDetailSheet('${d.dateISO}')">
          <rect x="${cx - 12}" y="${yMain}" width="24" height="${hMain}" fill="#0EA5E9" rx="2" />
          ${hSub > 0 ? `<rect x="${cx - 12}" y="${ySub}" width="24" height="${hSub}" fill="#D97706" rx="2" />` : ''}
          <text x="${cx}" y="${ySub - 5}" font-size="9.5" font-weight="900" fill="#0C4A6E" text-anchor="middle">${d.totalW}</text>
          <text x="${cx}" y="${svgH - padB + 16}" font-size="9" fill="#0C4A6E" text-anchor="middle" font-weight="700">${d.dateShort}</text>
        </g>
      `);

      const yCum = (padT + plotH) - (d.cumW / maxCum) * plotH;
      linePoints.push(`${cx},${yCum}`);

    } else if (mode === 'machinery') {
      // 機具柱體 (翠綠 #059669)
      const barH = (d.totalM / maxVal) * plotH;
      const yTop = (padT + plotH) - barH;

      barSvgParts.push(`
        <g style="cursor:pointer;" onclick="window.appActions.openDayDetailSheet('${d.dateISO}')">
          <rect x="${cx - 12}" y="${yTop}" width="24" height="${barH}" fill="#059669" rx="2" />
          <text x="${cx}" y="${yTop - 5}" font-size="9.5" font-weight="900" fill="#065F46" text-anchor="middle">${d.totalM}台</text>
          <text x="${cx}" y="${svgH - padB + 16}" font-size="9" fill="#0C4A6E" text-anchor="middle" font-weight="700">${d.dateShort}</text>
        </g>
      `);

      const yCum = (padT + plotH) - (d.cumM / maxCum) * plotH;
      linePoints.push(`${cx},${yCum}`);

    } else {
      // 綜合負載：並排雙柱 (左藍工人 + 右綠機具)
      const hW = (d.totalW / maxVal) * plotH;
      const hM = (d.totalM / maxVal) * plotH;
      const yBase = padT + plotH;

      barSvgParts.push(`
        <g style="cursor:pointer;" onclick="window.appActions.openDayDetailSheet('${d.dateISO}')">
          <rect x="${cx - 14}" y="${yBase - hW}" width="12" height="${hW}" fill="#0EA5E9" rx="2" />
          <rect x="${cx}" y="${yBase - hM}" width="12" height="${hM}" fill="#059669" rx="2" />
          <text x="${cx - 8}" y="${yBase - hW - 4}" font-size="8.5" font-weight="800" fill="#0EA5E9" text-anchor="middle">${d.totalW}</text>
          <text x="${cx + 6}" y="${yBase - hM - 4}" font-size="8.5" font-weight="800" fill="#059669" text-anchor="middle">${d.totalM}</text>
          <text x="${cx}" y="${svgH - padB + 16}" font-size="9" fill="#0C4A6E" text-anchor="middle" font-weight="700">${d.dateShort}</text>
        </g>
      `);

      const yCum = (padT + plotH) - (d.cumW / maxCum) * plotH;
      linePoints.push(`${cx},${yCum}`);
    }
  });

  const linePointsStr = linePoints.join(' ');
  const yBase = padT + plotH;

  return `
    <div style="display:flex;justify-content:space-between;align-items:center;font-size:10px;margin-bottom:6px;padding:0 4px;">
      <div style="display:flex;gap:10px;">
        ${mode === 'workers' ? `
          <span><strong style="color:#0EA5E9;">■</strong> 主體出工</span>
          <span><strong style="color:#D97706;">■</strong> 點工協力</span>
        ` : mode === 'machinery' ? `
          <span><strong style="color:#059669;">■</strong> 進場機具(台)</span>
        ` : `
          <span><strong style="color:#0EA5E9;">■</strong> 人力</span>
          <span><strong style="color:#059669;">■</strong> 機具</span>
        `}
      </div>
      <div>
        <span><strong style="color:#EF4444;">●—</strong> 累計工數折線 (右軸 ${maxCum})</span>
      </div>
    </div>

    <svg width="${svgW}" height="${svgH}" style="display:block;min-width:${svgW}px;">
      <!-- 水平參考線 -->
      <line x1="${padL}" y1="${yBase}" x2="${svgW - padR}" y2="${yBase}" stroke="#CBD5E1" stroke-width="1.5" />
      <line x1="${padL}" y1="${yBase - plotH / 2}" x2="${svgW - padR}" y2="${yBase - plotH / 2}" stroke="#F1F5F9" stroke-width="1" stroke-dasharray="3 3" />
      <line x1="${padL}" y1="${padT}" x2="${svgW - padR}" y2="${padT}" stroke="#F1F5F9" stroke-width="1" stroke-dasharray="3 3" />

      <!-- 左軸刻度 (日用量) -->
      <text x="${padL - 6}" y="${padT + 4}" font-size="9" fill="#64748B" text-anchor="end">${maxVal}</text>
      <text x="${padL - 6}" y="${yBase - plotH / 2 + 3}" font-size="9" fill="#64748B" text-anchor="end">${Math.round(maxVal / 2)}</text>
      <text x="${padL - 6}" y="${yBase}" font-size="9" fill="#64748B" text-anchor="end">0</text>

      <!-- 右軸刻度 (累積 S-Curve) -->
      <text x="${svgW - padR + 6}" y="${padT + 4}" font-size="9" fill="#EF4444" font-weight="bold">${maxCum}</text>
      <text x="${svgW - padR + 6}" y="${yBase}" font-size="9" fill="#EF4444" font-weight="bold">0</text>

      <!-- 長條柱群 -->
      ${barSvgParts.join('')}

      <!-- 累計 S-Curve 實體折線 -->
      <polyline fill="none" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${linePointsStr}" />
      
      <!-- 節點圓點 -->
      ${linePoints.map(pt => {
        const [px, py] = pt.split(',');
        return `<circle cx="${px}" cy="${py}" r="3" fill="#EF4444" stroke="#FFFFFF" stroke-width="1.5" />`;
      }).join('')}
    </svg>
  `;
} {
  if (!reports || reports.length === 0) {
    return '<div style="padding:18px;text-align:center;color:#64748B;">尚無日報數據</div>';
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

  let cum = 0;
  const daysData = reports.map(r => {
    const workers = r.tradeRecords.filter(t => t.category === 'workers');
    const dayTotal = workers.reduce((sum, w) => sum + getTodayQty(w), 0);
    cum += dayTotal;
    return {
      date: r.reportDateISO.slice(5),
      total: dayTotal,
      cum: cum
    };
  });

  const maxDay = Math.max(10, ...daysData.map(d => d.total));
  const maxCum = Math.max(20, cum);

  const barSvgParts = [];
  const linePoints = [];

  daysData.forEach((d, i) => {
    const cx = padL + i * colW + colW / 2;
    const barH = (d.total / maxDay) * plotH;
    const yTop = padT + (plotH - barH);

    barSvgParts.push(`
      <rect x="${cx - 14}" y="${yTop}" width="28" height="${barH}" fill="#0EA5E9" rx="2" />
      <text x="${cx}" y="${yTop - 5}" font-size="10" font-weight="bold" fill="#0C4A6E" text-anchor="middle">${d.total}人</text>
      <text x="${cx}" y="${svgH - padB + 14}" font-size="9" fill="#0C4A6E" text-anchor="middle">${d.date}</text>
      <text x="${cx}" y="${svgH - padB + 26}" font-size="8" fill="#64748B" text-anchor="middle">累${d.cum}</text>
    `);

    const cy = padT + plotH - (d.cum / maxCum) * plotH;
    linePoints.push(`${cx},${cy}`);
    barSvgParts.push(`<circle cx="${cx}" cy="${cy}" r="3" fill="#D97706" stroke="#FFFFFF" stroke-width="1.5" />`);
  });

  return `
    <svg width="${svgW}" height="${svgH}" style="display:block;">
      <line x1="${padL}" y1="${padT + plotH}" x2="${svgW - padR}" y2="${padT + plotH}" stroke="#CBD5E1" stroke-width="1" />
      <line x1="${padL}" y1="${padT + plotH * 0.5}" x2="${svgW - padR}" y2="${padT + plotH * 0.5}" stroke="#E2E8F0" stroke-dasharray="3,3" />
      ${barSvgParts.join('')}
      <polyline points="${linePoints.join(' ')}" fill="none" stroke="#D97706" stroke-width="2.5" />
    </svg>
  `;
}

// 單日出工山積圖 (Step 7)
function buildSingleDayMountainSvg(records, mode = 'workers') {
  if (!records || records.length === 0) {
    return '<div style="padding:12px;text-align:center;color:#64748B;">尚無出工紀錄</div>';
  }
  const count = records.length;
  const colMinW = 54;
  const padL = 32;
  const padR = 36;
  const padT = 22;
  const padB = 42;
  const svgW = Math.max(360, padL + padR + count * colMinW);
  const svgH = 170;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const maxToday = Math.max(5, ...records.map(r => getTodayQty(r)));
  const maxCum = Math.max(10, ...records.map(r => Number(((r.priorCumulative || 0) + getTodayQty(r)).toFixed(1))));

  const colW = plotW / count;
  const barW = Math.min(26, Math.max(14, colW * 0.55));
  const barColor = mode === 'machinery' ? '#0284C7' : '#0EA5E9';

  let barsSvg = '';
  const cumPoints = [];
  const yBase = padT + plotH;

  records.forEach((item, idx) => {
    const cx = padL + colW * idx + colW / 2;
    const todaySum = getTodayQty(item);
    const cumSum = Number(((item.priorCumulative || 0) + todaySum).toFixed(1));

    const barH = (todaySum / maxToday) * plotH;
    const yTop = yBase - barH;
    const yCum = yBase - (cumSum / maxCum) * plotH;
    cumPoints.push(`${cx.toFixed(1)},${yCum.toFixed(1)}`);

    const shortName = item.name.length > 5 ? item.name.slice(0, 5) + '..' : item.name;

    barsSvg += `
      <rect x="${(cx - barW / 2).toFixed(1)}" y="${yTop.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(0, barH).toFixed(1)}" fill="${barColor}" rx="2" />
      <text x="${cx.toFixed(1)}" y="${(yTop - 4).toFixed(1)}" font-size="8.5" font-weight="800" fill="#0C4A6E" text-anchor="middle">${todaySum}</text>
      <text x="${cx.toFixed(1)}" y="${yBase + 15}" font-size="8.5" font-weight="700" fill="#0C4A6E" text-anchor="middle">${shortName}</text>
    `;
  });

  const dotsSvg = cumPoints.map((pt, i) => {
    const [px, py] = pt.split(',');
    return `<circle cx="${px}" cy="${py}" r="3" fill="#059669" stroke="#FFFFFF" stroke-width="1.2" />`;
  }).join('');

  return `
    <div style="display:flex;justify-content:space-between;font-size:9.5px;margin-bottom:4px;color:var(--text-muted);">
      <span><strong style="color:${barColor};">■</strong> 本日數量</span>
      <span><strong style="color:#059669;">●—</strong> 累積山積線</span>
    </div>
    <div style="overflow-x:auto;">
      <svg width="${svgW}" height="${svgH}" style="display:block;min-width:${svgW}px;">
        <line x1="${padL}" y1="${yBase}" x2="${svgW - padR}" y2="${yBase}" stroke="#CBD5E1" stroke-width="1" />
        <polyline fill="none" stroke="#059669" stroke-width="2" points="${cumPoints.join(' ')}" />
        ${barsSvg}
        ${dotsSvg}
      </svg>
    </div>
  `;
}

// 工種佔比圓餅/環形圖 (Donut Chart)
function buildDonutChartHtml(items) {
  const activeItems = items.filter(it => getTodayQty(it) > 0);
  if (activeItems.length === 0) {
    return '<div style="font-size:11px;color:var(--text-muted);padding:8px 0;">本日尚無出工數據</div>';
  }

  const palette = ['#0EA5E9', '#0284C7', '#059669', '#D97706', '#6366F1', '#EC4899', '#8B5CF6'];
  const grandTotal = activeItems.reduce((acc, it) => acc + getTodayQty(it), 0) || 1;

  let cumPct = 0;
  const r = 36;
  const circum = 2 * Math.PI * r;

  const segs = activeItems.map((it, idx) => {
    const pct = getTodayQty(it) / grandTotal;
    const dash = (pct * circum).toFixed(2) + ' ' + circum.toFixed(2);
    const offset = (-cumPct * circum).toFixed(2);
    cumPct += pct;
    return `<circle r="${r}" cx="46" cy="46" fill="transparent" stroke="${palette[idx % palette.length]}" stroke-width="15" stroke-dasharray="${dash}" stroke-dashoffset="${offset}" transform="rotate(-90 46 46)" />`;
  }).join('');

  const legend = activeItems.map((it, idx) => {
    const qty = getTodayQty(it);
    const pct = ((qty / grandTotal) * 100).toFixed(1);
    return `
      <div style="display:flex;justify-content:space-between;font-size:10.5px;padding:3px 0;border-bottom:1px dotted #E2E8F0;gap:6px;">
        <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${palette[idx % palette.length]};margin-right:4px;"></span><strong>${it.name}</strong></span>
        <strong style="color:var(--primary-dark);">${qty} ${it.unit} (${pct}%)</strong>
      </div>
    `;
  }).join('');

  return `
    <div style="display:grid;grid-template-columns:92px 1fr;gap:12px;align-items:center;background:#F8FAFC;padding:10px;border-radius:6px;border:1px solid #E2E8F0;">
      <svg width="92" height="92" viewBox="0 0 92 92">
        <circle r="${r}" cx="46" cy="46" fill="transparent" stroke="#E2E8F0" stroke-width="15" />
        ${segs}
      </svg>
      <div>${legend}</div>
    </div>
  `;
}

// 區間全量統計總表 (分類改為「工班」/「機具」)
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
            category: tr.category === 'machinery' ? '機具' : '工班',
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
      <tr>
        <td style="text-align:center;font-weight:700;white-space:nowrap;">${it.category}</td>
        <td style="white-space:nowrap;"><strong>${it.name}</strong></td>
        <td style="text-align:right;font-weight:bold;white-space:nowrap;">${it.total.toFixed(1)} ${it.unit}</td>
        <td style="text-align:right;white-space:nowrap;">${monthlyAvg} ${it.unit}</td>
        <td style="text-align:right;white-space:nowrap;">${it.maxQty} ${it.unit}</td>
        <td style="text-align:center;white-space:nowrap;">${it.activeDays} 天</td>
      </tr>
    `;
  }).join('');
}

// 🏠 模型
function renderPageBimModelView() {
  const proj = getActiveProject();
  return `
    <!-- 主次上下垂直排版：主標在第一行，專案名稱作為次級文字於下方 -->
    <div class="vertical-hierarchy-header">
      <div class="vh-primary-title">工地 BIM 輕量化 3D 模型檢視</div>
      <div class="vh-secondary-meta">
        <span class="vh-badge-tag">${proj.name}</span>
        <span>當前施工進度層：5F 樑板鋼筋綁紮中</span>
      </div>
    </div>

    <div class="motion-card" style="text-align:center;padding:16px;">
      <div style="width:100%;height:250px;background:linear-gradient(180deg,#E0F2FE 0%,#BAE6FD 100%);border:2px solid var(--border-color);border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;">
        <div style="font-size:52px;margin-bottom:8px;">🏢</div>
        <div style="font-size:16px;font-weight:900;color:var(--text-main);font-family:var(--font-heading);">
          ${proj.name} 3D 結構模型
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">
          輕量化 WebGL / IFC 圖資已就緒
        </div>
        <button class="phrase-chip-item" style="margin-top:12px;padding:6px 16px;font-size:12.5px;background:#0EA5E9;color:#fff;border-color:#0284C7;font-weight:900;" onclick="alert('BIM 輕量化模型加載完成！')">
          檢視輕量化模型 (點擊載入)
        </button>
      </div>
    </div>
  `;
}

// ⚙️ 設定 (加入累計數量開關)
function renderPageSettingsView() {
  const acc = state.account;
  return `
    <div class="section-title-box">
      <span class="section-title-text">系統設定與帳號訂閱</span>
    </div>

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

      <div style="background:#E0F2FE;border:1.5px solid var(--border-color);border-radius:6px;padding:10px;margin-bottom:12px;">
        <div style="font-size:13px;font-weight:800;color:var(--text-main);margin-bottom:6px;">方案費用說明：</div>
        <div style="font-size:12px;color:var(--text-sub);line-height:1.5;">
          • <strong>通用版 ($1,200/月)</strong>：標準工程日報、工期氣候計算、山積圖統計、A4 PDF 匯出。<br>
          • <strong>客製版 (依需求報價)</strong>：專屬施工報表欄位自訂、ERP 系統同步、多工地權限管理。
        </div>
      </div>

      <div style="display:flex;gap:8px;margin-bottom:8px;">
        <button class="btn-create-proj-locked" style="flex:1;background:#0EA5E9;height:44px;font-size:13.5px;margin-bottom:0;"
                onclick="window.appActions.navigateTab('checkout')">
          <span>💳</span> 線上刷卡升級訂閱
        </button>
        <button class="btn-create-proj-locked" style="flex:1;background:#059669;height:44px;font-size:13.5px;margin-bottom:0;"
                onclick="window.appActions.openLineSupport()">
          <span>💬</span> LINE 客服諮詢
        </button>
      </div>
      <button class="btn-create-proj-locked" style="display:none;background:#059669;height:44px;font-size:14px;"
              onclick="window.appActions.openLineSupport()">
        <span>💬</span> 聯繫專屬 LINE 線上客服
      </button>
    </div>

    <!-- 進階工程功能開關 -->
    <div class="motion-card">
      <div style="font-size:14px;font-weight:900;color:var(--text-main);margin-bottom:8px;">
        🛠️ 介面欄位顯示開關 (主動開啟)
      </div>

      <!-- 累計數量欄位顯示開關 -->
      <label style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F1F5F9;cursor:pointer;">
        <div>
          <strong style="font-size:13px;">顯示工種累計數量欄位</strong>
          <div style="font-size:11.5px;color:var(--text-muted);">在第 5 步工班/機具清單中顯示「累計 X人/X台」徽章</div>
        </div>
        <input type="checkbox" style="width:20px;height:20px;accent-color:var(--primary);"
               ${state.showCumulativeInTrades ? 'checked' : ''}
               onchange="window.appActions.toggleAdvancedFeature('showCumulativeInTrades', this.checked)" />
      </label>

      <label style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F1F5F9;cursor:pointer;">
        <div>
          <strong style="font-size:13px;">啟用營建材料統計模組</strong>
          <div style="font-size:11.5px;color:var(--text-muted);">在第 5 步增加材料進出庫與累計</div>
        </div>
        <input type="checkbox" style="width:20px;height:20px;accent-color:var(--primary);"
               ${state.enableMaterials ? 'checked' : ''}
               onchange="window.appActions.toggleAdvancedFeature('enableMaterials', this.checked)" />
      </label>

      <label style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;cursor:pointer;">
        <div>
          <strong style="font-size:13px;">啟用廠商代工與詳細備註</strong>
          <div style="font-size:11.5px;color:var(--text-muted);">在工種下方增加協力廠商與細項工作內容</div>
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
    state.currentStep = 2;
    renderApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  goToStep(stepNumber) {
    state.currentStep = stepNumber;
    renderApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  
  setStatsRange(rangeKey) {
    state.statsFilterRange = rangeKey;
    renderApp();
  },

  exportToPdf() {
    window.print();
  },

  exportToExcel() {
    const proj = getActiveProject();
    const reports = proj.reports || [];
    
    // 生成 CSV 格式內容 (可直接在 Excel 開啟並支援 UTF-8 BOM)
    let csv = '\uFEFF"工程名稱","' + proj.name.replace(/"/g, '""') + '"\n';
    csv += '"契約總工期","' + proj.contractDays + ' 天","已施工天數","' + proj.usedDays + ' 天"\n\n';
    csv += '"日報日期","上午天氣","下午天氣","本日進度摘要","預定進度(%)","實際進度(%)","出工人數","機具台數"\n';
    
    reports.forEach(r => {
      const workers = r.tradeRecords.filter(t => t.category === 'workers').reduce((sum, w) => sum + getTodayQty(w), 0);
      const machines = r.tradeRecords.filter(t => t.category === 'machinery').reduce((sum, m) => sum + getTodayQty(m), 0);
      csv += `"${r.reportDateISO}","${r.weatherAM}","${r.weatherPM}","${(r.todayProgressSummary||'').replace(/"/g, '""')}","${r.plannedProgressCumulative}%","${r.actualProgressCumulative}%","${workers}","${machines}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${proj.name}_工程總報表_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    state.toastMessage = '📊 成功匯出 Excel (CSV) 專案報表！';
    renderApp();
  },

  completePayment() {
    alert('🎉 恭喜！您已成功授權付款 NT$ 6,300！\n專業通用版年費方案已正式開通！');
    state.account.planType = 'annual_pro';
    state.account.renewDate = '2027/10/23';
    state.activeBottomTab = 'settings';
    renderApp();
  },

  
  openExportActionSheet() {
    state.showExportActionSheet = true;
    renderApp();
  },

  closeExportActionSheet() {
    state.showExportActionSheet = false;
    renderApp();
  },

  setChartMode(mode) {
    state.mountainChartMode = mode;
    renderApp();
  },

  openDayDetailSheet(dateISO) {
    state.selectedDayDetail = dateISO;
    renderApp();
  },

  closeDayDetailSheet() {
    state.selectedDayDetail = null;
    renderApp();
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
    state.activeTradeCategory = tabKey;
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

  // 快捷添加工種/機具
  quickAddTradeItem(tradeName) {
    const rep = getActiveReport();
    if (!rep) return;
    const isWorkers = state.activeTradeCategory === 'workers';
    let exist = rep.tradeRecords.find(r => r.name === tradeName);
    if (!exist) {
      exist = {
        id: (isWorkers ? 'w_' : 'm_') + Date.now(),
        category: state.activeTradeCategory,
        name: tradeName,
        unit: isWorkers ? '人' : (tradeName.includes('馬達') ? '組' : '台'),
        todayQty: 1,
        priorCumulative: 10,
        todayWorkNote: tradeName + '現場施作'
      };
      rep.tradeRecords.push(exist);
      saveState();
      state.toastMessage = '✅ 已加入【' + tradeName + '】！';
      renderApp();
    } else {
      exist.todayQty = (exist.todayQty || 0) + 1;
      saveState();
      state.toastMessage = '數量 +1';
      renderApp();
    }
  },

  // 自訂新增工種/機具
  addNewTradeItem() {
    const input = document.getElementById('input-new-trade-name');
    if (!input || !input.value.trim()) return;
    const name = input.value.trim();
    const isWorkers = state.activeTradeCategory === 'workers';
    if (isWorkers) {
      if (!state.customTradesList.includes(name)) state.customTradesList.push(name);
    } else {
      if (!state.customMachinesList.includes(name)) state.customMachinesList.push(name);
    }
    input.value = '';
    this.quickAddTradeItem(name);
  },

  removeCustomTradeItem(idx) {
    const isWorkers = state.activeTradeCategory === 'workers';
    if (isWorkers) {
      state.customTradesList.splice(idx, 1);
    } else {
      state.customMachinesList.splice(idx, 1);
    }
    saveState();
    renderApp();
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

  // 照片拍照與選取
  handlePhotoSelected(inputEl, sourceMode) {
    const rep = getActiveReport();
    if (!rep || !inputEl.files || inputEl.files.length === 0) return;

    if (!rep.photos) rep.photos = [];

    Array.from(inputEl.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const d = new Date();
        const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        rep.photos.push({
          id: 'ph_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          dataUrl: e.target.result,
          capturedAt: formatDateWestern(rep.reportDateISO, 'slash_weekday') + ' ' + timeStr,
          desc: sourceMode === 'camera' ? '現場即時拍攝' : '相簿匯入相片'
        });
        saveState();
        renderApp();
      };
      reader.readAsDataURL(file);
    });

    state.toastMessage = '📷 成功讀取 ' + inputEl.files.length + ' 張照片！';
    inputEl.value = '';
  },

  updatePhotoDesc(idx, val) {
    const rep = getActiveReport();
    if (rep && rep.photos && rep.photos[idx]) {
      rep.photos[idx].desc = val;
      saveState();
    }
  },

  removePhoto(idx) {
    const rep = getActiveReport();
    if (rep && rep.photos) {
      rep.photos.splice(idx, 1);
      saveState();
      renderApp();
    }
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
    const txt = `【${proj.name} 施工日報】\n📅 日期：${formatDateWestern(rep.reportDateISO, 'slash_weekday')}\n☀️ 天候：上午 ${rep.weatherAM} / 下午 ${rep.weatherPM}\n📌 本日施作：${rep.todayProgressSummary}\n📝 明日預定：${rep.tomorrowPlanSummary}`;
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
        plannedProgress: 1.0,
        actualProgress: 1.0,
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

function initApp() {
  loadState();
  renderApp();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
