/**
 * 營建工程管理日報表 App (UI/UX Pro Max 旗艦定案版 V6)
 * 已依照您的選擇完整實作：
 * 1. 預設啟用「🌿 MOYA 抹茶大地工匠風」，並於「⚙️ 設定與外觀」內建 4 種專業主題即時切換
 * 2. 內建全部 3 種導覽列佈局模式，可隨時從「⚙️ 設定與外觀」自由切換：
 *    - 模式 A (dual_pill)：頂部「步驟 1～8 橫向滑動導覽膠囊列」＋ 底部「上一頁／下一步」雙軌並行
 *    - 模式 B (immersive)：極簡沉浸單屏模式（點擊頂部「步驟 X/7 ▾」才展開 1～8 步跳頁選單）
 *    - 模式 C (bottom_tab)：底部常駐分頁列（Bottom Tab Bar：常駐於畫面最下方，支援左右滑動切換 1～8 頁）
 * 3. 操作介面側邊放不下時全面支援「左右滑動瀏覽 (.h-scroll-strip)」，功能與文字 100% 完整顯示不裁切
 * 4. 日期選擇欄位全面修正：步驟 2 具備「填報日期 / 開工日期 / 預定完工日」＋ 民國年即時對照 ＋ [◀ -1天 / 今天 / +1天 ▶] 快捷鍵；點擊卡片任意處直接喚醒月曆
 * 5. 文字輸入防鍵盤遮擋與光標自動追蹤：彈出鍵盤時自動顯示「⌨️ 鍵盤上方浮動輔助列（▲上一欄 / ▼下一欄 / ✓收起鍵盤）」，並動態調整可視區高度，確保永遠看得到光標位置
 */

const STORAGE_KEY = 'MOYA_SITE_REPORT_V6_UXPRO';
const PHRASES_KEY = 'MOYA_CUSTOM_WORK_PHRASES_V6';
const SETTINGS_KEY = 'MOYA_UI_SETTINGS_V6';
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const UI_THEMES = [
  { id: 'moya', name: '🌿 MOYA 抹茶大地工匠風 (預設推薦)', desc: '溫潤米白紙感＋森林抹茶綠，適合長時間填報' },
  { id: 'swiss', name: '☀️ Swiss 戶外強光高對比模式', desc: '7:1 超高對比純白深黑，大太陽下工地極致清晰' },
  { id: 'blueprint', name: '📐 Blueprint 現代工程科技藍', desc: 'BIM 儀表板與專業監造科技藍白配色' },
  { id: 'dark', name: '🌙 Dark OLED 夜間與地下室護眼模式', desc: '深色低眩光，適合地下室或夜間施工' },
];

const NAV_LAYOUT_MODES = [
  {
    id: 'dual_pill',
    name: '🧭 雙軌並行：頂部「1～8步橫向滑動膠囊列」＋底部「上一頁/下一步」(預設)',
    desc: '上方可隨時左右滑動跳頁，下方保留大顆換頁按鈕',
  },
  {
    id: 'immersive',
    name: '✨ 極簡沉浸單屏模式（點擊頂部才展開跳頁選單）',
    desc: '平常隱藏頂部步驟列，畫面最乾淨；點擊頂部「步驟 ▾」即可展開跳頁',
  },
  {
    id: 'bottom_tab',
    name: '📱 底部常駐分頁列（Bottom Tab Bar）',
    desc: '將 1～8 步分頁固定於畫面最下方，單手大拇指即可左右滑動切換',
  },
];

const STEP_NAV_ITEMS = [
  { step: 1, icon: '📁', short: '專案', label: '1.專案管理' },
  { step: 2, icon: '📅', short: '日期天氣', label: '2.日期天氣工期' },
  { step: 3, icon: '✍️', short: '今日進度', label: '3.今日進度' },
  { step: 4, icon: '📝', short: '明日進度', label: '4.明日進度' },
  { step: 5, icon: '👷', short: '人機料', label: '5.人機料紀錄' },
  { step: 6, icon: '📷', short: '現場照片', label: '6.現場照片' },
  { step: 7, icon: '📄', short: '預覽PDF', label: '7.日報預覽PDF' },
  { step: 8, icon: '📊', short: '專案總表', label: '8.專案總統計' },
];

const TRADE_CATEGORIES = [
  { key: 'temp_works', label: '假設工程', color: '#2F5D46' },
  { key: 'foundation', label: '基礎工程', color: '#4B7F65' },
  { key: 'structure', label: '結構工程', color: '#6FA086' },
  { key: 'mep', label: '機電工程', color: '#C59B5F' },
  { key: 'interior', label: '裝修工程', color: '#A67558' },
  { key: 'materials', label: '營建材料', color: '#3B6E75' },
  { key: 'machinery', label: '機具設備', color: '#2B5B6C' },
];

const MACHINERY_PALETTE = ['#2B5B6C', '#3B7A8C', '#C58B2B', '#6FA086', '#A67558', '#52796F'];

const DEFAULT_PHRASES = [
  '擋土柱施作',
  '施工架搭設及安全巡檢',
  '點井抽水及開挖觀測',
  '鋼筋進場檢驗及綁紮',
  '模板組立及支撐加固',
  '混凝土澆置及坍度試驗',
];

function getTodayQty(item) {
  if (!item) return 0;
  if (typeof item.todayQty === 'number' && !isNaN(item.todayQty)) {
    return Number(item.todayQty.toFixed(1));
  }
  const am = Number(item.morningQty || 0);
  const pm = Number(item.afternoonQty || 0);
  return Number((am + pm).toFixed(1));
}

function createSampleTrades(factor = 1, dayIndex = 0) {
  const f = n => Math.max(0, Math.round(n * factor));
  return [
    {
      id: 't1',
      category: 'temp_works',
      name: '施工架工程',
      unit: '人',
      todayQty: f(6),
      priorCumulative: 18 + dayIndex * 5,
      isSubcontracted: false,
      vendorName: '立安鷹架',
      todayWorkNote: '外牆施工架搭設及安全巡檢',
      tomorrowWorkNote: '施工架續搭設與安全母索檢點',
    },
    {
      id: 't2',
      category: 'temp_works',
      name: '普通工',
      unit: '人',
      todayQty: f(6),
      priorCumulative: 24 + dayIndex * 6,
      isSubcontracted: true,
      vendorName: '立安工程行',
      todayWorkNote: '工區安全圍籬與環境整理',
      tomorrowWorkNote: '現場動線維護與整理',
    },
    {
      id: 't3',
      category: 'foundation',
      name: '點井工程',
      unit: '人',
      todayQty: f(4),
      priorCumulative: 16 + dayIndex * 4,
      isSubcontracted: true,
      vendorName: '大地水井工程',
      todayWorkNote: '基礎開挖區點井抽水觀測',
      tomorrowWorkNote: '持續點井抽水與水位監測',
    },
    {
      id: 't4',
      category: 'foundation',
      name: '機械操作工',
      unit: '人',
      todayQty: f(3),
      priorCumulative: 15 + dayIndex * 3,
      isSubcontracted: true,
      vendorName: '大地基樁工程',
      todayWorkNote: '擋土柱施作鑽掘與導溝施作',
      tomorrowWorkNote: '擋土柱施作明日續作',
    },
    {
      id: 't5',
      category: 'structure',
      name: '鋼筋工',
      unit: '人',
      todayQty: f(8),
      priorCumulative: 45 + dayIndex * 7,
      isSubcontracted: true,
      vendorName: '順發鋼筋',
      todayWorkNote: '地樑與基礎鋼筋加工綁紮',
      tomorrowWorkNote: '基礎鋼筋續綁與保護層墊塊檢查',
    },
    {
      id: 't6',
      category: 'structure',
      name: '模板工',
      unit: '人',
      todayQty: f(5),
      priorCumulative: 30 + dayIndex * 4,
      isSubcontracted: true,
      vendorName: '宏泰模版',
      todayWorkNote: '基礎側模組立與支撐加固',
      tomorrowWorkNote: '模板垂直度校正',
    },
    {
      id: 't7',
      category: 'mep',
      name: '水電配管工',
      unit: '人',
      todayQty: f(4),
      priorCumulative: 20 + dayIndex * 3,
      isSubcontracted: true,
      vendorName: '永明機電',
      todayWorkNote: '接地銅棒與臨時水電管線配置',
      tomorrowWorkNote: '基礎穿樑套管預埋',
    },
    {
      id: 't8',
      category: 'interior',
      name: '泥作工',
      unit: '人',
      todayQty: f(2),
      priorCumulative: 10 + dayIndex * 2,
      isSubcontracted: false,
      vendorName: '',
      todayWorkNote: '工務所周邊截水溝修補',
      tomorrowWorkNote: '現場養護',
    },
    {
      id: 't9',
      category: 'materials',
      name: '鋼筋 SD420W',
      unit: '噸',
      todayQty: Number((12 * factor).toFixed(1)),
      priorCumulative: 120 + dayIndex * 10,
      isSubcontracted: false,
      vendorName: '東和鋼鐵',
      todayWorkNote: '竹節鋼筋進場檢驗合格',
      tomorrowWorkNote: '依進度吊放施作',
    },
    {
      id: 't10',
      category: 'materials',
      name: '預拌混凝土 4000psi',
      unit: 'm³',
      todayQty: Number((28 * factor).toFixed(1)),
      priorCumulative: 320 + dayIndex * 25,
      isSubcontracted: false,
      vendorName: '國產預拌廠',
      todayWorkNote: '擋土柱與地樑混凝土澆置',
      tomorrowWorkNote: '預定澆置 30m³',
    },
    {
      id: 't11',
      category: 'machinery',
      name: '怪手',
      unit: '台',
      todayQty: Math.max(1, Math.round(3 * factor)),
      priorCumulative: 35 + dayIndex * 3,
      isSubcontracted: true,
      vendorName: '大統重機械',
      todayWorkNote: '擋土柱施作開挖與土方整平',
      tomorrowWorkNote: '擋土柱施作配合開挖',
    },
    {
      id: 't12',
      category: 'machinery',
      name: '25T吊車',
      unit: '台',
      todayQty: factor >= 0.85 ? 2 : 1,
      priorCumulative: 18 + dayIndex * 1,
      isSubcontracted: true,
      vendorName: '宏昌起重',
      todayWorkNote: '鋼筋籠與施工架物料吊掛作業',
      tomorrowWorkNote: '續配合工區吊掛',
    },
    {
      id: 't13',
      category: 'machinery',
      name: '全套管基樁機',
      unit: '台',
      todayQty: factor >= 0.7 ? 1 : 0,
      priorCumulative: 14 + dayIndex * 1,
      isSubcontracted: true,
      vendorName: '大地基樁工程',
      todayWorkNote: '擋土柱全套管鑽掘施作',
      tomorrowWorkNote: '續鑽掘施作',
    },
    {
      id: 't14',
      category: 'machinery',
      name: '混凝土壓送車',
      unit: '台',
      todayQty: factor >= 1.0 ? 1 : 0,
      priorCumulative: 9 + Math.floor(dayIndex / 2),
      isSubcontracted: true,
      vendorName: '國產壓送',
      todayWorkNote: '基樁與PC混凝土泵送澆置',
      tomorrowWorkNote: '視澆置排程進場',
    },
  ];
}

function createCleanBlankTrades() {
  const defaultItems = [
    { id: 't1', category: 'temp_works', name: '施工架工程', unit: '人' },
    { id: 't2', category: 'temp_works', name: '普通工', unit: '人' },
    { id: 't3', category: 'foundation', name: '點井工程', unit: '人' },
    { id: 't4', category: 'foundation', name: '機械操作工', unit: '人' },
    { id: 't5', category: 'structure', name: '鋼筋工', unit: '人' },
    { id: 't6', category: 'structure', name: '模板工', unit: '人' },
    { id: 't7', category: 'mep', name: '水電配管工', unit: '人' },
    { id: 't8', category: 'interior', name: '泥作工', unit: '人' },
    { id: 't9', category: 'materials', name: '鋼筋 SD420W', unit: '噸' },
    { id: 't10', category: 'materials', name: '預拌混凝土', unit: 'm³' },
    { id: 't11', category: 'machinery', name: '怪手', unit: '台' },
    { id: 't12', category: 'machinery', name: '25T吊車', unit: '台' },
    { id: 't13', category: 'machinery', name: '全套管基樁機', unit: '台' },
  ];
  return defaultItems.map(item => ({
    ...item,
    todayQty: 0,
    priorCumulative: 0,
    isSubcontracted: false,
    vendorName: '',
    todayWorkNote: '',
    tomorrowWorkNote: '',
  }));
}

function createBlankReport(projName, compName) {
  const todayISO = new Date().toISOString().slice(0, 10);
  return {
    id: `rep_${Date.now()}`,
    projectName: projName,
    companyName: compName,
    reportDateISO: todayISO,
    startDateISO: todayISO,
    endDateISO: todayISO,
    totalContractDays: 365,
    usedDays: 1,
    workingDaysCount: 1,
    extendDays: 0,
    exemptDays: 0,
    excludedDays: 0,
    planCumProgress: 0,
    actualCumProgress: 0,
    todayPlanProgress: 0,
    weatherAM: '晴',
    weatherPM: '晴',
    siteEngineerCount: 1,
    todayProgressSummary: '',
    tomorrowPlanSummary: '',
    importantNotes: '',
    targetLineGroupName: `${projName}-工程回報群`,
    lineWebhookUrl: '',
    tradeRecords: createCleanBlankTrades(),
    photos: [],
  };
}

function createSampleMultiDayReports(projName, compName) {
  const days = [
    { date: '2026-10-19', used: 548, work: 420, plan: 4.60, act: 2.55, wAM: '晴', wPM: '晴', factor: 1.00 },
    { date: '2026-10-18', used: 547, work: 419, plan: 4.58, act: 2.51, wAM: '晴', wPM: '陰', factor: 1.25 },
    { date: '2026-10-17', used: 546, work: 418, plan: 4.55, act: 2.46, wAM: '陰', wPM: '晴', factor: 0.85 },
    { date: '2026-10-16', used: 545, work: 417, plan: 4.52, act: 2.42, wAM: '晴', wPM: '晴', factor: 1.35 },
    { date: '2026-10-15', used: 544, work: 416, plan: 4.49, act: 2.36, wAM: '雨', wPM: '陰', factor: 0.60 },
    { date: '2026-10-14', used: 543, work: 415, plan: 4.46, act: 2.33, wAM: '晴', wPM: '晴', factor: 1.15 },
    { date: '2026-10-13', used: 542, work: 414, plan: 4.43, act: 2.28, wAM: '晴', wPM: '晴', factor: 0.95 },
    { date: '2026-10-12', used: 541, work: 413, plan: 4.40, act: 2.24, wAM: '晴', wPM: '晴', factor: 1.10 },
    { date: '2026-10-11', used: 540, work: 412, plan: 4.37, act: 2.19, wAM: '陰', wPM: '陰', factor: 0.80 },
    { date: '2026-10-10', used: 539, work: 411, plan: 4.34, act: 2.15, wAM: '晴', wPM: '晴', factor: 1.30 },
    { date: '2026-10-09', used: 538, work: 410, plan: 4.31, act: 2.10, wAM: '晴', wPM: '晴', factor: 1.20 },
    { date: '2026-10-08', used: 537, work: 409, plan: 4.28, act: 2.05, wAM: '雨', wPM: '雨', factor: 0.50 },
    { date: '2026-10-07', used: 536, work: 408, plan: 4.25, act: 2.02, wAM: '陰', wPM: '晴', factor: 0.90 },
    { date: '2026-10-06', used: 535, work: 407, plan: 4.22, act: 1.98, wAM: '晴', wPM: '晴', factor: 1.15 },
    { date: '2026-10-05', used: 534, work: 406, plan: 4.19, act: 1.93, wAM: '晴', wPM: '晴', factor: 1.05 },
    { date: '2026-10-04', used: 533, work: 405, plan: 4.16, act: 1.89, wAM: '晴', wPM: '陰', factor: 0.95 },
    { date: '2026-10-03', used: 532, work: 404, plan: 4.13, act: 1.85, wAM: '晴', wPM: '晴', factor: 1.25 },
    { date: '2026-10-02', used: 531, work: 403, plan: 4.10, act: 1.80, wAM: '陰', wPM: '雨', factor: 0.70 },
    { date: '2026-10-01', used: 530, work: 402, plan: 4.07, act: 1.76, wAM: '晴', wPM: '晴', factor: 1.10 },
    { date: '2026-09-30', used: 529, work: 401, plan: 4.04, act: 1.72, wAM: '晴', wPM: '晴', factor: 1.00 },
  ];

  const totalLen = days.length;
  return days.map((d, idx) => {
    const chronologicalIdx = totalLen - 1 - idx;
    const trades = createSampleTrades(d.factor, chronologicalIdx);
    if (d.date === '2026-10-19') {
      trades.forEach(t => {
        if (t.name === '普通工') t.todayQty = 6;
        else if (t.name === '機械操作工') t.todayQty = 3;
        else if (t.category !== 'materials' && t.category !== 'machinery') t.todayQty = 0;
        else if (t.name === '怪手') t.todayQty = 3;
        else if (t.category === 'machinery') t.todayQty = 0;
      });
    }

    return {
      id: `rep_${d.date.replace(/-/g, '')}`,
      projectName: projName,
      companyName: compName,
      reportDateISO: d.date,
      startDateISO: '2026-06-05',
      endDateISO: '2029-03-23',
      totalContractDays: 1390,
      usedDays: d.used,
      workingDaysCount: d.work,
      extendDays: 0,
      exemptDays: 128,
      excludedDays: 0,
      planCumProgress: d.plan,
      actualCumProgress: d.act,
      todayPlanProgress: 0.02,
      weatherAM: d.wAM,
      weatherPM: d.wPM,
      siteEngineerCount: 8,
      todayProgressSummary: '1.擋土柱施作',
      tomorrowPlanSummary: '1.擋土柱施作',
      importantNotes: '',
      targetLineGroupName: `${projName}-監造工程回報群`,
      lineWebhookUrl: '',
      tradeRecords: trades,
      photos:
        idx === 0
          ? [
              {
                id: 'p1',
                uri: 'https://images.unsplash.com/photo-1541888946425-d09bb18086f6?auto=format&fit=crop&w=800&q=80',
                capturedAt: '115/10/19 09:20',
                gpsText: '25.0778°N, 121.3725°E',
                weatherTag: '晴',
                caption: '擋土柱施作現場查驗',
              },
              {
                id: 'p2',
                uri: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
                capturedAt: '115/10/19 14:45',
                gpsText: '25.0779°N, 121.3728°E',
                weatherTag: '晴',
                caption: '怪手進場施作與材料點收',
              },
            ]
          : [],
    };
  });
}

function createInitialProjects() {
  return [
    {
      id: 'proj_1',
      name: '拾光薈二期新建工程 (範例)',
      companyName: '豐譽營造股份有限公司',
      year: 2026,
      reports: createSampleMultiDayReports('拾光薈二期新建工程', '豐譽營造股份有限公司'),
    },
  ];
}

const state = {
  projects: [],
  customPhrases: [],
  // 使用者選擇預設：MOYA 抹茶大地工匠風 + 內建三種導覽模式可從設定切換 + 啟用鍵盤上方浮動輔助列
  uiTheme: 'moya',
  navLayoutMode: 'dual_pill', // 'dual_pill' | 'immersive' | 'bottom_tab'
  immersiveMenuExpanded: false,
  enableKeyboardAssistBar: true,
  activeProjId: 'proj_1',
  activeRepId: 'rep_20261019',
  currentStep: 1,
  statsStartDate: '2026-09-30',
  statsEndDate: '2026-10-19',
  activeCategory: 'temp_works',
  showTradeDetailNotes: false,
  expandedProjIds: { proj_1: true },
  showNewProjForm: false,
  errorModalOpen: false,
  lineModalOpen: false,
  settingsModalOpen: false,
  showWebhookInput: false,
  customLineText: '',
  toastMessage: '',
};

function applyThemeToDOM() {
  if (state.uiTheme && state.uiTheme !== 'moya') {
    document.documentElement.setAttribute('data-ui-theme', state.uiTheme);
  } else {
    document.documentElement.removeAttribute('data-ui-theme');
  }
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        state.projects = parsed;
        state.activeProjId = parsed[0].id;
        state.activeRepId = parsed[0].reports[0]?.id || '';
      }
    }
    const savedPhrases = localStorage.getItem(PHRASES_KEY);
    if (savedPhrases) {
      state.customPhrases = JSON.parse(savedPhrases);
    }
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      const parsedSet = JSON.parse(savedSettings);
      if (parsedSet.uiTheme) state.uiTheme = parsedSet.uiTheme;
      if (parsedSet.navLayoutMode) state.navLayoutMode = parsedSet.navLayoutMode;
      if (typeof parsedSet.enableKeyboardAssistBar === 'boolean') {
        state.enableKeyboardAssistBar = parsedSet.enableKeyboardAssistBar;
      }
    }
  } catch (e) {
    console.warn(e);
  }
  if (!state.projects || state.projects.length === 0) {
    state.projects = createInitialProjects();
  }
  if (!state.customPhrases || state.customPhrases.length === 0) {
    state.customPhrases = [...DEFAULT_PHRASES];
  }
  applyThemeToDOM();
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.projects));
    localStorage.setItem(PHRASES_KEY, JSON.stringify(state.customPhrases));
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        uiTheme: state.uiTheme,
        navLayoutMode: state.navLayoutMode,
        enableKeyboardAssistBar: state.enableKeyboardAssistBar,
      })
    );
  } catch (e) {
    console.warn(e);
  }
}

function getActiveProject() {
  return state.projects.find(p => p.id === state.activeProjId) || state.projects[0];
}

function getActiveReport() {
  const proj = getActiveProject();
  return proj.reports.find(r => r.id === state.activeRepId) || proj.reports[0];
}

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
  if (mode === 'full') {
    return y + '年' + mm + '月' + dd + '日 星期' + w;
  }
  return y + '/' + mm + '/' + dd;
}
const toMinguo = formatDateWestern;


function getWeekdayLabel(isoStr) {
  const parts = (isoStr || '').split('-').map(Number);
  if (parts.length !== 3 || isNaN(parts[0])) return '週一';
  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
  return `週${WEEKDAYS[dt.getDay()]}`;
}

function shiftISODate(isoStr, deltaDays) {
  const parts = (isoStr || '').split('-').map(Number);
  const dt =
    parts.length === 3 && !isNaN(parts[0])
      ? new Date(parts[0], parts[1] - 1, parts[2])
      : new Date();
  dt.setDate(dt.getDate() + deltaDays);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function detectReportErrors(rep) {
  const errors = [];
  if (!rep.reportDateISO) {
    errors.push({ step: 2, field: '日報日期', msg: '尚未填寫日報日期' });
  }
  if (rep.startDateISO && rep.endDateISO && rep.startDateISO > rep.endDateISO) {
    errors.push({ step: 2, field: '開工/完工日', msg: '開工日期不可晚於預定完工日期' });
  }
  if (rep.totalContractDays <= 0) {
    errors.push({ step: 2, field: '總工期', msg: '總工期日曆天必須大於 0 天' });
  }
  if (rep.usedDays < 0 || rep.usedDays > rep.totalContractDays + rep.extendDays) {
    errors.push({
      step: 2,
      field: '使用工期',
      msg: `使用工期 (${rep.usedDays}天) 超過總工期上限 (${rep.totalContractDays + rep.extendDays}天)`,
    });
  }
  if (rep.planCumProgress < 0 || rep.planCumProgress > 100) {
    errors.push({
      step: 2,
      field: '累積預定進度',
      msg: `預定進度百分比 (${rep.planCumProgress}%) 超出 0~100% 範圍`,
    });
  }
  if (rep.actualCumProgress < 0 || rep.actualCumProgress > 100) {
    errors.push({
      step: 2,
      field: '累積實際進度',
      msg: `實際進度百分比 (${rep.actualCumProgress}%) 超出 0~100% 範圍`,
    });
  }
  if (!rep.todayProgressSummary || !rep.todayProgressSummary.trim()) {
    errors.push({ step: 3, field: '今日進度', msg: '今日施工進度空白，請填寫或點選常用工項' });
  }
  if (!rep.tomorrowPlanSummary || !rep.tomorrowPlanSummary.trim()) {
    errors.push({ step: 4, field: '明日進度', msg: '明日預劃施作項目空白，請填寫明日計畫' });
  }

  const activeTrades = rep.tradeRecords.filter(r => getTodayQty(r) > 0);
  if (activeTrades.length === 0) {
    errors.push({
      step: 5,
      field: '出工與進場數量',
      msg: '今日所有工種、材料與機具進場數量皆為 0，請確認是否漏填',
    });
  }

  rep.tradeRecords.forEach(r => {
    const qty = getTodayQty(r);
    if (qty < 0) {
      errors.push({
        step: 5,
        cat: r.category,
        field: r.name,
        msg: `「${r.name}」的今日數量不可為負數`,
      });
    }
    if (qty > 0 && !r.unit.trim()) {
      errors.push({
        step: 5,
        cat: r.category,
        field: r.name,
        msg: `「${r.name}」有填寫數量但漏填「單位」`,
      });
    }
  });

  return errors;
}

function compileStandardLineText(rep) {
  const dateHeader = toMinguo(rep.reportDateISO, 'slash_weekday');
  const startMinguo = toMinguo(rep.startDateISO, 'chinese');
  const endMinguo = toMinguo(rep.endDateISO, 'chinese');
  const diff = (rep.actualCumProgress - rep.planCumProgress).toFixed(2);
  const remainDays = Math.max(0, rep.totalContractDays - rep.usedDays + rep.extendDays);

  const fmtW = w => (w && w.length === 1 && w !== '颱' ? `${w}天` : w);

  const workerItems = rep.tradeRecords.filter(
    r => r.category !== 'materials' && r.category !== 'machinery' && getTodayQty(r) > 0
  );
  const totalWorkers = Number(
    workerItems.reduce((acc, r) => acc + getTodayQty(r), 0).toFixed(1)
  );
  const totalStaffAndWorkers = Number((rep.siteEngineerCount + totalWorkers).toFixed(1));
  const workerLines = workerItems
    .map(r => `${r.name}: ${getTodayQty(r)}人`)
    .join('\n');

  const machItems = rep.tradeRecords.filter(
    r => r.category === 'machinery' && getTodayQty(r) > 0
  );
  const totalMach = Number(
    machItems.reduce((acc, r) => acc + getTodayQty(r), 0).toFixed(1)
  );
  const machLines = machItems
    .map(r => `${r.name}: ${getTodayQty(r)}${r.unit || '台'}`)
    .join('\n');

  const formatNumbered = txt => {
    const lines = (txt || '')
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
    if (lines.length === 0) return '1.擋土柱施作';
    return lines.map((l, i) => (/^\d+\./.test(l) ? l : `${i + 1}.${l}`)).join('\n');
  };

  return `${dateHeader}

一、工程進度狀況：
1.今日累積預定進度: ${Number(rep.planCumProgress).toFixed(2)}%
2.今日累積實際進度: ${Number(rep.actualCumProgress).toFixed(2)}%
3.今日預定進度: ${Number(rep.todayPlanProgress).toFixed(2)}%
4.累積進度超前: ${diff}%
5.開工日期: ${startMinguo}
6.總工期: ${rep.totalContractDays}日曆天(決標日起)
7.使用工期： ${rep.usedDays}天
8.剩餘工期： ${remainDays}天
9.展延工期：已核定 ${rep.extendDays}曆天
免計工期：已核定${rep.exemptDays}天
不計工期：已核定${rep.excludedDays}天
10.預定完工日:${endMinguo}
11.天候狀況： 上午/${fmtW(rep.weatherAM)} 下午/${fmtW(rep.weatherPM)}

二、本日工班出工狀況：
現場工程師+出工人數:${totalStaffAndWorkers}人
1.現場計工程師: ${rep.siteEngineerCount}人
2.今日出工合計: ${totalWorkers}人
${workerLines || '無出工'}
3.機具使用: ${totalMach}台
${machLines || '無'}

三、今日工項：
${formatNumbered(rep.todayProgressSummary)}
四、明日預劃施作項目：
${formatNumbered(rep.tomorrowPlanSummary)}
五、本日重要記事:
${rep.importantNotes || ''}

六、行動化填報:
已填報`;
}

/**
 * 智慧鍵盤防遮擋與光標自動置中引擎
 * 當使用者聚焦任何文字/數字輸入框 (除了 date/checkbox/file) 時：
 * 1. 立即啟動 keyboard-open 模式，展開「⌨️ 鍵盤上方浮動輔助列（▲上一欄 / ▼下一欄 / ✓收起鍵盤）」
 * 2. 自動將當前輸入框捲動至鍵盤上方可視區正中央，並自動捲動 textarea 內部捲軸確保游標 100% 可見
 */
let activeInputEl = null;

function isTextKeyboardInput(el) {
  if (!el) return false;
  if (el.tagName === 'TEXTAREA') return true;
  if (el.tagName === 'INPUT') {
    const t = (el.type || 'text').toLowerCase();
    return t === 'text' || t === 'number' || t === 'tel' || t === 'search' || t === 'url';
  }
  return false;
}

function ensureFocusedInputVisible(el) {
  if (!el) return;
  activeInputEl = el;
  if (state.enableKeyboardAssistBar && isTextKeyboardInput(el)) {
    document.body.classList.add('keyboard-open');
  }
  const scrollTargetIntoView = () => {
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      if (el.tagName === 'TEXTAREA') {
        const isAtEnd = el.selectionEnd >= (el.value || '').length - 3;
        if (isAtEnd) {
          el.scrollTop = el.scrollHeight;
        }
      }
    } catch {
      // ignore
    }
  };
  setTimeout(scrollTargetIntoView, 50);
  setTimeout(scrollTargetIntoView, 260);
}

function setupVisualViewportKeyboardGuard() {
  if (!window.visualViewport) return;
  const handleViewportChange = () => {
    const vv = window.visualViewport;
    document.documentElement.style.setProperty('--vvh', `${vv.height}px`);
    const isKeyboardOpen = vv.height < window.innerHeight * 0.84;
    if (isKeyboardOpen) {
      document.body.classList.add('keyboard-open');
      if (document.activeElement && isTextKeyboardInput(document.activeElement)) {
        ensureFocusedInputVisible(document.activeElement);
      }
    } else if (!isTextKeyboardInput(document.activeElement)) {
      document.body.classList.remove('keyboard-open');
    }
  };
  window.visualViewport.addEventListener('resize', handleViewportChange);
  window.visualViewport.addEventListener('scroll', handleViewportChange);
  handleViewportChange();
}

function bindAdaptiveInputsAndEnterNext() {
  const textareas = document.querySelectorAll('.adaptive-textarea');
  textareas.forEach(ta => {
    const fitHeight = () => {
      ta.style.height = 'auto';
      const maxH = document.body.classList.contains('keyboard-open') ? 150 : 220;
      ta.style.height = Math.min(maxH, Math.max(76, ta.scrollHeight)) + 'px';
      ensureFocusedInputVisible(ta);
    };
    fitHeight();
    ta.addEventListener('input', fitHeight);
    ta.addEventListener('focus', () => ensureFocusedInputVisible(ta));
    ta.addEventListener('click', () => ensureFocusedInputVisible(ta));
    ta.addEventListener('keyup', () => ensureFocusedInputVisible(ta));
  });

  const allInputs = Array.from(document.querySelectorAll('input, textarea'));
  allInputs.forEach(inp => {
    inp.addEventListener('focus', () => ensureFocusedInputVisible(inp));
    inp.addEventListener('blur', () => {
      setTimeout(() => {
        if (!isTextKeyboardInput(document.activeElement)) {
          document.body.classList.remove('keyboard-open');
        }
      }, 150);
    });
  });

  const enterInputs = Array.from(document.querySelectorAll('input[data-enter-next="true"]'));
  enterInputs.forEach((inp, idx) => {
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const nextInp = enterInputs[idx + 1];
        if (nextInp) {
          nextInp.focus();
          if (typeof nextInp.select === 'function') nextInp.select();
          ensureFocusedInputVisible(nextInp);
        } else {
          inp.blur();
          document.body.classList.remove('keyboard-open');
        }
      }
    });
  });

  // 自動將頂部或底部導覽列之當前步驟捲動至中央可見位置
  const activeStepBtn = document.querySelector('.step-pill-btn.active, .bottom-tab-item.active');
  if (activeStepBtn) {
    try {
      activeStepBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    } catch {
      // ignore
    }
  }

  const activeCatBtn = document.querySelector('.btn-cat-tab.active');
  if (activeCatBtn) {
    try {
      activeCatBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    } catch {
      // ignore
    }
  }

  const kbarContainers = document.querySelectorAll('.kbar-chart-wrapper');
  kbarContainers.forEach(box => {
    if (box.scrollWidth > box.clientWidth) {
      box.scrollLeft = box.scrollWidth;
    }
  });
}

function renderApp() {
  const root = document.getElementById('app-root');
  if (!root) return;

  applyThemeToDOM();
  const proj = getActiveProject();
  const rep = getActiveReport();
  const errors = detectReportErrors(rep);

  let stepCardContent = '';
  if (state.currentStep === 1) stepCardContent = renderStep1Projects();
  else if (state.currentStep === 2) stepCardContent = renderStep2WeatherAndSchedule(rep);
  else if (state.currentStep === 3) stepCardContent = renderStep3TodayProgress(rep);
  else if (state.currentStep === 4) stepCardContent = renderStep4TomorrowAndNotes(rep);
  else if (state.currentStep === 5) stepCardContent = renderStep5Trades(rep);
  else if (state.currentStep === 6) stepCardContent = renderStep6Photos(rep);
  else if (state.currentStep === 7) stepCardContent = renderStep7PreviewAndCharts(rep, errors);
  else if (state.currentStep === 8) stepCardContent = renderStep8ProjectRangeStats(proj);

  // 依據使用者在「⚙️ 設定與外觀」選擇的導覽佈局模式 (dual_pill / immersive / bottom_tab) 決定顯示方式
  const showTopPillBar =
    state.navLayoutMode === 'dual_pill' ||
    (state.navLayoutMode === 'immersive' && state.immersiveMenuExpanded);

  const stepNavHtml = showTopPillBar
    ? `<nav class="step-pill-nav no-print" aria-label="填報步驟快速切換列">
        ${STEP_NAV_ITEMS.map(
          it => `
          <button class="step-pill-btn ${state.currentStep === it.step ? 'active' : ''}"
                  onclick="window.appActions.setStep(${it.step})">
            ${it.label}
          </button>`
        ).join('')}
      </nav>`
    : '';

  const bottomTabBarHtml =
    state.navLayoutMode === 'bottom_tab'
      ? `<nav class="bottom-tab-bar no-print" aria-label="底部常駐分頁列">
          ${STEP_NAV_ITEMS.map(
            it => `
            <button class="bottom-tab-item ${state.currentStep === it.step ? 'active' : ''}"
                    onclick="window.appActions.setStep(${it.step})">
              <span style="font-size:14px;">${it.icon}</span>
              <span>${it.short}</span>
            </button>`
          ).join('')}
        </nav>`
      : '';

  const validationBarHtml =
    errors.length === 0
      ? `<div class="validation-bar ok no-print" onclick="window.appActions.toggleErrorModal(true)">
           <span>✅ 自動偵測檢核：填寫正常 (0 項異常)</span>
           <span>點此檢視 ▾</span>
         </div>`
      : `<div class="validation-bar err no-print" onclick="window.appActions.toggleErrorModal(true)">
           <span>⚠️ 偵測到 ${errors.length} 項異常：${errors[0].msg}</span>
           <span>點擊修正 ▾</span>
         </div>`;

  const immersiveToggleBtnHtml =
    state.navLayoutMode === 'immersive'
      ? `<button class="btn-top-action" style="background:var(--matcha-dark);" onclick="window.appActions.toggleImmersiveMenu()">
           🧭 步驟 ${state.currentStep}/8 ${state.immersiveMenuExpanded ? '▴' : '▾'}
         </button>`
      : '';

  root.innerHTML = `
    
    <header class="app-topbar no-print">
      <div class="topbar-left" onclick="window.appActions.setStep(1)" title="回專案管理">
        <span style="font-size:18px;">🏗️</span>
        <h1 class="app-main-title">營建日報</h1>
        <span class="topbar-step-pill">${state.currentStep}/8</span>
      </div>
      <div class="topbar-right">
        ${immersiveToggleBtnHtml}
        <button class="btn-top-item" onclick="window.appActions.openProjectRangeStats('${proj.id}')">
          <span>📊</span> 專案總表
        </button>
        <button class="btn-top-item" onclick="window.appActions.openLineModal()">
          <span>💬</span> LINE
        </button>
        <button class="btn-top-item btn-settings-highlight" onclick="window.appActions.toggleSettingsModal(true)">
          <span>⚙️</span> 設定
        </button>
      </div>
    </header>


    ${stepNavHtml}
    ${validationBarHtml}

    <section class="main-card">
      ${stepCardContent}
      ${
        state.enableKeyboardAssistBar
          ? `<div class="keyboard-assist-bar no-print">
              <span style="font-size:11.5px;font-weight:800;color:var(--matcha-primary);">⌨️ 鍵盤防遮擋輔助列</span>
              <div style="display:flex;gap:6px;">
                <button type="button" class="phrase-chip" style="padding:3px 9px;" onmousedown="event.preventDefault();window.appActions.focusAdjacentInput(-1)" ontouchstart="event.preventDefault();window.appActions.focusAdjacentInput(-1)">▲ 上一欄</button>
                <button type="button" class="phrase-chip" style="padding:3px 9px;" onmousedown="event.preventDefault();window.appActions.focusAdjacentInput(1)" ontouchstart="event.preventDefault();window.appActions.focusAdjacentInput(1)">▼ 下一欄</button>
                <button type="button" class="btn-top-action" style="height:26px;font-size:11.5px;padding:0 10px;" onmousedown="event.preventDefault();window.appActions.dismissKeyboard()" ontouchstart="event.preventDefault();window.appActions.dismissKeyboard()">✓ 收起鍵盤</button>
              </div>
            </div>`
          : ''
      }
    </section>

    <!-- 浮動跳下一欄按鈕 -->
    ${[2, 3, 4, 5].includes(state.currentStep) ? `<button class="floating-jump-btn no-print" onclick="window.appActions.focusAdjacentInput(1)">⬇️ 跳下一欄</button>` : ''}

${bottomTabBarHtml}

    ${state.errorModalOpen ? renderErrorCheckModal(errors) : ''}
    ${state.lineModalOpen ? renderLineModal(rep) : ''}
    ${state.settingsModalOpen ? renderSettingsModal() : ''}
  `;

  bindAdaptiveInputsAndEnterNext();
}

// ================= (1) 建立專案 =================

function renderStep1Projects() {
  const projItems = state.projects
    .map(p => {
      const reports = p.reports || [];
      return `
      <div class="proj-clean-card">
        <!-- 上排完整工程名稱 -->
        <div class="proj-clean-header">
          <div class="proj-clean-title">${p.name}</div>
          <div class="proj-clean-sub">${p.contractorCompany || '營造工程'} · 現有 ${reports.length} 份日報紀錄</div>
        </div>

        <!-- 名稱下方為那三個按鈕：新增日報 / 總統計 / 刪除專案 -->
        <div class="proj-clean-actions">
          <button class="btn-proj-action btn-add-report" onclick="window.appActions.createNewReport('${p.id}')">
            ➕ 新增日報
          </button>
          <button class="btn-proj-action btn-stats" onclick="window.appActions.openProjectRangeStats('${p.id}')">
            📊 總統計
          </button>
          <button class="btn-proj-action btn-del-proj" onclick="window.appActions.deleteProject('${p.id}')">
            🗑️ 刪除專案
          </button>
        </div>

        <!-- 下方日報清單 (點選即可直接進入填報) -->
        <div class="proj-reports-stream">
          ${reports
            .map(
              r => `
            <div class="proj-report-row" onclick="window.appActions.openReport('${p.id}','${r.id}')">
              <span class="report-row-date">📅 ${formatDateWestern(r.reportDateISO, 'slash_weekday')}</span>
              <span class="report-row-action">進入填報 ❯</span>
            </div>`
            )
            .join('')}
        </div>
      </div>`;
    })
    .join('');

  return `
    <div class="card-header">
      <div class="card-title-row">
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="step-num-badge">1</span>
          <h2 class="card-step-title">專案管理</h2>
        </div>
      </div>
      <p class="card-step-desc">點選工程名稱下方按鈕即可直接新增日報、檢視總統計或刪除專案。</p>
    </div>

    <div class="card-body">
      ${
        !state.showNewProjForm
          ? `<button class="btn-create-proj-hero" onclick="window.appActions.toggleNewProjForm(true)">＋ 建立新工程專案 (空白日報)</button>`
          : `<div class="new-proj-form-box">
              <input id="new-proj-name" data-enter-next="true" enterkeyhint="next" class="adaptive-input" placeholder="輸入完整工程名稱 (例: 臺中水湳經貿園區新建工程)..." />
              <input id="new-proj-comp" data-enter-next="true" enterkeyhint="done" class="adaptive-input" placeholder="輸入營造廠商名稱 (例: 臺灣營造股份有限公司)..." />
              <div class="btn-row-2">
                <button class="btn-full-gray" style="height:38px;" onclick="window.appActions.toggleNewProjForm(false)">取消</button>
                <button class="btn-full-green" style="height:38px;" onclick="window.appActions.confirmCreateProject()">確認建立專案</button>
              </div>
            </div>`
      }

      ${projItems}

      <div class="backup-actions-row">
        <button class="btn-subtle-link" onclick="window.appActions.exportBackup()">💾 匯出專案備份檔</button>
        <span style="color:var(--border-color);">|</span>
        <button class="btn-subtle-link" onclick="window.appActions.importBackup()">📥 匯入專案備份檔</button>
      </div>
    </div>

    <div class="card-footer">
      <button class="btn-full-green" onclick="window.appActions.setStep(2)">進入當日日報填寫 →</button>
    </div>
  `;
}

function renderStep2WeatherAndSchedule(rep) {
  const weatherList = ['晴', '陰', '雨', '豪大雨', '颱'];

  const renderWeatherStrip = (periodKey, curVal) => `
    <div class="weather-strip">
      ${weatherList
        .map(
          w =>
            `<button class="btn-weather ${curVal === w ? 'active' : ''}" onclick="window.appActions.setWeather('${periodKey}','${w}')">${w}</button>`
        )
        .join('')}
    </div>
  `;

  return `
    <div class="card-header">
      <div class="card-title-row">
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="step-num-badge">2</span>
          <h2 class="card-step-title">日期、天氣與工期進度</h2>
        </div>
        <span class="nowrap-cell" style="font-size:11.5px;font-weight:800;color:var(--matcha-primary);">${toMinguo(rep.reportDateISO, 'slash_weekday')}</span>
      </div>
    </div>

    <div class="card-body">
      <!-- 日期選擇欄位修正：點擊外框即可喚醒月曆 + 民國年即時對照 + [◀ -1天 / 今天 / +1天 ▶] 快捷鍵 -->
      <div class="date-section-box">
        <div class="date-main-row">
          <span style="font-size:12.5px;font-weight:800;color:var(--matcha-primary);white-space:nowrap;">📅 填報日期：</span>
          <div class="date-input-wrapper" onclick="const inp=this.querySelector('input');if(inp){if(inp.showPicker)inp.showPicker();else inp.focus();}">
            <input type="date" class="date-picker-input"
                   value="${rep.reportDateISO || ''}"
                   onchange="window.appActions.setReportDate(this.value)" />
          </div>
          <div class="h-scroll-strip" style="width:auto;padding-bottom:0;">
            <button class="phrase-chip" style="padding:4px 8px;background:var(--white);" onclick="window.appActions.shiftReportDate(-1)">◀ -1天</button>
            <button class="phrase-chip" style="padding:4px 8px;background:var(--white);" onclick="window.appActions.setReportDateToToday()">今天</button>
            <button class="phrase-chip" style="padding:4px 8px;background:var(--white);" onclick="window.appActions.shiftReportDate(1)">+1天 ▶</button>
          </div>
        </div>

        <div class="date-sub-grid">
          <div class="date-mini-card" onclick="const inp=this.querySelector('input');if(inp){if(inp.showPicker)inp.showPicker();else inp.focus();}">
            <div class="date-mini-label">
              <span>🚩 開工日期</span>
              <span style="color:var(--matcha-primary);">${toMinguo(rep.startDateISO, 'chinese')}</span>
            </div>
            <input type="date" class="date-picker-input" style="height:28px;font-size:13.5px;"
                   value="${rep.startDateISO || ''}"
                   onchange="window.appActions.setContractDate('startDateISO', this.value)" />
          </div>
          <div class="date-mini-card" onclick="const inp=this.querySelector('input');if(inp){if(inp.showPicker)inp.showPicker();else inp.focus();}">
            <div class="date-mini-label">
              <span>🏁 預定完工日</span>
              <span style="color:var(--matcha-primary);">${toMinguo(rep.endDateISO, 'chinese')}</span>
            </div>
            <input type="date" class="date-picker-input" style="height:28px;font-size:13.5px;"
                   value="${rep.endDateISO || ''}"
                   onchange="window.appActions.setContractDate('endDateISO', this.value)" />
          </div>
        </div>
      </div>

      <!-- 上午 / 下午天氣 (支援左右滑動完整顯示) -->
      <div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0;">
        <div>
          <div class="weather-sec-label">☀️ 上午天氣</div>
          ${renderWeatherStrip('weatherAM', rep.weatherAM)}
        </div>
        <div>
          <div class="weather-sec-label">🌤️ 下午天氣</div>
          ${renderWeatherStrip('weatherPM', rep.weatherPM)}
        </div>
      </div>

      <!-- 工期與進度百分比 -->
      <div class="compact-metrics-grid" style="flex-shrink:0;">
        <div class="metric-cell">
          <label>預定進度(%)</label>
          <input type="text" inputmode="decimal" enterkeyhint="next" data-enter-next="true"
                 class="adaptive-input ${rep.planCumProgress < 0 || rep.planCumProgress > 100 ? 'input-error' : ''}"
                 value="${rep.planCumProgress}"
                 oninput="window.appActions.liveUpdateNumberField('planCumProgress', this.value)"
                 onblur="window.appActions.commitNumberField()" />
        </div>
        <div class="metric-cell">
          <label>實際進度(%)</label>
          <input type="text" inputmode="decimal" enterkeyhint="next" data-enter-next="true"
                 class="adaptive-input ${rep.actualCumProgress < 0 || rep.actualCumProgress > 100 ? 'input-error' : ''}"
                 value="${rep.actualCumProgress}"
                 oninput="window.appActions.liveUpdateNumberField('actualCumProgress', this.value)"
                 onblur="window.appActions.commitNumberField()" />
        </div>
        <div class="metric-cell">
          <label>今日預定(%)</label>
          <input type="text" inputmode="decimal" enterkeyhint="next" data-enter-next="true"
                 class="adaptive-input"
                 value="${rep.todayPlanProgress}"
                 oninput="window.appActions.liveUpdateNumberField('todayPlanProgress', this.value)"
                 onblur="window.appActions.commitNumberField()" />
        </div>
        <div class="metric-cell">
          <label>總工期(天)</label>
          <input type="text" inputmode="numeric" enterkeyhint="next" data-enter-next="true"
                 class="adaptive-input"
                 value="${rep.totalContractDays}"
                 oninput="window.appActions.liveUpdateNumberField('totalContractDays', this.value)"
                 onblur="window.appActions.commitNumberField()" />
        </div>
        <div class="metric-cell">
          <label>使用工期(天)</label>
          <input type="text" inputmode="numeric" enterkeyhint="next" data-enter-next="true"
                 class="adaptive-input ${rep.usedDays > rep.totalContractDays + rep.extendDays ? 'input-error' : ''}"
                 value="${rep.usedDays}"
                 oninput="window.appActions.liveUpdateNumberField('usedDays', this.value)"
                 onblur="window.appActions.commitNumberField()" />
        </div>
        <div class="metric-cell">
          <label>工程師(人)</label>
          <input type="text" inputmode="numeric" enterkeyhint="done" data-enter-next="true"
                 class="adaptive-input"
                 value="${rep.siteEngineerCount}"
                 oninput="window.appActions.liveUpdateNumberField('siteEngineerCount', this.value)"
                 onblur="window.appActions.commitNumberField()" />
        </div>
      </div>
    </div>

    <div class="card-footer">
      <div class="btn-row-2">
        <button class="btn-full-gray" onclick="window.appActions.setStep(1)">上一頁</button>
        <button class="btn-full-green" onclick="window.appActions.setStep(3)">完成 (下一步)</button>
      </div>
    </div>
  `;
}

// ================= (3) 今日進度 =================
function renderStep3TodayProgress(rep) {
  const phraseChips = state.customPhrases
    .map(
      (p, idx) => `
      <span class="phrase-chip" onclick="window.appActions.appendPhraseTo('todayProgressSummary', '${p.replace(/'/g, "\\'")}')">
        ＋ ${p}
        <span class="phrase-chip-del" title="刪除此常用工項" onclick="event.stopPropagation(); window.appActions.removeCustomPhrase(${idx})">×</span>
      </span>`
    )
    .join('');

  return `
    <div class="card-header">
      <div class="card-title-row">
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="step-num-badge">3</span>
          <h2 class="card-step-title">今日進度</h2>
        </div>
        
      </div>
      <p class="card-step-desc">點擊輸入框時將自動上移防鍵盤遮擋，確保隨時看得到文字游標。</p>
    </div>

    <div class="card-body">
      <div class="phrase-add-row">
        <input id="new-phrase-input-today" data-enter-next="true" enterkeyhint="done"
               class="adaptive-input" style="height:36px;font-size:15px;"
               placeholder="輸入新常用工項 (如：擋土柱施作)..."
               onkeydown="if(event.key==='Enter'){event.preventDefault();window.appActions.addCustomPhrase('new-phrase-input-today');}" />
        <button class="btn-full-green" style="width:auto;height:36px;font-size:13px;padding:0 14px;" onclick="window.appActions.addCustomPhrase('new-phrase-input-today')">＋常用</button>
      </div>

      <div class="phrase-chips-wrap">
        ${phraseChips}
      </div>

      <textarea id="textarea-today-progress" class="adaptive-textarea ${!rep.todayProgressSummary.trim() ? 'input-error' : ''}"
                style="flex:1;min-height:110px;"
                placeholder="點擊此處輸入今日施工進度（支援手機鍵盤🎤語音輸入，輸入時自動保持游標可見）..."
                oninput="window.appActions.liveUpdateText('todayProgressSummary', this.value)">${rep.todayProgressSummary}</textarea>
    </div>

    <div class="card-footer">
      <div class="btn-row-2">
        <button class="btn-full-gray" onclick="window.appActions.setStep(2)">上一頁</button>
        <button class="btn-full-green" onclick="window.appActions.setStep(4)">完成 (下一步)</button>
      </div>
    </div>
  `;
}

// ================= (4) 明日進度與重要記事 =================
function renderStep4TomorrowAndNotes(rep) {
  const phraseChips = state.customPhrases
    .map(
      (p, idx) => `
      <span class="phrase-chip" onclick="window.appActions.appendPhraseTo('tomorrowPlanSummary', '${p.replace(/'/g, "\\'")}')">
        ＋ ${p}
        <span class="phrase-chip-del" title="刪除此常用工項" onclick="event.stopPropagation(); window.appActions.removeCustomPhrase(${idx})">×</span>
      </span>`
    )
    .join('');

  return `
    <div class="card-header">
      <div class="card-title-row">
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="step-num-badge">4</span>
          <h2 class="card-step-title">明日進度與重要記事</h2>
        </div>
        
      </div>
      <p class="card-step-desc">可直接新增/點選明日常用工項，輸入文字時自動追蹤光標不被鍵盤擋住。</p>
    </div>

    <div class="card-body">
      <div class="phrase-add-row">
        <input id="new-phrase-input-tomorrow" data-enter-next="true" enterkeyhint="done"
               class="adaptive-input" style="height:36px;font-size:15px;"
               placeholder="新增明日常用工項 (如：結構鋼筋綁紮)..."
               onkeydown="if(event.key==='Enter'){event.preventDefault();window.appActions.addCustomPhrase('new-phrase-input-tomorrow');}" />
        <button class="btn-full-green" style="width:auto;height:36px;font-size:13px;padding:0 14px;" onclick="window.appActions.addCustomPhrase('new-phrase-input-tomorrow')">＋常用</button>
      </div>

      <div class="phrase-chips-wrap">
        ${phraseChips}
      </div>

      <textarea id="textarea-tomorrow-progress" class="adaptive-textarea ${!rep.tomorrowPlanSummary.trim() ? 'input-error' : ''}"
                style="flex:1;min-height:80px;"
                placeholder="輸入明日預計施作進度..."
                oninput="window.appActions.liveUpdateText('tomorrowPlanSummary', this.value)">${rep.tomorrowPlanSummary}</textarea>

      <div style="font-size:12.5px;font-weight:800;color:var(--text-sub);margin-top:2px;flex-shrink:0;">📝 備註 / 本日重要記事</div>
      <textarea id="textarea-important-notes" class="adaptive-textarea"
                style="flex:1;min-height:70px;"
                placeholder="輸入本日重要記事或備註事項..."
                oninput="window.appActions.liveUpdateText('importantNotes', this.value)">${rep.importantNotes}</textarea>
    </div>

    <div class="card-footer">
      <div class="btn-row-2">
        <button class="btn-full-gray" onclick="window.appActions.setStep(3)">上一頁</button>
        <button class="btn-full-green" onclick="window.appActions.setStep(5)">完成 (下一步)</button>
      </div>
    </div>
  `;
}

// ================= (5) 人員、材料、機具紀錄 =================
function renderStep5Trades(rep) {
  const catTabs = TRADE_CATEGORIES.map(
    c =>
      `<button class="btn-cat-tab ${state.activeCategory === c.key ? 'active' : ''}"
               onclick="window.appActions.setCategory('${c.key}')">${c.label}</button>`
  ).join('');

  const curCat = TRADE_CATEGORIES.find(c => c.key === state.activeCategory) || TRADE_CATEGORIES[0];
  const items = rep.tradeRecords.filter(r => r.category === state.activeCategory);

  const rowsHtml = items
    .map(item => {
      const todayQty = getTodayQty(item);
      const cumTotal = Number((item.priorCumulative + todayQty).toFixed(1));

      return `
      <div class="trade-row-card">
        <div class="trade-single-grid">
          <div class="nowrap-cell" style="font-size:14px;font-weight:800;color:var(--text-main);">${item.name}</div>
          <div class="nowrap-cell" style="font-size:12px;color:var(--text-muted);text-align:center;">${item.unit}</div>
          <input type="text" inputmode="decimal" enterkeyhint="next" data-enter-next="true"
                 class="adaptive-input" style="height:36px;padding:4px 6px;text-align:center;font-weight:800;"
                 placeholder="今日數量"
                 value="${todayQty}"
                 oninput="window.appActions.liveSetTradeQty('${item.id}', this.value)" />
          <div id="cum-badge-${item.id}" class="nowrap-cell" style="background:var(--matcha-light);color:var(--matcha-primary);border-radius:6px;padding:6px 8px;font-size:12px;font-weight:800;text-align:center;">
            累計 ${cumTotal}${item.unit}
          </div>
        </div>

        ${
          state.showTradeDetailNotes
            ? `<div style="display:flex;flex-direction:column;gap:5px;border-top:1px dashed var(--border-color);padding-top:6px;margin-top:6px;">
                <div style="display:grid;grid-template-columns:56px minmax(0,1fr);gap:6px;align-items:center;">
                  <label style="font-size:12px;font-weight:700;display:flex;align-items:center;gap:4px;cursor:pointer;white-space:nowrap;">
                    <input type="checkbox" style="width:16px;height:16px;accent-color:var(--matcha-primary);"
                           ${item.isSubcontracted ? 'checked' : ''}
                           onchange="window.appActions.setTradeMeta('${item.id}','isSubcontracted',this.checked)" />代工
                  </label>
                  <input data-enter-next="true" enterkeyhint="next" class="adaptive-input" style="height:32px;font-size:14px;padding:3px 8px;"
                         placeholder="協力廠商名稱" value="${item.vendorName || ''}"
                         oninput="window.appActions.liveSetTradeMeta('${item.id}','vendorName',this.value)" />
                </div>
                <input data-enter-next="true" enterkeyhint="next" class="adaptive-input" style="height:32px;font-size:14px;padding:3px 8px;"
                       placeholder="今日工作內容" value="${item.todayWorkNote || ''}"
                       oninput="window.appActions.liveSetTradeMeta('${item.id}','todayWorkNote',this.value)" />
                <input data-enter-next="true" enterkeyhint="next" class="adaptive-input" style="height:32px;font-size:14px;padding:3px 8px;"
                       placeholder="明日工作內容" value="${item.tomorrowWorkNote || ''}"
                       oninput="window.appActions.liveSetTradeMeta('${item.id}','tomorrowWorkNote',this.value)" />
              </div>`
            : ''
        }
      </div>`;
    })
    .join('');

  const defaultUnit =
    state.activeCategory === 'machinery'
      ? '台'
      : state.activeCategory === 'materials'
      ? '噸'
      : '人';

  return `
    <div class="card-header">
      <div class="card-title-row">
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="step-num-badge">5</span>
          <h2 class="card-step-title">人員、材料、機具紀錄</h2>
        </div>
        
      </div>
      <p class="card-step-desc">直接填寫當日數量（不分上下午，僅顯示今日與累計，按 Enter 跳下一欄）。</p>
    </div>

    <div class="cat-tabs-wrap" style="margin-bottom:6px;">
      ${catTabs}
    </div>

    <div class="h-scroll-strip" style="justify-content:space-between;margin-bottom:4px;">
      <strong style="font-size:13px;">${curCat.label} (項目 / 單位 / 今日數量 / 累計)</strong>
      <button class="btn-top-action" style="height:28px;font-size:11px;padding:0 10px;"
              onclick="window.appActions.toggleTradeDetailNotes()">
        ${state.showTradeDetailNotes ? '▲ 收合廠商備註' : '▼ 展開廠商與工作備註'}
      </button>
    </div>

    <div class="card-body">
      ${rowsHtml}

      <div style="background:var(--white);border:1px solid var(--border-color);border-radius:8px;padding:9px;display:flex;flex-direction:column;gap:6px;flex-shrink:0;">
        <div style="display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,0.8fr) auto;gap:6px;">
          <input id="custom-trade-name" data-enter-next="true" enterkeyhint="next" class="adaptive-input" style="height:36px;font-size:15px;" placeholder="新增其他項目..." />
          <input id="custom-trade-unit" data-enter-next="true" enterkeyhint="done" class="adaptive-input" style="height:36px;font-size:15px;text-align:center;" placeholder="單位" value="${defaultUnit}" />
          <button class="btn-full-green" style="width:auto;height:36px;font-size:13px;padding:0 14px;" onclick="window.appActions.addCustomTradeItem()">＋增加</button>
        </div>
      </div>
    </div>

    <div class="card-footer">
      <div class="btn-row-2">
        <button class="btn-full-gray" onclick="window.appActions.setStep(4)">上一頁</button>
        <button class="btn-full-green" onclick="window.appActions.setStep(6)">完成 (下一步)</button>
      </div>
    </div>
  `;
}

// ================= (6) 現場照片 =================
function renderStep6Photos(rep) {
  const photosHtml = rep.photos
    .map(
      p => `
      <div style="background:var(--white);border:1px solid var(--border-color);border-radius:8px;overflow:hidden;display:flex;flex-direction:column;">
        <div style="position:relative;height:110px;background:#182019;">
          <img src="${p.uri}" style="width:100%;height:100%;object-fit:cover;" />
          <div style="position:absolute;bottom:0;left:0;right:0;background:rgba(24,32,25,0.75);color:#fff;font-size:9px;padding:3px 5px;">
            ${p.capturedAt} ｜ ${p.gpsText}
          </div>
        </div>
        <button class="btn-proj-del" style="border:none;border-radius:0;height:30px;width:100%;"
                onclick="window.appActions.removePhoto('${p.id}')">移除照片</button>
      </div>`
    )
    .join('');

  return `
    <div class="card-header">
      <div class="card-title-row">
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="step-num-badge">6</span>
          <h2 class="card-step-title">現場照片</h2>
        </div>
      </div>
      <p class="card-step-desc">直接拍照或選取相簿照片，照片會保存在日報表。</p>
    </div>

    <input type="file" id="camera-file-input" accept="image/*" capture="environment" style="display:none"
           onchange="window.appActions.handleFileSelected(this)" />
    <input type="file" id="gallery-file-input" accept="image/*" multiple style="display:none"
           onchange="window.appActions.handleFileSelected(this)" />

    <div class="photo-action-grid" style="margin-bottom:8px;">
      <div class="dashed-photo-btn" onclick="document.getElementById('camera-file-input').click()">
        <div class="green-circle-icon">＋</div>
        <span style="font-size:13px;font-weight:700;">現場拍照</span>
      </div>
      <div class="dashed-photo-btn" onclick="document.getElementById('gallery-file-input').click()">
        <div class="green-circle-icon">▦</div>
        <span style="font-size:13px;font-weight:700;">選取相簿照片</span>
      </div>
    </div>

    <div class="card-body">
      <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(140px, 1fr));gap:8px;">
        ${photosHtml}
      </div>
    </div>

    <div class="card-footer">
      <div class="btn-row-2">
        <button class="btn-full-gray" onclick="window.appActions.setStep(5)">上一頁</button>
        <button class="btn-full-green" onclick="window.appActions.setStep(7)">完成 (預覽與圖表)</button>
      </div>
    </div>
  `;
}

// ================= (7) 單日日報預覽與正式 A4 PDF 報表 =================
function renderStep7PreviewAndCharts(rep) {
  const remainDays = Math.max(0, rep.totalContractDays - rep.usedDays + rep.extendDays);
  const weekdayLabel = getWeekdayLabel(rep.reportDateISO);

  const workerRecords = rep.tradeRecords.filter(
    r =>
      r.category !== 'materials' &&
      r.category !== 'machinery' &&
      (getTodayQty(r) > 0 || r.priorCumulative > 0)
  );
  const machRecords = rep.tradeRecords.filter(
    r => r.category === 'machinery' && (getTodayQty(r) > 0 || r.priorCumulative > 0)
  );
  const todayFilledRecords = rep.tradeRecords.filter(r => getTodayQty(r) > 0);

  const workerHistogramSvg = buildSingleDayMountainSvg(workerRecords, 'manpower');
  const machHistogramSvg = buildSingleDayMountainSvg(machRecords, 'machinery');
  const donutSectionHtml = buildAllFilledDonutHtml(todayFilledRecords);

  const activeDetailRecords = rep.tradeRecords.filter(
    r => getTodayQty(r) > 0 || r.priorCumulative > 0
  );
  const detailRows = (activeDetailRecords.length > 0 ? activeDetailRecords : rep.tradeRecords)
    .map(item => {
      const catLabel = TRADE_CATEGORIES.find(c => c.key === item.category)?.label || '';
      const todaySum = getTodayQty(item);
      const cumSum = Number((item.priorCumulative + todaySum).toFixed(1));
      return `<tr>
        <td class="nowrap-cell">${catLabel}</td>
        <td class="nowrap-cell"><strong>${item.name}</strong></td>
        <td class="nowrap-cell" style="text-align:right;"><strong>${todaySum} ${item.unit}</strong></td>
        <td class="nowrap-cell" style="text-align:right;">${cumSum} ${item.unit}</td>
        <td class="nowrap-cell">${item.vendorName || '-'}</td>
        <td>${item.todayWorkNote || '-'}</td>
      </tr>`;
    })
    .join('');

  return `
    <div class="card-header no-print">
      <div class="card-title-row">
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="step-num-badge">7</span>
          <h2 class="card-step-title">日報表預覽與正式 PDF 輸出</h2>
        </div>
      </div>
      <p class="card-step-desc">功能列與表格若側邊放不下皆可左右滑動；輸出 PDF 時自動完整排版為 A4 正式報告。</p>
    </div>

    <div class="h-scroll-strip no-print" style="margin-bottom:8px;">
      <button class="btn-top-action" style="height:36px;padding:0 12px;" onclick="window.appActions.saveReportWithToast()">💾 儲存日報</button>
      <button class="btn-top-action" style="height:36px;padding:0 12px;background:#1F4E37;" onclick="window.print()">🖨️ 輸出正式 PDF</button>
      <button class="btn-top-action" style="height:36px;padding:0 12px;background:#2B5B6C;" onclick="window.appActions.openLineModal()">💬 統整 LINE 文字稿</button>
      <button class="btn-top-action" style="height:36px;padding:0 12px;background:#3B6E75;" onclick="window.appActions.openProjectRangeStats('${state.activeProjId}')">📊 區間 K 棒總統計</button>
    </div>

    <div class="card-body">
      <div class="report-preview-paper">
        <div style="font-size:16px;font-weight:900;border-bottom:2px solid #2F5D46;padding-bottom:4px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:4px;">
          <span>營建工程管理日報表</span>
          <span class="nowrap-cell" style="font-size:10.5px;color:#4A554E;">${rep.reportDateISO} (${toMinguo(rep.reportDateISO, 'slash_weekday')})</span>
        </div>

        <div class="table-scroll-box">
          <table class="rep-table">
            <tr>
              <th class="nowrap-cell" style="width:15%">專案名稱</th>
              <td style="width:35%"><strong>${rep.projectName}</strong></td>
              <th class="nowrap-cell" style="width:15%">承攬廠商</th>
              <td style="width:35%">${rep.companyName}</td>
            </tr>
            <tr>
              <th class="nowrap-cell">天候狀況</th>
              <td class="nowrap-cell">上午：${rep.weatherAM} ｜ 下午：${rep.weatherPM}</td>
              <th class="nowrap-cell">填報日期</th>
              <td class="nowrap-cell">${toMinguo(rep.reportDateISO, 'chinese')} (${weekdayLabel})</td>
            </tr>
            <tr>
              <th class="nowrap-cell">契約工期</th>
              <td class="nowrap-cell">開工 ${rep.startDateISO} ～ 完工 ${rep.endDateISO}</td>
              <th class="nowrap-cell">工期統計</th>
              <td class="nowrap-cell">總工期 ${rep.totalContractDays}天 ｜ 已用 ${rep.usedDays}天 ｜ 剩餘 ${remainDays}天</td>
            </tr>
            <tr>
              <th class="nowrap-cell">工程進度</th>
              <td colspan="3" class="nowrap-cell">
                預定累計：<strong>${rep.planCumProgress.toFixed(2)}%</strong> ｜
                實際累計：<strong>${rep.actualCumProgress.toFixed(2)}%</strong> ｜
                今日預定：<strong>${rep.todayPlanProgress.toFixed(2)}%</strong> ｜
                超前/落後：<strong>${(rep.actualCumProgress - rep.planCumProgress).toFixed(2)}%</strong>
              </td>
            </tr>
            <tr>
              <th class="nowrap-cell">今日工項</th>
              <td colspan="3">${(rep.todayProgressSummary || '-').replace(/\n/g, '<br/>')}</td>
            </tr>
            <tr>
              <th class="nowrap-cell">明日預計</th>
              <td colspan="3">${(rep.tomorrowPlanSummary || '-').replace(/\n/g, '<br/>')}</td>
            </tr>
            <tr>
              <th class="nowrap-cell">重要記事</th>
              <td colspan="3">${(rep.importantNotes || '-').replace(/\n/g, '<br/>')}</td>
            </tr>
          </table>
        </div>

        <div class="chart-card">
          <div class="chart-card-title">
            <span>👷 本日工班出工山積圖 (本日出工量 × 歷史累計工數曲線)</span>
            <span class="nowrap-cell" style="font-size:10px;color:#4A554E;">現場工程師 ${rep.siteEngineerCount} 人</span>
          </div>
          ${workerHistogramSvg}
        </div>

        <div class="chart-card">
          <div class="chart-card-title" style="color:#2B5B6C;">
            <span>🚜 本日機具使用獨立山積圖 (本日動用台數 × 歷史累計台數曲線)</span>
            <span class="nowrap-cell" style="font-size:10px;color:#2B5B6C;">共 ${machRecords.length} 項機具設備</span>
          </div>
          ${machHistogramSvg}
        </div>

        <div class="chart-card">
          <div class="chart-card-title">
            <span>🍩 當日已填寫項目全量佔比分析</span>
          </div>
          ${donutSectionHtml}
        </div>

        <div style="font-weight:800;font-size:12px;color:#2F5D46;margin:8px 0 4px;">📋 人員、材料、機具進場紀錄明細表 (可左右滑動檢視)</div>
        <div class="table-scroll-box">
          <table class="rep-table" style="font-size:10px;">
            <thead>
              <tr>
                <th class="nowrap-cell">分類</th>
                <th class="nowrap-cell">工別/項目</th>
                <th class="nowrap-cell" style="text-align:right;">本日數量</th>
                <th class="nowrap-cell" style="text-align:right;">累計數量</th>
                <th class="nowrap-cell">協力廠商</th>
                <th class="nowrap-cell">今日工作內容</th>
              </tr>
            </thead>
            <tbody>${detailRows}</tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="card-footer no-print">
      <div class="btn-row-2">
        <button class="btn-full-gray" onclick="window.appActions.setStep(6)">上一頁</button>
        <button class="btn-full-gray" onclick="window.appActions.setStep(1)">結束填報</button>
      </div>
    </div>
  `;
}

// ================= (8) 專案總統計 =================
function renderStep8ProjectRangeStats(proj) {
  const allSorted = [...proj.reports].sort((a, b) =>
    a.reportDateISO.localeCompare(b.reportDateISO)
  );
  const minProjDate = allSorted[0]?.reportDateISO || '';
  const maxProjDate = allSorted[allSorted.length - 1]?.reportDateISO || '';

  let startD = state.statsStartDate || minProjDate;
  let endD = state.statsEndDate || maxProjDate;
  if (startD && endD && startD > endD) {
    const tmp = startD;
    startD = endD;
    endD = tmp;
  }

  const filteredReports = allSorted.filter(
    r => (!startD || r.reportDateISO >= startD) && (!endD || r.reportDateISO <= endD)
  );

  const itemMap = new Map();
  let totalManDaysInRange = 0;
  let totalEngineerDaysInRange = 0;
  let totalMachineDaysInRange = 0;

  filteredReports.forEach(rep => {
    totalEngineerDaysInRange += Number(rep.siteEngineerCount || 0);
    rep.tradeRecords.forEach(tr => {
      const dayQty = getTodayQty(tr);
      if (dayQty > 0 || tr.priorCumulative > 0) {
        const key = `${tr.category}__${tr.name}__${tr.unit}`;
        if (!itemMap.has(key)) {
          itemMap.set(key, {
            category: tr.category,
            name: tr.name,
            unit: tr.unit,
            rangeTotal: 0,
            activeDays: 0,
            maxDayQty: 0,
          });
        }
        const entry = itemMap.get(key);
        entry.rangeTotal = Number((entry.rangeTotal + dayQty).toFixed(1));
        if (dayQty > 0) entry.activeDays += 1;
        if (dayQty > entry.maxDayQty) entry.maxDayQty = dayQty;

        if (tr.category === 'machinery') {
          totalMachineDaysInRange = Number((totalMachineDaysInRange + dayQty).toFixed(1));
        } else if (tr.category !== 'materials') {
          totalManDaysInRange = Number((totalManDaysInRange + dayQty).toFixed(1));
        }
      }
    });
  });

  const aggregatedItems = Array.from(itemMap.values()).filter(x => x.rangeTotal > 0);
  const dayCount = Math.max(1, filteredReports.length);

  const manpowerKBarMountainSvg = buildMultiDayKBarMountainSvg(filteredReports, 'manpower');
  const machineryKBarMountainSvg = buildMultiDayKBarMountainSvg(filteredReports, 'machinery');
  const rangeDonutHtml = buildRangeAggregatedDonutHtml(aggregatedItems);
  const rangeTableHtml = buildRangeSummarySixColTableHtml(aggregatedItems, dayCount);

  return `
    <div class="card-header no-print">
      <div class="card-title-row">
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="step-num-badge">📊</span>
          <h2 class="card-step-title">專案總統計：${proj.name}</h2>
        </div>
      </div>
      <p class="card-step-desc">點擊起始或結束日期卡片即可選取區間，山積圖支援左右滑動檢視各日趨勢。</p>
    </div>

    <div class="date-section-box no-print" style="margin-bottom:8px;">
      <div class="date-sub-grid">
        <div class="date-mini-card" onclick="const inp=this.querySelector('input');if(inp){if(inp.showPicker)inp.showPicker();else inp.focus();}">
          <div class="date-mini-label">
            <span>📅 起始日期</span>
            <span style="color:var(--matcha-primary);">${toMinguo(startD, 'chinese')}</span>
          </div>
          <input type="date" class="date-picker-input" style="height:30px;font-size:14px;"
                 value="${startD}"
                 onchange="window.appActions.setStatsDateRange(this.value, '${endD}')" />
        </div>
        <div class="date-mini-card" onclick="const inp=this.querySelector('input');if(inp){if(inp.showPicker)inp.showPicker();else inp.focus();}">
          <div class="date-mini-label">
            <span>📅 結束日期</span>
            <span style="color:var(--matcha-primary);">${toMinguo(endD, 'chinese')}</span>
          </div>
          <input type="date" class="date-picker-input" style="height:30px;font-size:14px;"
                 value="${endD}"
                 onchange="window.appActions.setStatsDateRange('${startD}', this.value)" />
        </div>
      </div>

      
      <!-- 預社區間快速切換按鈕 (日/週/月/季/全期) -->
      <div class="preset-range-strip no-print">
        <button class="preset-btn ${state.statsPresetRange === 'day' ? 'active' : ''}" onclick="window.appActions.quickSelectRange('day')">今日 (日)</button>
        <button class="preset-btn ${state.statsPresetRange === 'week' ? 'active' : ''}" onclick="window.appActions.quickSelectRange('week')">本週 (週)</button>
        <button class="preset-btn ${state.statsPresetRange === 'month' ? 'active' : ''}" onclick="window.appActions.quickSelectRange('month')">本月 (月)</button>
        <button class="preset-btn ${state.statsPresetRange === 'quarter' ? 'active' : ''}" onclick="window.appActions.quickSelectRange('quarter')">本季 (季)</button>
        <button class="preset-btn ${state.statsPresetRange === 'all' || !state.statsPresetRange ? 'active' : ''}" onclick="window.appActions.quickSelectRange('all')">專案全期 (${allSorted.length}日)</button>
      </div>
</div></div>

    <div class="card-body">
      <div class="report-preview-paper">
        <div style="font-size:15px;font-weight:900;border-bottom:2px solid #2F5D46;padding-bottom:5px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:4px;">
          <span>${proj.name} — 專案區間總統計正式報表</span>
          <span class="nowrap-cell" style="font-size:10.5px;color:#4A554E;">統計區間：${startD} ～ ${endD} (共 ${filteredReports.length} 日)</span>
        </div>

        <div class="h-scroll-strip" style="display:grid;grid-template-columns:repeat(4,minmax(76px,1fr));gap:6px;margin-bottom:10px;">
          <div style="background:#F1F5F2;padding:6px;border-radius:6px;text-align:center;border:1px solid #CBD2CD;">
            <div class="nowrap-cell" style="font-size:9.5px;color:#4A554E;font-weight:700;">區間天數</div>
            <div class="nowrap-cell" style="font-size:13.5px;font-weight:900;color:#2F5D46;">${filteredReports.length} 天</div>
          </div>
          <div style="background:#F1F5F2;padding:6px;border-radius:6px;text-align:center;border:1px solid #CBD2CD;">
            <div class="nowrap-cell" style="font-size:9.5px;color:#4A554E;font-weight:700;">區間總出工</div>
            <div class="nowrap-cell" style="font-size:13.5px;font-weight:900;color:#2F5D46;">${totalManDaysInRange} 人日</div>
          </div>
          <div style="background:#F1F5F2;padding:6px;border-radius:6px;text-align:center;border:1px solid #CBD2CD;">
            <div class="nowrap-cell" style="font-size:9.5px;color:#4A554E;font-weight:700;">工程師累計</div>
            <div class="nowrap-cell" style="font-size:13.5px;font-weight:900;color:#2F5D46;">${totalEngineerDaysInRange} 人日</div>
          </div>
          <div style="background:#E3EFF3;padding:6px;border-radius:6px;text-align:center;border:1px solid #B5CDD6;">
            <div class="nowrap-cell" style="font-size:9.5px;color:#2B5B6C;font-weight:700;">機具總使用</div>
            <div class="nowrap-cell" style="font-size:13.5px;font-weight:900;color:#2B5B6C;">${totalMachineDaysInRange} 台日</div>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-card-title">
            <span>👷 區間每日出工人數山積圖 (各工程分類堆疊 + 累積人日曲線)</span>
            <span class="kbar-hint-tag no-print">⬅️ 左右滑動檢視全區間 (${filteredReports.length}日) ➡️</span>
          </div>
          ${manpowerKBarMountainSvg}
        </div>

        <div class="chart-card">
          <div class="chart-card-title" style="color:#2B5B6C;">
            <span>🚜 區間每日機具使用獨立山積圖 (各機具型號堆疊 + 累積台日曲線)</span>
            <span class="kbar-hint-tag no-print" style="background:#E3EFF3;color:#2B5B6C;">⬅️ 左右滑動檢視全區間 (${filteredReports.length}日) ➡️</span>
          </div>
          ${machineryKBarMountainSvg}
        </div>

        <div class="chart-card">
          <div class="chart-card-title">
            <span>🍩 區間已填寫項目總量佔比分析 (共 ${aggregatedItems.length} 項活躍工種/材料/機具)</span>
          </div>
          ${rangeDonutHtml}
        </div>

        <div class="chart-card">
          <div class="chart-card-title">
            <span>📋 區間已填寫項目全量統計總表</span>
            <span style="font-size:10px;color:#4A554E;">⬅️ 表格可左右滑動｜月均以 30 日曆天換算</span>
          </div>
          ${rangeTableHtml}
        </div>
      </div>
    </div>

    <div class="card-footer no-print">
      <div class="btn-row-2">
        <button class="btn-full-gray" onclick="window.appActions.setStep(1)">← 返回專案管理</button>
        <button class="btn-full-green" onclick="window.appActions.setStep(2)">進入日報填寫 →</button>
      </div>
    </div>
  `;
}

function buildMultiDayKBarMountainSvg(reports, mode = 'manpower') {
  if (!reports || reports.length === 0) {
    return `<div style="padding:14px;text-align:center;color:#6E7872;">所選日期區間內尚無日報紀錄，請點選上方「全部區間」或調整起始/結束日期。</div>`;
  }

  const n = reports.length;
  const colMinW = 46;
  const padL = 34;
  const padR = 38;
  const padT = 24;
  const padB = 46;
  const svgW = Math.max(360, padL + padR + n * colMinW);
  const svgH = 205;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  let legendItems = [];
  let runningCum = 0;

  if (mode === 'manpower') {
    const workerCats = TRADE_CATEGORIES.filter(
      c => c.key !== 'materials' && c.key !== 'machinery'
    );
    legendItems = workerCats.map(c => ({ key: c.key, label: c.label, color: c.color }));
  } else {
    const machNames = [];
    reports.forEach(rep => {
      rep.tradeRecords
        .filter(r => r.category === 'machinery')
        .forEach(r => {
          if (!machNames.includes(r.name)) machNames.push(r.name);
        });
    });
    if (machNames.length === 0) machNames.push('怪手');
    legendItems = machNames.map((name, i) => ({
      key: name,
      label: name,
      color: MACHINERY_PALETTE[i % MACHINERY_PALETTE.length],
    }));
  }

  const daySeries = reports.map(rep => {
    const segments = legendItems.map(leg => {
      const sum = rep.tradeRecords
        .filter(r =>
          mode === 'manpower'
            ? r.category === leg.key
            : r.category === 'machinery' && r.name === leg.key
        )
        .reduce((acc, r) => acc + getTodayQty(r), 0);
      return { ...leg, val: Number(sum.toFixed(1)) };
    });

    const dayTotal = Number(segments.reduce((a, b) => a + b.val, 0).toFixed(1));
    runningCum = Number((runningCum + dayTotal).toFixed(1));

    return {
      dateISO: rep.reportDateISO,
      shortDate: rep.reportDateISO.slice(5),
      segments,
      dayTotal,
      runningCum,
      actPct: rep.actualCumProgress,
    };
  });

  const maxDayTotal = Math.max(5, ...daySeries.map(d => d.dayTotal));
  const maxRunningCum = Math.max(10, daySeries[daySeries.length - 1]?.runningCum || 10);

  const primaryStroke = mode === 'machinery' ? '#2B5B6C' : '#2F5D46';
  const lineStroke = '#C58B2B';
  const unitSuffix = mode === 'machinery' ? '台' : '人';

  let gridLines = '';
  for (let i = 0; i <= 4; i++) {
    const y = padT + (plotH * i) / 4;
    const leftV = Math.round(maxDayTotal * (1 - i / 4));
    const rightV = Math.round(maxRunningCum * (1 - i / 4));
    gridLines += `
      <line x1="${padL}" y1="${y}" x2="${svgW - padR}" y2="${y}" stroke="#E2E7E3" stroke-width="1" stroke-dasharray="2,2" />
      <text x="${padL - 4}" y="${y + 3}" font-size="8.5" font-weight="700" fill="${primaryStroke}" text-anchor="end">${leftV}</text>
      <text x="${svgW - padR + 4}" y="${y + 3}" font-size="8.5" font-weight="700" fill="#9E6710" text-anchor="start">${rightV}</text>
    `;
  }

  const colW = plotW / n;
  const barW = Math.min(26, Math.max(14, colW * 0.58));
  const yBase = padT + plotH;

  let stackedBarsSvg = '';
  const cumPts = [];

  daySeries.forEach((d, idx) => {
    const cx = padL + colW * idx + colW / 2;
    let currentY = yBase;

    stackedBarsSvg += `<line x1="${cx.toFixed(1)}" y1="${padT}" x2="${cx.toFixed(1)}" y2="${yBase}" stroke="#F0F3F1" stroke-width="1" />`;

    d.segments.forEach(seg => {
      if (seg.val <= 0) return;
      const segH = (seg.val / maxDayTotal) * plotH;
      const nextY = currentY - segH;
      stackedBarsSvg += `<rect x="${(cx - barW / 2).toFixed(1)}" y="${nextY.toFixed(1)}" width="${barW.toFixed(1)}" height="${segH.toFixed(1)}" fill="${seg.color}" rx="1.5" />`;
      currentY = nextY;
    });

    const yCum = yBase - (d.runningCum / maxRunningCum) * plotH;
    cumPts.push(`${cx.toFixed(1)},${yCum.toFixed(1)}`);

    stackedBarsSvg += `
      <text x="${cx.toFixed(1)}" y="${(currentY - 4).toFixed(1)}" font-size="8.5" font-weight="800" fill="#1C2520" text-anchor="middle">${d.dayTotal}${unitSuffix}</text>
      <text x="${cx.toFixed(1)}" y="${yBase + 14}" font-size="8.5" font-weight="800" fill="#2C352E" text-anchor="middle">${d.shortDate}</text>
      <text x="${cx.toFixed(1)}" y="${yBase + 25}" font-size="7.5" fill="#6E7871" text-anchor="middle">累${d.runningCum}</text>
    `;
  });

  const firstX = (padL + colW / 2).toFixed(1);
  const lastX = (padL + colW * (n - 1) + colW / 2).toFixed(1);
  const mountainPoly = `${firstX},${yBase.toFixed(1)} ${cumPts.join(' ')} ${lastX},${yBase.toFixed(1)}`;

  const cumDots = cumPts
    .map(pt => {
      const [px, py] = pt.split(',');
      return `<circle cx="${px}" cy="${py}" r="3" fill="${lineStroke}" stroke="#fff" stroke-width="1.2" />`;
    })
    .join('');

  const catLegend = legendItems
    .map(
      c =>
        `<span class="nowrap-cell" style="display:inline-flex;align-items:center;gap:3px;font-size:9.5px;font-weight:700;"><span style="width:8px;height:8px;background:${c.color};display:inline-block;border-radius:2px;"></span>${c.label}</span>`
    )
    .join('');

  const wrapperId = `kbar-wrap-${mode}`;

  return `
    <div class="h-scroll-strip" style="margin-bottom:4px;">${catLegend}</div>
    <div class="h-scroll-strip" style="justify-content:space-between;font-size:9.5px;color:#4A554E;margin-bottom:4px;">
      <span>左軸：當日${mode === 'machinery' ? '機具動用台數' : '各工種出工人數'} (${unitSuffix})</span>
      <div class="no-print" style="display:inline-flex;gap:4px;">
        <button class="phrase-chip" style="padding:1px 6px;font-size:10px;" onclick="document.getElementById('${wrapperId}').scrollTo({left:0,behavior:'smooth'})">⏮ 最早</button>
        <button class="phrase-chip" style="padding:1px 6px;font-size:10px;" onclick="const el=document.getElementById('${wrapperId}');el.scrollTo({left:el.scrollWidth,behavior:'smooth'})">最新 ⏭</button>
      </div>
      <span style="color:#9E6710;font-weight:800;">●━● 右軸：區間累積山積線 (${unitSuffix}日)</span>
    </div>
    <div id="${wrapperId}" class="kbar-chart-wrapper">
      <svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" style="display:block;min-width:${svgW}px;">
        ${gridLines}
        <polygon points="${mountainPoly}" fill="rgba(197, 155, 95, 0.18)" />
        <polyline fill="none" stroke="${lineStroke}" stroke-width="2.2" points="${cumPts.join(' ')}" />
        ${stackedBarsSvg}
        ${cumDots}
        <line x1="${padL}" y1="${yBase}" x2="${svgW - padR}" y2="${yBase}" stroke="${primaryStroke}" stroke-width="1.5" />
      </svg>
    </div>
  `;
}

function buildRangeAggregatedDonutHtml(aggregatedItems) {
  if (aggregatedItems.length === 0) {
    return `<div style="font-size:11px;color:#6E7872;">區間內尚無填寫數據</div>`;
  }
  const palette = [
    '#2F5D46', '#4B7F65', '#6FA086', '#C59B5F', '#A67558',
    '#3B6E75', '#2B5B6C', '#52796F', '#84A98C', '#B5838D',
  ];
  const grandTotal = aggregatedItems.reduce((a, b) => a + b.rangeTotal, 0) || 1;
  let cumPct = 0;
  const r = 36;
  const circum = 2 * Math.PI * r;

  const segs = aggregatedItems
    .map((item, idx) => {
      const pct = item.rangeTotal / grandTotal;
      const dash = `${(pct * circum).toFixed(2)} ${circum.toFixed(2)}`;
      const offset = (-cumPct * circum).toFixed(2);
      cumPct += pct;
      return `<circle r="${r}" cx="46" cy="46" fill="transparent" stroke="${palette[idx % palette.length]}" stroke-width="15" stroke-dasharray="${dash}" stroke-dashoffset="${offset}" transform="rotate(-90 46 46)" />`;
    })
    .join('');

  const legend = aggregatedItems
    .map((item, idx) => {
      const pct = ((item.rangeTotal / grandTotal) * 100).toFixed(1);
      return `<div style="display:flex;justify-content:space-between;font-size:10.5px;padding:2px 0;border-bottom:1px dotted #E6ECE8;gap:6px;">
        <span class="nowrap-cell"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${palette[idx % palette.length]};margin-right:4px;"></span><strong>${item.name}</strong></span>
        <strong class="nowrap-cell" style="color:#2F5D46;">${item.rangeTotal} ${item.unit} (${pct}%)</strong>
      </div>`;
    })
    .join('');

  return `
    <div style="display:grid;grid-template-columns:92px minmax(0,1fr);gap:10px;align-items:center;">
      <svg width="92" height="92" viewBox="0 0 92 92">
        <circle r="${r}" cx="46" cy="46" fill="transparent" stroke="#E4ECE7" stroke-width="15" />
        ${segs}
      </svg>
      <div style="overflow-x:auto;">${legend}</div>
    </div>
  `;
}

function buildRangeSummarySixColTableHtml(aggregatedItems, totalDaysCount) {
  if (aggregatedItems.length === 0) {
    return `<div style="font-size:11px;color:#6E7872;">區間內尚無填寫數據</div>`;
  }

  const tableRows = aggregatedItems
    .map(item => {
      const catLabel = TRADE_CATEGORIES.find(c => c.key === item.category)?.label || '';
      const monthlyAvg = Number(((item.rangeTotal / Math.max(1, totalDaysCount)) * 30).toFixed(1));
      return `<tr>
        <td class="nowrap-cell">${catLabel}</td>
        <td class="nowrap-cell"><strong>${item.name}</strong></td>
        <td class="nowrap-cell" style="text-align:right;"><strong>${item.rangeTotal} ${item.unit}</strong></td>
        <td class="nowrap-cell" style="text-align:right;">${monthlyAvg} ${item.unit}</td>
        <td class="nowrap-cell" style="text-align:right;">${item.maxDayQty} ${item.unit}</td>
        <td class="nowrap-cell" style="text-align:center;">${item.activeDays} 天</td>
      </tr>`;
    })
    .join('');

  return `
    <div class="table-scroll-box" style="margin-bottom:0;">
      <table class="rep-table" style="font-size:10.5px;margin-top:4px;margin-bottom:0;">
        <thead>
          <tr>
            <th class="nowrap-cell">分類</th>
            <th class="nowrap-cell">項目</th>
            <th class="nowrap-cell" style="text-align:right;">區間總計</th>
            <th class="nowrap-cell" style="text-align:right;">月均</th>
            <th class="nowrap-cell" style="text-align:right;">單日峰值</th>
            <th class="nowrap-cell" style="text-align:center;">進場天數</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>
  `;
}

function buildSingleDayMountainSvg(records, mode = 'manpower') {
  if (!records || records.length === 0) {
    return `<div style="padding:12px;text-align:center;color:#6E7872;">本日尚無${mode === 'machinery' ? '機具使用' : '工班出工'}紀錄</div>`;
  }
  const count = records.length;
  const colMinW = 54;
  const padL = 32;
  const padR = 36;
  const padT = 22;
  const padB = 42;
  const svgW = Math.max(360, padL + padR + count * colMinW);
  const svgH = 180;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const maxToday = Math.max(5, ...records.map(r => getTodayQty(r)));
  const maxCum = Math.max(
    10,
    ...records.map(r => Number((r.priorCumulative + getTodayQty(r)).toFixed(1)))
  );

  const colW = plotW / count;
  const barW = Math.min(28, Math.max(14, colW * 0.55));
  const barColor = mode === 'machinery' ? '#2B5B6C' : '#2F5D46';

  let gridLines = '';
  for (let i = 0; i <= 4; i++) {
    const y = padT + (plotH * i) / 4;
    const leftVal = Math.round(maxToday * (1 - i / 4));
    const rightVal = Math.round(maxCum * (1 - i / 4));
    gridLines += `
      <line x1="${padL}" y1="${y}" x2="${svgW - padR}" y2="${y}" stroke="#E2E7E3" stroke-width="1" stroke-dasharray="2,2" />
      <text x="${padL - 4}" y="${y + 3}" font-size="8.5" font-weight="700" fill="${barColor}" text-anchor="end">${leftVal}</text>
      <text x="${svgW - padR + 4}" y="${y + 3}" font-size="8.5" font-weight="700" fill="#B87A28" text-anchor="start">${rightVal}</text>
    `;
  }

  let barsSvg = '';
  const cumPoints = [];
  const yBase = padT + plotH;

  records.forEach((item, idx) => {
    const cx = padL + colW * idx + colW / 2;
    const todaySum = getTodayQty(item);
    const cumSum = Number((item.priorCumulative + todaySum).toFixed(1));

    const barH = (todaySum / maxToday) * plotH;
    const yTop = yBase - barH;
    const yCum = yBase - (cumSum / maxCum) * plotH;
    cumPoints.push(`${cx.toFixed(1)},${yCum.toFixed(1)}`);

    const shortName = item.name.length > 6 ? item.name.slice(0, 6) + '..' : item.name;
    const fill =
      mode === 'machinery'
        ? MACHINERY_PALETTE[idx % MACHINERY_PALETTE.length]
        : TRADE_CATEGORIES.find(c => c.key === item.category)?.color || barColor;

    barsSvg += `
      <rect x="${(cx - barW / 2).toFixed(1)}" y="${yTop.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(0, barH).toFixed(1)}" fill="${fill}" rx="2" />
      <text x="${cx.toFixed(1)}" y="${(yTop - 4).toFixed(1)}" font-size="8.5" font-weight="800" fill="#1C2520" text-anchor="middle">${todaySum}${item.unit}</text>
      <text x="${cx.toFixed(1)}" y="${yBase + 15}" font-size="8.5" font-weight="700" fill="#374238" text-anchor="middle">${shortName}</text>
    `;
  });

  const firstX = (padL + colW / 2).toFixed(1);
  const lastX = (padL + colW * (count - 1) + colW / 2).toFixed(1);
  const mountainAreaPoints = `${firstX},${yBase.toFixed(1)} ${cumPoints.join(' ')} ${lastX},${yBase.toFixed(1)}`;

  const dotsSvg = cumPoints
    .map((pt, i) => {
      const [px, py] = pt.split(',');
      const item = records[i];
      const cumSum = Number((item.priorCumulative + getTodayQty(item)).toFixed(1));
      return `
        <circle cx="${px}" cy="${py}" r="3" fill="#C58B2B" stroke="#FFFFFF" stroke-width="1.2" />
        <text x="${px}" y="${Number(py) - 5}" font-size="7.5" font-weight="800" fill="#9E6710" text-anchor="middle">累${cumSum}</text>
      `;
    })
    .join('');

  return `
    <div style="display:flex;justify-content:space-between;font-size:9.5px;margin-bottom:4px;color:#4A554E;">
      <span><strong style="color:${barColor}">■</strong> 本日數量 (左軸)</span>
      <span><strong style="color:#C58B2B">●━●</strong> 歷史累計山積線 (右軸)</span>
    </div>
    <div class="kbar-chart-wrapper">
      <svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" style="display:block;min-width:${svgW}px;">
        ${gridLines}
        <polygon points="${mountainAreaPoints}" fill="rgba(197, 155, 95, 0.16)" />
        <polyline fill="none" stroke="#C58B2B" stroke-width="2" points="${cumPoints.join(' ')}" />
        ${barsSvg}
        ${dotsSvg}
        <line x1="${padL}" y1="${yBase}" x2="${svgW - padR}" y2="${yBase}" stroke="${barColor}" stroke-width="1.5" />
      </svg>
    </div>
  `;
}

function buildAllFilledDonutHtml(todayFilledRecords) {
  if (todayFilledRecords.length === 0) {
    return `<div style="font-size:11px;color:#6E7872;">今日尚無大於 0 的進場項目</div>`;
  }
  const palette = [
    '#2F5D46', '#4B7F65', '#6FA086', '#C59B5F', '#A67558',
    '#3B6E75', '#2B5B6C', '#52796F', '#84A98C', '#B5838D',
  ];
  const totalSum = todayFilledRecords.reduce((acc, r) => acc + getTodayQty(r), 0) || 1;
  let cumPct = 0;
  const r = 36;
  const circum = 2 * Math.PI * r;

  const segments = todayFilledRecords
    .map((item, idx) => {
      const val = getTodayQty(item);
      const pct = val / totalSum;
      const dash = `${(pct * circum).toFixed(2)} ${circum.toFixed(2)}`;
      const offset = (-cumPct * circum).toFixed(2);
      cumPct += pct;
      const color = palette[idx % palette.length];
      return `<circle r="${r}" cx="46" cy="46" fill="transparent" stroke="${color}" stroke-width="15" stroke-dasharray="${dash}" stroke-dashoffset="${offset}" transform="rotate(-90 46 46)" />`;
    })
    .join('');

  const legendRows = todayFilledRecords
    .map((item, idx) => {
      const val = getTodayQty(item);
      const pct = ((val / totalSum) * 100).toFixed(1);
      const color = palette[idx % palette.length];
      const catLabel = TRADE_CATEGORIES.find(c => c.key === item.category)?.label || '';
      return `<div style="display:flex;justify-content:space-between;align-items:center;font-size:10px;padding:2px 0;border-bottom:1px dotted #E6ECE8;gap:6px;">
        <span class="nowrap-cell" style="display:flex;align-items:center;gap:4px;">
          <span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;"></span>
          <strong style="color:#1C2520;">${item.name}</strong>
          <span style="color:#6E7872;font-size:9px;">(${catLabel})</span>
        </span>
        <span class="nowrap-cell" style="font-weight:800;color:#2F5D46;">${val} ${item.unit} (${pct}%)</span>
      </div>`;
    })
    .join('');

  return `
    <div style="display:grid;grid-template-columns:92px minmax(0,1fr);gap:10px;align-items:center;">
      <svg width="92" height="92" viewBox="0 0 92 92">
        <circle r="${r}" cx="46" cy="46" fill="transparent" stroke="#E4ECE7" stroke-width="15" />
        ${segments}
      </svg>
      <div style="overflow-x:auto;">${legendRows}</div>
    </div>
  `;
}

// ================= ⚙️ 設定與外觀 Modal (支援切換 3 種導覽列佈局 + 4 種主題配色 + 鍵盤防遮擋輔助列開關) =================
function renderSettingsModal() {
  const navModesHtml = NAV_LAYOUT_MODES.map(
    m => `
    <div onclick="window.appActions.setNavLayoutMode('${m.id}')"
         style="padding:10px 12px;border-radius:10px;border:2px solid ${state.navLayoutMode === m.id ? 'var(--matcha-primary)' : 'var(--border-color)'};background:${state.navLayoutMode === m.id ? 'var(--matcha-light)' : 'var(--white)'};margin-bottom:6px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:8px;">
      <div>
        <div style="font-size:13px;font-weight:800;color:var(--text-main);">${m.name}</div>
        <div style="font-size:11px;color:var(--text-sub);margin-top:2px;">${m.desc}</div>
      </div>
      <span class="nowrap-cell" style="font-size:12.5px;font-weight:900;color:var(--matcha-primary);">${state.navLayoutMode === m.id ? '✓ 使用中' : '切換'}</span>
    </div>`
  ).join('');

  const themesHtml = UI_THEMES.map(
    t => `
    <div onclick="window.appActions.setUiTheme('${t.id}')"
         style="padding:10px 12px;border-radius:10px;border:2px solid ${state.uiTheme === t.id ? 'var(--matcha-primary)' : 'var(--border-color)'};background:${state.uiTheme === t.id ? 'var(--matcha-light)' : 'var(--white)'};margin-bottom:6px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:8px;">
      <div>
        <div style="font-size:13px;font-weight:800;color:var(--text-main);">${t.name}</div>
        <div style="font-size:11px;color:var(--text-sub);margin-top:2px;">${t.desc}</div>
      </div>
      <span class="nowrap-cell" style="font-size:12.5px;font-weight:900;color:var(--matcha-primary);">${state.uiTheme === t.id ? '✓ 使用中' : '套用'}</span>
    </div>`
  ).join('');

  return `
    <div class="modal-mask no-print">
      <div class="modal-box" style="padding:16px;">
        <h3 style="margin:0 0 8px;font-size:17px;">⚙️ UI/UX 導覽模式與外觀設定</h3>
        <div style="overflow-y:auto;max-height:70dvh;padding-right:2px;">
          <div style="font-size:13px;font-weight:800;color:var(--matcha-primary);margin-bottom:6px;">1. 導覽列佈局模式（三種皆可隨時切換）：</div>
          ${navModesHtml}

          <div style="font-size:13px;font-weight:800;color:var(--matcha-primary);margin:12px 0 6px;">2. 視覺主題配色：</div>
          ${themesHtml}

          <div style="font-size:13px;font-weight:800;color:var(--matcha-primary);margin:12px 0 6px;">3. 輸入文字防鍵盤遮擋輔助：</div>
          <label style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--white);border:1.5px solid var(--border-color);border-radius:10px;cursor:pointer;font-size:13px;font-weight:700;">
            <input type="checkbox" style="width:18px;height:18px;accent-color:var(--matcha-primary);"
                   ${state.enableKeyboardAssistBar ? 'checked' : ''}
                   onchange="window.appActions.toggleKeyboardAssistSetting(this.checked)" />
            <span>輸入文字時自動顯示「⌨️ 鍵盤上方浮動輔助列（▲上一欄 / ▼下一欄 / ✓收起鍵盤）」並保持光標可見</span>
          </label>
        </div>
        <button class="btn-full-green" style="margin-top:12px;" onclick="window.appActions.toggleSettingsModal(false)">完成並關閉設定</button>
      </div>
    </div>
  `;
}

function renderErrorCheckModal(errors) {
  const listHtml =
    errors.length === 0
      ? `<div style="padding:14px;background:var(--ok-bg);color:var(--ok-text);border-radius:8px;font-weight:700;font-size:13px;">
           🎉 系統已自動檢核工期、進度百分比、今日/明日工項與出工數據，沒有發現任何填寫異常。
         </div>`
      : errors
          .map(
            e => `
          <div onclick="window.appActions.jumpToError(${e.step}, '${e.cat || ''}')"
               style="padding:10px 12px;background:var(--danger-bg);border:1px solid var(--danger-border);border-radius:8px;margin-bottom:8px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <div>
              <div style="font-size:13px;font-weight:800;color:var(--danger-text);">⚠️ [步驟 ${e.step} - ${e.field}]</div>
              <div style="font-size:12px;color:var(--text-main);margin-top:2px;">${e.msg}</div>
            </div>
            <span style="font-size:12px;font-weight:800;color:var(--danger-text);white-space:nowrap;">前往修正 →</span>
          </div>`
          )
          .join('');

  return `
    <div class="modal-mask no-print">
      <div class="modal-box" style="padding:16px;">
        <h3 style="margin:0 0 6px;font-size:17px;">🔍 自動偵測報錯與填寫檢核清單</h3>
        <p style="margin:0 0 10px;font-size:12px;color:var(--text-muted);">點擊任一異常項目可直接跳轉至對應步驟欄位修正：</p>
        <div style="overflow-y:auto;max-height:60dvh;">${listHtml}</div>
        <button class="btn-full-green" style="margin-top:10px;" onclick="window.appActions.toggleErrorModal(false)">關閉視窗</button>
      </div>
    </div>
  `;
}

function renderLineModal(rep) {
  return `
    <div class="modal-mask no-print">
      <div class="modal-box">
        <div style="padding:10px 12px;background:var(--card-bg);border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center;">
          <button class="btn-full-gray" style="width:auto;height:32px;padding:0 10px;font-size:12px;" onclick="window.appActions.closeLineModal()">✕ 關閉</button>
          <strong style="font-size:15px;">LINE 公文日報文字稿</strong>
          <button class="btn-full-gray" style="width:auto;height:32px;padding:0 10px;font-size:12px;" onclick="window.appActions.refreshLineText()">🔄 重新統整</button>
        </div>

        <div style="padding:8px 12px;background:var(--matcha-light);border-bottom:1px solid var(--border-color);">
          <div style="display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:6px;align-items:center;">
            <strong style="font-size:12px;color:var(--matcha-primary);">📢 群組：</strong>
            <input class="adaptive-input" style="height:32px;font-size:13px;padding:4px 8px;"
                   value="${rep.targetLineGroupName || ''}"
                   onchange="window.appActions.updateField('targetLineGroupName', this.value)" />
            <button class="btn-top-action" style="height:32px;font-size:11px;" onclick="window.appActions.toggleWebhookConfig()">⚙️ Webhook</button>
          </div>
          ${
            state.showWebhookInput
              ? `<div style="margin-top:6px;">
                  <input class="adaptive-input" style="height:32px;font-size:12px;"
                         placeholder="填入 LINE Bot / Make Webhook URL 即可背景自動推播"
                         value="${rep.lineWebhookUrl || ''}"
                         onchange="window.appActions.updateField('lineWebhookUrl', this.value)" />
                </div>`
              : ''
          }
        </div>

        ${
          state.toastMessage
            ? `<div style="margin:6px 12px 0;padding:6px 10px;background:var(--ok-bg);color:var(--ok-text);border-radius:6px;font-size:12px;font-weight:800;">
                ${state.toastMessage}
              </div>`
            : ''
        }

        <div style="padding:10px 12px;flex:1;overflow-y:auto;">
          <textarea id="line-compiled-textarea" class="adaptive-textarea"
                    style="height:100%;min-height:260px;font-family:monospace;font-size:13px;line-height:1.5;"
                    oninput="window.appActions.setCustomLineText(this.value)">${state.customLineText}</textarea>
        </div>

        <div style="padding:10px 12px;background:var(--card-bg);border-top:1px solid var(--border-color);" class="btn-row-2">
          <button class="btn-full-gray" style="border-color:var(--matcha-primary);color:var(--matcha-primary);" onclick="window.appActions.copyLineText()">📋 一鍵複製</button>
          <button class="btn-full-green" onclick="window.appActions.sendToLineGroup()">🚀 自動上傳 LINE 群組</button>
        </div>
      </div>
    </div>
  `;
}

window.appActions = {
  setStep(stepNum) {
    state.currentStep = stepNum;
    state.immersiveMenuExpanded = false;
    document.body.classList.remove('keyboard-open');
    renderApp();
  },
  toggleImmersiveMenu() {
    state.immersiveMenuExpanded = !state.immersiveMenuExpanded;
    renderApp();
  },
  toggleSettingsModal(open) {
    state.settingsModalOpen = open;
    renderApp();
  },
  setNavLayoutMode(modeId) {
    state.navLayoutMode = modeId;
    saveState();
    renderApp();
  },
  setUiTheme(themeId) {
    state.uiTheme = themeId;
    saveState();
    applyThemeToDOM();
    renderApp();
  },
  toggleKeyboardAssistSetting(enabled) {
    state.enableKeyboardAssistBar = !!enabled;
    saveState();
    renderApp();
  },
  focusAdjacentInput(dir) {
    const inputs = Array.from(document.querySelectorAll('.card-body input[type="text"], .card-body textarea'));
    if (inputs.length === 0) return;
    const curIdx = inputs.indexOf(activeInputEl || document.activeElement);
    const nextIdx = Math.min(inputs.length - 1, Math.max(0, (curIdx === -1 ? 0 : curIdx) + dir));
    const target = inputs[nextIdx];
    if (target) {
      target.focus();
      if (typeof target.select === 'function' && target.tagName === 'INPUT') target.select();
      ensureFocusedInputVisible(target);
    }
  },
  dismissKeyboard() {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    document.body.classList.remove('keyboard-open');
  },
  openProjectRangeStats(projId) {
    state.activeProjId = projId;
    const proj = getActiveProject();
    const dates = proj.reports.map(r => r.reportDateISO).sort();
    if (dates.length > 0) {
      state.statsStartDate = dates[0];
      state.statsEndDate = dates[dates.length - 1];
    }
    state.currentStep = 8;
    renderApp();
  },
  setStatsDateRange(startISO, endISO) {
    if (startISO && endISO && startISO > endISO) {
      state.statsStartDate = endISO;
      state.statsEndDate = startISO;
    } else {
      state.statsStartDate = startISO;
      state.statsEndDate = endISO;
    }
    renderApp();
  },
  
  quickSelectRange(mode) {
    const proj = getActiveProject();
    const dates = proj.reports.map(r => r.reportDateISO).sort();
    if (dates.length === 0) return;
    const latest = dates[dates.length - 1];

    if (mode === 'day' || mode === 'today' || mode === 1) {
      state.statsStartDate = latest;
      state.statsEndDate = latest;
      state.statsPresetRange = 'day';
    } else if (mode === 'week' || mode === 7) {
      state.statsStartDate = shiftISODate(latest, -6);
      state.statsEndDate = latest;
      state.statsPresetRange = 'week';
    } else if (mode === 'month' || mode === 30) {
      state.statsStartDate = shiftISODate(latest, -29);
      state.statsEndDate = latest;
      state.statsPresetRange = 'month';
    } else if (mode === 'quarter' || mode === 90) {
      state.statsStartDate = shiftISODate(latest, -89);
      state.statsEndDate = latest;
      state.statsPresetRange = 'quarter';
    } else if (mode === 'all') {
      state.statsStartDate = dates[0];
      state.statsEndDate = latest;
      state.statsPresetRange = 'all';
    } else if (typeof mode === 'number') {
      const startIdx = Math.max(0, dates.length - mode);
      state.statsStartDate = dates[startIdx];
      state.statsEndDate = latest;
    }
    renderApp();
  },

  setReportDate(newDateISO) {
    if (!newDateISO) return;
    const rep = getActiveReport();
    rep.reportDateISO = newDateISO;
    saveState();
    renderApp();
  },
  shiftReportDate(deltaDays) {
    const rep = getActiveReport();
    rep.reportDateISO = shiftISODate(rep.reportDateISO, deltaDays);
    rep.usedDays = Math.max(1, (rep.usedDays || 1) + deltaDays);
    saveState();
    renderApp();
  },
  setReportDateToToday() {
    const rep = getActiveReport();
    rep.reportDateISO = new Date().toISOString().slice(0, 10);
    saveState();
    renderApp();
  },
  setContractDate(field, newDateISO) {
    if (!newDateISO) return;
    const rep = getActiveReport();
    rep[field] = newDateISO;
    if (rep.startDateISO && rep.endDateISO && rep.startDateISO <= rep.endDateISO) {
      const d1 = new Date(rep.startDateISO);
      const d2 = new Date(rep.endDateISO);
      const diffTotal = Math.round((d2 - d1) / 86400000) + 1;
      if (diffTotal > 0) rep.totalContractDays = diffTotal;
    }
    saveState();
    renderApp();
  },
  toggleErrorModal(open) {
    state.errorModalOpen = open;
    renderApp();
  },
  jumpToError(stepNum, catKey) {
    state.currentStep = stepNum;
    if (catKey) state.activeCategory = catKey;
    state.errorModalOpen = false;
    renderApp();
  },
  toggleExpandProj(projId) {
    state.expandedProjIds[projId] = !state.expandedProjIds[projId];
    renderApp();
  },
  toggleNewProjForm(show) {
    state.showNewProjForm = show;
    renderApp();
  },
  confirmCreateProject() {
    const nameEl = document.getElementById('new-proj-name');
    const compEl = document.getElementById('new-proj-comp');
    const name = nameEl ? nameEl.value.trim() : '';
    const comp = compEl && compEl.value.trim() ? compEl.value.trim() : '營造股份有限公司';
    if (!name) {
      alert('請輸入工程專案名稱');
      return;
    }
    const newId = 'proj_' + Date.now();
    const firstBlankReport = createBlankReport(name, comp);
    state.projects.unshift({
      id: newId,
      name,
      companyName: comp,
      year: new Date().getFullYear(),
      reports: [firstBlankReport],
    });
    state.activeProjId = newId;
    state.activeRepId = firstBlankReport.id;
    state.expandedProjIds[newId] = true;
    state.showNewProjForm = false;
    saveState();
    renderApp();
  },
  createNewReport(projId) {
    const proj = state.projects.find(p => p.id === projId);
    if (!proj) return;
    const latestRep = proj.reports[0];
    const nextRep = latestRep
      ? JSON.parse(JSON.stringify(latestRep))
      : createBlankReport(proj.name, proj.companyName);

    nextRep.id = 'rep_' + Date.now();
    nextRep.reportDateISO = new Date().toISOString().slice(0, 10);
    nextRep.usedDays = (nextRep.usedDays || 0) + 1;
    nextRep.workingDaysCount = (nextRep.workingDaysCount || 0) + 1;
    nextRep.todayProgressSummary = '';
    nextRep.tomorrowPlanSummary = '';
    nextRep.importantNotes = '';
    nextRep.photos = [];
    nextRep.tradeRecords = (nextRep.tradeRecords || []).map(tr => ({
      ...tr,
      priorCumulative: Number((Number(tr.priorCumulative || 0) + getTodayQty(tr)).toFixed(1)),
      todayQty: 0,
      morningQty: undefined,
      afternoonQty: undefined,
    }));

    proj.reports.unshift(nextRep);
    state.activeProjId = proj.id;
    state.activeRepId = nextRep.id;
    state.currentStep = 2;
    saveState();
    renderApp();
  },
  deleteProject(projId) {
    if (state.projects.length <= 1) {
      alert('請至少保留一個工程專案');
      return;
    }
    if (!confirm('確定要刪除此專案嗎？')) return;
    state.projects = state.projects.filter(p => p.id !== projId);
    state.activeProjId = state.projects[0].id;
    state.activeRepId = state.projects[0].reports[0].id;
    saveState();
    renderApp();
  },
  openReport(projId, repId) {
    state.activeProjId = projId;
    state.activeRepId = repId;
    state.currentStep = 2;
    renderApp();
  },
  exportBackup() {
    const json = JSON.stringify(state.projects, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      alert('✅ 已匯出全部專案備份 JSON 至剪貼簿！');
    });
  },
  importBackup() {
    const raw = prompt('請貼上專案備份 JSON 字串：');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        state.projects = parsed;
        state.activeProjId = parsed[0].id;
        state.activeRepId = parsed[0].reports[0].id;
        saveState();
        renderApp();
        alert('✅ 備份還原成功！');
      }
    } catch {
      alert('JSON 格式錯誤');
    }
  },
  setWeather(periodKey, val) {
    const rep = getActiveReport();
    rep[periodKey] = val;
    saveState();
    renderApp();
  },
  updateField(field, val) {
    const rep = getActiveReport();
    rep[field] = val;
    saveState();
    renderApp();
  },
  liveUpdateNumberField(field, val) {
    const rep = getActiveReport();
    const cleaned = String(val).replace(/[^0-9.-]/g, '');
    rep[field] = parseFloat(cleaned) || 0;
    saveState();
  },
  commitNumberField() {
    saveState();
  },
  liveUpdateText(field, val) {
    const rep = getActiveReport();
    rep[field] = val;
    saveState();
  },
  addCustomPhrase(inputId = 'new-phrase-input-today') {
    const inp = document.getElementById(inputId);
    const val = inp ? inp.value.trim() : '';
    if (!val) return;
    if (!state.customPhrases.includes(val)) {
      state.customPhrases.unshift(val);
      saveState();
    }
    renderApp();
  },
  removeCustomPhrase(idx) {
    state.customPhrases.splice(idx, 1);
    saveState();
    renderApp();
  },
  appendPhraseTo(field, phrase) {
    const rep = getActiveReport();
    const existingLines = (rep[field] || '')
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
    const nextNum = existingLines.length + 1;
    const cleanPhrase = phrase.replace(/^\d+\./, '').trim();
    existingLines.push(`${nextNum}.${cleanPhrase}`);
    rep[field] = existingLines.join('\n');
    saveState();
    renderApp();
  },
  setCategory(catKey) {
    state.activeCategory = catKey;
    renderApp();
  },
  toggleTradeDetailNotes() {
    state.showTradeDetailNotes = !state.showTradeDetailNotes;
    renderApp();
  },
  liveSetTradeQty(itemId, rawVal) {
    const rep = getActiveReport();
    const item = rep.tradeRecords.find(r => r.id === itemId);
    if (!item) return;
    const cleaned = String(rawVal).replace(/[^0-9.-]/g, '');
    item.todayQty = Math.max(0, parseFloat(cleaned) || 0);
    item.morningQty = undefined;
    item.afternoonQty = undefined;
    saveState();
    const badge = document.getElementById(`cum-badge-${itemId}`);
    if (badge) {
      const cumTotal = Number((item.priorCumulative + item.todayQty).toFixed(1));
      badge.textContent = `累計 ${cumTotal}${item.unit}`;
    }
  },
  setTradeMeta(itemId, field, val) {
    const rep = getActiveReport();
    const item = rep.tradeRecords.find(r => r.id === itemId);
    if (!item) return;
    item[field] = val;
    saveState();
    renderApp();
  },
  liveSetTradeMeta(itemId, field, val) {
    const rep = getActiveReport();
    const item = rep.tradeRecords.find(r => r.id === itemId);
    if (!item) return;
    item[field] = val;
    saveState();
  },
  addCustomTradeItem() {
    const nameEl = document.getElementById('custom-trade-name');
    const unitEl = document.getElementById('custom-trade-unit');
    const name = nameEl ? nameEl.value.trim() : '';
    const defaultUnit =
      state.activeCategory === 'machinery'
        ? '台'
        : state.activeCategory === 'materials'
        ? '噸'
        : '人';
    const unit = unitEl && unitEl.value.trim() ? unitEl.value.trim() : defaultUnit;
    if (!name) {
      alert('請輸入要新增的項目名稱');
      return;
    }
    const rep = getActiveReport();
    rep.tradeRecords.push({
      id: 'tr_' + Date.now(),
      category: state.activeCategory,
      name,
      unit,
      todayQty: 1,
      priorCumulative: 0,
      isSubcontracted: false,
      vendorName: '',
      todayWorkNote: `${name} 今日施作`,
      tomorrowWorkNote: `${name} 明日續作與整理`,
    });
    saveState();
    renderApp();
  },
  handleFileSelected(inputEl) {
    if (!inputEl.files || inputEl.files.length === 0) return;
    const rep = getActiveReport();
    Array.from(inputEl.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const now = new Date();
        const tStr = now.toTimeString().slice(0, 5);
        rep.photos.unshift({
          id: 'ph_' + Date.now() + Math.random().toString(36).slice(2, 5),
          uri: e.target.result,
          capturedAt: `${toMinguo(rep.reportDateISO, 'slash_weekday').split(' ')[0]} ${tStr}`,
          gpsText: '25.0778°N, 121.3725°E',
          weatherTag: rep.weatherAM,
          caption: file.name.replace(/\.[^.]+$/, ''),
        });
        saveState();
        renderApp();
      };
      reader.readAsDataURL(file);
    });
  },
  removePhoto(photoId) {
    const rep = getActiveReport();
    rep.photos = rep.photos.filter(x => x.id !== photoId);
    saveState();
    renderApp();
  },
  saveReportWithToast() {
    const rep = getActiveReport();
    const errors = detectReportErrors(rep);
    saveState();
    if (errors.length > 0) {
      alert(`已暫存日報，但系統偵測到 ${errors.length} 項填寫異常：\n- ${errors.map(e => e.msg).join('\n- ')}`);
    } else {
      alert('✅ 今日日報已通過防呆檢核並安全儲存！');
    }
  },
  openLineModal() {
    const rep = getActiveReport();
    state.customLineText = compileStandardLineText(rep);
    state.toastMessage = '';
    state.lineModalOpen = true;
    renderApp();
  },
  closeLineModal() {
    state.lineModalOpen = false;
    renderApp();
  },
  refreshLineText() {
    const rep = getActiveReport();
    state.customLineText = compileStandardLineText(rep);
    state.toastMessage = '🔄 已重新統整最新日報數據！';
    renderApp();
  },
  setCustomLineText(val) {
    state.customLineText = val;
  },
  toggleWebhookConfig() {
    state.showWebhookInput = !state.showWebhookInput;
    renderApp();
  },
  copyLineText() {
    const ta = document.getElementById('line-compiled-textarea');
    const txt = ta ? ta.value : state.customLineText;
    state.customLineText = txt;
    navigator.clipboard.writeText(txt).then(() => {
      state.toastMessage = '✅ 已一鍵複製完整日報文字稿！';
      renderApp();
    });
  },
  async sendToLineGroup() {
    const rep = getActiveReport();
    const ta = document.getElementById('line-compiled-textarea');
    const txt = ta ? ta.value : state.customLineText;
    state.customLineText = txt;

    try {
      await navigator.clipboard.writeText(txt);
    } catch {
      // ignore
    }

    if (rep.lineWebhookUrl && rep.lineWebhookUrl.trim().startsWith('http')) {
      try {
        const res = await fetch(rep.lineWebhookUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            groupName: rep.targetLineGroupName,
            projectName: rep.projectName,
            reportDate: rep.reportDateISO,
            text: txt,
          }),
        });
        if (res.ok) {
          state.toastMessage = `🚀 已自動上傳至指定群組：【${rep.targetLineGroupName}】`;
          renderApp();
          return;
        }
      } catch {
        // fallback
      }
    }

    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(txt)}`;
    state.toastMessage = `✅ 已複製文字並喚醒 LINE 上傳至【${rep.targetLineGroupName}】`;
    renderApp();
    window.open(lineUrl, '_blank');
  },
};

function initApp() {
  loadState();
  setupVisualViewportKeyboardGuard();
  renderApp();
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

