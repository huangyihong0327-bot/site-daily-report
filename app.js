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
  deviceMode: localStorage.getItem('site_report_device_mode') || 'auto', // 'auto' | 'pc' | 'mobile'
  activeBottomTab: 'home', // 'home' | 'report' | 'stats' | 'model' | 'settings' | 'checkout'
  statsFilterRange: 'all',
  statsTradeFilter: 'all', // 'all' or trade name
  statsCustomStartDate: '',
  statsCustomEndDate: '', // 'all' | 'week' | 'month' | 'quarter' | 'last30'
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

  // 3D BIM 輕量化檢視器狀態
  bimActiveModel: 'u001', // 'u001' (中階單元帷幕牆) | 'rc_structure' (RC結構框架) | 'custom' (自訂上傳)
  bimWireframe: false,
  bimExploded: false,
  bimShowGrid: true,
  bimCustomModelName: '',

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

  // 清理暫態 UI 狀態，防止重新整理時殘留彈窗或無效的自訂模型參照
  state.toastMessage = '';
  state.showExportActionSheet = false;
  state.selectedDayDetail = null;
  state.bimSelectedPart = null;
  if (state.bimActiveModel === 'custom') {
    state.bimActiveModel = 'u001';
    state.bimCustomModelName = '';
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

let _toastTimer = null;
function showToast(message) {
  if (!message) return;
  state.toastMessage = '';
  let toastEl = document.getElementById('global-toast-banner');
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'global-toast-banner';
    toastEl.style.cssText = 'position:fixed;bottom:92px;left:50%;transform:translateX(-50%);background:#0C4A6E;color:#FFFFFF;padding:9px 18px;border-radius:20px;font-size:12.5px;font-weight:700;z-index:2147483647;box-shadow:0 6px 18px rgba(0,0,0,0.32);pointer-events:none;transition:opacity 0.25s ease, transform 0.25s ease;opacity:0;';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = message;
  toastEl.style.opacity = '1';
  toastEl.style.transform = 'translateX(-50%) translateY(0)';

  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    if (toastEl) {
      toastEl.style.opacity = '0';
      toastEl.style.transform = 'translateX(-50%) translateY(8px)';
    }
  }, 2400);
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
        <button class="action-sheet-item-btn" onclick="window.appActions.exportStatsToPdf();window.appActions.closeExportActionSheet();">
          <span style="font-size:20px;">📄</span>
          <div style="text-align:left;">
            <div>匯出專案總報表 (PDF 列印)</div>
            <div style="font-size:11px;color:var(--text-muted);font-weight:normal;">含區間山積圖、KPI 指標與項目全量總表</div>
          </div>
        </button>
        <button class="action-sheet-item-btn" onclick="window.appActions.exportStatsToExcel();window.appActions.closeExportActionSheet();">
          <span style="font-size:20px;">📊</span>
          <div style="text-align:left;">
            <div>匯出專案總報表 (EXCEL 試算表)</div>
            <div style="font-size:11px;color:var(--text-muted);font-weight:normal;">依目前篩選區間下載 UTF-8 CSV 完整數據報表</div>
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

  // 🖥️ PC 電腦端工作站與手機預覽模式狀態管理
  const isPcDevice = state.deviceMode === 'pc' || (state.deviceMode !== 'mobile' && typeof window !== 'undefined' && window.innerWidth >= 900);
  if (isPcDevice) {
    root.classList.add('is-pc-mode');
    root.classList.remove('is-mobile-preview');
  } else if (state.deviceMode === 'mobile') {
    root.classList.add('is-mobile-preview');
    root.classList.remove('is-pc-mode');
  } else {
    root.classList.remove('is-pc-mode');
    root.classList.remove('is-mobile-preview');
  }

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

  if (state.activeBottomTab === 'model') {
    setTimeout(() => {
      if (window.appActions && typeof window.appActions.initBim3DViewer === 'function') {
        window.appActions.initBim3DViewer();
      }
    }, 50);
  }
}

function renderHeaderNav() {
  const isHome = state.activeBottomTab === 'home';
  const proj = getActiveProject();
  const cur = state.activeBottomTab;
  const isPcMode = state.deviceMode === 'pc' || (state.deviceMode !== 'mobile' && typeof window !== 'undefined' && window.innerWidth >= 900);
  const toggleBtnText = isPcMode ? '🖥️ 電腦版' : '📱 手機版';

  return `
    <header class="minimal-header-nav no-print">
      <div class="minimal-brand-wrap" onclick="window.appActions.navigateTab('home')">
        <span style="font-size:22px;">🏗️</span>
        <div>
          <div class="minimal-brand-title">${isHome ? '營建工程管理系統' : '營建日報'}</div>
          <div class="pc-brand-subtitle">工務所電腦工作站</div>
        </div>
        ${!isHome ? `<span class="minimal-proj-pill" title="目前案場">${proj.name}</span>` : ''}
      </div>

      <!-- 電腦端專屬頂部導覽列 (PC Desktop Top Navigation) -->
      <nav class="pc-top-nav-tabs" aria-label="電腦版導航列">
        <button class="pc-nav-tab-item ${cur === 'home' ? 'active' : ''}" onclick="window.appActions.navigateTab('home')">
          <span>⚡</span> 專案首頁
        </button>
        <button class="pc-nav-tab-item ${cur === 'stats' ? 'active' : ''}" onclick="window.appActions.navigateTab('stats')">
          <span>📊</span> 專案總報表
        </button>
        <button class="pc-nav-tab-item ${cur === 'model' ? 'active' : ''}" onclick="window.appActions.navigateTab('model')">
          <span>🏠</span> 3D模型
        </button>
        <button class="pc-nav-tab-item ${cur === 'settings' ? 'active' : ''}" onclick="window.appActions.navigateTab('settings')">
          <span>⚙️</span> 系統設定
        </button>
      </nav>

      <div class="minimal-header-actions">
        <!-- 電腦/手機版型智慧切換器 -->
        <button class="device-toggle-btn" onclick="window.appActions.toggleDeviceMode()" title="點擊於「電腦寬版」與「手機模擬」介面切換">
          ${toggleBtnText}
        </button>

        ${!isHome ? `
          <button class="header-action-btn-pc" onclick="window.appActions.quickPrintA4()" title="快速輸出正式 A4 報表">
            🖨️ 列印 A4
          </button>
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
    <div class="pc-home-top-row">
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

      <div class="pc-home-actions-card">
        <button class="btn-create-proj-locked" style="margin-bottom:8px;" onclick="window.appActions.openCreateProjectModal()">
          <span>＋</span> 建立新工程專案 (空白日報)
        </button>

        <div class="backup-btn-row-locked" style="margin-bottom:0;">
          <button class="btn-backup-item" onclick="window.appActions.exportBackup()">
            <span>💾</span> 匯出專案備份檔
          </button>
          <button class="btn-backup-item" onclick="window.appActions.importBackup()">
            <span>📥</span> 匯入專案備份檔
          </button>
        </div>
      </div>
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
      <div style="width:100%;">
        <input type="date" class="native-input-box" value="${rep.reportDateISO}"
               onchange="window.appActions.setReportDate(this.value)" style="width:100%;height:44px;font-size:15px;font-weight:800;" />
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
  // 圖表 2：工種出工佔比圓餅圖 (上下垂直排版)
  const workerDonutHtml = buildDonutChartHtml(workers);
  // 圖表 3：機具使用直方圖
  const machSvg = buildSingleDayMountainSvg(machines, 'machinery');

  return `
    <div class="tabstrip-steps-row no-print">
      <button class="tabstrip-pill" onclick="window.appActions.navigateTab('home')">1.專案管理</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(2)">2.工期氣候</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(3)">3.今日進度</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(4)">4.明日進度</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(5)">5.出工機具</button>
      <button class="tabstrip-pill" onclick="window.appActions.goToStep(6)">6.現場照片</button>
      <button class="tabstrip-pill active">7.日報預覽</button>
    </div>

    <!-- 頂部操作按鈕 (文案精簡，grid 1fr 1fr 防裁切) -->
    <div class="action-buttons-grid-2col no-print">
      <button class="btn-create-proj-locked" onclick="window.print()">
        <span>🖨️</span> 輸出 PDF
      </button>
      <button class="btn-backup-item" onclick="window.appActions.openLineShareModal()">
        <span>💬</span> 複製 LINE 文字
      </button>
    </div>

    <!-- 進度差異比較功能 -->
    <div class="motion-card no-print" style="padding:12px;">
      <div style="font-size:13.5px;font-weight:900;color:var(--text-main);margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
        <span>📈 工期與累計進度差異比較分析</span>
        <span class="${isAhead ? 'variance-badge-ahead' : 'variance-badge-behind'}">
          ${isAhead ? '超前 +' + diffPct + '%' : '落後 ' + Math.abs(diffPct) + '%'}
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

      <div style="font-size:13px;font-weight:900;color:var(--text-main);margin:12px 0 6px;">
        🍩 本日各工種出工佔比分析 (圓餅圖)
      </div>
      ${workerDonutHtml}
    </div>

    <!-- 正式日報表主體 (手機垂直排版 ＋ 支援左右滑動與標準 A4 列印) -->
    <div class="pc-a4-preview-wrapper"><div class="motion-card a4-print-sheet" style="padding:18px;margin-bottom:0;">
      <div style="text-align:center;border-bottom:2.5px solid #0C4A6E;padding-bottom:6px;margin-bottom:10px;">
        <h2 style="font-size:17px;font-weight:900;color:#0C4A6E;">${proj.contractorCompany || '營造工程股份有限公司'}</h2>
        <h3 style="font-size:15px;font-weight:800;color:#0C4A6E;letter-spacing:1px;margin-top:2px;">營 建 工 程 施 工 日 報 表</h3>
      </div>

      <!-- 格線表格 1：手機友善垂直表格 (解決右側被切掉問題) -->
      <div class="report-table-scroll-container">
        <table class="rep-table-grid mobile-info-vertical-table">
          <tr>
            <th>工程名稱</th>
            <td colspan="3"><strong>${proj.name}</strong></td>
          </tr>
          <tr>
            <th>施工日期</th>
            <td>${formatDateWestern(rep.reportDateISO, 'slash_weekday')}</td>
            <th>天候狀況</th>
            <td>上午：${rep.weatherAM} / 下午：${rep.weatherPM}</td>
          </tr>
          <tr>
            <th>契約工期</th>
            <td>${contractDays} 天</td>
            <th>已施工天數</th>
            <td>${usedDays} 天 (餘 ${remainDays} 天)</td>
          </tr>
          <tr>
            <th>預定進度</th>
            <td>${plannedPct}%</td>
            <th>實際進度</th>
            <td>${actualPct}% (差值 <strong style="color:${isAhead ? '#059669' : '#DC2626'};">${isAhead ? '+' : ''}${diffPct}%</strong>)</td>
          </tr>
        </table>
      </div>

      <!-- 格線表格 2：施工進度內容 -->
      <table class="rep-table-grid" style="margin-top:6px;">
        <tr>
          <th style="width:24%;height:64px;">本日施作進度</th>
          <td style="vertical-align:top;line-height:1.5;">${rep.todayProgressSummary || '按既定工序順利施作。'}</td>
        </tr>
        <tr>
          <th style="width:24%;height:56px;">明日預定進度</th>
          <td style="vertical-align:top;line-height:1.5;">${rep.tomorrowPlanSummary || '明日按排程賡續施作。'}</td>
        </tr>
        <tr>
          <th style="width:24%;height:44px;">工區重要記事</th>
          <td style="vertical-align:top;line-height:1.4;">${rep.importantNotes || '本日無特殊異常或公安狀況。'}</td>
        </tr>
      </table>

      <!-- 格線表格 3：出工統計 -->
      <div style="font-size:12.5px;font-weight:900;color:#0C4A6E;margin:10px 0 4px;">一、工班出工統計 (本日合計：${totalWorkers} 人)</div>
      <div class="report-table-scroll-container">
        <table class="rep-table-grid" style="min-width:320px;">
          <thead>
            <tr>
              <th style="width:40%;">工種項目</th>
              <th style="width:16%;text-align:center;">單位</th>
              <th style="width:22%;text-align:center;">今日出工</th>
              <th style="width:22%;text-align:center;">累計出工</th>
            </tr>
          </thead>
          <tbody>
            ${workers.map(w => `
              <tr>
                <td><strong>${w.name}</strong></td>
                <td style="text-align:center;">${w.unit}</td>
                <td style="text-align:center;font-weight:bold;color:#0C4A6E;">${getTodayQty(w)}</td>
                <td style="text-align:center;">${(w.priorCumulative || 0) + getTodayQty(w)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- 格線表格 4：機具統計 -->
      <div style="font-size:12.5px;font-weight:900;color:#0C4A6E;margin:10px 0 4px;">二、機具設備統計 (本日合計：${totalMachines} 台/組)</div>
      <div class="report-table-scroll-container">
        <table class="rep-table-grid" style="min-width:320px;">
          <thead>
            <tr>
              <th style="width:40%;">機具型號設備</th>
              <th style="width:16%;text-align:center;">單位</th>
              <th style="width:22%;text-align:center;">今日使用</th>
              <th style="width:22%;text-align:center;">累計台日</th>
            </tr>
          </thead>
          <tbody>
            ${machines.map(m => `
              <tr>
                <td><strong>${m.name}</strong></td>
                <td style="text-align:center;">${m.unit}</td>
                <td style="text-align:center;font-weight:bold;color:#0C4A6E;">${getTodayQty(m)}</td>
                <td style="text-align:center;">${(m.priorCumulative || 0) + getTodayQty(m)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- 簽核欄位 -->
      <table class="rep-table-grid" style="margin-top:12px;">
        <tr style="height:40px;">
          <th style="width:25%;">工地主任</th>
          <th style="width:25%;">現場工程師</th>
          <th style="width:25%;">品管/安衛</th>
          <th style="width:25%;">填表人</th>
        </tr>
        <tr style="height:36px;">
          <td></td><td></td><td></td>
          <td style="text-align:center;font-size:9.5pt;font-weight:bold;">${state.account.name.split(' ')[0]}</td>
        </tr>
      </table>
    </div>

    <!-- 5. 報表最底部新增「完成填報並複製貼上 LINE」行動總結按鈕區 (Point 6) -->
    <div class="report-bottom-submit-section no-print">
      <button class="btn-complete-and-line" onclick="window.appActions.completeReportAndShareLine()">
        <span>✅</span> 完成填報，複製文字並轉貼 LINE
      </button>
      <div class="btn-bottom-sub-row">
        <button class="btn-bottom-sub-item" onclick="window.print()">
          <span>🖨️</span> 輸出 PDF
        </button>
        <button class="btn-bottom-sub-item" onclick="window.appActions.openLineShareModal()">
          <span>📋</span> 僅複製文字
        </button>
      </div>
    </div>
  `;
}

// =========================================================================
// 📊 專案總體分析與資源配置總報表 (統整山積圖、S曲線折線圖、圓餅圖與公文輸出)
// =========================================================================
function renderPageStatsView() {
  const proj = getActiveProject();
  const allReports = [...(proj.reports || [])].sort((a, b) => a.reportDateISO.localeCompare(b.reportDateISO));
  
  // 1. 時間維度篩選 (支援自訂起訖時間)
  const range = state.statsFilterRange || 'all';
  const now = new Date();

  const defaultStart = allReports.length > 0 ? allReports[0].reportDateISO : '2026-10-01';
  const defaultEnd = allReports.length > 0 ? allReports[allReports.length - 1].reportDateISO : '2026-10-25';
  const customStart = state.statsCustomStartDate || defaultStart;
  const customEnd = state.statsCustomEndDate || defaultEnd;

  const filteredReports = allReports.filter(rep => {
    if (range === 'all') return true;
    if (range === 'custom') {
      return rep.reportDateISO >= customStart && rep.reportDateISO <= customEnd;
    }
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

  // 2. 收集該專案所有出現過的工種清單供分項系自由篩選
  const availableTradesSet = new Set();
  allReports.forEach(r => {
    r.tradeRecords.forEach(t => {
      if (t.name) availableTradesSet.add(t.name);
    });
  });
  const availableTrades = Array.from(availableTradesSet);

  // 3. 工種分項篩選
  const tradeFilter = state.statsTradeFilter || 'all';

  // 4. 計算核心匯總數據
  let totalWorkers = 0;
  let totalMachines = 0;
  let peakWorkers = 0;
  let peakWorkerDay = '無紀錄';
  let sunnyDays = 0;
  let rainyDays = 0;

  const tradeAccumMap = {};
  const machineAccumMap = {};

  reports.forEach(r => {
    let dayWorkers = r.tradeRecords.filter(t => t.category === 'workers');
    let dayMachines = r.tradeRecords.filter(t => t.category === 'machinery');

    // 計算各工種全體總計
    dayWorkers.forEach(w => {
      const qty = getTodayQty(w);
      if (!tradeAccumMap[w.name]) {
        tradeAccumMap[w.name] = { name: w.name, unit: w.unit, total: 0, peak: 0 };
      }
      tradeAccumMap[w.name].total += qty;
      tradeAccumMap[w.name].peak = Math.max(tradeAccumMap[w.name].peak, qty);
    });

    dayMachines.forEach(m => {
      const qty = getTodayQty(m);
      if (!machineAccumMap[m.name]) {
        machineAccumMap[m.name] = { name: m.name, unit: m.unit, total: 0, peak: 0 };
      }
      machineAccumMap[m.name].total += qty;
      machineAccumMap[m.name].peak = Math.max(machineAccumMap[m.name].peak, qty);
    });

    // 如果有分項篩選
    if (tradeFilter !== 'all') {
      dayWorkers = dayWorkers.filter(w => w.name === tradeFilter);
      dayMachines = dayMachines.filter(m => m.name === tradeFilter);
    }

    const dayTotalW = dayWorkers.reduce((sum, w) => sum + getTodayQty(w), 0);
    const dayTotalM = dayMachines.reduce((sum, m) => sum + getTodayQty(m), 0);

    totalWorkers += dayTotalW;
    totalMachines += dayTotalM;

    if (dayTotalW > peakWorkers) {
      peakWorkers = dayTotalW;
      peakWorkerDay = r.reportDateISO;
    }

    if (r.weatherAM === '晴' || r.weatherPM === '晴') sunnyDays++;
    if (r.weatherAM === '雨' || r.weatherPM === '雨') rainyDays++;
  });

  const sortedTrades = Object.values(tradeAccumMap).sort((a, b) => b.total - a.total);
  const sortedMachines = Object.values(machineAccumMap).sort((a, b) => b.total - a.total);

  const avgDailyWorkers = reports.length > 0 ? (totalWorkers / reports.length).toFixed(1) : '0';
  const activeStart = reports.length > 0 ? reports[0].reportDateISO : customStart;
  const activeEnd = reports.length > 0 ? reports[reports.length - 1].reportDateISO : customEnd;

  const rangeLabelMap = {
    all: '全工期 (' + allReports.length + '日)',
    week: '本週報表',
    month: '本月報表',
    quarter: '本季報表',
    last30: '近 30 天',
    custom: '自訂時間區間 (' + activeStart + ' ～ ' + activeEnd + ')'
  };

  const plannedPct = Number(proj.plannedProgress || 43.5);
  const actualPct = Number(proj.actualProgress || 41.3);
  const diffPct = Number((actualPct - plannedPct).toFixed(1));
  const isAhead = diffPct >= 0;
  const contractDays = Number(proj.contractDays) || 480;
  const usedDays = Number(proj.usedDays) || 198;
  const remainDays = Math.max(0, contractDays - usedDays);

  const chartMode = state.mountainChartMode || 'workers';

  // 5. 繪製三大核心圖表 (螢幕版與正式列印版)
  // 圖表 1：雙軸資源山積圖 (長條柱 + 累積折線)
  const mountainChartSvgScreen = buildDoubleAxisMountainSvg(reports, chartMode, tradeFilter, false);
  const mountainChartSvgPrint = buildDoubleAxisMountainSvg(reports, chartMode, tradeFilter, true);

  // 圖表 2：工程契約進度累計 S 曲線折線圖
  const sCurveSvgScreen = buildProjectScheduleSCurveSvg(proj, reports, false);
  const sCurveSvgPrint = buildProjectScheduleSCurveSvg(proj, reports, true);

  // 圖表 3：各工種出工結構佔比圓餅/環形圖
  const donutChartSvgScreen = buildProjectExecutiveDonutSvg(sortedTrades, sortedTrades.reduce((s, t) => s + t.total, 0), false);
  const donutChartSvgPrint = buildProjectExecutiveDonutSvg(sortedTrades, sortedTrades.reduce((s, t) => s + t.total, 0), true);

  return `
    <!-- 1. 螢幕端主次分明標題列 (no-print) -->
    <div class="vertical-hierarchy-header no-print">
      <div class="vh-primary-title">專案工務數據總覽儀表板</div>
      <div class="vh-secondary-meta">
        <span class="vh-badge-tag" style="white-space:nowrap;flex-shrink:0;">${proj.name}</span>
        <span>呈現區間：<strong style="color:var(--primary-dark);">${rangeLabelMap[range]}</strong></span>
        ${tradeFilter !== 'all' ? `<span class="vh-badge-tag" style="background:#0284C7;color:#fff;">分項：${tradeFilter}</span>` : ''}
      </div>
    </div>

    <!-- 專案總報表專屬匯出按鈕列 (no-print) -->
    <div class="stats-export-action-bar no-print">
      <button class="stats-export-btn-pdf" onclick="window.appActions.exportStatsToPdf()">
        <span>📄</span> 輸出正式總報表 (含完整圖表A4公文)
      </button>
      <button class="stats-export-btn-excel" onclick="window.appActions.exportStatsToExcel()">
        <span>📊</span> 匯出完整總報表 (EXCEL)
      </button>
    </div>

    <!-- 頂部快速切換專案 (no-print) -->
    <div class="motion-card no-print" style="padding:10px;">
      <div style="font-size:12px;font-weight:800;color:var(--text-muted);margin-bottom:4px;">⚡ 快速選擇檢視專案：</div>
      <select class="native-input-box" style="height:42px;font-size:14.5px;font-weight:800;"
              onchange="window.appActions.switchStatsProject(this.value)">
        ${state.projects.map(p => `
          <option value="${p.id}" ${p.id === proj.id ? 'selected' : ''}>${p.name}</option>
        `).join('')}
      </select>
    </div>

    <!-- 時間維度篩選晶片列 (支援自訂起訖日期) (no-print) -->
    <div class="stats-filter-chips-row no-print">
      <button class="stats-filter-chip ${range === 'all' ? 'active' : ''}" onclick="window.appActions.setStatsRange('all')">全工期 (${allReports.length}日)</button>
      <button class="stats-filter-chip ${range === 'week' ? 'active' : ''}" onclick="window.appActions.setStatsRange('week')">本週報表</button>
      <button class="stats-filter-chip ${range === 'month' ? 'active' : ''}" onclick="window.appActions.setStatsRange('month')">本月報表</button>
      <button class="stats-filter-chip ${range === 'quarter' ? 'active' : ''}" onclick="window.appActions.setStatsRange('quarter')">本季報表</button>
      <button class="stats-filter-chip ${range === 'last30' ? 'active' : ''}" onclick="window.appActions.setStatsRange('last30')">近 30 天</button>
      <button class="stats-filter-chip ${range === 'custom' ? 'active' : ''}" style="border-color:#0EA5E9;color:#0284C7;font-weight:800;" onclick="window.appActions.setStatsRange('custom')">
        <span>📅</span> 自訂區間
      </button>
    </div>

    <!-- 自訂起訖日期選擇區塊 (no-print) -->
    ${range === 'custom' ? `
      <div class="custom-date-filter-box no-print">
        <div class="custom-date-label">📅 自訂統計起訖日期：</div>
        <div class="custom-date-inputs">
          <input type="date" id="stats-start-date" value="${customStart}" />
          <span style="font-weight:800;color:var(--text-muted);">至</span>
          <input type="date" id="stats-end-date" value="${customEnd}" />
          <button class="btn-nowrap-action" style="height:38px;padding:0 12px;font-size:12.5px;" onclick="window.appActions.applyCustomDateRange()">
            🔍 套用查詢
          </button>
        </div>
      </div>
    ` : ''}

    <!-- 分項工種自由篩選列 (Drilldown Sub-Trade Filter) (no-print) -->
    <div class="subtrade-filter-container no-print">
      <div class="subtrade-filter-title">
        <span>🏷️ 分項工種自由篩選 (點選可單獨分析該分項)：</span>
      </div>
      <div class="subtrade-chips-scroll">
        <button class="subtrade-chip-btn ${tradeFilter === 'all' ? 'active' : ''}" onclick="window.appActions.setStatsTradeFilter('all')">
          全部工種 (綜合總覽)
        </button>
        ${availableTrades.map(name => `
          <button class="subtrade-chip-btn ${tradeFilter === name ? 'active' : ''}" onclick="window.appActions.setStatsTradeFilter('${name}')">
            ${name}
          </button>
        `).join('')}
      </div>
    </div>

    <!-- 2. 4 大核心營建工程指針 KPI 矩陣 (no-print) -->
    <div class="kpi-matrix-2x2 no-print">
      <div class="kpi-matrix-card">
        <span class="kpi-matrix-label">👷 ${tradeFilter === 'all' ? '全案總出工數' : '【' + tradeFilter + '】累計出工'}</span>
        <span class="kpi-matrix-val" style="color:var(--accent-cta);">${totalWorkers} <span style="font-size:13px;color:var(--text-muted);">人·日</span></span>
        <span class="kpi-matrix-sub">日均出工：${avgDailyWorkers} 人 ｜ 峰值：${peakWorkers} 人</span>
      </div>
      <div class="kpi-matrix-card">
        <span class="kpi-matrix-label">🚜 重機具動員總計</span>
        <span class="kpi-matrix-val" style="color:var(--primary-dark);">${totalMachines} <span style="font-size:13px;color:var(--text-muted);">台·班</span></span>
        <span class="kpi-matrix-sub">進場機具款式：${sortedMachines.length} 款 ｜ 稼動率：92%</span>
      </div>
      <div class="kpi-matrix-card">
        <span class="kpi-matrix-label">📈 合約進度履約指標</span>
        <span class="kpi-matrix-val" style="color:${isAhead ? '#059669' : '#DC2626'};">${actualPct}% <span style="font-size:12px;">(預定 ${plannedPct}%)</span></span>
        <span class="kpi-matrix-sub">差值：<strong style="color:${isAhead ? '#059669' : '#DC2626'};">${isAhead ? '+' : ''}${diffPct}% (${isAhead ? '超前' : '落後'})</strong></span>
      </div>
      <div class="kpi-matrix-card">
        <span class="kpi-matrix-label">⏱️ 統計工期天候</span>
        <span class="kpi-matrix-val" style="color:var(--text-main);">${reports.length} <span style="font-size:13px;color:var(--text-muted);">日曆天</span></span>
        <span class="kpi-matrix-sub">晴天 ${sunnyDays}日 ｜ 雨天 ${rainyDays}日 ｜ 餘 ${remainDays}天</span>
      </div>
    </div>

    <!-- 3. 圖表群：雙軸山積圖 (長條柱 + 累積折線) (no-print) -->
    <div class="motion-card no-print">
      <div style="font-size:14.5px;font-weight:900;color:var(--text-main);margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
        <span>📊 雙維度資源配置山積圖 (每日出工長條柱 ＋ 累計成長折線)</span>
        ${tradeFilter !== 'all' ? `<span style="font-size:12px;color:#0284C7;font-weight:bold;">已鎖定：${tradeFilter}</span>` : ''}
      </div>

      <div class="chart-segmented-control">
        <button class="chart-seg-btn ${chartMode === 'workers' ? 'active' : ''}" onclick="window.appActions.setChartMode('workers')">
          👷 出工人力
        </button>
        <button class="chart-seg-btn ${chartMode === 'machinery' ? 'active' : ''}" onclick="window.appActions.setChartMode('machinery')">
          🚜 進場機具
        </button>
        <button class="chart-seg-btn ${chartMode === 'combined' ? 'active' : ''}" onclick="window.appActions.setChartMode('combined')">
          📈 綜合負載雙柱
        </button>
      </div>

      <div class="mountain-chart-scroll-box-smooth">
        ${mountainChartSvgScreen}
      </div>
    </div>

    <!-- 4. 圖表群雙欄並排：S 曲線折線圖 ＋ 工種圓餅圖 (no-print) -->
    <div class="charts-2col-grid no-print">
      <!-- 4A. 工程進度累積 S 曲線折線圖 -->
      <div class="motion-card" style="margin-bottom:14px;">
        <div style="font-size:14px;font-weight:900;color:var(--text-main);margin-bottom:8px;">
          📈 工程累計進度 S 曲線折線圖 (預定 vs 實際)
        </div>
        <div>
          ${sCurveSvgScreen}
        </div>
      </div>

      <!-- 4B. 各工種出工佔比圓餅圖 -->
      <div class="motion-card" style="margin-bottom:14px;">
        <div style="font-size:14px;font-weight:900;color:var(--text-main);margin-bottom:8px;">
          🍩 各工種出工投入結構圓餅圖
        </div>
        <div>
          ${donutChartSvgScreen}
        </div>
      </div>
    </div>

    <!-- 5. 區間逐日工程進度與施工日誌一覽表 (no-print) -->
    <div class="motion-card no-print">
      <div style="font-size:13.5px;font-weight:900;color:var(--text-main);margin-bottom:8px;">
        📋 區間逐日施工日誌與項目統計表 (共 ${reports.length} 篇日報)
      </div>
      <div style="overflow-x:auto;">
        <table class="rep-table-grid" style="font-size:11px;margin-bottom:0;">
          <thead>
            <tr>
              <th style="width:75px;white-space:nowrap;">日期</th>
              <th style="width:50px;white-space:nowrap;text-align:center;">天候</th>
              <th style="width:55px;white-space:nowrap;text-align:right;">出工數</th>
              <th style="width:55px;white-space:nowrap;text-align:right;">機具數</th>
              <th style="white-space:nowrap;">本日施工進度摘要</th>
              <th style="width:55px;white-space:nowrap;text-align:center;">操作</th>
            </tr>
          </thead>
          <tbody>
            ${reports.map(r => {
              const dayW = r.tradeRecords.filter(t => t.category === 'workers').reduce((sum, w) => sum + getTodayQty(w), 0);
              const dayM = r.tradeRecords.filter(t => t.category === 'machinery').reduce((sum, m) => sum + getTodayQty(m), 0);
              return `
                <tr>
                  <td style="font-weight:700;">${r.reportDateISO}</td>
                  <td style="text-align:center;">${r.weatherAM}/${r.weatherPM}</td>
                  <td style="text-align:right;font-weight:800;color:var(--primary-dark);">${dayW}</td>
                  <td style="text-align:right;font-weight:800;color:#059669;">${dayM}</td>
                  <td style="max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.todayProgressSummary || '正常施工'}</td>
                  <td style="text-align:center;">
                    <button class="phrase-chip-item" style="padding:2px 6px;font-size:10.5px;" onclick="window.appActions.openDayDetailSheet('${r.reportDateISO}')">明細 ❯</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- 📄 正式公文總報表 (僅列印或匯出 PDF 時呈現，完整內嵌各大向量專業圖表！)   -->
    <!-- ========================================================================= -->
    <div class="stats-official-a4-doc">
      <!-- 表頭 -->
      <div style="text-align:center;border-bottom:2.5px solid #000000;padding-bottom:8px;margin-bottom:12px;">
        <div style="font-size:14pt;font-weight:900;letter-spacing:1px;">${proj.contractorCompany || '營造工程股份有限公司'}</div>
        <div style="font-size:16pt;font-weight:900;letter-spacing:2px;margin:4px 0;">營 建 工 程 工 務 總 體 分 析 與 資 源 配 置 總 報 表</div>
        <div style="font-size:9pt;color:#333;letter-spacing:1px;">EXECUTIVE CONSTRUCTION PROJECT MANAGEMENT & RESOURCE ANALYTICS REPORT</div>
      </div>

      <!-- 工程基本資料表 -->
      <table class="official-rep-table">
        <tr>
          <th style="width:16%;">工程名稱</th>
          <td style="width:34%;font-weight:bold;">${proj.name}</td>
          <th style="width:16%;">統計期間</th>
          <td style="width:34%;font-weight:bold;">自 ${activeStart} 至 ${activeEnd} 止 (共 ${reports.length} 天)</td>
        </tr>
        <tr>
          <th>承攬廠商</th>
          <td>${proj.contractorCompany || '營造工程股份有限公司'}</td>
          <th>監造單位</th>
          <td>建築師事務所 / 工程顧問股份有限公司</td>
        </tr>
        <tr>
          <th>合約工期</th>
          <td>核定 ${contractDays} 天 ｜ 已施工 ${usedDays} 天 ｜ 尚餘 ${remainDays} 天</td>
          <th>工程進度</th>
          <td>預定 ${plannedPct}% ｜ 實際 ${actualPct}% ｜ 差值 <strong style="color:${isAhead ? '#059669' : '#DC2626'};">${isAhead ? '+' : ''}${diffPct}% (${isAhead ? '超前' : '落後'})</strong></td>
        </tr>
        <tr>
          <th>總出工人次</th>
          <td><strong>${totalWorkers} 人·日</strong> (平均每日 ${avgDailyWorkers} 人)</td>
          <th>機具動員總數</th>
          <td><strong>${totalMachines} 台·班</strong> (運轉良好)</td>
        </tr>
      </table>

      <!-- 第一章：工程累計進度 S 曲線折線圖 (向量圖表內嵌於公文報告內) -->
      <div class="print-no-break">
        <div style="font-size:11pt;font-weight:bold;margin:10px 0 4px;">一、工程合約累計進度 S 曲線折線圖分析 (預定 vs 實際)</div>
        <div class="stats-chart-print-box">
          ${sCurveSvgPrint}
        </div>
      </div>

      <!-- 第二章：資源配置雙軸山積圖 (長條圖 + 累積折線內嵌於公文報告內) -->
      <div class="print-no-break">
        <div style="font-size:11pt;font-weight:bold;margin:10px 0 4px;">二、工務資源配置雙軸山積圖 (每日出工負荷與累計投入)</div>
        <div class="stats-chart-print-box">
          ${mountainChartSvgPrint}
        </div>
      </div>

      <!-- 第三章：各工種出工結構佔比圓餅圖與明細分析 (圓餅圖內嵌於公文報告內) -->
      <div class="print-no-break">
        <div style="font-size:11pt;font-weight:bold;margin:10px 0 4px;">三、各工種人力資源結構圓餅分析與統計明細表</div>
        <div class="stats-chart-print-box">
          ${donutChartSvgPrint}
        </div>
        <table class="official-rep-table" style="margin-top:6px;">
          <thead>
            <tr>
              <th style="width:8%;">項次</th>
              <th style="width:26%;">工種名稱</th>
              <th style="width:12%;">單位</th>
              <th style="width:18%;">區間累計出工</th>
              <th style="width:18%;">佔總出工比例</th>
              <th style="width:18%;">單日最高出工</th>
            </tr>
          </thead>
          <tbody>
            ${sortedTrades.map((t, idx) => {
              const totalWAll = sortedTrades.reduce((s, it) => s + it.total, 0) || 1;
              const pct = ((t.total / totalWAll) * 100).toFixed(1);
              return `
                <tr>
                  <td style="text-align:center;">${idx + 1}</td>
                  <td><strong>${t.name}</strong></td>
                  <td style="text-align:center;">${t.unit}</td>
                  <td style="text-align:right;font-weight:bold;">${t.total}</td>
                  <td style="text-align:right;">${pct}%</td>
                  <td style="text-align:right;">${t.peak} ${t.unit}</td>
                </tr>
              `;
            }).join('')}
            <tr style="background:#F8FAFC;font-weight:bold;">
              <td colspan="3" style="text-align:center;">人力出工總計</td>
              <td style="text-align:right;">${sortedTrades.reduce((s, it) => s + it.total, 0)} 人</td>
              <td style="text-align:right;">100.0%</td>
              <td style="text-align:right;">峰值 ${peakWorkers} 人</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 第四章：施工重型機具動員統計表 -->
      <div class="print-no-break">
        <div style="font-size:11pt;font-weight:bold;margin:12px 0 4px;">四、施工重型機具動員統計表</div>
        <table class="official-rep-table">
          <thead>
            <tr>
              <th style="width:8%;">項次</th>
              <th style="width:34%;">機具設備型號</th>
              <th style="width:16%;">計量單位</th>
              <th style="width:22%;">區間累計台班</th>
              <th style="width:20%;">單日最高進場</th>
            </tr>
          </thead>
          <tbody>
            ${sortedMachines.map((m, idx) => `
              <tr>
                <td style="text-align:center;">${idx + 1}</td>
                <td><strong>${m.name}</strong></td>
                <td style="text-align:center;">${m.unit}</td>
                <td style="text-align:right;font-weight:bold;">${m.total}</td>
                <td style="text-align:right;">${m.peak} ${m.unit}</td>
              </tr>
            `).join('')}
            <tr style="background:#F8FAFC;font-weight:bold;">
              <td colspan="3" style="text-align:center;">機具動員總計</td>
              <td style="text-align:right;">${totalMachines} 台·班</td>
              <td style="text-align:right;">-</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 第五章：區間逐日工程進度摘錄表 -->
      <div class="print-no-break">
        <div style="font-size:11pt;font-weight:bold;margin:12px 0 4px;">五、區間施工進度與出工明細日誌</div>
        <table class="official-rep-table">
          <thead>
            <tr>
              <th style="width:16%;">施工日期</th>
              <th style="width:12%;">天候</th>
              <th style="width:14%;">出工/機具</th>
              <th style="width:34%;">主要施作工程進度</th>
              <th style="width:24%;">工區重要記事</th>
            </tr>
          </thead>
          <tbody>
            ${reports.map(r => {
              const w = r.tradeRecords.filter(t => t.category === 'workers').reduce((sum, item) => sum + getTodayQty(item), 0);
              const m = r.tradeRecords.filter(t => t.category === 'machinery').reduce((sum, item) => sum + getTodayQty(item), 0);
              return `
                <tr>
                  <td style="text-align:center;font-weight:bold;">${r.reportDateISO}</td>
                  <td style="text-align:center;">${r.weatherAM}/${r.weatherPM}</td>
                  <td style="text-align:center;">${w}人 / ${m}台</td>
                  <td>${r.todayProgressSummary || '按既定排程順利施作。'}</td>
                  <td>${r.importantNotes || '無特殊公安狀況。'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- 第六章：審核簽署確認欄 -->
      <div class="print-no-break" style="margin-top:14px;">
        <div style="font-size:11pt;font-weight:bold;margin-bottom:4px;">六、專案審核與簽章簽認欄</div>
        <table class="official-rep-table">
          <tr style="height:44px;">
            <th style="width:25%;">專任工程人員 (主任技師)</th>
            <th style="width:25%;">監造單位 監造主任</th>
            <th style="width:25%;">承包廠商 工地主任</th>
            <th style="width:25%;">承辦 / 製表人</th>
          </tr>
          <tr style="height:60px;">
            <td></td><td></td><td></td>
            <td style="text-align:center;vertical-align:bottom;font-weight:bold;font-size:10pt;">
              ${state.account.name || '工務所主任'}
            </td>
          </tr>
        </table>
      </div>
    </div>
  `;
}



function buildProjectScheduleSCurveSvg(proj, reports, isPrint = false) {
  if (!reports || reports.length === 0) {
    return '<div style="padding:14px;text-align:center;color:#64748B;">尚無進度趨勢數據</div>';
  }

  const n = reports.length;
  const svgW = isPrint ? 740 : Math.max(380, 520);
  const svgH = isPrint ? 170 : 200;
  const padL = 42;
  const padR = 40;
  const padT = 24;
  const padB = 38;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const plannedBase = Number(proj.plannedProgress || 43.5);
  const actualBase = Number(proj.actualProgress || 41.3);

  // 構造 S-Curve 累計資料點
  const ptsPlanned = [];
  const ptsActual = [];
  const dotsActual = [];

  reports.forEach((r, idx) => {
    const x = padL + (idx / Math.max(1, n - 1)) * plotW;
    const ratio = (idx + 1) / n;
    
    // 計算預定與實際在當日的模擬累積進度
    const pVal = Math.min(100, Math.max(0, (plannedBase - (n - idx - 1) * 0.4)));
    const aVal = Math.min(100, Math.max(0, (actualBase - (n - idx - 1) * 0.42)));

    const yP = (padT + plotH) - (pVal / 100) * plotH;
    const yA = (padT + plotH) - (aVal / 100) * plotH;

    ptsPlanned.push(`${x.toFixed(1)},${yP.toFixed(1)}`);
    ptsActual.push(`${x.toFixed(1)},${yA.toFixed(1)}`);
    dotsActual.push({ x, y: yA, date: r.reportDateISO.slice(5), val: aVal.toFixed(1) });
  });

  const plannedLine = ptsPlanned.join(' ');
  const actualLine = ptsActual.join(' ');

  return `
    <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;margin-bottom:6px;padding:0 4px;">
      <div style="display:flex;gap:12px;">
        <span><strong style="color:#0284C7;">-- -</strong> 預定進度S曲線 (${plannedBase}%)</span>
        <span><strong style="color:#059669;">●—</strong> 實際累計進度 (${actualBase}%)</span>
      </div>
      <div>
        <span style="font-weight:bold;color:${actualBase >= plannedBase ? '#059669' : '#DC2626'};">
          ${actualBase >= plannedBase ? '⚡ 進度超前 +' + (actualBase - plannedBase).toFixed(1) + '%' : '⚠️ 進度落後 -' + (plannedBase - actualBase).toFixed(1) + '%'}
        </span>
      </div>
    </div>

    <svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" style="display:block;width:100%;max-width:${svgW}px;">
      <!-- 背景格線 -->
      <line x1="${padL}" y1="${padT + plotH}" x2="${svgW - padR}" y2="${padT + plotH}" stroke="#CBD5E1" stroke-width="1.5" />
      <line x1="${padL}" y1="${padT + plotH * 0.5}" x2="${svgW - padR}" y2="${padT + plotH * 0.5}" stroke="#F1F5F9" stroke-width="1" stroke-dasharray="3 3" />
      <line x1="${padL}" y1="${padT}" x2="${svgW - padR}" y2="${padT}" stroke="#F1F5F9" stroke-width="1" stroke-dasharray="3 3" />

      <!-- Y 軸進度刻度 -->
      <text x="${padL - 6}" y="${padT + 4}" font-size="9" fill="#64748B" text-anchor="end">100%</text>
      <text x="${padL - 6}" y="${padT + plotH * 0.5 + 3}" font-size="9" fill="#64748B" text-anchor="end">50%</text>
      <text x="${padL - 6}" y="${padT + plotH}" font-size="9" fill="#64748B" text-anchor="end">0%</text>

      <!-- 預定 S 曲線 (虛線) -->
      <polyline fill="none" stroke="#0284C7" stroke-width="2.5" stroke-dasharray="6 3" points="${plannedLine}" />

      <!-- 實際進度 S 曲線 (實線) -->
      <polyline fill="none" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="${actualLine}" />

      <!-- 資料點圓點與日期標籤 -->
      ${dotsActual.map((pt, i) => `
        <circle cx="${pt.x}" cy="${pt.y}" r="3.5" fill="#059669" stroke="#FFFFFF" stroke-width="1.5" />
        ${(i === 0 || i === dotsActual.length - 1 || i % Math.ceil(dotsActual.length / 6) === 0) ? `
          <text x="${pt.x}" y="${svgH - padB + 16}" font-size="9" fill="#0C4A6E" text-anchor="middle" font-weight="700">${pt.date}</text>
          <text x="${pt.x}" y="${pt.y - 6}" font-size="8.5" fill="#059669" text-anchor="middle" font-weight="900">${pt.val}%</text>
        ` : ''}
      `).join('')}
    </svg>
  `;
}

function buildProjectExecutiveDonutSvg(sortedTrades, totalWorkers, isPrint = false) {
  if (!sortedTrades || sortedTrades.length === 0 || totalWorkers === 0) {
    return '<div style="padding:12px;text-align:center;color:#64748B;">尚無工種佔比數據</div>';
  }

  const palette = ['#0EA5E9', '#0284C7', '#059669', '#D97706', '#6366F1', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B', '#3B82F6'];
  const activeTrades = sortedTrades.filter(t => t.total > 0);
  const grandTotal = totalWorkers || 1;

  let cumPct = 0;
  const cx = isPrint ? 75 : 85;
  const cy = isPrint ? 75 : 85;
  const r = isPrint ? 48 : 55;
  const circum = 2 * Math.PI * r;

  const segs = activeTrades.map((t, idx) => {
    const pct = t.total / grandTotal;
    const dash = (pct * circum).toFixed(2) + ' ' + circum.toFixed(2);
    const offset = (-cumPct * circum).toFixed(2);
    cumPct += pct;
    return `<circle r="${r}" cx="${cx}" cy="${cy}" fill="transparent" stroke="${palette[idx % palette.length]}" stroke-width="22" stroke-dasharray="${dash}" stroke-dashoffset="${offset}" transform="rotate(-90 ${cx} ${cy})" />`;
  }).join('');

  const svgDimension = isPrint ? 150 : 170;

  const legendHtml = activeTrades.slice(0, 8).map((t, idx) => {
    const pct = ((t.total / grandTotal) * 100).toFixed(1);
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;border-bottom:1px dashed #E2E8F0;font-size:${isPrint ? '9.5pt' : '11.5px'};">
        <span style="display:inline-flex;align-items:center;gap:6px;">
          <span style="width:10px;height:10px;border-radius:2px;background:${palette[idx % palette.length]};display:inline-block;flex-shrink:0;"></span>
          <strong style="color:#0F172A;">${t.name}</strong>
        </span>
        <span style="font-weight:bold;color:#0284C7;">${t.total} ${t.unit} (${pct}%)</span>
      </div>
    `;
  }).join('');

  return `
    <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
      <div style="position:relative;width:${svgDimension}px;height:${svgDimension}px;flex-shrink:0;">
        <svg width="${svgDimension}" height="${svgDimension}" viewBox="0 0 ${svgDimension} ${svgDimension}">
          <circle r="${r}" cx="${cx}" cy="${cy}" fill="transparent" stroke="#F1F5F9" stroke-width="22" />
          ${segs}
        </svg>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);text-align:center;pointer-events:none;">
          <div style="font-size:9.5px;color:#64748B;font-weight:bold;">總出工</div>
          <div style="font-size:${isPrint ? '13pt' : '15px'};font-weight:900;color:#0F172A;line-height:1.1;">${totalWorkers}</div>
          <div style="font-size:9px;color:#0284C7;">人·日</div>
        </div>
      </div>
      <div style="flex:1;min-width:180px;">
        ${legendHtml}
      </div>
    </div>
  `;
}

// 繪製雙軸山積圖 (支援出工人力、進場機具、雙柱綜合負載 + S-Curve 累計折線)
function buildDoubleAxisMountainSvg(reports, mode = 'workers', filterTrade = 'all', isPrint = false) {
  if (!reports || reports.length === 0) {
    return '<div style="padding:18px;text-align:center;color:#64748B;">尚無日報數據</div>';
  }

  const n = reports.length;
  const colW = isPrint ? Math.max(24, Math.floor(660 / Math.max(1, n))) : (mode === 'combined' ? 56 : 46);
  const padL = 40;
  const padR = 40;
  const padT = 24;
  const padB = 46;
  const svgW = isPrint ? 740 : Math.max(380, padL + padR + n * colW);
  const svgH = isPrint ? 180 : 220;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  let cumWorkers = 0;
  let cumMachines = 0;

  const daysData = reports.map(r => {
    let workers = r.tradeRecords.filter(t => t.category === 'workers');
    let machines = r.tradeRecords.filter(t => t.category === 'machinery');

    // 若有指定工種分項篩選
    if (filterTrade && filterTrade !== 'all') {
      workers = workers.filter(w => w.name === filterTrade);
      machines = machines.filter(m => m.name === filterTrade);
    }

    const mainWorkers = workers.filter(w => !w.name.includes('點工') && !w.name.includes('特約')).reduce((sum, w) => sum + getTodayQty(w), 0);
    const subWorkers = workers.filter(w => w.name.includes('點工') || w.name.includes('特約')).reduce((sum, w) => sum + getTodayQty(w), 0);
    const totalW = workers.reduce((sum, w) => sum + getTodayQty(w), 0);
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
      cumM: cumMachines
    };
  });

  const maxVal = mode === 'machinery'
    ? Math.max(6, ...daysData.map(d => d.totalM))
    : Math.max(8, ...daysData.map(d => d.totalW));

  const maxCum = mode === 'machinery' ? Math.max(10, cumMachines) : Math.max(15, cumWorkers);

  const barSvgParts = [];
  const linePoints = [];

  daysData.forEach((d, i) => {
    const cx = isPrint ? (padL + (i + 0.5) * (plotW / n)) : (padL + i * colW + colW / 2);
    const barWidth = isPrint ? Math.min(22, Math.max(8, (plotW / n) * 0.7)) : 24;

    if (mode === 'workers') {
      const hMain = (d.mainWorkers / maxVal) * plotH;
      const hSub = (d.subWorkers / maxVal) * plotH;
      const yBase = padT + plotH;
      const yMain = yBase - hMain;
      const ySub = yMain - hSub;

      barSvgParts.push(`
        <g style="cursor:pointer;" onclick="window.appActions.openDayDetailSheet('${d.dateISO}')">
          <rect x="${cx - barWidth / 2}" y="${yMain}" width="${barWidth}" height="${hMain}" fill="#0EA5E9" rx="2" />
          ${hSub > 0 ? `<rect x="${cx - barWidth / 2}" y="${ySub}" width="${barWidth}" height="${hSub}" fill="#D97706" rx="2" />` : ''}
          <text x="${cx}" y="${ySub - 5}" font-size="9.5" font-weight="900" fill="#0C4A6E" text-anchor="middle">${d.totalW}</text>
          ${(isPrint && n > 15 && i % 2 !== 0) ? '' : `<text x="${cx}" y="${svgH - padB + 16}" font-size="9" fill="#0C4A6E" text-anchor="middle" font-weight="700">${d.dateShort}</text>`}
        </g>
      `);

      const yCum = (padT + plotH) - (d.cumW / maxCum) * plotH;
      linePoints.push(`${cx},${yCum}`);

    } else if (mode === 'machinery') {
      const barH = (d.totalM / maxVal) * plotH;
      const yTop = (padT + plotH) - barH;

      barSvgParts.push(`
        <g style="cursor:pointer;" onclick="window.appActions.openDayDetailSheet('${d.dateISO}')">
          <rect x="${cx - barWidth / 2}" y="${yTop}" width="${barWidth}" height="${barH}" fill="#059669" rx="2" />
          <text x="${cx}" y="${yTop - 5}" font-size="9.5" font-weight="900" fill="#065F46" text-anchor="middle">${d.totalM}台</text>
          ${(isPrint && n > 15 && i % 2 !== 0) ? '' : `<text x="${cx}" y="${svgH - padB + 16}" font-size="9" fill="#0C4A6E" text-anchor="middle" font-weight="700">${d.dateShort}</text>`}
        </g>
      `);

      const yCum = (padT + plotH) - (d.cumM / maxCum) * plotH;
      linePoints.push(`${cx},${yCum}`);

    } else {
      const hW = (d.totalW / maxVal) * plotH;
      const hM = (d.totalM / maxVal) * plotH;
      const yBase = padT + plotH;
      const halfW = barWidth / 2;

      barSvgParts.push(`
        <g style="cursor:pointer;" onclick="window.appActions.openDayDetailSheet('${d.dateISO}')">
          <rect x="${cx - barWidth}" y="${yBase - hW}" width="${halfW}" height="${hW}" fill="#0EA5E9" rx="2" />
          <rect x="${cx}" y="${yBase - hM}" width="${halfW}" height="${hM}" fill="#059669" rx="2" />
          <text x="${cx - halfW / 2}" y="${yBase - hW - 4}" font-size="8.5" font-weight="800" fill="#0EA5E9" text-anchor="middle">${d.totalW}</text>
          <text x="${cx + halfW / 2}" y="${yBase - hM - 4}" font-size="8.5" font-weight="800" fill="#059669" text-anchor="middle">${d.totalM}</text>
          ${(isPrint && n > 15 && i % 2 !== 0) ? '' : `<text x="${cx}" y="${svgH - padB + 16}" font-size="9" fill="#0C4A6E" text-anchor="middle" font-weight="700">${d.dateShort}</text>`}
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
        ${filterTrade !== 'all' ? `
          <span><strong style="color:#0EA5E9;">■</strong> 【${filterTrade}】單日投入人數</span>
        ` : mode === 'workers' ? `
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
        <span><strong style="color:#EF4444;">●—</strong> 累計成長折線 (右軸 ${maxCum})</span>
      </div>
    </div>

    <svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" style="display:block;width:100%;max-width:${svgW}px;">
      <!-- 水平參考線 -->
      <line x1="${padL}" y1="${yBase}" x2="${svgW - padR}" y2="${yBase}" stroke="#CBD5E1" stroke-width="1.5" />
      <line x1="${padL}" y1="${yBase - plotH / 2}" x2="${svgW - padR}" y2="${yBase - plotH / 2}" stroke="#F1F5F9" stroke-width="1" stroke-dasharray="3 3" />
      <line x1="${padL}" y1="${padT}" x2="${svgW - padR}" y2="${padT}" stroke="#F1F5F9" stroke-width="1" stroke-dasharray="3 3" />

      <!-- 左軸刻度 -->
      <text x="${padL - 6}" y="${padT + 4}" font-size="9" fill="#64748B" text-anchor="end">${maxVal}</text>
      <text x="${padL - 6}" y="${yBase - plotH / 2 + 3}" font-size="9" fill="#64748B" text-anchor="end">${Math.round(maxVal / 2)}</text>
      <text x="${padL - 6}" y="${yBase}" font-size="9" fill="#64748B" text-anchor="end">0</text>

      <!-- 右軸刻度 -->
      <text x="${svgW - padR + 6}" y="${padT + 4}" font-size="9" fill="#EF4444" font-weight="bold">${maxCum}</text>
      <text x="${svgW - padR + 6}" y="${yBase}" font-size="9" fill="#EF4444" font-weight="bold">0</text>

      <!-- 長條柱群 -->
      ${barSvgParts.join('')}

      <!-- 累計實體折線 -->
      <polyline fill="none" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${linePointsStr}" />
      
      <!-- 節點圓點 -->
      ${linePoints.map(pt => {
        const [px, py] = pt.split(',');
        return `<circle cx="${px}" cy="${py}" r="3" fill="#EF4444" stroke="#FFFFFF" stroke-width="1.5" />`;
      }).join('')}
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
    return '<div style="font-size:11px;color:var(--text-muted);padding:8px 0;text-align:center;">本日尚無出工數據</div>';
  }

  const palette = ['#0EA5E9', '#0284C7', '#059669', '#D97706', '#6366F1', '#EC4899', '#8B5CF6'];
  const grandTotal = activeItems.reduce((acc, it) => acc + getTodayQty(it), 0) || 1;

  let cumPct = 0;
  const r = 42;
  const circum = 2 * Math.PI * r;

  const segs = activeItems.map((it, idx) => {
    const pct = getTodayQty(it) / grandTotal;
    const dash = (pct * circum).toFixed(2) + ' ' + circum.toFixed(2);
    const offset = (-cumPct * circum).toFixed(2);
    cumPct += pct;
    return `<circle r="${r}" cx="54" cy="54" fill="transparent" stroke="${palette[idx % palette.length]}" stroke-width="16" stroke-dasharray="${dash}" stroke-dashoffset="${offset}" transform="rotate(-90 54 54)" />`;
  }).join('');

  const legend = activeItems.map((it, idx) => {
    const qty = getTodayQty(it);
    const pct = ((qty / grandTotal) * 100).toFixed(1);
    return `
      <div class="pie-chart-legend-row">
        <span>
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${palette[idx % palette.length]};margin-right:6px;"></span>
          <strong style="color:var(--text-main);">${it.name}</strong>
        </span>
        <strong style="color:var(--primary-dark);font-family:var(--font-heading);font-size:12.5px;">${qty} ${it.unit} (${pct}%)</strong>
      </div>
    `;
  }).join('');

  return `
    <div class="pie-chart-vertical-box">
      <div class="pie-chart-svg-wrap">
        <svg width="108" height="108" viewBox="0 0 108 108">
          <circle r="${r}" cx="54" cy="54" fill="transparent" stroke="#E2E8F0" stroke-width="16" />
          ${segs}
        </svg>
      </div>
      <div class="pie-chart-legend-full">
        ${legend}
      </div>
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

// =========================================================================
// 🏢 BIM 3D 輕量化 WebGL 模型檢視模組 (Three.js & OrbitControls)
// =========================================================================

function renderPageBimModelView() {
  const proj = getActiveProject();
  const activeM = state.bimActiveModel || 'u001';

  return `
    <div class="bim-page-wrap">
      <!-- 主次上下垂直排版：主標在第一行，專案名稱作為次級文字於下方 -->
      <div class="vertical-hierarchy-header" style="margin-bottom:14px;">
        <div class="vh-primary-title">工地 BIM 3D 輕量化模型工作台</div>
        <div class="vh-secondary-meta">
          <span class="vh-badge-tag">${proj.name}</span>
          <span>工務所 3D 空間檢視・支援 IFC / GLB / OBJ・全構件點擊拾取與爆炸分解・360° 球體旋轉</span>
        </div>
      </div>

      <!-- 模型切換標籤列 -->
      <div class="bim-model-switcher">
        <button class="bim-model-chip ${activeM === 'u001' ? 'active' : ''}" onclick="window.appActions.switchBimModel('u001')">
          <span>🏢</span> U001 1700×3600 中階單元帷幕牆 (示範)
        </button>
        <button class="bim-model-chip ${activeM === 'mega_towers' ? 'active' : ''}" onclick="window.appActions.switchBimModel('mega_towers')">
          <span>🏙️</span> 4棟30層大樓超大基地 (全景視野示範)
        </button>
        <button class="bim-model-chip ${activeM === 'rc_structure' ? 'active' : ''}" onclick="window.appActions.switchBimModel('rc_structure')">
          <span>🏗️</span> 5F 現場 RC 結構主體框架 (示範)
        </button>
        <button class="bim-model-chip ${activeM === 'custom' ? 'active' : ''}" onclick="window.appActions.triggerBimFileInput()">
          <span>📂</span> 本機上傳 3D 模型 (.ifc / .glb / .obj) ${state.bimCustomModelName ? `<span style="opacity:0.85;">(${state.bimCustomModelName})</span>` : ''}
        </button>
        <input type="file" id="bim-file-uploader" accept=".ifc,.glb,.gltf,.obj" style="display:none;" onchange="window.appActions.handleBimFileUpload(event)" />
      </div>

      <!-- 3D 畫布與 HUD 浮動控制容器 (支援標準 Fullscreen API 與 CSS 備援) -->
      <div id="bim-viewer-container" class="bim-viewer-container">
        <!-- 頂部浮動工具列 HUD -->
        <div class="bim-hud-top-bar">
          <div class="bim-hud-left">
            <div class="bim-status-pill">
              <span class="pulse-dot"></span>
              <span id="bim-hud-title">${activeM === 'u001' ? 'U001 中階單元帷幕牆 (1700×3600)' : activeM === 'mega_towers' ? '4棟30層大樓超大基地 (120m高/240m基地)' : activeM === 'rc_structure' ? '5F RC 結構主體框架' : (state.bimCustomModelName || '自訂 3D 模型')}</span>
            </div>
          </div>
          <div class="bim-hud-actions">
            <button id="bim-btn-reset" class="bim-hud-btn" onclick="window.appActions.resetBimCamera()" title="重置為全景中心最佳視角">
              <span>🔄</span> <span class="btn-text">中心視角</span>
            </button>
            <button id="bim-btn-fov" class="bim-hud-btn ${state.bimWideFov ? 'active' : ''}" onclick="window.appActions.toggleBimWideFov()" title="切換標準視角 (45°) 或超廣角全景視野 (65°)">
              <span>🔭</span> <span class="btn-text" id="bim-btn-fov-text">${state.bimWideFov ? '超廣角(65°)' : '廣角視野'}</span>
            </button>
            <button id="bim-btn-grid" class="bim-hud-btn ${state.bimShowGrid !== false ? 'active' : ''}" onclick="window.appActions.toggleBimGrid()" title="開啟/隱藏參考格線">
              <span>📏</span> <span class="btn-text">參考網格</span>
            </button>
            <button id="bim-btn-wireframe" class="bim-hud-btn ${state.bimWireframe ? 'active' : ''}" onclick="window.appActions.toggleBimWireframe()" title="切換線框檢視模式">
              <span>🌐</span> <span class="btn-text">線框</span>
            </button>
            <button id="bim-btn-explode" class="bim-hud-btn ${state.bimExploded ? 'active' : ''}" onclick="window.appActions.toggleBimExplode()" title="全模型構件徑向爆炸分解檢視 (支援所有內建與上傳的多構件模型)">
              <span>💥</span> <span class="btn-text" id="bim-btn-explode-text">${state.bimExploded ? '復原組合' : '構件分解'}</span>
            </button>
            <!-- 進入全螢幕按鈕 -->
            <button class="bim-hud-btn bim-enter-fs-btn" onclick="window.appActions.toggleBimFullscreen()" title="進入全螢幕模式">
              <span>⛶</span> <span class="btn-text">進入全螢幕</span>
            </button>
            <!-- 退出全螢幕按鈕 (全螢幕時浮現於右上角) -->
            <button class="bim-exit-fs-btn" onclick="window.appActions.exitBimFullscreen()" title="退出全螢幕 (亦可按鍵盤 ESC 退出)">
              <span>✕</span> 退出全螢幕 (ESC)
            </button>
          </div>
        </div>

        <!-- 點選 3D 構件時浮現之即時 BIM 構件屬性 HUD 浮窗 -->
        <div id="bim-selected-hud" class="bim-selected-hud hidden"></div>

        <!-- 3D Canvas 畫布區塊 (支援拖曳放置檔案與 Raycaster 點擊構件檢視) -->
        <div id="bim-canvas-wrap" class="bim-canvas-wrap" 
             ondragover="window.appActions.handleBimDragOver(event)" 
             ondragleave="window.appActions.handleBimDragLeave(event)" 
             ondrop="window.appActions.handleBimDrop(event)">
          <canvas id="bim-three-canvas"></canvas>
          <div id="bim-loading-overlay" class="bim-loading-overlay hidden">
            <div class="bim-spinner"></div>
            <div style="color:#F8FAFC;font-size:13px;font-weight:700;">正在解析並加載 3D 輕量化模型...</div>
          </div>
        </div>

        <!-- 底部浮動操作提示 HUD -->
        <div class="bim-hud-bottom-bar">
          <div class="bim-control-tips">
            <span>👆 <b>單擊構件</b>：讀取 BIM 屬性</span>
            <span>・</span>
            <span>🖱️ <b>左鍵拖曳</b>：360° 旋轉</span>
            <span>・</span>
            <span>🔍 <b>滾輪</b>：縮放</span>
            <span>・</span>
            <span>↔️ <b>右鍵</b>：平移</span>
          </div>
          <div class="bim-coord-box" id="bim-stat-box">
            <span>WebGL 60 FPS</span>
          </div>
        </div>
      </div>

      <!-- 即時選取構件之動態檢驗卡 (Raycaster 點擊任何構件時即時更新) -->
      <div id="bim-live-inspector-box"></div>

      <!-- 元件屬性與技術規格卡片 (與 中階幕牆族元件製成技術 規格完全對應) -->
      ${renderBimPropertiesCard(activeM)}

      <!-- 模型上傳與 Revit 匯出說明卡片 -->
      ${renderBimUploadGuideCard()}
    </div>
  `;
}

function renderBimPropertiesCard(activeM) {
  if (activeM === 'u001') {
    return `
      <div class="motion-card" style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid var(--border-light);padding-bottom:10px;margin-bottom:14px;">
          <div>
            <div style="font-size:15px;font-weight:900;color:var(--text-main);display:flex;align-items:center;gap:6px;">
              <span>🏢</span> U001 中階單元帷幕牆族群屬性檢核 (Revit 實體參數)
            </div>
            <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">
              對應技術：中階族元件製成技術 (先篩選再建模・單一族直接拉伸・小於 3MB 輕量化)
            </div>
          </div>
          <span class="vh-badge-tag" style="background:#E0F2FE;color:#0284C7;border-color:#BAE6FD;">1.44 MB 輕量化</span>
        </div>

        <div class="bim-specs-grid">
          <div>
            <table class="bim-param-table">
              <tr>
                <td class="bim-param-label">族群名稱</td>
                <td class="bim-param-value">U001_1700x3600_帷幕嵌板.rfa</td>
              </tr>
              <tr>
                <td class="bim-param-label">族群範本</td>
                <td class="bim-param-value">Metric Curtain Wall Panel (防變形約束)</td>
              </tr>
              <tr>
                <td class="bim-param-label">名義尺寸</td>
                <td class="bim-param-value">1,700 mm (寬) × 3,600 mm (高)</td>
              </tr>
              <tr>
                <td class="bim-param-label">實體外包尺寸</td>
                <td class="bim-param-value">1,732 mm × 3,640 mm × 254 mm (深)</td>
              </tr>
            </table>
          </div>

          <div>
            <table class="bim-param-table">
              <tr>
                <td class="bim-param-label">鋁擠型主框</td>
                <td class="bim-param-value">A6063-T5 陽極深灰 (立柱 Jamb 200mm / 橫樑 180mm)</td>
              </tr>
              <tr>
                <td class="bim-param-label">複層玻璃規格</td>
                <td class="bim-param-value">35 mm 雙強化複層中空 Low-E (8+12A+8)</td>
              </tr>
              <tr>
                <td class="bim-param-label">飾板與背板</td>
                <td class="bim-param-value">下半部 900mm 乾掛花崗岩飾板 + 鍍鋅保溫背板</td>
              </tr>
              <tr>
                <td class="bim-param-label">結構固定節點</td>
                <td class="bim-param-value">鋼構角鋼牛腿轉接件 + M20 化學錨栓預埋件</td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    `;
  } else if (activeM === 'mega_towers') {
    return `
      <div class="motion-card" style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid var(--border-light);padding-bottom:10px;margin-bottom:14px;">
          <div>
            <div style="font-size:15px;font-weight:900;color:var(--text-main);display:flex;align-items:center;gap:6px;">
              <span>🏙️</span> 4 棟 30 層大樓超大基地綜合開發案 (百米超高層建築群)
            </div>
            <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">
              超大視野驗證模型・涵蓋 A/B/C/D 棟 30F 高塔、裙樓、景觀廣場與周邊道路
            </div>
          </div>
          <span class="vh-badge-tag" style="background:#E0E7FF;color:#4338CA;border-color:#C7D2FE;">全區大視野 240m</span>
        </div>

        <div class="bim-specs-grid">
          <div>
            <table class="bim-param-table">
              <tr>
                <td class="bim-param-label">建物規模</td>
                <td class="bim-param-value">共 4 棟 30 層超高層大樓 (單棟高度約 108m ~ 125m)</td>
              </tr>
              <tr>
                <td class="bim-param-label">基地範圍</td>
                <td class="bim-param-value">240 m × 240 m 綜合開發街廓 (總樓地板 > 120,000 m²)</td>
              </tr>
              <tr>
                <td class="bim-param-label">外觀立面</td>
                <td class="bim-param-value">Low-E 複層玻璃帷幕帶 + 鋁料飾帶 + 頂層星空花園冠頂</td>
              </tr>
            </table>
          </div>
          <div>
            <table class="bim-param-table">
              <tr>
                <td class="bim-param-label">視野相機設定</td>
                <td class="bim-param-value">視野極限拓展至 100,000m (無霧氣阻擋 / 零距離衰減)</td>
              </tr>
              <tr>
                <td class="bim-param-label">旋轉軸心</td>
                <td class="bim-param-value">鎖定於全區 4 棟建築群幾何正中心，360° 仰俯翻轉穩定無偏擺</td>
              </tr>
              <tr>
                <td class="bim-param-label">縮放視野深度</td>
                <td class="bim-param-value">支援遠距全區鳥瞰 ↔ 近距單層窗框細節自由穿梭</td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    `;
  } else if (activeM === 'rc_structure') {
    return `
      <div class="motion-card" style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid var(--border-light);padding-bottom:10px;margin-bottom:14px;">
          <div>
            <div style="font-size:15px;font-weight:900;color:var(--text-main);display:flex;align-items:center;gap:6px;">
              <span>🏗️</span> 5F 現場建築 RC 結構主體構架屬性
            </div>
            <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">
              工務所現場 BIM 施工排程對應模型
            </div>
          </div>
          <span class="vh-badge-tag" style="background:#DCFCE7;color:#16A34A;border-color:#BBF7D0;">進度 57.8%</span>
        </div>

        <div class="bim-specs-grid">
          <div>
            <table class="bim-param-table">
              <tr>
                <td class="bim-param-label">結構形式</td>
                <td class="bim-param-value">RC 鋼筋混凝土剛構架系統</td>
              </tr>
              <tr>
                <td class="bim-param-label">設計柱斷面</td>
                <td class="bim-param-value">C1 柱：600 mm × 600 mm (fc' = 280 kgf/cm²)</td>
              </tr>
              <tr>
                <td class="bim-param-label">主大樑斷面</td>
                <td class="bim-param-value">G1 樑：400 mm × 700 mm</td>
              </tr>
            </table>
          </div>
          <div>
            <table class="bim-param-table">
              <tr>
                <td class="bim-param-label">樓板規格</td>
                <td class="bim-param-value">雙層雙向鋼筋混凝土板 (厚 150 mm)</td>
              </tr>
              <tr>
                <td class="bim-param-label">施工狀態色彩</td>
                <td class="bim-param-value"><span style="color:#64748B;">■ 灰：已澆置</span>｜<span style="color:#F59E0B;">■ 橘：模板</span>｜<span style="color:#EF4444;">■ 紅：鋼筋待驗</span></td>
              </tr>
              <tr>
                <td class="bim-param-label">檢驗節點</td>
                <td class="bim-param-value">5F 樑板鋼筋綁紮與管路預埋自主查驗中</td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="motion-card" style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid var(--border-light);padding-bottom:10px;margin-bottom:14px;">
          <div>
            <div style="font-size:15px;font-weight:900;color:var(--text-main);display:flex;align-items:center;gap:6px;">
              <span>📂</span> 自訂上傳模型屬性資訊
            </div>
            <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">
              本機渲染模式・資料安全無上傳外洩風險
            </div>
          </div>
          <span class="vh-badge-tag" style="background:#FEF3C7;color:#D97706;border-color:#FDE68A;">本機 WebGL</span>
        </div>
        <div style="font-size:13px;color:var(--text-main);line-height:1.6;">
          目前載入檔案：<b>${state.bimCustomModelName || '未命名 3D 模型'}</b>。您可透過滑鼠或手勢自由旋轉、放大與平移，亦可隨時切換全螢幕檢視細部。
        </div>
      </div>
    `;
  }
}

function renderBimUploadGuideCard() {
  return `
    <div class="motion-card">
      <div style="border-bottom:2px solid var(--border-light);padding-bottom:10px;margin-bottom:12px;">
        <div style="font-size:15px;font-weight:900;color:var(--text-main);display:flex;align-items:center;gap:6px;">
          <span>💡</span> 3D 模型如何上傳與 IFC / Revit 放置教學
        </div>
        <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">
          支援格式：<b>.ifc</b> (BIM 開放標準)、<b>.glb</b> (推薦，含貼圖材質)、<b>.obj</b>、<b>.gltf</b>
        </div>
      </div>

      <!-- 拖曳上傳放置區 -->
      <div class="bim-dropzone" onclick="window.appActions.triggerBimFileInput()">
        <div style="font-size:38px;margin-bottom:6px;">📤</div>
        <div style="font-size:14.5px;font-weight:900;color:#0284C7;margin-bottom:4px;">
          點擊此處選擇檔案，或將 IFC / GLB / OBJ 模型直接拖曳至畫布放開
        </div>
        <div style="font-size:12px;color:var(--text-muted);">
          支援 .ifc / .glb / .obj，旋轉中心點自動對齊模型正中間，完全 360° 球面旋轉無死角，100% 本機解析無資安風險
        </div>
      </div>

      <!-- Revit 匯出說明 -->
      <div style="margin-top:16px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px;">
        <div style="font-size:13.5px;font-weight:800;color:#0F172A;margin-bottom:8px;">
          🛠️ 如何匯出模型放入本系統？
        </div>
        <ol style="margin:0;padding-left:20px;font-size:12.5px;color:#334155;line-height:1.8;">
          <li>
            <b>方法 A (IFC 原生支援・最通用)：</b>在 Revit 點選「檔案」→「匯出」→「IFC」，產出的 <b>.ifc</b> 檔案直接拖曳進上方視窗，系統會自動解析牆板樑柱三維幾何！
          </li>
          <li>
            <b>方法 B (一鍵匯出 GLB・色彩最完整)：</b>在 Revit 中安裝免費外掛 <i>Revit to glTF Exporter</i> 或 <i>Datasmith</i>，直接在 3D 視圖點選「Export to GLB」，檔案容量極小且帶有完整材質。
          </li>
          <li>
            <b>方法 C (FBX / OBJ 轉檔)：</b>若有現成 3D 模型，直接匯出為 <b>.obj</b> 或透過 Blender 轉為 <b>.glb</b> 拖入即可！
          </li>
        </ol>
      </div>
    </div>
  `;
}

// 建立 U001 1700x3600 中階單元帷幕牆 3D 模型 (對應 中階族元件製成技術 規格)
function buildCurtainWallU001Group() {
  const group = new THREE.Group();
  group.name = 'curtain_wall_u001';

  // 材質庫
  const aluMat = new THREE.MeshStandardMaterial({
    color: 0x334155, // slate 700 陽極深灰烤漆
    metalness: 0.82,
    roughness: 0.32
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x38BDF8, // Low-E 複層玻璃青藍色反光
    transmission: 0.72,
    opacity: 0.82,
    transparent: true,
    roughness: 0.05,
    metalness: 0.12,
    reflectivity: 0.92,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08
  });

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x94A3B8, // 花崗岩沉穩灰
    roughness: 0.88,
    metalness: 0.06
  });

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x475569, // 結構鋼構牛腿
    metalness: 0.85,
    roughness: 0.35
  });

  const backpanMat = new THREE.MeshStandardMaterial({
    color: 0x64748B, // 鍍鋅保溫背板
    metalness: 0.65,
    roughness: 0.48
  });

  const slabMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    transparent: true,
    opacity: 0.28
  });

  // 1. 左公梃 (Left Mullion)
  const leftMullionGeo = new THREE.BoxGeometry(0.065, 3.64, 0.20);
  const leftMullion = new THREE.Mesh(leftMullionGeo, aluMat);
  leftMullion.position.set(-0.8175, 1.82, 0);
  leftMullion.userData = {
    part: 'left_mullion',
    origPos: leftMullion.position.clone(),
    explodeOffset: new THREE.Vector3(-0.45, 0, 0),
    bimInfo: {
      elementId: 'CW-U001-ML-L',
      name: '左公梃鋁擠型立柱 (Left Male Mullion)',
      category: 'Curtain Wall Mullion (帷幕立柱)',
      materialName: 'A6063-T5 陽極深灰鋁擠型 (氟碳烤漆)',
      specNote: '雙腔體斷熱結構・防變形鎖固槽口'
    }
  };
  group.add(leftMullion);

  // 2. 右母梃 (Right Mullion)
  const rightMullionGeo = new THREE.BoxGeometry(0.065, 3.64, 0.20);
  const rightMullion = new THREE.Mesh(rightMullionGeo, aluMat);
  rightMullion.position.set(0.8175, 1.82, 0);
  rightMullion.userData = {
    part: 'right_mullion',
    origPos: rightMullion.position.clone(),
    explodeOffset: new THREE.Vector3(0.45, 0, 0),
    bimInfo: {
      elementId: 'CW-U001-ML-R',
      name: '右母梃鋁擠型立柱 (Right Female Mullion)',
      category: 'Curtain Wall Mullion (帷幕立柱)',
      materialName: 'A6063-T5 陽極深灰鋁擠型 (含 EPDM 膠條槽)',
      specNote: '單元公母插接式氣密水密等壓腔'
    }
  };
  group.add(rightMullion);

  // 3. 上橫樑 (Top Transom)
  const topTransomGeo = new THREE.BoxGeometry(1.57, 0.08, 0.18);
  const topTransom = new THREE.Mesh(topTransomGeo, aluMat);
  topTransom.position.set(0, 3.56, 0.01);
  topTransom.userData = {
    part: 'top_transom',
    origPos: topTransom.position.clone(),
    explodeOffset: new THREE.Vector3(0, 0.35, 0),
    bimInfo: {
      elementId: 'CW-U001-TR-TOP',
      name: '上橫樑鋁擠型 (Top Head Transom)',
      category: 'Curtain Wall Mullion (帷幕橫樑)',
      materialName: 'A6063-T5 陽極深灰鋁擠型',
      specNote: '頂部排水披水構造與下層單元插接頭'
    }
  };
  group.add(topTransom);

  // 4. 下橫樑 (Bottom Transom)
  const btmTransomGeo = new THREE.BoxGeometry(1.57, 0.09, 0.18);
  const btmTransom = new THREE.Mesh(btmTransomGeo, aluMat);
  btmTransom.position.set(0, 0.06, 0.01);
  btmTransom.userData = {
    part: 'btm_transom',
    origPos: btmTransom.position.clone(),
    explodeOffset: new THREE.Vector3(0, -0.35, 0),
    bimInfo: {
      elementId: 'CW-U001-TR-BTM',
      name: '下橫樑鋁擠型底座 (Bottom Sill Transom)',
      category: 'Curtain Wall Mullion (帷幕橫樑)',
      materialName: 'A6063-T5 陽極深灰鋁擠型',
      specNote: '底部導水溝槽與防風壓扣件底座'
    }
  };
  group.add(btmTransom);

  // 5. 中腰橫樑 (Intermediate Transom)
  const midTransomGeo = new THREE.BoxGeometry(1.57, 0.075, 0.18);
  const midTransom = new THREE.Mesh(midTransomGeo, aluMat);
  midTransom.position.set(0, 1.10, 0.01);
  midTransom.userData = {
    part: 'mid_transom',
    origPos: midTransom.position.clone(),
    explodeOffset: new THREE.Vector3(0, 0, 0.25),
    bimInfo: {
      elementId: 'CW-U001-TR-MID',
      name: '中腰分隔橫樑 (Intermediate Transom)',
      category: 'Curtain Wall Mullion (中腰橫料)',
      materialName: 'A6063-T5 陽極深灰鋁擠型',
      specNote: '分隔上部透光視窗區與下部石材層間區'
    }
  };
  group.add(midTransom);

  // 6. 複層中空 Low-E 玻璃 (Vision IGU, 35mm 總厚度)
  const glassGeo = new THREE.BoxGeometry(1.57, 2.38, 0.035);
  const glassMesh = new THREE.Mesh(glassGeo, glassMat);
  glassMesh.position.set(0, 2.33, 0.05);
  glassMesh.userData = {
    part: 'glass',
    origPos: glassMesh.position.clone(),
    explodeOffset: new THREE.Vector3(0, 0.1, 0.55),
    bimInfo: {
      elementId: 'CW-U001-GL-01',
      name: '35mm 雙強化複層中空 Low-E 玻璃 (Vision IGU)',
      category: 'Curtain Panels (玻璃嵌板)',
      materialName: '8mm半反射強化 + 12A氬氣層 + 8mm強化 Low-E',
      specNote: '簡化為單一 35mm 實體，兼顧渲染光澤與檔案輕量化'
    }
  };
  group.add(glassMesh);

  // 7. 下段乾掛花崗岩飾板 (Spandrel Stone Panel)
  const stoneGeo = new THREE.BoxGeometry(1.57, 0.95, 0.03);
  const stoneMesh = new THREE.Mesh(stoneGeo, stoneMat);
  stoneMesh.position.set(0, 0.58, 0.055);
  stoneMesh.userData = {
    part: 'stone',
    origPos: stoneMesh.position.clone(),
    explodeOffset: new THREE.Vector3(0, -0.1, 0.6),
    bimInfo: {
      elementId: 'CW-U001-ST-01',
      name: '下段乾掛花崗岩外飾板 (Spandrel Stone Panel)',
      category: 'Curtain Panels (石材飾板)',
      materialName: '30mm 燒面深灰花崗石材 (背栓乾掛)',
      specNote: '耐候抗污石材面層，含結構矽利康耐候填縫'
    }
  };
  group.add(stoneMesh);

  // 8. 鍍鋅金屬保溫背板 (Insulation Backpan)
  const backpanGeo = new THREE.BoxGeometry(1.56, 0.94, 0.05);
  const backpanMesh = new THREE.Mesh(backpanGeo, backpanMat);
  backpanMesh.position.set(0, 0.58, -0.04);
  backpanMesh.userData = {
    part: 'backpan',
    origPos: backpanMesh.position.clone(),
    explodeOffset: new THREE.Vector3(0, -0.1, -0.45),
    bimInfo: {
      elementId: 'CW-U001-BP-01',
      name: '層間防火岩棉鍍鋅保溫背板 (Insulation Backpan)',
      category: 'Firestop & Insulation (防火保溫層)',
      materialName: '2.0mm 鍍鋅鋼板 + 50mm 高密度防火岩棉',
      specNote: '符合建築技術規則層間防火時效 1 小時以上規定'
    }
  };
  group.add(backpanMesh);

  // 9. 鋼構牛腿與預埋轉接件 (Steel Anchor Brackets)
  const anchorGeo = new THREE.BoxGeometry(0.12, 0.12, 0.15);
  const anchorPositions = [
    [-0.72, 3.35, -0.15],
    [0.72, 3.35, -0.15],
    [-0.72, 0.35, -0.15],
    [0.72, 0.35, -0.15]
  ];
  anchorPositions.forEach((pos, idx) => {
    const anchor = new THREE.Mesh(anchorGeo, steelMat);
    anchor.position.set(pos[0], pos[1], pos[2]);
    anchor.userData = {
      part: 'anchor_' + idx,
      origPos: anchor.position.clone(),
      explodeOffset: new THREE.Vector3(pos[0] * 0.35, 0, -0.4),
      bimInfo: {
        elementId: `CW-U001-ANC-0${idx + 1}`,
        name: `三維可調式鋼構牛腿轉接件 #${idx + 1} (Anchor Bracket)`,
        category: 'Structural Connections (結構轉接件)',
        materialName: 'SN490B 熱浸鍍鋅加勁角鋼 + M20 化學錨栓',
        specNote: '提供 X/Y/Z 三向施工誤差微調 (±25mm)'
      }
    };
    group.add(anchor);
  });

  // 10. 結構樓板邊緣參考層 (Floor Slab Edge Indicator)
  const slabTopGeo = new THREE.BoxGeometry(2.4, 0.2, 0.6);
  const slabTop = new THREE.Mesh(slabTopGeo, slabMat);
  slabTop.position.set(0, 3.5, -0.4);
  slabTop.userData = {
    part: 'slab_top',
    origPos: slabTop.position.clone(),
    explodeOffset: new THREE.Vector3(0, 0.3, -0.65),
    bimInfo: {
      elementId: 'STR-SLAB-UPPER',
      name: '上層 RC 結構樓板邊緣 (Upper Floor Slab)',
      category: 'Structural Floors (RC 樓板)',
      materialName: 'RC 鋼筋混凝土 (fc\'=280 kgf/cm²)',
      specNote: '帷幕吊掛固定基準面'
    }
  };
  group.add(slabTop);

  const slabBtmGeo = new THREE.BoxGeometry(2.4, 0.2, 0.6);
  const slabBtm = new THREE.Mesh(slabBtmGeo, slabMat);
  slabBtm.position.set(0, 0.1, -0.4);
  slabBtm.userData = {
    part: 'slab_btm',
    origPos: slabBtm.position.clone(),
    explodeOffset: new THREE.Vector3(0, -0.3, -0.65),
    bimInfo: {
      elementId: 'STR-SLAB-LOWER',
      name: '本層 RC 結構樓板邊緣 (Lower Floor Slab)',
      category: 'Structural Floors (RC 樓板)',
      materialName: 'RC 鋼筋混凝土 (fc\'=280 kgf/cm²)',
      specNote: '層間塞水路與防火填塞基準面'
    }
  };
  group.add(slabBtm);

  return group;
}

// 建立 5F RC 現場結構主體 3D 模型 (支援構件分解與點擊檢視)
function buildRcStructureGroup() {
  const group = new THREE.Group();
  group.name = 'rc_structure';

  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x94A3B8,
    roughness: 0.9,
    metalness: 0.1
  });

  const rebarMat = new THREE.MeshStandardMaterial({
    color: 0xEF4444, // 鋼筋待驗標記紅色
    roughness: 0.5,
    metalness: 0.7
  });

  const formworkMat = new THREE.MeshStandardMaterial({
    color: 0xF59E0B, // 模板工程琥珀色
    roughness: 0.7,
    metalness: 0.2
  });

  // 樓地板: 6m x 6m x 0.18m
  const slabGeo = new THREE.BoxGeometry(6, 0.18, 6);
  const slab = new THREE.Mesh(slabGeo, concreteMat);
  slab.position.set(0, 0.09, 0);
  slab.userData = {
    bimInfo: {
      elementId: 'RC-5F-SLAB-S1',
      name: '5F S1 雙層雙向 RC 結構樓地板 (厚180mm)',
      category: 'Structural Floors (結構樓板)',
      materialName: '預拌混凝土 fc\'=280 kgf/cm² (已完成養護)',
      specNote: '雙向 #4@150mm 鋼筋網配置'
    }
  };
  group.add(slab);

  // 4 根柱子: 0.6m x 3.2m x 0.6m
  const colGeo = new THREE.BoxGeometry(0.6, 3.2, 0.6);
  const colCoords = [
    [-2.2, 1.69, -2.2, 'C1-A1 (西北角柱)'],
    [2.2, 1.69, -2.2, 'C1-B1 (東北角柱)'],
    [-2.2, 1.69, 2.2, 'C1-A2 (西南角柱)'],
    [2.2, 1.69, 2.2, 'C1-B2 (東南角柱・模板組立中)']
  ];
  colCoords.forEach((c, idx) => {
    const isFormwork = (idx === 3);
    const mat = isFormwork ? formworkMat : concreteMat;
    const col = new THREE.Mesh(colGeo, mat);
    col.position.set(c[0], c[1], c[2]);
    col.userData = {
      bimInfo: {
        elementId: `RC-5F-COL-0${idx + 1}`,
        name: `5F 結構柱 ${c[3]} (600×600mm)`,
        category: 'Structural Columns (RC 結構柱)',
        materialName: isFormwork ? '清水複合模板組立加固中 (待查驗)' : 'RC 鋼筋混凝土 fc\'=280 kgf/cm² (已拆模)',
        specNote: '主筋 16-#8 SD420W，箍筋 #4@100/150mm'
      }
    };
    group.add(col);
  });

  // 主大樑: 0.4m x 0.7m x 4.4m
  const beamXGeo = new THREE.BoxGeometry(4.4, 0.7, 0.4);
  const beamX1 = new THREE.Mesh(beamXGeo, concreteMat);
  beamX1.position.set(0, 3.29 - 0.35, -2.2);
  beamX1.userData = {
    bimInfo: {
      elementId: 'RC-5F-BM-G1N',
      name: '5F 北側主大樑 G1-N (400×700mm)',
      category: 'Structural Framing (RC 主樑)',
      materialName: 'RC 鋼筋混凝土 fc\'=280 kgf/cm²',
      specNote: '抗彎主筋與兩端耐震韌性箍筋加密區'
    }
  };
  group.add(beamX1);

  const beamX2 = new THREE.Mesh(beamXGeo, concreteMat);
  beamX2.position.set(0, 3.29 - 0.35, 2.2);
  beamX2.userData = {
    bimInfo: {
      elementId: 'RC-5F-BM-G1S',
      name: '5F 南側主大樑 G1-S (400×700mm)',
      category: 'Structural Framing (RC 主樑)',
      materialName: 'RC 鋼筋混凝土 fc\'=280 kgf/cm²',
      specNote: '抗彎主筋與穿樑套管自主檢查合格'
    }
  };
  group.add(beamX2);

  const beamZGeo = new THREE.BoxGeometry(0.4, 0.7, 4.4);
  const beamZ1 = new THREE.Mesh(beamZGeo, concreteMat);
  beamZ1.position.set(-2.2, 3.29 - 0.35, 0);
  beamZ1.userData = {
    bimInfo: {
      elementId: 'RC-5F-BM-G2W',
      name: '5F 西側主大樑 G2-W (400×700mm)',
      category: 'Structural Framing (RC 主樑)',
      materialName: 'RC 鋼筋混凝土 fc\'=280 kgf/cm²',
      specNote: '與 C1 角柱剛接節點'
    }
  };
  group.add(beamZ1);

  const beamZ2 = new THREE.Mesh(beamZGeo, concreteMat);
  beamZ2.position.set(2.2, 3.29 - 0.35, 0);
  beamZ2.userData = {
    bimInfo: {
      elementId: 'RC-5F-BM-G2E',
      name: '5F 東側主大樑 G2-E (400×700mm)',
      category: 'Structural Framing (RC 主樑)',
      materialName: 'RC 鋼筋混凝土 fc\'=280 kgf/cm²',
      specNote: '與 C1 角柱剛接節點'
    }
  };
  group.add(beamZ2);

  // 頂層樑板綁筋指示 (鋼筋網格)
  let rebarIdx = 1;
  for (let i = -2; i <= 2; i += 0.5) {
    const barGeo = new THREE.CylinderGeometry(0.015, 0.015, 4.4);
    const barX = new THREE.Mesh(barGeo, rebarMat);
    barX.rotation.z = Math.PI / 2;
    barX.position.set(0, 3.35, i);
    barX.userData = {
      bimInfo: {
        elementId: `RC-6F-REB-X${rebarIdx}`,
        name: `頂層樓板 X向竹節鋼筋 #${rebarIdx} (SD420W)`,
        category: 'Structural Rebar (鋼筋籠待驗)',
        materialName: 'SD420W 高拉力竹節鋼筋 (#5@150mm)',
        specNote: '保護層墊塊與綁紮間距自主查驗中'
      }
    };
    group.add(barX);

    const barZ = new THREE.Mesh(barGeo, rebarMat);
    barZ.rotation.x = Math.PI / 2;
    barZ.position.set(i, 3.37, 0);
    barZ.userData = {
      bimInfo: {
        elementId: `RC-6F-REB-Z${rebarIdx}`,
        name: `頂層樓板 Y向竹節鋼筋 #${rebarIdx} (SD420W)`,
        category: 'Structural Rebar (鋼筋籠待驗)',
        materialName: 'SD420W 高拉力竹節鋼筋 (#5@150mm)',
        specNote: '保護層墊塊與水電管路預埋查驗中'
      }
    };
    group.add(barZ);
    rebarIdx++;
  }

  return group;
}

// 🏢 建立 4 棟 30 層大樓超大基地綜合開發案模型 (全景大視野驗證模型)
function buildFourTowersMegaProjectGroup() {
  const group = new THREE.Group();
  group.name = 'mega_4_towers_30f';

  // 材質庫
  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x94A3B8,
    roughness: 0.8,
    metalness: 0.15
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x38BDF8,
    transmission: 0.72,
    opacity: 0.85,
    transparent: true,
    roughness: 0.05,
    metalness: 0.25,
    reflectivity: 0.95
  });

  const spandrelMat = new THREE.MeshStandardMaterial({
    color: 0x334155, // 陽極暗青鐵灰
    roughness: 0.35,
    metalness: 0.75
  });

  const crownMat = new THREE.MeshStandardMaterial({
    color: 0x0284C7, // 天際線皇冠科技藍
    roughness: 0.25,
    metalness: 0.85
  });

  const siteGroundMat = new THREE.MeshStandardMaterial({
    color: 0x1E293B,
    roughness: 0.92
  });

  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x0F172A,
    roughness: 0.95
  });

  const plazaMat = new THREE.MeshStandardMaterial({
    color: 0x059669, // 中庭綠意公園
    roughness: 0.85
  });

  // 1. 超大基地地盤 (240m × 240m)
  const baseGeo = new THREE.BoxGeometry(240, 2, 240);
  const baseMesh = new THREE.Mesh(baseGeo, siteGroundMat);
  baseMesh.position.set(0, -1, 0);
  baseMesh.userData = {
    explodeOffset: new THREE.Vector3(0, -18, 0),
    bimInfo: {
      elementId: 'SITE-BASE-240',
      name: '全區綜合開發街廓基地盤 (240m×240m)',
      category: 'Toposolid & Site (基地地盤與地下室頂板)',
      materialName: '筏式基礎與地下 5 層連續壁結構體',
      specNote: '基地總面積 57,600 m²'
    }
  };
  group.add(baseMesh);

  // 外環環狀道路 (寬度 14m)
  const roadGeo = new THREE.BoxGeometry(232, 0.1, 232);
  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  roadMesh.position.set(0, 0.05, 0);
  roadMesh.userData = {
    explodeOffset: new THREE.Vector3(0, -10, 0),
    bimInfo: {
      elementId: 'SITE-ROAD-RING',
      name: '基地外環景觀車道與消防救災動線',
      category: 'Site Roads (環狀道路)',
      materialName: '透水瀝青混凝土鋪面 (厚100mm)',
      specNote: '全區雙向環狀車道與無障礙人行步道'
    }
  };
  group.add(roadMesh);

  // 中央下沉綠化廣場 (90m × 90m)
  const plazaGeo = new THREE.BoxGeometry(90, 0.2, 90);
  const plazaMesh = new THREE.Mesh(plazaGeo, plazaMat);
  plazaMesh.position.set(0, 0.1, 0);
  plazaMesh.userData = {
    explodeOffset: new THREE.Vector3(0, -5, 0),
    bimInfo: {
      elementId: 'SITE-PLAZA-CENTRAL',
      name: '中央生態綠化中庭廣場 (90m×90m)',
      category: 'Landscape Plaza (中央景觀綠地)',
      materialName: '複層植栽綠化與雨水貯留回收系統',
      specNote: '開放空間綠覆率 > 65%'
    }
  };
  group.add(plazaMesh);

  // 2. 4 棟 30 層大樓 (A/B/C/D 棟，每棟高達 108m ~ 125m)
  const towerPositions = [
    { code: 'A', name: 'A棟 (30F 智慧商辦大樓)', x: -62, z: -62 },
    { code: 'B', name: 'B棟 (30F 旗艦景觀豪邸)', x: 62, z: -62 },
    { code: 'C', name: 'C棟 (30F 研發科技總部)', x: -62, z: 62 },
    { code: 'D', name: 'D棟 (30F 國際會議中心)', x: 62, z: 62 }
  ];

  towerPositions.forEach((tp) => {
    const radialDir = new THREE.Vector3(tp.x, 0, tp.z).normalize();

    // 裙樓 (1F~3F 商業基座: 36m × 36m × 12m)
    const podiumGeo = new THREE.BoxGeometry(36, 12, 36);
    const podium = new THREE.Mesh(podiumGeo, concreteMat);
    podium.position.set(tp.x, 6, tp.z);
    podium.userData = {
      explodeOffset: radialDir.clone().multiplyScalar(22),
      bimInfo: {
        elementId: `TWR-${tp.code}-PODIUM`,
        name: `${tp.name} - 1F~3F 商業裙樓基座`,
        category: 'Building Podium (商業裙樓)',
        materialName: 'SRC 鋼骨鋼筋混凝土 + 乾掛石材基座',
        specNote: '挑高迎賓大廳與商業空間 (36m×36m×12m)'
      }
    };
    group.add(podium);

    // 主塔身 (4F~30F: 27層主體，高度 86.4m，斷面 26m × 26m)
    const towerH = 86.4;
    const towerY = 12 + towerH / 2;
    const bodyGeo = new THREE.BoxGeometry(26, towerH, 26);
    const body = new THREE.Mesh(bodyGeo, spandrelMat);
    body.position.set(tp.x, towerY, tp.z);
    body.userData = {
      explodeOffset: radialDir.clone().multiplyScalar(32).add(new THREE.Vector3(0, 12, 0)),
      bimInfo: {
        elementId: `TWR-${tp.code}-CORE`,
        name: `${tp.name} - 4F~30F 核心筒與結構主體`,
        category: 'Structural Core & Frame (超高層主體)',
        materialName: 'CFT 柱內灌漿高強度鋼骨結構 + 鋁板立面',
        specNote: '單層高 3.2m，共 30 層標準樓層'
      }
    };
    group.add(body);

    // 4 向大面積玻璃帷幕立面
    const glassSideGeo1 = new THREE.BoxGeometry(26.2, towerH - 2, 21);
    const glassSide1 = new THREE.Mesh(glassSideGeo1, glassMat);
    glassSide1.position.set(tp.x, towerY, tp.z);
    glassSide1.userData = {
      explodeOffset: radialDir.clone().multiplyScalar(48).add(new THREE.Vector3(0, 15, 0)),
      bimInfo: {
        elementId: `TWR-${tp.code}-CW-EW`,
        name: `${tp.name} - 東西向單元式 Low-E 玻璃帷幕系統`,
        category: 'Curtain Wall System (東西向單元帷幕)',
        materialName: '雙銀 Low-E 複層中空玻璃單元幕牆',
        specNote: '抗風壓 4500 Pa，水密性 1500 Pa'
      }
    };
    group.add(glassSide1);

    const glassSideGeo2 = new THREE.BoxGeometry(21, towerH - 2, 26.2);
    const glassSide2 = new THREE.Mesh(glassSideGeo2, glassMat);
    glassSide2.position.set(tp.x, towerY, tp.z);
    glassSide2.userData = {
      explodeOffset: radialDir.clone().multiplyScalar(62).add(new THREE.Vector3(0, 18, 0)),
      bimInfo: {
        elementId: `TWR-${tp.code}-CW-NS`,
        name: `${tp.name} - 南北向單元式 Low-E 玻璃帷幕系統`,
        category: 'Curtain Wall System (南北向單元帷幕)',
        materialName: '雙銀 Low-E 複層中空玻璃單元幕牆',
        specNote: '全棟模組化吊裝單元幕牆'
      }
    };
    group.add(glassSide2);

    // 樓層層間水平飾帶 (30 層完整層線)
    for (let f = 1; f <= 30; f++) {
      const slabY = f * 3.2;
      const ringGeo = new THREE.BoxGeometry(26.6, 0.4, 26.6);
      const ring = new THREE.Mesh(ringGeo, concreteMat);
      ring.position.set(tp.x, slabY, tp.z);
      ring.userData = {
        explodeOffset: radialDir.clone().multiplyScalar(32 + f * 0.45).add(new THREE.Vector3(0, f * 0.65, 0)),
        bimInfo: {
          elementId: `TWR-${tp.code}-FL-${String(f).padStart(2, '0')}F`,
          name: `${tp.name} - 第 ${f}F 結構樓板與層間飾帶`,
          category: 'Floor Slabs (標準層樓板)',
          materialName: '鋼承板複合 RC 樓板 + 陽極鋁合金層間飾帶',
          specNote: `設計高程 GL+${slabY.toFixed(1)}m`
        }
      };
      group.add(ring);
    }

    // 屋頂星空會所 / 科技冠頂 (高度 10m)
    const crownGeo = new THREE.BoxGeometry(20, 10, 20);
    const crown = new THREE.Mesh(crownGeo, crownMat);
    crown.position.set(tp.x, 98.4 + 5, tp.z);
    crown.userData = {
      explodeOffset: radialDir.clone().multiplyScalar(38).add(new THREE.Vector3(0, 38, 0)),
      bimInfo: {
        elementId: `TWR-${tp.code}-CROWN`,
        name: `${tp.name} - R1~R3 屋頂星空花園冠頂`,
        category: 'Roof Crown (屋突冠頂構造)',
        materialName: '天際線金屬格柵與太陽能光電帷幕頂冠',
        specNote: '含阻尼器室 (TMD) 與高空景觀會所'
      }
    };
    group.add(crown);

    // 建築避雷針與天際立柱 (高度 16m)
    const mastGeo = new THREE.CylinderGeometry(0.3, 0.8, 16);
    const mast = new THREE.Mesh(mastGeo, crownMat);
    mast.position.set(tp.x, 108.4 + 8, tp.z);
    mast.userData = {
      explodeOffset: radialDir.clone().multiplyScalar(42).add(new THREE.Vector3(0, 56, 0)),
      bimInfo: {
        elementId: `TWR-${tp.code}-SPIRE`,
        name: `${tp.name} - 航空障礙燈與避雷針塔尖`,
        category: 'Roof Spire (避雷塔尖)',
        materialName: 'SUS316 不鏽鋼抗風圓管立柱',
        specNote: '塔尖總高度 GL+124.4m'
      }
    };
    group.add(mast);
  });

  return group;
}

// =========================================================================
// 🏛️ 業界標準多構件語義化 IFC (ISO-10303-21) 三維幾何解析引擎
// 每個 ClosedShell / OpenShell / TriangulatedFaceSet 獨立生成 Mesh，
// 自動判別建築構件類別、配置 PBR 材質並支援獨立點擊檢視與爆炸分解！
// =========================================================================
function parseIFCToThreeGeometry(ifcText, THREE) {
  const points = new Map();
  const pointLists3D = new Map();
  const polyloops = new Map();
  const faces = new Map();
  const closedShells = new Map();
  const triangulatedSets = new Map();

  // 逐段解析 STEP 語句 (分號結尾)
  const statements = ifcText.split(';');
  const total = statements.length;

  for (let i = 0; i < total; i++) {
    const raw = statements[i].trim();
    if (!raw.startsWith('#')) continue;
    const eqIdx = raw.indexOf('=');
    if (eqIdx === -1) continue;

    const id = parseInt(raw.slice(1, eqIdx), 10);
    if (isNaN(id)) continue;
    const rest = raw.slice(eqIdx + 1);
    const parenIdx = rest.indexOf('(');
    if (parenIdx === -1) continue;

    const type = rest.slice(0, parenIdx).toUpperCase().trim();
    const argsStr = rest.slice(parenIdx + 1, rest.lastIndexOf(')'));

    if (type === 'IFCCARTESIANPOINT') {
      const match = argsStr.match(/\(([^)]+)\)/);
      if (match) {
        const coords = match[1].split(',').map(s => parseFloat(s.trim()) || 0);
        points.set(id, coords);
      }
    } else if (type === 'IFCCARTESIANPOINTLIST3D') {
      const coordMatches = argsStr.match(/\(\s*-?\d[^)]+\)/g);
      if (coordMatches) {
        const list = coordMatches.map(cm => cm.replace(/[()]/g, '').split(',').map(s => parseFloat(s.trim()) || 0));
        pointLists3D.set(id, list);
      }
    } else if (type === 'IFCTRIANGULATEDFACESET') {
      const ptListMatch = argsStr.match(/#(\d+)/);
      const idxMatches = argsStr.match(/\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g);
      if (ptListMatch && idxMatches) {
        const ptListId = parseInt(ptListMatch[1], 10);
        const tris = idxMatches.map(im => im.replace(/[()]/g, '').split(',').map(s => parseInt(s.trim(), 10) - 1));
        triangulatedSets.set(id, { ptListId, tris });
      }
    } else if (type === 'IFCPOLYLOOP') {
      const match = argsStr.match(/\(([^)]+)\)/);
      if (match) {
        const ptIds = match[1].split(',').map(s => parseInt(s.trim().replace('#', ''), 10)).filter(n => !isNaN(n));
        polyloops.set(id, ptIds);
      }
    } else if (type === 'IFCFACEOUTERBOUND' || type === 'IFCFACEBOUND') {
      const match = argsStr.match(/#(\d+)/);
      if (match) {
        faces.set(id, parseInt(match[1], 10));
      }
    } else if (type === 'IFCFACE') {
      const match = argsStr.match(/#(\d+)/);
      if (match) {
        faces.set(id, parseInt(match[1], 10));
      }
    } else if (type === 'IFCCLOSEDSHELL' || type === 'IFCOPENSHELL') {
      const match = argsStr.match(/\(([^)]+)\)/);
      if (match) {
        const faceIds = match[1].split(',').map(s => parseInt(s.trim().replace('#', ''), 10)).filter(n => !isNaN(n));
        closedShells.set(id, faceIds);
      }
    }
  }

  // 自動檢測長度單位 (公釐 mm vs 公尺 m)：若數值常態大於 50 則自動除以 1000
  let maxCoord = 0;
  for (const [, pt] of points.entries()) {
    for (const val of pt) {
      if (Math.abs(val) > maxCoord) maxCoord = Math.abs(val);
    }
    if (points.size > 150 && maxCoord > 100) break;
  }
  if (maxCoord === 0 && pointLists3D.size > 0) {
    for (const [, list] of pointLists3D.entries()) {
      for (const pt of list) {
        for (const val of pt) {
          if (Math.abs(val) > maxCoord) maxCoord = Math.abs(val);
        }
      }
      if (maxCoord > 100) break;
    }
  }
  const scale = maxCoord > 50 ? 0.001 : 1.0;

  const group = new THREE.Group();
  group.name = 'IFC_Imported_Model';

  // 依據幾何長寬高比例智慧推斷 IFC 構件語義與材質
  const buildSemanticIfcMesh = (verts, expressId, indexNum) => {
    if (!verts || verts.length < 9) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.computeVertexNormals();
    geo.computeBoundingBox();

    const bb = geo.boundingBox;
    const center = new THREE.Vector3();
    bb.getCenter(center);
    const size = new THREE.Vector3();
    bb.getSize(size);

    // 將頂點轉為構件自身局部座標，並將 Mesh.position 設於該構件自身幾何中心 (確保爆炸分解與點擊精準)
    geo.translate(-center.x, -center.y, -center.z);

    let category = 'IfcBuildingElement (建築實體構件)';
    let matColor = 0x94A3B8;
    let metalness = 0.25;
    let roughness = 0.65;
    let opacity = 1.0;
    let transparent = false;
    let matName = 'BIM 標準建築結構材質';

    const minHorizontal = Math.min(size.x, size.z);
    const maxHorizontal = Math.max(size.x, size.z);

    if (minHorizontal < 0.08 && size.y > 0.6 && maxHorizontal > 0.5) {
      // 薄型直立大面積版片 -> 玻璃嵌板或幕牆飾板
      category = 'IfcPlate / IfcCurtainWallPanel (帷幕嵌板/玻璃)';
      matColor = 0x38BDF8;
      metalness = 0.15;
      roughness = 0.1;
      opacity = 0.82;
      transparent = true;
      matName = '複層 Low-E 玻璃 / 帷幕單元嵌板';
    } else if (size.y > maxHorizontal * 2.2) {
      // 細長直立構件 -> 結構柱或帷幕立柱 (Mullion / Column)
      category = size.x < 0.35 ? 'IfcMember (帷幕鋁擠型立柱 Mullion)' : 'IfcColumn (結構柱構件)';
      matColor = size.x < 0.35 ? 0x334155 : 0x64748B;
      metalness = 0.75;
      roughness = 0.35;
      matName = size.x < 0.35 ? 'A6063-T5 陽極鋁擠型立柱' : 'RC / 鋼骨結構柱';
    } else if (size.y < 0.45 && maxHorizontal > size.y * 3) {
      if (minHorizontal < 0.35) {
        // 水平細長構件 -> 橫樑 (Transom / Beam)
        category = 'IfcBeam / IfcMember (水平橫樑構件)';
        matColor = 0x475569;
        metalness = 0.7;
        roughness = 0.4;
        matName = '鋁擠型橫料 / 結構橫樑';
      } else {
        // 扁平大面積 -> 樓板 (Slab)
        category = 'IfcSlab (結構樓板/平臺)';
        matColor = 0x94A3B8;
        metalness = 0.15;
        roughness = 0.85;
        matName = 'RC 鋼筋混凝土樓板';
      }
    }

    const mat = new THREE.MeshStandardMaterial({
      color: matColor,
      roughness,
      metalness,
      transparent,
      opacity,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(center);
    mesh.userData = {
      part: `ifc_${expressId}`,
      bimInfo: {
        elementId: `IFC-#${expressId}`,
        name: `IFC 構件 #${expressId} (序號 ${indexNum})`,
        category,
        materialName: matName,
        specNote: `STEP ExpressID #${expressId}・自動語義幾何分件`
      }
    };
    return mesh;
  };

  let meshCounter = 1;

  // 1. 逐個 ClosedShell / OpenShell 建立獨立 Mesh (支援構件分解與單獨點選)
  for (const [shellId, faceIds] of closedShells.entries()) {
    const shellVerts = [];
    for (const faceId of faceIds) {
      let loopId = faces.get(faceId) || faceId;
      let polyPtIds = polyloops.get(loopId);
      if (!polyPtIds && faces.has(loopId)) {
        polyPtIds = polyloops.get(faces.get(loopId));
      }
      if (!polyPtIds || polyPtIds.length < 3) continue;

      const polyPts = polyPtIds.map(pid => points.get(pid)).filter(p => !!p);
      if (polyPts.length < 3) continue;

      const p0 = polyPts[0];
      for (let j = 1; j < polyPts.length - 1; j++) {
        const p1 = polyPts[j];
        const p2 = polyPts[j + 1];
        shellVerts.push(
          p0[0] * scale, (p0[2] !== undefined ? p0[2] : 0) * scale, (p0[1] !== undefined ? -p0[1] : 0) * scale,
          p1[0] * scale, (p1[2] !== undefined ? p1[2] : 0) * scale, (p1[1] !== undefined ? -p1[1] : 0) * scale,
          p2[0] * scale, (p2[2] !== undefined ? p2[2] : 0) * scale, (p2[1] !== undefined ? -p2[1] : 0) * scale
        );
      }
    }
    const m = buildSemanticIfcMesh(shellVerts, shellId, meshCounter);
    if (m) {
      group.add(m);
      meshCounter++;
    }
  }

  // 2. 支援 IFC4 IfcTriangulatedFaceSet
  for (const [setId, setObj] of triangulatedSets.entries()) {
    const ptList = pointLists3D.get(setObj.ptListId);
    if (!ptList || ptList.length === 0) continue;
    const setVerts = [];
    for (const tri of setObj.tris) {
      const p0 = ptList[tri[0]];
      const p1 = ptList[tri[1]];
      const p2 = ptList[tri[2]];
      if (!p0 || !p1 || !p2) continue;
      setVerts.push(
        p0[0] * scale, (p0[2] !== undefined ? p0[2] : 0) * scale, (p0[1] !== undefined ? -p0[1] : 0) * scale,
        p1[0] * scale, (p1[2] !== undefined ? p1[2] : 0) * scale, (p1[1] !== undefined ? -p1[1] : 0) * scale,
        p2[0] * scale, (p2[2] !== undefined ? p2[2] : 0) * scale, (p2[1] !== undefined ? -p2[1] : 0) * scale
      );
    }
    const m = buildSemanticIfcMesh(setVerts, setId, meshCounter);
    if (m) {
      group.add(m);
      meshCounter++;
    }
  }

  // 3. 若無 Shell 則從 PolyLoop 回退建構
  if (group.children.length === 0 && polyloops.size > 0) {
    const fallbackVerts = [];
    for (const [, polyPtIds] of polyloops.entries()) {
      if (!polyPtIds || polyPtIds.length < 3) continue;
      const polyPts = polyPtIds.map(pid => points.get(pid)).filter(p => !!p);
      if (polyPts.length < 3) continue;
      const p0 = polyPts[0];
      for (let j = 1; j < polyPts.length - 1; j++) {
        const p1 = polyPts[j];
        const p2 = polyPts[j + 1];
        fallbackVerts.push(
          p0[0] * scale, (p0[2] !== undefined ? p0[2] : 0) * scale, (p0[1] !== undefined ? -p0[1] : 0) * scale,
          p1[0] * scale, (p1[2] !== undefined ? p1[2] : 0) * scale, (p1[1] !== undefined ? -p1[1] : 0) * scale,
          p2[0] * scale, (p2[2] !== undefined ? p2[2] : 0) * scale, (p2[1] !== undefined ? -p2[1] : 0) * scale
        );
      }
    }
    const m = buildSemanticIfcMesh(fallbackVerts, 100, 1);
    if (m) group.add(m);
  }

  return group;
}

// =========================================================================
// 🏢 3D BIM 管理器單例物件 (業界標準 WebGL 架構：零記憶體洩漏、全模型自動爆炸、Raycaster 點選檢視)
// =========================================================================
const bim3DManager = {
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  raycaster: null,
  animId: null,
  grid: null,
  currentGroup: null,
  selectedMesh: null,
  activeModelType: 'u001',
  isWireframe: false,
  isExploded: false,
  customObject: null,
  explodableMeshes: [],
  pointerDownPos: { x: 0, y: 0 },
  onResizeBound: null,
  onFsChangeBound: null,
  onKeyDownBound: null,
  onPointerDownBound: null,
  onPointerUpBound: null,

  init(containerEl, canvasEl) {
    if (typeof THREE === 'undefined') {
      console.warn('Three.js 尚未加載');
      return;
    }
    if (!containerEl || !canvasEl) return;

    this.dispose();

    const width = containerEl.clientWidth || 800;
    const height = containerEl.clientHeight || 520;

    // 1. 場景 (無霧氣阻擋，百米超高大樓與全區地平線清晰展現)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0F172A);
    this.scene.fog = null;

    // 2. 相機 (遠裁剪面拓展至 100,000 米，可同時鳥瞰 4 棟 30 層大樓乃至整個都市基地)
    const fov = state.bimWideFov ? 65 : 45;
    this.camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 100000);
    this.camera.position.set(200, 150, 250);

    // 3. 渲染器
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvasEl,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // 4. Raycaster 射線拾取器 (支援點擊 3D 構件高亮與屬性檢視)
    this.raycaster = new THREE.Raycaster();

    // 5. OrbitControls 空間軌道控制器 (無死角全角度球面旋轉 + 拓展最大縮放距離至 100,000 米)
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.08;
      this.controls.screenSpacePanning = true;
      this.controls.enableRotate = true;
      this.controls.rotateSpeed = 0.95;
      this.controls.minDistance = 0.05;
      this.controls.maxDistance = 100000;
      this.controls.minPolarAngle = 0;
      this.controls.maxPolarAngle = Math.PI;
      this.controls.minAzimuthAngle = -Infinity;
      this.controls.maxAzimuthAngle = Infinity;
      this.controls.target.set(0, 0, 0);
    }

    // 6. 建築光影 (全向多光源照射，確保仰視俯視角度皆立體分明)
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.85);
    this.scene.add(ambientLight);

    const dirLightTop = new THREE.DirectionalLight(0xFFFFFF, 0.95);
    dirLightTop.position.set(150, 300, 200);
    this.scene.add(dirLightTop);

    const dirLightBtm = new THREE.DirectionalLight(0xFFFFFF, 0.65);
    dirLightBtm.position.set(-150, -200, -150);
    this.scene.add(dirLightBtm);

    const fillLight = new THREE.DirectionalLight(0x38BDF8, 0.45);
    fillLight.position.set(-150, 50, -150);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xFFFFFF, 0.4);
    rimLight.position.set(0, 150, -250);
    this.scene.add(rimLight);

    // 7. 基準格線 (Grid)
    this.grid = new THREE.GridHelper(300, 30, 0x38BDF8, 0x334155);
    this.grid.position.y = -1;
    this.grid.visible = state.bimShowGrid !== false;
    this.scene.add(this.grid);

    // 8. 加載當前模型
    this.isWireframe = !!state.bimWireframe;
    this.isExploded = !!state.bimExploded;
    this.loadActiveModel();

    // 9. 渲染迴圈 (支援所有模型子構件平滑爆炸插值)
    const animate = () => {
      this.animId = requestAnimationFrame(animate);

      if (this.explodableMeshes && this.explodableMeshes.length > 0) {
        for (let i = 0; i < this.explodableMeshes.length; i++) {
          const mesh = this.explodableMeshes[i];
          if (mesh.userData && mesh.userData.origPos && mesh.userData.explodeOffset) {
            const targetX = mesh.userData.origPos.x + (this.isExploded ? mesh.userData.explodeOffset.x : 0);
            const targetY = mesh.userData.origPos.y + (this.isExploded ? mesh.userData.explodeOffset.y : 0);
            const targetZ = mesh.userData.origPos.z + (this.isExploded ? mesh.userData.explodeOffset.z : 0);
            mesh.position.x += (targetX - mesh.position.x) * 0.1;
            mesh.position.y += (targetY - mesh.position.y) * 0.1;
            mesh.position.z += (targetZ - mesh.position.z) * 0.1;
          }
        }
      }

      if (this.controls) {
        this.controls.update();
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };
    animate();

    // 10. 綁定事件監聽 (含視窗調整、全螢幕與 Raycaster 點擊拾取)
    this.onResizeBound = () => this.handleResize();
    window.addEventListener('resize', this.onResizeBound);

    this.onPointerDownBound = (e) => {
      this.pointerDownPos.x = e.clientX;
      this.pointerDownPos.y = e.clientY;
    };
    this.onPointerUpBound = (e) => {
      const dx = Math.abs(e.clientX - this.pointerDownPos.x);
      const dy = Math.abs(e.clientY - this.pointerDownPos.y);
      // 移動距離小於 6px 視為「點擊拾取構件」，大於 6px 為旋轉/平移拖曳
      if (dx < 6 && dy < 6 && e.button === 0) {
        this.handleCanvasClickInspect(e, canvasEl);
      }
    };
    canvasEl.addEventListener('pointerdown', this.onPointerDownBound);
    canvasEl.addEventListener('pointerup', this.onPointerUpBound);

    this.bindFullscreenEvents();
  },

  handleResize() {
    const wrap = document.getElementById('bim-canvas-wrap');
    if (!wrap || !this.renderer || !this.camera) return;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  },

  disposeGroupVRAM(group) {
    if (!group) return;
    group.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m && m.dispose && m.dispose());
          } else if (child.material.dispose) {
            child.material.dispose();
          }
        }
      }
    });
  },

  dispose() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (this.onResizeBound) {
      window.removeEventListener('resize', this.onResizeBound);
      this.onResizeBound = null;
    }
    if (this.onFsChangeBound) {
      document.removeEventListener('fullscreenchange', this.onFsChangeBound);
      document.removeEventListener('webkitfullscreenchange', this.onFsChangeBound);
      this.onFsChangeBound = null;
    }
    if (this.onKeyDownBound) {
      window.removeEventListener('keydown', this.onKeyDownBound);
      this.onKeyDownBound = null;
    }
    if (this.renderer && this.renderer.domElement) {
      if (this.onPointerDownBound) {
        this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDownBound);
      }
      if (this.onPointerUpBound) {
        this.renderer.domElement.removeEventListener('pointerup', this.onPointerUpBound);
      }
    }
    this.onPointerDownBound = null;
    this.onPointerUpBound = null;

    if (this.currentGroup && this.activeModelType !== 'custom') {
      this.disposeGroupVRAM(this.currentGroup);
    }
    if (this.grid) {
      this.disposeGroupVRAM(this.grid);
    }
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    this.scene = null;
    this.camera = null;
    this.currentGroup = null;
    this.selectedMesh = null;
    this.explodableMeshes = [];
    this.grid = null;
  },

  loadActiveModel() {
    if (!this.scene) return;
    this.clearSelectedMeshHighlight();

    if (this.currentGroup) {
      this.scene.remove(this.currentGroup);
      if (this.activeModelType !== 'custom') {
        this.disposeGroupVRAM(this.currentGroup);
      }
      this.currentGroup = null;
    }

    const type = state.bimActiveModel || 'u001';
    this.activeModelType = type;

    if (type === 'u001') {
      this.currentGroup = buildCurtainWallU001Group();
    } else if (type === 'mega_towers') {
      this.currentGroup = buildFourTowersMegaProjectGroup();
    } else if (type === 'rc_structure') {
      this.currentGroup = buildRcStructureGroup();
    } else if (type === 'custom') {
      if (this.customObject) {
        this.currentGroup = this.customObject;
      } else {
        this.currentGroup = buildCurtainWallU001Group();
        state.bimActiveModel = 'u001';
      }
    }

    if (this.currentGroup) {
      this.scene.add(this.currentGroup);
      this.fitModelAndCenterPivot(this.currentGroup);
      this.prepareBimModelMetadataAndExplode(this.currentGroup);
    }

    this.applyWireframe();
  },

  // 🎯 核心升級 1：全模型通用型自動爆炸向量與 BIM 構件元數據生成引擎
  // 確保任何模型 (U001 / 4棟30層大樓 / 5F RC結構 / 上傳的 IFC, GLB, OBJ) 皆可爆炸分解與點擊讀取尺寸！
  prepareBimModelMetadataAndExplode(group) {
    if (!group) return;
    this.explodableMeshes = [];

    group.updateMatrixWorld(true);
    const assemblyBox = new THREE.Box3().setFromObject(group);
    const assemblyCenter = assemblyBox.getCenter(new THREE.Vector3());
    const assemblySize = assemblyBox.getSize(new THREE.Vector3());
    const maxAssemblyDim = Math.max(assemblySize.x, assemblySize.y, assemblySize.z) || 5;

    let idx = 1;
    group.traverse((child) => {
      if (!child.isMesh || !child.geometry) return;

      if (!child.geometry.boundingBox) {
        child.geometry.computeBoundingBox();
      }

      // 儲存初始未偏移之基準局部座標 (防止重複調用時發生座標漂移)
      if (!child.userData.origPos) {
        child.userData.origPos = child.position.clone();
      } else {
        child.position.copy(child.userData.origPos);
      }

      // 計算該子構件在世界空間中的包圍盒與幾何中心
      const meshBox = new THREE.Box3().setFromObject(child);
      const meshCenter = meshBox.getCenter(new THREE.Vector3());
      const meshSize = meshBox.getSize(new THREE.Vector3());

      // 若該子構件尚未定義 explodeOffset，自動依構件中心與模型總中心之徑向向量計算爆炸位移
      if (!child.userData.explodeOffset) {
        const radial = meshCenter.clone().sub(assemblyCenter);
        if (radial.lengthSq() < 0.0001) {
          // 若子構件中心剛好與整體中心重疊，給予螺旋分層展開向量
          const angle = idx * 1.15;
          radial.set(Math.cos(angle), ((idx % 5) - 2) * 0.35, Math.sin(angle)).normalize().multiplyScalar(maxAssemblyDim * 0.22);
        } else {
          const dist = radial.length();
          radial.normalize().multiplyScalar(dist * 0.55 + maxAssemblyDim * 0.08);
        }
        child.userData.explodeOffset = radial;
      }

      // 補齊完整 BIM 構件規格屬性 (供點擊 Raycaster 即時讀取)
      const wMm = Math.max(1, Math.round(meshSize.x * 1000));
      const hMm = Math.max(1, Math.round(meshSize.y * 1000));
      const dMm = Math.max(1, Math.round(meshSize.z * 1000));
      const volM3 = (meshSize.x * meshSize.y * meshSize.z).toFixed(3);

      const existingInfo = child.userData.bimInfo || {};
      child.userData.bimInfo = {
        elementId: existingInfo.elementId || `BIM-EL-${String(idx).padStart(3, '0')}`,
        name: existingInfo.name || child.name || `3D 建築構件 #${idx}`,
        category: existingInfo.category || 'BIM Building Element (建築構件)',
        materialName: existingInfo.materialName || (child.material && child.material.name ? child.material.name : 'PBR 工程結構材質'),
        dimensionsMm: `${wMm.toLocaleString()} × ${hMm.toLocaleString()} × ${dMm.toLocaleString()} mm`,
        elevationM: `GL ${meshCenter.y >= 0 ? '+' : ''}${meshCenter.y.toFixed(2)} m`,
        volumeM3: `${volM3} m³`,
        specNote: existingInfo.specNote || '支援 360° 檢視與構件爆炸分解'
      };

      this.explodableMeshes.push(child);
      idx++;
    });

    // 更新底部狀態列顯示構件總數
    const statBox = document.getElementById('bim-stat-box');
    if (statBox) {
      statBox.innerHTML = `<span>構件數：<b>${this.explodableMeshes.length}</b> 件｜WebGL 60 FPS</span>`;
    }
  },

  // 🎯 核心升級 2：大視野零偏移自動置中演算法 (徹底修復重複呼叫時的位置累積漂移 Bug)
  fitModelAndCenterPivot(group) {
    if (!group || !this.scene) return;

    // 1. 先將群組位移歸零，並將所有子構件還原至基準位置後再計算真實包圍盒
    group.position.set(0, 0, 0);
    group.traverse((child) => {
      if (child.isMesh && child.userData && child.userData.origPos) {
        child.position.copy(child.userData.origPos);
      }
    });
    group.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // 2. 將模型的物理重心嚴格平移至 (0, 0, 0)
    group.position.sub(center);
    group.updateMatrixWorld(true);

    // 3. 將 OrbitControls 的旋轉中心點直接設在 (0, 0, 0)
    if (this.controls) {
      this.controls.target.set(0, 0, 0);
    }

    // 4. 動態調整基準參考網格位置與範圍 (自適應百米大樓或小構件)
    if (this.grid) {
      const bottomY = -size.y / 2 - 0.05;
      this.grid.position.set(0, bottomY, 0);
      const span = Math.max(size.x, size.z, 20);
      this.grid.scale.set(span / 10, 1, span / 10);
      this.grid.visible = state.bimShowGrid !== false;
    }

    // 5. 自動自適應計算相機距離 (依據包圍盒最大維度與視角 FOV 精確運算，保證 100% 完整容納全景全貌)
    if (this.camera && this.controls) {
      const maxDim = Math.max(size.x, size.y, size.z) || 10;
      const fovRad = (this.camera.fov * Math.PI) / 180;
      let fitDist = (maxDim / 2) / Math.tan(fovRad / 2) * 1.45;
      fitDist = Math.max(fitDist, 4);

      this.camera.near = Math.max(0.05, maxDim / 10000);
      this.camera.far = Math.max(100000, maxDim * 50);
      this.camera.updateProjectionMatrix();

      this.camera.position.set(fitDist * 0.95, fitDist * 0.65, fitDist * 1.15);
      this.camera.lookAt(0, 0, 0);

      this.controls.minDistance = Math.max(0.05, maxDim / 5000);
      this.controls.maxDistance = Math.max(100000, maxDim * 50);
      this.controls.update();
    }
  },

  // 🎯 核心升級 3：Raycaster 3D 構件點擊拾取與發光高亮檢視器
  handleCanvasClickInspect(event, canvasEl) {
    if (!this.raycaster || !this.camera || !this.currentGroup || !canvasEl) return;

    const rect = canvasEl.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    this.raycaster.setFromCamera(mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.explodableMeshes, false);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      this.selectAndHighlightMesh(hitMesh);
    } else {
      this.clearSelectedMeshHighlight();
    }
  },

  selectAndHighlightMesh(mesh) {
    if (!mesh) return;
    this.clearSelectedMeshHighlight();

    // 若共用材質則先行獨立複製一份材質，避免同材質構件一起變色
    if (mesh.material && !mesh.userData._matCloned) {
      mesh.material = mesh.material.clone();
      mesh.userData._matCloned = true;
    }

    if (mesh.material && mesh.material.emissive) {
      mesh.userData._origEmissiveHex = mesh.material.emissive.getHex();
      mesh.userData._origEmissiveIntensity = mesh.material.emissiveIntensity || 0;
      mesh.material.emissive.setHex(0x0EA5E9);
      mesh.material.emissiveIntensity = 0.55;
    }

    this.selectedMesh = mesh;
    const info = (mesh.userData && mesh.userData.bimInfo) ? mesh.userData.bimInfo : null;
    if (info) {
      this.renderSelectedComponentUI(info);
    }
  },

  clearSelectedMeshHighlight() {
    if (this.selectedMesh && this.selectedMesh.material && this.selectedMesh.material.emissive) {
      const origHex = this.selectedMesh.userData._origEmissiveHex !== undefined ? this.selectedMesh.userData._origEmissiveHex : 0x000000;
      const origInt = this.selectedMesh.userData._origEmissiveIntensity !== undefined ? this.selectedMesh.userData._origEmissiveIntensity : 0;
      this.selectedMesh.material.emissive.setHex(origHex);
      this.selectedMesh.material.emissiveIntensity = origInt;
    }
    this.selectedMesh = null;

    const hudEl = document.getElementById('bim-selected-hud');
    if (hudEl) {
      hudEl.classList.add('hidden');
      hudEl.innerHTML = '';
    }
    const inspectorBox = document.getElementById('bim-live-inspector-box');
    if (inspectorBox) {
      inspectorBox.innerHTML = '';
    }
  },

  renderSelectedComponentUI(info) {
    const hudEl = document.getElementById('bim-selected-hud');
    if (hudEl) {
      hudEl.classList.remove('hidden');
      hudEl.innerHTML = `
        <div class="bim-selected-hud-header">
          <span>🎯 已選取構件：<b>${info.name}</b></span>
          <button class="bim-selected-hud-close" onclick="window.appActions.clearBimSelection()">✕</button>
        </div>
        <div class="bim-selected-hud-body">
          <span>編號：${info.elementId}</span>
          <span>｜</span>
          <span>外包尺寸：<b>${info.dimensionsMm}</b></span>
          <span>｜</span>
          <span>材質：${info.materialName}</span>
        </div>
      `;
    }

    const inspectorBox = document.getElementById('bim-live-inspector-box');
    if (inspectorBox) {
      inspectorBox.innerHTML = `
        <div class="motion-card" style="margin-bottom:16px;border:2px solid #0EA5E9;background:#F0F9FF;">
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1.5px solid #BAE6FD;padding-bottom:8px;margin-bottom:10px;">
            <div>
              <div style="font-size:14.5px;font-weight:900;color:#0369A1;display:flex;align-items:center;gap:6px;">
                <span>🎯</span> 3D 點選構件即時 BIM 屬性檢測 (Raycaster Live Inspector)
              </div>
              <div style="font-size:11.5px;color:#0284C7;">點擊畫布空白處或右上按鈕即可取消選取高亮</div>
            </div>
            <button class="phrase-chip-item" style="background:#FFFFFF;border-color:#0284C7;color:#0284C7;" onclick="window.appActions.clearBimSelection()">取消選取 ✕</button>
          </div>
          <div class="bim-specs-grid" style="margin-bottom:0;">
            <div>
              <table class="bim-param-table">
                <tr><td class="bim-param-label">構件編號 (ID)</td><td class="bim-param-value" style="color:#0284C7;">${info.elementId}</td></tr>
                <tr><td class="bim-param-label">構件名稱</td><td class="bim-param-value">${info.name}</td></tr>
                <tr><td class="bim-param-label">BIM 分類</td><td class="bim-param-value">${info.category}</td></tr>
              </table>
            </div>
            <div>
              <table class="bim-param-table">
                <tr><td class="bim-param-label">實測外包尺寸</td><td class="bim-param-value" style="color:#059669;">${info.dimensionsMm}</td></tr>
                <tr><td class="bim-param-label">工程材質規格</td><td class="bim-param-value">${info.materialName}</td></tr>
                <tr><td class="bim-param-label">空間高程 / 備註</td><td class="bim-param-value">${info.elevationM} (${info.specNote})</td></tr>
              </table>
            </div>
          </div>
        </div>
      `;
    }
  },

  applyWireframe() {
    if (!this.currentGroup) return;
    this.currentGroup.traverse((child) => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => { if (m) m.wireframe = this.isWireframe; });
        } else {
          child.material.wireframe = this.isWireframe;
        }
      }
    });
  },

  bindFullscreenEvents() {
    if (this.onFsChangeBound) {
      document.removeEventListener('fullscreenchange', this.onFsChangeBound);
      document.removeEventListener('webkitfullscreenchange', this.onFsChangeBound);
    }
    this.onFsChangeBound = () => {
      const container = document.getElementById('bim-viewer-container');
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || (container && container.classList.contains('is-fullscreen')));
      if (container && !isFs) {
        container.classList.remove('is-fullscreen');
      }
      setTimeout(() => this.handleResize(), 60);
    };

    document.addEventListener('fullscreenchange', this.onFsChangeBound);
    document.addEventListener('webkitfullscreenchange', this.onFsChangeBound);

    if (this.onKeyDownBound) {
      window.removeEventListener('keydown', this.onKeyDownBound);
    }
    this.onKeyDownBound = (e) => {
      if (e.key === 'Escape') {
        const container = document.getElementById('bim-viewer-container');
        if (container && container.classList.contains('is-fullscreen')) {
          if (window.appActions && window.appActions.exitBimFullscreen) {
            window.appActions.exitBimFullscreen();
          }
        }
      }
    };
    window.addEventListener('keydown', this.onKeyDownBound);
  }
};


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

    <!-- 專案管理與刪除建錯專案 (安全移至設定區) -->
    <div class="motion-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div>
          <div style="font-size:14.5px;font-weight:900;color:var(--text-main);">📁 工程專案管理與清理</div>
          <div style="font-size:11px;color:var(--text-muted);">若有建錯或測試專案，可在此處安全刪除</div>
        </div>
        <button class="phrase-chip-item" style="padding:4px 10px;font-size:11.5px;font-weight:800;" onclick="window.appActions.openCreateProjectModal()">
          ＋ 新增專案
        </button>
      </div>

      <div style="display:flex;flex-direction:column;gap:4px;">
        ${state.projects.map(p => {
          const repCount = (p.reports || []).length;
          return `
            <div class="project-manage-item-row">
              <div class="project-manage-info">
                <div class="project-manage-name">${p.name}</div>
                <div class="project-manage-meta">工期：${p.usedDays}/${p.contractDays} 天 · ${repCount} 份日報</div>
              </div>
              <button class="btn-delete-project" onclick="window.appActions.deleteProject('${p.id}')">
                <span>🗑️</span> 刪除專案
              </button>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderToastNotice() {
  if (state.toastMessage) {
    const msg = state.toastMessage;
    state.toastMessage = '';
    setTimeout(() => showToast(msg), 15);
  }
  return '';
}

// =========================================================================
// 全域動作控制器 (window.appActions)
// =========================================================================
window.appActions = {
  // 🏢 3D BIM 輕量化檢視器動作 (業界標準無損局部 DOM 更新，絕不中斷 WebGL 與全螢幕)
  initBim3DViewer() {
    const container = document.getElementById('bim-canvas-wrap');
    const canvas = document.getElementById('bim-three-canvas');
    if (!container || !canvas) return;
    bim3DManager.init(container, canvas);
  },

  updateBimHudUI() {
    const fovBtn = document.getElementById('bim-btn-fov');
    const fovText = document.getElementById('bim-btn-fov-text');
    if (fovBtn) fovBtn.classList.toggle('active', !!state.bimWideFov);
    if (fovText) fovText.textContent = state.bimWideFov ? '超廣角(65°)' : '廣角視野';

    const gridBtn = document.getElementById('bim-btn-grid');
    if (gridBtn) gridBtn.classList.toggle('active', state.bimShowGrid !== false);

    const wireBtn = document.getElementById('bim-btn-wireframe');
    if (wireBtn) wireBtn.classList.toggle('active', !!state.bimWireframe);

    const expBtn = document.getElementById('bim-btn-explode');
    const expText = document.getElementById('bim-btn-explode-text');
    if (expBtn) expBtn.classList.toggle('active', !!state.bimExploded);
    if (expText) expText.textContent = state.bimExploded ? '復原組合' : '構件分解';
  },

  clearBimSelection() {
    bim3DManager.clearSelectedMeshHighlight();
  },

  switchBimModel(modelKey) {
    state.bimActiveModel = modelKey;
    state.bimExploded = false;
    bim3DManager.isExploded = false;
    renderApp();
  },

  toggleBimFullscreen() {
    const container = document.getElementById('bim-viewer-container');
    if (!container) return;

    const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || container.classList.contains('is-fullscreen'));
    if (!isFs) {
      container.classList.add('is-fullscreen');
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {
          bim3DManager.handleResize();
        });
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      }
      showToast('⛶ 已進入 3D 全螢幕模式 (按 ESC 或右上角按鈕退出)');
    } else {
      this.exitBimFullscreen();
    }
    setTimeout(() => bim3DManager.handleResize(), 80);
  },

  exitBimFullscreen() {
    const container = document.getElementById('bim-viewer-container');
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
    if (container) {
      container.classList.remove('is-fullscreen');
    }
    showToast('✕ 已退出全螢幕模式');
    setTimeout(() => bim3DManager.handleResize(), 80);
  },

  resetBimCamera() {
    state.bimExploded = false;
    bim3DManager.isExploded = false;
    bim3DManager.clearSelectedMeshHighlight();
    if (bim3DManager.currentGroup) {
      bim3DManager.fitModelAndCenterPivot(bim3DManager.currentGroup);
    } else {
      bim3DManager.loadActiveModel();
    }
    this.updateBimHudUI();
    showToast('🔄 視角與構件已重置為全景中心最佳角度');
  },

  toggleBimWireframe() {
    state.bimWireframe = !state.bimWireframe;
    bim3DManager.isWireframe = state.bimWireframe;
    bim3DManager.applyWireframe();
    this.updateBimHudUI();
    showToast(state.bimWireframe ? '🌐 已切換為線框檢視模式' : '🧱 已還原為實體材質模式');
  },

  toggleBimGrid() {
    state.bimShowGrid = state.bimShowGrid === false ? true : false;
    if (bim3DManager.grid) {
      bim3DManager.grid.visible = state.bimShowGrid;
    }
    this.updateBimHudUI();
    showToast(state.bimShowGrid ? '📏 參考網格已開啟' : '📏 參考網格已隱藏');
  },

  toggleBimWideFov() {
    state.bimWideFov = !state.bimWideFov;
    if (bim3DManager.camera) {
      bim3DManager.camera.fov = state.bimWideFov ? 65 : 45;
      bim3DManager.camera.updateProjectionMatrix();
    }
    this.updateBimHudUI();
    showToast(state.bimWideFov ? '🔭 已切換為超廣角全景視野 (65°)' : '🔭 已還原為標準視角 (45°)');
  },

  toggleBimExplode() {
    state.bimExploded = !state.bimExploded;
    bim3DManager.isExploded = state.bimExploded;
    this.updateBimHudUI();
    showToast(state.bimExploded ? '💥 構件平滑爆炸分解檢視中 (可點擊任一構件查看尺寸)' : '🧩 構件平滑復原組合完成');
  },

  triggerBimFileInput() {
    const uploader = document.getElementById('bim-file-uploader');
    if (uploader) uploader.click();
  },

  handleBimFileUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (file) {
      this.loadBimFileObject(file);
    }
    if (event.target) event.target.value = '';
  },

  handleBimDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    const wrap = document.getElementById('bim-canvas-wrap');
    if (wrap) wrap.style.outline = '2.5px dashed #38BDF8';
  },

  handleBimDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    const wrap = document.getElementById('bim-canvas-wrap');
    if (wrap) wrap.style.outline = 'none';
  },

  handleBimDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const wrap = document.getElementById('bim-canvas-wrap');
    if (wrap) wrap.style.outline = 'none';
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) {
      this.loadBimFileObject(file);
    }
  },

  loadBimFileObject(file) {
    const overlay = document.getElementById('bim-loading-overlay');
    if (overlay) overlay.classList.remove('hidden');

    const fileName = file.name;
    const ext = fileName.split('.').pop().toLowerCase();

    const reader = new FileReader();

    const applyCustomLoadedModel = (obj3D, labelType) => {
      if (bim3DManager.customObject && bim3DManager.customObject !== obj3D) {
        bim3DManager.disposeGroupVRAM(bim3DManager.customObject);
      }
      bim3DManager.customObject = obj3D;
      state.bimActiveModel = 'custom';
      state.bimCustomModelName = fileName;
      state.bimExploded = false;
      bim3DManager.isExploded = false;
      if (overlay) overlay.classList.add('hidden');
      renderApp();
      showToast(`✅ 成功載入 ${labelType} 模型：${fileName} (支援點擊構件與爆炸分解)`);
    };

    if (ext === 'glb' || ext === 'gltf') {
      reader.onload = (e) => {
        try {
          if (typeof THREE.GLTFLoader === 'undefined') {
            alert('GLTFLoader 尚在載入中，請稍候重試');
            if (overlay) overlay.classList.add('hidden');
            return;
          }
          const loader = new THREE.GLTFLoader();
          loader.parse(e.target.result, '', (gltf) => {
            applyCustomLoadedModel(gltf.scene, 'GLB/GLTF');
          }, (err) => {
            console.error(err);
            alert('3D 模型解析失敗：' + (err.message || '格式異常'));
            if (overlay) overlay.classList.add('hidden');
          });
        } catch (err) {
          console.error(err);
          alert('解析錯誤：' + err.message);
          if (overlay) overlay.classList.add('hidden');
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (ext === 'obj') {
      reader.onload = (e) => {
        try {
          if (typeof THREE.OBJLoader === 'undefined') {
            alert('OBJLoader 尚在載入中，請稍候重試');
            if (overlay) overlay.classList.add('hidden');
            return;
          }
          const loader = new THREE.OBJLoader();
          const obj = loader.parse(e.target.result);
          applyCustomLoadedModel(obj, 'OBJ');
        } catch (err) {
          console.error(err);
          alert('OBJ 模型解析失敗：' + err.message);
          if (overlay) overlay.classList.add('hidden');
        }
      };
      reader.readAsText(file);
    } else if (ext === 'ifc') {
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const ifcGroup = parseIFCToThreeGeometry(text, THREE);
          if (!ifcGroup || ifcGroup.children.length === 0) {
            throw new Error('未在該 IFC 檔案中找到可識別的三維網格或實體面 (可能為純專案結構或非實體視圖)');
          }
          applyCustomLoadedModel(ifcGroup, 'IFC');
        } catch (err) {
          console.error(err);
          alert('IFC 模型載入失敗：' + err.message);
          if (overlay) overlay.classList.add('hidden');
        }
      };
      reader.readAsText(file);
    } else {
      alert('不支援的檔案格式。請上傳 .ifc, .glb, .gltf 或 .obj 格式之 3D 模型。');
      if (overlay) overlay.classList.add('hidden');
    }
  },

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

  
  setStatsTradeFilter(tradeName) {
    state.statsTradeFilter = tradeName;
    state.toastMessage = tradeName === 'all' ? '🏷️ 已切換為全部工種綜合總覽' : '🏷️ 已鎖定分項：' + tradeName;
    renderApp();
  },

  setStatsRange(rangeKey) {
    state.statsFilterRange = rangeKey;
    renderApp();
  },

  exportStatsToPdf() {
    // 切換或確保在總報表視圖後觸發列印
    if (state.activeBottomTab !== 'stats') {
      state.activeBottomTab = 'stats';
      renderApp();
    }
    setTimeout(() => {
      window.print();
    }, 150);
  },

  exportStatsToExcel() {
    const proj = getActiveProject();
    const allReports = [...(proj.reports || [])].sort((a, b) => a.reportDateISO.localeCompare(b.reportDateISO));
    const range = state.statsFilterRange || 'all';
    const now = new Date();

    const customStart = state.statsCustomStartDate || (allReports.length > 0 ? allReports[0].reportDateISO : '2026-10-01');
    const customEnd = state.statsCustomEndDate || (allReports.length > 0 ? allReports[allReports.length - 1].reportDateISO : '2026-10-25');

    const filteredReports = allReports.filter(rep => {
      if (range === 'all') return true;
      if (range === 'custom') {
        return rep.reportDateISO >= customStart && rep.reportDateISO <= customEnd;
      }
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

    const rangeNames = {
      all: '全工期',
      week: '本週報表',
      month: '本月報表',
      quarter: '本季報表',
      last30: '近30天',
      custom: '自訂區間_' + customStart + '至' + customEnd
    };

    let csv = '\uFEFF"【' + proj.name.replace(/"/g, '""') + '】營建工程工務總體分析與資源配置總報表"\n';
    csv += '"承造單位：' + (proj.contractorCompany||'營造工程').replace(/"/g, '""') + '","統計區間：' + rangeNames[range] + '","製表時間：' + new Date().toLocaleString() + '"\n';
    csv += '"合約總工期：' + (proj.contractDays||480) + '天","已施工：' + (proj.usedDays||198) + '天","預定進度：' + (proj.plannedProgress||43.5) + '%","實際進度：' + (proj.actualProgress||41.3) + '%"\n\n';

    // 1. 各工種出工結構表
    csv += '"【一、各工種人力資源投入累計總表】"\n';
    csv += '"項次","工種名稱","單位","區間累計出工(人次)","單日最高出工"\n';
    const tradeMap = {};
    reports.forEach(r => {
      r.tradeRecords.filter(t => t.category === 'workers').forEach(w => {
        const qty = getTodayQty(w);
        if (!tradeMap[w.name]) tradeMap[w.name] = { name: w.name, unit: w.unit, total: 0, peak: 0 };
        tradeMap[w.name].total += qty;
        tradeMap[w.name].peak = Math.max(tradeMap[w.name].peak, qty);
      });
    });
    Object.values(tradeMap).sort((a,b)=>b.total - a.total).forEach((t, i) => {
      csv += '"' + (i+1) + '","' + t.name + '","' + t.unit + '","' + t.total + '","' + t.peak + '"\n';
    });
    csv += '\n';

    // 2. 施工機具設備統計表
    csv += '"【二、施工機具設備動員統計表】"\n';
    csv += '"項次","機具型號","單位","區間累計台班","單日最高進場"\n';
    const machMap = {};
    reports.forEach(r => {
      r.tradeRecords.filter(t => t.category === 'machinery').forEach(m => {
        const qty = getTodayQty(m);
        if (!machMap[m.name]) machMap[m.name] = { name: m.name, unit: m.unit, total: 0, peak: 0 };
        machMap[m.name].total += qty;
        machMap[m.name].peak = Math.max(machMap[m.name].peak, qty);
      });
    });
    Object.values(machMap).sort((a,b)=>b.total - a.total).forEach((m, i) => {
      csv += '"' + (i+1) + '","' + m.name + '","' + m.unit + '","' + m.total + '","' + m.peak + '"\n';
    });
    csv += '\n';

    // 3. 逐日施工進度與出工日誌
    csv += '"【三、區間逐日工程進度與出工日誌總表】"\n';
    csv += '"施工日期","上午天候","下午天候","本日施作進度","明日預定進度","出工人數","進場機具數","工區記事"\n';
    reports.forEach(r => {
      const workers = r.tradeRecords.filter(t => t.category === 'workers').reduce((sum, w) => sum + getTodayQty(w), 0);
      const machines = r.tradeRecords.filter(t => t.category === 'machinery').reduce((sum, m) => sum + getTodayQty(m), 0);
      csv += '"' + r.reportDateISO + '","' + r.weatherAM + '","' + r.weatherPM + '","' + (r.todayProgressSummary||'').replace(/"/g, '""') + '","' + (r.tomorrowPlanSummary||'').replace(/"/g, '""') + '","' + workers + '","' + machines + '","' + (r.importantNotes||'').replace(/"/g, '""') + '"\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${proj.name}_專案總報表_${rangeNames[range] || '全工期'}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    state.toastMessage = '📊 成功匯出【' + (rangeNames[range] || '全工期') + '】專案總報表 (EXCEL)！';
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

  
  completeReportAndShareLine() {
    saveState();
    const proj = getActiveProject();
    const rep = getActiveReport();
    const workers = rep.tradeRecords.filter(r => r.category === 'workers');
    const machines = rep.tradeRecords.filter(r => r.category === 'machinery');
    const totalW = workers.reduce((sum, w) => sum + getTodayQty(w), 0);
    const totalM = machines.reduce((sum, m) => sum + getTodayQty(m), 0);
    
    const txt = `【${proj.name} 施工日報】\n📅 日期：${formatDateWestern(rep.reportDateISO, 'slash_weekday')}\n☀️ 天候：上午 ${rep.weatherAM} / 下午 ${rep.weatherPM}\n👷 人力機具：出工 ${totalW} 人，機具 ${totalM} 台\n📌 本日施作：${rep.todayProgressSummary || '按進度順利施作'}\n📝 明日預定：${rep.tomorrowPlanSummary || '賡續施作'}\n🏢 承造單位：${proj.contractorCompany || '營造工程'}`;
    
    navigator.clipboard.writeText(txt).catch(() => {});
    state.toastMessage = '✅ 填報完成！已複製日報文字，即將開啟 LINE！';
    renderApp();
    
    setTimeout(() => {
      window.open('https://line.me/R/msg/text/?' + encodeURIComponent(txt), '_blank');
    }, 450);
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

  deleteProject(projId) {
    const targetProj = state.projects.find(p => p.id === projId);
    if (!targetProj) return;

    if (state.projects.length <= 1) {
      alert('⚠️ 系統中至少需保留一個工程專案，無法刪除最後一個專案！');
      return;
    }

    const confirmMsg = '確定要刪除「' + targetProj.name + '」嗎？\n\n⚠️ 注意：此操作將會清除該工程的所有日報紀錄且無法復原！';
    if (!confirm(confirmMsg)) return;

    // 執行刪除
    state.projects = state.projects.filter(p => p.id !== projId);

    // 如果刪除的是當前正選取的專案，自動切換至第一個現有專案
    if (state.activeProjId === projId) {
      state.activeProjId = state.projects[0].id;
      const reps = state.projects[0].reports || [];
      state.activeReportId = reps.length > 0 ? reps[reps.length - 1].id : null;
    }

    saveState();
    state.toastMessage = '🗑️ 已成功刪除專案：' + targetProj.name;
    renderApp();
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


// 監聽視窗尺寸自適應 (業界標準：僅動態更新 CSS 容器模式類別，絕不觸發 renderApp 重建 DOM，避免破壞 WebGL 與全螢幕狀態)
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    if (state.deviceMode === 'auto') {
      const root = document.getElementById('app-root');
      if (!root) return;
      const isPcNow = window.innerWidth >= 900;
      root.classList.toggle('is-pc-mode', isPcNow);
      root.classList.remove('is-mobile-preview');
      const devBtn = document.querySelector('.device-toggle-btn');
      if (devBtn) {
        devBtn.innerHTML = isPcNow ? '🖥️ 電腦版' : '📱 手機版';
      }
    }
  });
}
