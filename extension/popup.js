var currentLang = 'zh';

var text = {
  en: {
    appName: 'Audit Agent',
    labelUrl: 'URL to Audit',
    labelGoal: 'Primary Goal',
    labelAudience: 'Target Audience (Optional)',
    audiencePlaceholder: 'e.g. Busy entrepreneurs',
    analyzeBtn: 'Analyze Conversion',
    resetBtn: 'Reset',
    resetBottomBtn: 'Analyze Another',
    loadingText: 'Analyzing...',
    scoreLabel: 'Conversion Score',
    headerIssues: 'Critical Conversion Bottlenecks',
    headerWins: 'Quick Wins (Next 15 min)',
    headerPlan: '7-Day Optimization Plan',
    goals: ['Collect leads', 'Sell product', 'Book calls', 'Webinar registration', 'Free download'],
    days: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
    headerVIP: 'Advanced AI Copywriter',
    descVIP: 'Unlock our LLM-powered deep analysis to rewrite your copy and find hidden conversion blockers.',
    unlockVIP: 'Unlock VIP via WhatsApp',
    waText: 'Hi! I want to upgrade to VIP for the Landingpage Audit Agent.',
    fullScreenBtn: '⛶ Full Screen Preview'
  },
  zh: {
    appName: '落地页审计',
    labelUrl: '落地页链接',
    labelGoal: '主要转化目标',
    labelAudience: '目标受众（可选）',
    audiencePlaceholder: 'e.g. 忙碌的创业者',
    analyzeBtn: '分析转化性能',
    resetBtn: '重置',
    resetBottomBtn: '重新分析',
    loadingText: '正在分析...',
    scoreLabel: '转化评分',
    headerIssues: '核心转化率瓶颈',
    headerWins: '15 分钟内可优化的点',
    headerPlan: '7 天优化计划',
    goals: ['收集潜在客户', '销售产品', '预约咨询', '研讨会报名', '免费下载'],
    days: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
    headerVIP: '进阶 AI 文案重写与深度审计',
    descVIP: '解锁由大语言模型驱动的深度分析，一键重写高转化文案，精准挖掘深层转化瓶颈。',
    unlockVIP: '通过 WhatsApp 解锁 VIP',
    waText: '你好！我想升级 Landingpage 审计插件的 VIP 高级功能。',
    fullScreenBtn: '⛶ 全屏预览'
  }
};

function setLang(lang) {
  currentLang = lang;
  document.getElementById('btnEn').classList.toggle('active', lang === 'en');
  document.getElementById('btnZh').classList.toggle('active', lang === 'zh');
  applyText();
  // save preference
  try { chrome.storage.local.set({ lang: lang }); } catch(e) {}
}

function applyText() {
  var t = text[currentLang];
  document.getElementById('appName').textContent = t.appName;
  document.getElementById('labelUrl').textContent = t.labelUrl;
  document.getElementById('labelGoal').textContent = t.labelGoal;
  document.getElementById('labelAudience').textContent = t.labelAudience;
  document.getElementById('inputAudience').placeholder = t.audiencePlaceholder;
  document.getElementById('btnAnalyze').textContent = t.analyzeBtn;
  document.getElementById('btnReset').textContent = t.resetBtn;
  document.getElementById('btnResetBottom').textContent = t.resetBottomBtn;
  document.getElementById('loadingText').textContent = t.loadingText;
  document.getElementById('headerIssues').textContent = t.headerIssues;
  document.getElementById('headerWins').textContent = t.headerWins;
  document.getElementById('headerPlan').textContent = t.headerPlan;
  document.getElementById('headerVIP').textContent = t.headerVIP;
  document.getElementById('descVIP').textContent = t.descVIP;
  document.getElementById('btnWhatsApp').textContent = t.unlockVIP;
  document.getElementById('btnFullScreen').textContent = t.fullScreenBtn;

  // Rebuild goal options
  var sel = document.getElementById('inputGoal');
  var current = sel.value;
  sel.innerHTML = '';
  t.goals.forEach(function(g) {
    var opt = document.createElement('option');
    opt.value = g;
    opt.textContent = g;
    sel.appendChild(opt);
  });
  // try to restore selection
  if (current) sel.value = current;
}

async function runAudit() {
  var url = document.getElementById('inputUrl').value.trim();
  if (!url) {
    document.getElementById('inputUrl').focus();
    return;
  }

  var goal = document.getElementById('inputGoal').value;
  var audience = document.getElementById('inputAudience').value.trim();
  var isEn = currentLang === 'en';
  var domainName = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0].split('.')[0] || 'Website';
  var capName = domainName.charAt(0).toUpperCase() + domainName.slice(1);

  // Show loading
  document.getElementById('formSection').style.display = 'none';
  document.getElementById('loadingSection').style.display = 'block';
  document.getElementById('resultsSection').style.display = 'none';

  try {
    // 统一调用 Shared Audit Engine
    var auditResult = await window.runBasicAudit({
      url: url,
      pageGoal: goal,
      targetAudience: audience,
      source: 'extension',
      isEn: isEn,
      supabase: null
    });
    
    renderResults(auditResult.report, auditResult.overallScore);
  } catch (e) {
    console.error("Audit failed", e);
  } finally {
    document.getElementById('loadingSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'block';
  }
}

function renderResults(report, score) {
  var isEn = currentLang === 'en';
  var t = text[currentLang];

  // Score ring
  var pct = score;
  var color = pct >= 70 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
  document.getElementById('scoreSection').innerHTML =
    '<div class="score-ring" style="--pct:' + pct + '; background: conic-gradient(' + color + ' calc(' + pct + '% * 3.6deg / 1deg), #1e293b 0)">' +
      '<div class="score-inner">' + pct + '</div>' +
    '</div>' +
    '<div>' +
      '<div class="score-label">' + t.scoreLabel + '</div>' +
      '<div class="score-problem">' + report.executiveSummary.problem + '</div>' +
    '</div>';

  // Issues
  var issuesHtml = '';
  report.topLeaks.forEach(function(leak, index) {
    // Top 2 are High, rest are Medium
    var severity = index < 2 ? 'High' : 'Medium';
    var badgeClass = severity === 'High' ? 'badge-high' : 'badge-medium';
    issuesHtml +=
      '<div class="issue-item">' +
        '<span class="badge ' + badgeClass + '">' + severity + '</span>' +
        '<div class="issue-content">' +
          '<div class="issue-title">' + leak.title + '</div>' +
          '<div class="issue-fix">💡 ' + leak.fix + '</div>' +
        '</div>' +
      '</div>';
  });
  document.getElementById('issuesList').innerHTML = issuesHtml;

  // Quick wins
  var winsHtml = '';
  report.quickWins.forEach(function(win, i) {
    winsHtml +=
      '<div class="win-item">' +
        '<div class="win-dot">' + (i + 1) + '</div>' +
        '<span>' + win + '</span>' +
      '</div>';
  });
  document.getElementById('winsList').innerHTML = winsHtml;

  // 7-day plan
  var plan = report.optimizationPlan;
  var planDays = [plan.day1, plan.day2, plan.day3, plan.day4, plan.day5, plan.day6, plan.day7];
  var planHtml = '';
  planDays.forEach(function(day, i) {
    // Strip "Day N:" prefix from the string since we render it separately
    var content = day.replace(/^Day \d+[：:]\s*/i, '');
    planHtml +=
      '<div class="plan-item">' +
        '<span class="plan-day">D' + (i + 1) + '</span>' +
        '<span>' + content + '</span>' +
      '</div>';
  });
  document.getElementById('planList').innerHTML = planHtml;
}

function resetForm() {
  document.getElementById('formSection').style.display = 'flex';
  document.getElementById('loadingSection').style.display = 'none';
  document.getElementById('resultsSection').style.display = 'none';
  document.getElementById('inputUrl').value = '';
  document.getElementById('inputAudience').value = '';
  document.getElementById('inputUrl').focus();
}

// Init
document.addEventListener('DOMContentLoaded', function() {
  // Attach Event Listeners to avoid Chrome Extension CSP violations
  document.getElementById('btnEn').addEventListener('click', function() { setLang('en'); });
  document.getElementById('btnZh').addEventListener('click', function() { setLang('zh'); });
  document.getElementById('btnAnalyze').addEventListener('click', runAudit);
  document.getElementById('btnReset').addEventListener('click', resetForm);
  document.getElementById('btnResetBottom').addEventListener('click', resetForm);

  document.getElementById('btnWhatsApp').addEventListener('click', function() {
    var t = text[currentLang];
    var url = 'https://wa.me/601110870288?text=' + encodeURIComponent(t.waText);
    chrome.tabs.create({ url: url });
  });

  document.getElementById('btnFullScreen').addEventListener('click', function() {
    var url = document.getElementById('inputUrl').value.trim();
    var goal = document.getElementById('inputGoal').value;
    var audience = document.getElementById('inputAudience').value.trim();
    var fullUrl = chrome.runtime.getURL('popup.html') + '?fullscreen=1&url=' + encodeURIComponent(url) + '&goal=' + encodeURIComponent(goal) + '&audience=' + encodeURIComponent(audience);
    chrome.tabs.create({ url: fullUrl });
  });

  // Restore saved lang
  try {
    chrome.storage.local.get(['lang'], function(res) {
      setLang(res.lang || 'zh');
    });
  } catch(e) {
    setLang('zh');
  }
  applyText();

  // Handle Fullscreen Mode Auto-run
  var params = new URLSearchParams(window.location.search);
  if (params.get('fullscreen') === '1') {
    document.body.classList.add('fullscreen');
    document.getElementById('btnFullScreen').style.display = 'none';
    
    if (params.get('url')) {
      document.getElementById('inputUrl').value = params.get('url');
      if (params.get('goal')) document.getElementById('inputGoal').value = params.get('goal');
      if (params.get('audience')) document.getElementById('inputAudience').value = params.get('audience');
      // Auto trigger audit
      setTimeout(runAudit, 100);
    }
  }
});
