import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft, Copy, AlertTriangle, CheckCircle, Lightbulb,
  Target, Layers, Zap, PenTool, Layout, ShieldCheck, HelpCircle,
  Smartphone, MousePointerClick, Calendar, Palette
} from 'lucide-react';
import { t } from '../constants/translations';
import { getExpertAudit } from '../utils/expertAudit';
import AdvancedAuditSection from '../components/AdvancedAuditSection';

const Report = ({ lang, showToast }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const curText = t[lang];
  const reportData = location.state?.reportData;
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    if (!reportData || !reportData.auditDetails) {
      navigate('/');
    }
  }, [reportData, navigate]);

  if (!reportData || !reportData.auditDetails) return <div className="p-10 text-center text-slate-500">Redirecting to home...</div>;

  const isEn = lang === 'en';
  const url = reportData.url;

  // Dynamically re-generate data based on current language
  const domainName = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0].split('.')[0] || 'Website';
  const capName = domainName.charAt(0).toUpperCase() + domainName.slice(1);
  const { report: data, finalScore: score } = getExpertAudit(reportData.goal, reportData.audience, isEn, capName);

  const { requireAuth, supabase } = useAuth();

  const handleCopyClick = () => {
    requireAuth('copy_report', () => {
      const sep = '─'.repeat(40);
      const lines = [];

      // Header
      lines.push(`🔍 ${isEn ? 'Landing Page Audit Report' : '落地页转化诊断报告'} — ${url}`);
      lines.push(`${isEn ? 'Overall Score' : '综合得分'}: ${score}/100`);
      lines.push(sep);

      // Executive Summary
      lines.push(`\n📌 ${isEn ? 'CORE DIAGNOSIS' : '核心诊断'}: ${data?.overallDiagnosis?.category || 'N/A'}`);
      lines.push(data?.overallDiagnosis?.diagnosis || '');
      lines.push(`\n${data?.executiveSummary?.problem || ''}`);
      lines.push(`⚠️ ${isEn ? 'Impact' : '影响'}: ${data?.executiveSummary?.impact || ''}`);

      // Top 3 Priorities
      lines.push(`\n🎯 ${isEn ? 'TOP 3 PRIORITIES' : '三大优先任务'}:`);
      data?.executiveSummary?.priorities?.forEach((p, i) => lines.push(`  ${i + 1}. ${p}`));

      // Top Conversion Leaks
      lines.push(`\n${sep}`);
      lines.push(`🚨 ${isEn ? 'TOP CONVERSION LEAKS' : '最大转化漏点'}:`);
      data?.topLeaks?.forEach((leak, i) => {
        lines.push(`  ${i + 1}. ${leak.title}`);
        lines.push(`     ${isEn ? 'Problem' : '问题'}: ${leak.wrong}`);
        lines.push(`     ${isEn ? 'Impact' : '影响'}: ${leak.hurts}`);
        lines.push(`     ${isEn ? 'Fix' : '修复'}: ${leak.fix}`);
      });

      // Above the Fold
      lines.push(`\n${sep}`);
      lines.push(`🖥️ ${isEn ? 'ABOVE-THE-FOLD AUDIT' : '首屏诊断'} (${data?.aboveTheFold?.score || 0}/100)`);
      lines.push(`  ${isEn ? 'Headline' : '大标题'}: ${data?.aboveTheFold?.headlineProblem || 'N/A'}`);
      lines.push(`  ${isEn ? 'Subheadline' : '副标题'}: ${data?.aboveTheFold?.subheadlineProblem || 'N/A'}`);
      lines.push(`  ${isEn ? '5-Second Test' : '5秒诊断'}: ${data?.aboveTheFold?.fiveSecondDiagnosis || 'N/A'}`);
      lines.push(`  ${isEn ? 'Why it hurts' : '致命影响'}: ${data?.aboveTheFold?.whyHurts || 'N/A'}`);
      lines.push(`  ${isEn ? 'How to fix' : '修复方案'}: ${data?.aboveTheFold?.fix || 'N/A'}`);
      lines.push(`\n  ✍️ ${isEn ? 'SUGGESTED HEADLINE' : '建议大标题'}: ${data?.aboveTheFold?.headlineExample || 'N/A'}`);
      lines.push(`  ✍️ ${isEn ? 'SUGGESTED SUBHEADLINE' : '建议副标题'}: ${data?.aboveTheFold?.subheadlineExample || 'N/A'}`);

      // CTA Audit
      lines.push(`\n${sep}`);
      lines.push(`🖱️ ${isEn ? 'CTA & BUTTON AUDIT' : 'CTA 按钮诊断'} (${data?.ctaAudit?.score || 0}/100)`);
      lines.push(`  ${isEn ? 'Visibility' : '可见度'}: ${data?.ctaAudit?.visibility || 'N/A'}`);
      lines.push(`  ${isEn ? 'Color Contrast' : '色彩对比'}: ${data?.ctaAudit?.colorContrast || 'N/A'}`);
      lines.push(`  ${isEn ? 'Copy Problem' : '文案问题'}: ${data?.ctaAudit?.copyProblem || 'N/A'}`);
      lines.push(`  ${isEn ? 'Better CTA Copy' : '高转化替换文案'}: ${data?.ctaAudit?.betterCopy?.join(' | ') || 'N/A'}`);
      lines.push(`  ${isEn ? 'Microcopy' : '按钮下方微文案'}: ${data?.ctaAudit?.microcopy || 'N/A'}`);

      // Copywriting
      lines.push(`\n${sep}`);
      lines.push(`📝 ${isEn ? 'COPYWRITING AUDIT' : '文案诊断'} (${data?.copywriting?.score || 0}/100)`);
      data?.copywriting?.weakAreas?.forEach((w, i) => lines.push(`  ✗ ${w}`));
      lines.push(`  ${isEn ? 'Fixes' : '修改铁律'}:`);
      data?.copywriting?.suggestions?.forEach((s, i) => lines.push(`  ✓ ${s}`));

      // Page Structure
      lines.push(`\n${sep}`);
      lines.push(`📐 ${isEn ? 'PAGE STRUCTURE' : '页面结构'} (${data?.pageStructure?.score || 0}/100)`);
      lines.push(`  ${isEn ? 'Problem' : '问题'}: ${data?.pageStructure?.problem || 'N/A'}`);
      lines.push(`  ${isEn ? 'Recommended Order' : '推荐结构'}:`);
      data?.pageStructure?.recommendedOrder?.forEach((s, i) => lines.push(`    ${i + 1}. ${s}`));

      // Trust & Proof
      lines.push(`\n${sep}`);
      lines.push(`🛡️ ${isEn ? 'TRUST & PROOF' : '信任与背书'} (${data?.trustProof?.score || 0}/100)`);
      lines.push(`  ${isEn ? 'Missing' : '缺失'}:`);
      data?.trustProof?.missing?.forEach(m => lines.push(`  ✗ ${m}`));
      lines.push(`  ${isEn ? 'Add these' : '建议增加'}:`);
      data?.trustProof?.suggestedBlocks?.forEach(s => lines.push(`  ✓ ${s}`));

      // Quick Wins
      lines.push(`\n${sep}`);
      lines.push(`⚡ ${isEn ? 'QUICK WINS (Do These Today!)' : '今天就能做的极速优化'}:`);
      data?.quickWins?.forEach((w, i) => lines.push(`  ${i + 1}. ${w}`));

      // 7-Day Plan
      lines.push(`\n${sep}`);
      lines.push(`📅 ${isEn ? '7-DAY OPTIMIZATION PLAN' : '7天优化落地计划'}:`);
      if (data?.optimizationPlan) {
        Object.entries(data.optimizationPlan).forEach(([key, val], i) => {
          lines.push(`  Day ${i + 1}: ${val.includes(': ') ? val.split(': ').slice(1).join(': ') : val}`);
        });
      }

      lines.push(`\n${sep}`);
      lines.push(`${isEn ? 'Generated by Landing Page Audit Agent' : '由 Landing Page Audit Agent 生成'}`);

      const fullText = lines.join('\n');
      navigator.clipboard.writeText(fullText).then(() => {
        showToast(isEn ? '✅ Full audit summary copied to clipboard!' : '✅ 完整审计摘要已复制到剪贴板！');
      }).catch(() => {
        showToast(isEn ? 'Copy failed, please try again' : '复制失败，请重试', 'error');
      });
    });
  };

  const tabs = [
    { id: 'summary', label: isEn ? 'Executive Summary' : '核心总结', icon: <Target size={16} /> },
    { id: 'hero', label: isEn ? 'Hero & UI' : '首屏与视觉', icon: <Layout size={16} /> },
    { id: 'copy', label: isEn ? 'Copy & Flow' : '文案与结构', icon: <PenTool size={16} /> },
    { id: 'trust', label: isEn ? 'Trust & FAQ' : '信任与异议', icon: <ShieldCheck size={16} /> },
  ];

  const ScoreBadge = ({ score }) => (
    <div className={`px-3 py-1 rounded-full text-xs font-bold ${score >= 70 ? 'bg-green-100 text-green-700' : score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
      Score: {score}/100
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:p-8 w-full mt-2 pb-24">
      {/* HEADER SECTION */}
      <div className="bg-white p-6 md:p-10 rounded-[32px] border border-slate-200 shadow-sm mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"/>
        
        <div className="w-full lg:w-auto relative z-10">
          <button 
            onClick={() => navigate('/')} 
            className="mb-4 text-slate-400 hover:text-blue-600 flex items-center gap-2 text-sm font-bold transition-all group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
            {isEn ? 'Back to Analyzer' : '返回首页'}
          </button>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3 tracking-tight leading-tight">
            {isEn ? 'Conversion Audit Report' : '落地页转化诊断报告'}
          </h2>
          <div className="flex items-center gap-2">
            <span className="p-1 bg-slate-100 rounded-md"><Layout size={14} className="text-slate-400"/></span>
            <p className="text-slate-500 break-all font-mono text-xs md:text-sm">{url}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto relative z-10">
          <button 
            onClick={handleCopyClick} 
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 border border-blue-100 rounded-2xl text-sm font-black bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all active:scale-[0.98]"
          >
            <Copy size={18} /> {isEn ? 'Copy Full Report' : '复制完整报告'}
          </button>
          
          <div className="flex items-center gap-6 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 w-full sm:w-auto justify-center">
            <div className="text-center">
              <div className={`text-4xl md:text-5xl font-black tracking-tighter ${score > 70 ? 'text-green-600' : 'text-blue-600'}`}>
                {score}
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {isEn ? 'Audit Score' : '综合得分'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* TABS NAVIGATION */}
        <div className="lg:w-64 shrink-0">
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 px-1 -mx-1 scrollbar-hide lg:sticky lg:top-24">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-sm whitespace-nowrap transition-all duration-200 border-2 ${
                  activeTab === tab.id 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/10 translate-x-1' 
                    : 'bg-white text-slate-400 hover:bg-slate-50 border-transparent hover:border-slate-100'
                }`}
              >
                <span className={`${activeTab === tab.id ? 'text-blue-400' : 'text-slate-300'} transition-colors`}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 min-w-0">

          {/* ================= TAB 1: EXECUTIVE SUMMARY ================= */}
          {activeTab === 'summary' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl">
                <h3 className="text-2xl font-black mb-4 flex items-center gap-2"><Target className="text-blue-200" /> {isEn ? 'Executive Summary' : '核心总结'}</h3>

                <div className="bg-white/10 p-5 rounded-2xl border border-white/20 mb-6 backdrop-blur-sm">
                  <div className="text-[10px] font-bold text-blue-200 uppercase tracking-wider mb-1">{isEn ? 'Overall Diagnosis' : '全局诊断'} - {data.overallDiagnosis.category}</div>
                  <p className="font-medium text-lg leading-relaxed">{data.overallDiagnosis.diagnosis}</p>
                </div>

                <p className="text-blue-50 text-lg leading-relaxed mb-4">{data.executiveSummary.problem}</p>
                <div className="bg-red-500/20 p-4 rounded-xl border border-red-500/30 mb-6">
                  <p className="font-semibold text-red-100">{data.executiveSummary.impact}</p>
                </div>

                <h4 className="text-sm font-bold uppercase tracking-wider text-blue-200 mb-3">{isEn ? 'Top 3 Priorities:' : '三大优先任务：'}</h4>
                <ul className="space-y-2">
                  {data.executiveSummary.priorities.map((p, i) => (
                    <li key={i} className="flex gap-3"><CheckCircle size={20} className="text-green-300 shrink-0" /> <span className="font-medium">{p}</span></li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Leaks */}
                <div className="bg-white p-6 rounded-3xl border shadow-sm">
                  <h3 className="text-xl font-black mb-6 flex items-center gap-2"><AlertTriangle className="text-red-500" /> {isEn ? 'Top Conversion Leaks' : '最大转化漏点'}</h3>
                  <div className="space-y-6">
                    {data.topLeaks.map((leak, i) => (
                      <div key={i} className="relative pl-6 border-l-2 border-red-100">
                        <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-red-400 border-4 border-white"></div>
                        <h4 className="font-bold text-slate-900">{leak.title}</h4>
                        <p className="text-sm text-slate-500 mt-1"><strong className="text-slate-700">{isEn ? 'Impact:' : '影响：'}</strong> {leak.hurts}</p>
                        <p className="text-sm text-blue-700 mt-1 bg-blue-50 p-2 rounded-lg"><strong className="text-blue-800">{isEn ? 'Fix:' : '修复建议：'}</strong> {leak.fix}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Wins & 7 Day Plan */}
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-3xl border shadow-sm">
                    <h3 className="text-xl font-black mb-4 flex items-center gap-2"><Zap className="text-yellow-500" /> {isEn ? '15-Minute Quick Wins' : '15分钟快速优化'}</h3>
                    <ul className="space-y-3">
                      {data.quickWins.map((win, i) => (
                        <li key={i} className="flex gap-3 text-sm"><div className="w-5 h-5 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center shrink-0 font-bold text-[10px]">{i + 1}</div> {win}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-purple-300"><Calendar size={20} /> {isEn ? '7-Day Action Plan' : '7天优化落地计划'}</h3>
                    <div className="space-y-3 text-sm">
                      {Object.entries(data.optimizationPlan).map(([day, text], i) => (
                        <div key={i} className="flex gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                          <span className="font-mono text-purple-300 font-bold">D{i + 1}</span>
                          <span className="text-slate-300">{text.split(': ')[1] || text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: HERO & UI ================= */}
          {activeTab === 'hero' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              {/* 1. Above-the-Fold Audit */}
              <div className="bg-white p-8 rounded-3xl border shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black flex items-center gap-2"><Layout className="text-blue-500" /> {isEn ? 'Above-the-Fold Audit' : '首屏与前5秒诊断'}</h3>
                  <ScoreBadge score={data?.aboveTheFold?.score || 0} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">{isEn ? 'Headline Clarity' : '大标题清晰度'}</h4>
                      <p className="text-sm text-slate-700 mt-1 flex gap-2"><span className="text-red-500 font-bold">×</span> {data?.aboveTheFold?.headlineProblem || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">{isEn ? 'Subheadline' : '副标题致命伤'}</h4>
                      <p className="text-sm text-slate-700 mt-1 flex gap-2"><span className="text-red-500 font-bold">×</span> {data?.aboveTheFold?.subheadlineProblem || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">{isEn ? 'First 5 Sec Diagnosis' : '黄金5秒诊断'}</h4>
                      <p className="text-sm text-slate-700 mt-1 flex gap-2"><span className="text-orange-500 font-bold">!</span> {data?.aboveTheFold?.fiveSecondDiagnosis || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">{isEn ? 'Missing Trust' : '缺失信任背书'}</h4>
                      <p className="text-sm text-slate-700 mt-1 flex gap-2"><span className="text-orange-500 font-bold">!</span> {data?.aboveTheFold?.missingTrust || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 h-full">
                      <h4 className="font-bold text-xs text-red-600 uppercase tracking-wider mb-2">{isEn ? 'Why it hurts conversion' : '为什么这会扼杀转化？'}</h4>
                      <p className="text-sm text-red-800 font-medium">{data?.aboveTheFold?.whyHurts || 'N/A'}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 h-full">
                      <h4 className="font-bold text-xs text-blue-600 uppercase tracking-wider mb-2">{isEn ? 'How to fix it' : '如何立刻修复'}</h4>
                      <p className="text-sm text-blue-800 font-medium">{data?.aboveTheFold?.fix || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* 2. Hero Rewrite Suggestions */}
                <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-inner">
                  <h4 className="font-bold text-sm text-purple-300 uppercase tracking-wider mb-4 flex items-center gap-2"><PenTool size={16} /> {isEn ? 'Hero Rewrite Suggestions' : '首屏文案与结构重写建议'}</h4>
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-bold text-white/50 bg-white/10 px-2 py-1 rounded uppercase">Better Headline (H1)</span>
                      <p className="text-xl font-black text-white mt-2 leading-tight">{data?.aboveTheFold?.headlineExample || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-white/50 bg-white/10 px-2 py-1 rounded uppercase">Better Subheadline (H2)</span>
                      <p className="text-sm text-slate-300 mt-1">{data?.aboveTheFold?.subheadlineExample || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-white/50 bg-white/10 px-2 py-1 rounded uppercase">Recommended Hero Structure</span>
                      <p className="text-sm font-mono text-purple-200 mt-1">{data?.aboveTheFold?.heroStructure || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. CTA / Button Visual Audit */}
              <div className="bg-white p-8 rounded-3xl border shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black flex items-center gap-2"><MousePointerClick className="text-emerald-500" /> {isEn ? 'CTA & Button Visual Audit' : 'CTA 按钮视觉与文案诊断'}</h3>
                  <ScoreBadge score={data?.ctaAudit?.score || 0} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">{isEn ? 'CTA Visibility' : '可见度诊断'}</h4>
                      <p className="text-sm text-slate-700 mt-1">{data?.ctaAudit?.visibility || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">{isEn ? 'Button Color Contrast' : '色彩对比度'}</h4>
                      <p className="text-sm text-slate-700 mt-1">{data?.ctaAudit?.colorContrast || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">{isEn ? 'Button Placement' : '按钮位置'}</h4>
                      <p className="text-sm text-slate-700 mt-1">{data?.ctaAudit?.placement || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">{isEn ? 'Copy Problem' : '当前文案问题'}</h4>
                      <p className="text-sm text-slate-700 mt-1">{data?.ctaAudit?.copyProblem || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex flex-col justify-center">
                    <h4 className="font-bold text-xs text-emerald-600 uppercase tracking-wider mb-3">{isEn ? 'Suggested Action Copy' : '高转化替换文案'}</h4>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {data?.ctaAudit?.betterCopy?.map((c, i) => <span key={i} className="bg-emerald-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-sm">{c}</span>) || 'N/A'}
                    </div>
                    <h4 className="font-bold text-xs text-emerald-600 uppercase tracking-wider mb-2">{isEn ? 'Microcopy Under Button' : '按钮下方必加微文案'}</h4>
                    <p className="text-slate-800 font-medium italic">"{data?.ctaAudit?.microcopy || 'N/A'}"</p>
                  </div>
                </div>
              </div>

              {/* 4 & 5. Visual Hierarchy & Mobile Audit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Visual Hierarchy */}
                <div className="bg-white p-6 rounded-3xl border shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black flex items-center gap-2"><Palette className="text-purple-500" /> {isEn ? 'Visual Hierarchy' : '视觉层级与排版'}</h3>
                    <ScoreBadge score={data?.visualHierarchy?.score || 0} />
                  </div>
                  <div className="space-y-3 mb-6">
                    <div><span className="text-xs font-bold text-slate-400 uppercase block">{isEn ? 'Color Hierarchy' : '色彩主次'}</span><span className="text-sm text-slate-700">{data?.visualHierarchy?.colorHierarchy || 'N/A'}</span></div>
                    <div><span className="text-xs font-bold text-slate-400 uppercase block">{isEn ? 'Typography' : '字体字号'}</span><span className="text-sm text-slate-700">{data?.visualHierarchy?.typography || 'N/A'}</span></div>
                    <div><span className="text-xs font-bold text-slate-400 uppercase block">{isEn ? 'Spacing' : '留白与呼吸感'}</span><span className="text-sm text-slate-700">{data?.visualHierarchy?.spacing || 'N/A'}</span></div>
                    <div><span className="text-xs font-bold text-slate-400 uppercase block">{isEn ? 'Focal Point' : '视觉焦点'}</span><span className="text-sm text-slate-700">{data?.visualHierarchy?.focalPoint || 'N/A'}</span></div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                    <span className="text-[10px] font-bold text-purple-600 uppercase block mb-1">{isEn ? 'Layout Recommendation' : '排版核心建议'}</span>
                    <p className="text-sm font-semibold text-purple-900">{data?.visualHierarchy?.recommendation || 'N/A'}</p>
                  </div>
                </div>

                {/* Mobile Audit */}
                <div className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black flex items-center gap-2"><Smartphone className="text-teal-500" /> {isEn ? 'Mobile First-Screen' : '移动端首屏体验'}</h3>
                    <ScoreBadge score={data?.mobileExperience?.score || 0} />
                  </div>
                  <div className="space-y-3 mb-6 flex-1">
                    <div><span className="text-xs font-bold text-slate-400 uppercase block">{isEn ? 'Mobile Friction' : '移动端摩擦力'}</span><span className="text-sm text-slate-700">{data?.mobileExperience?.mobileFriction || 'N/A'}</span></div>
                    <div><span className="text-xs font-bold text-slate-400 uppercase block">{isEn ? 'Form/Input Issue' : '输入框体验'}</span><span className="text-sm text-slate-700">{data?.mobileExperience?.inputIssue || 'N/A'}</span></div>
                    <div><span className="text-xs font-bold text-slate-400 uppercase block">{isEn ? 'CTA Visibility' : '按钮触达率'}</span><span className="text-sm text-slate-700">{data?.mobileExperience?.ctaVisibility || 'N/A'}</span></div>
                  </div>
                  <div className="bg-teal-50 p-3 rounded-lg border border-teal-100">
                    <span className="text-[10px] font-bold text-teal-600 uppercase block mb-1">{isEn ? 'Recommended Mobile Layout' : '移动端布局建议'}</span>
                    <p className="text-sm font-semibold text-teal-900">{data?.mobileExperience?.recommendedLayout || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* 6. Quick fixes for this section */}
              <div className="bg-white p-6 rounded-3xl border shadow-sm">
                <h3 className="text-lg font-black flex items-center gap-2 mb-4"><Zap className="text-yellow-500" /> {isEn ? 'Quick Fixes (Hero & UI)' : '该模块的 5 个极速优化动作'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data?.aboveTheFold?.quickFixes?.map((fix, i) => (
                    <div key={i} className="flex gap-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <CheckCircle size={18} className="text-yellow-500 shrink-0" /> {fix}
                    </div>
                  )) || <div className="text-sm text-slate-500">N/A</div>}
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB 3: COPY & FLOW ================= */}
          {activeTab === 'copy' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-white p-8 rounded-3xl border shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black flex items-center gap-2"><Layers className="text-orange-500" /> {isEn ? 'Page Structure & Flow' : '页面结构与阅读流'}</h3>
                  <ScoreBadge score={data?.pageStructure?.score || 0} />
                </div>
                <div className="bg-orange-50 text-orange-900 p-4 rounded-xl text-sm border border-orange-100 mb-6">
                  <strong>{isEn ? 'Current Flaw:' : '当前结构缺陷：'}</strong> {data?.pageStructure?.problem || 'N/A'}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-3">{isEn ? 'Recommended Order' : '推荐的页面骨架顺'}</h4>
                    <div className="flex flex-col gap-1">
                      {data?.pageStructure?.recommendedOrder?.map((step, i) => (
                        <div key={i} className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100 text-sm font-bold text-slate-700">
                          <div className="w-6 h-6 rounded-full bg-white border shadow-sm flex items-center justify-center text-[10px] text-slate-400 shrink-0">{i + 1}</div>
                          {step}
                        </div>
                      )) || 'N/A'}
                    </div>
                  </div>
                  <div className="pt-2">
                    <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-3">{isEn ? 'Why this works' : '为什么这样排版更好？'}</h4>
                    <p className="text-slate-600 text-sm leading-relaxed">{data?.pageStructure?.whyBetter || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black flex items-center gap-2"><PenTool className="text-indigo-500" /> {isEn ? 'Copywriting Audit' : '文案杀伤力'}</h3>
                  <ScoreBadge score={data?.copywriting?.score || 0} />
                </div>
                <h4 className="font-bold text-xs text-slate-400 uppercase mb-2">{isEn ? 'Weak Areas' : '文案毒瘤'}</h4>
                <ul className="space-y-2 mb-6">
                  {data?.copywriting?.weakAreas?.map((p, i) => <li key={i} className="text-sm text-slate-600 border-b pb-2 flex gap-2"><span className="text-red-500">×</span> {p}</li>) || 'N/A'}
                </ul>
                <h4 className="font-bold text-xs text-indigo-500 uppercase mb-2">{isEn ? 'Rewrite Rules' : '修改铁律'}</h4>
                <ul className="space-y-2">
                  {data?.copywriting?.suggestions?.map((p, i) => <li key={i} className="text-sm text-slate-900 font-medium flex gap-2"><CheckCircle size={14} className="text-indigo-500 mt-0.5" />{p}</li>) || 'N/A'}
                </ul>
              </div>
            </div>
          )}

          {/* ================= TAB 4: TRUST & FAQ ================= */}
          {activeTab === 'trust' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-white p-8 rounded-3xl border shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black flex items-center gap-2"><ShieldCheck className="text-green-600" /> {isEn ? 'Trust & Proof Audit' : '信任与背书诊断'}</h3>
                  <ScoreBadge score={data?.trustProof?.score || 0} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-3">{isEn ? 'Missing Trust Elements' : '极度缺失的信任元素'}</h4>
                    <ul className="space-y-3">
                      {data?.trustProof?.missing?.map((p, i) => <li key={i} className="flex gap-2 text-sm text-slate-700"><span className="text-red-500">×</span> {p}</li>) || 'N/A'}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-3">{isEn ? 'Suggested Proof Blocks' : '强烈建议增加的区块'}</h4>
                    <ul className="space-y-3">
                      {data?.trustProof?.suggestedBlocks?.map((p, i) => <li key={i} className="flex gap-2 text-sm font-bold text-slate-900"><CheckCircle size={16} className="text-green-500" /> {p}</li>) || 'N/A'}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black flex items-center gap-2"><HelpCircle className="text-rose-500" /> {isEn ? 'FAQ / Objection Handling' : 'FAQ 与异议处理'}</h3>
                  <ScoreBadge score={data?.faqObjections?.score || 0} />
                </div>
                <div className="mb-6">
                  <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-3">{isEn ? 'Unanswered Objections (Conversion Killers)' : '尚未解答的致命疑虑 (转化杀手)'}</h4>
                  <div className="flex flex-wrap gap-2">
                    {data?.faqObjections?.missing?.map((m, i) => <span key={i} className="bg-rose-50 text-rose-700 border border-rose-100 px-3 py-1.5 rounded-lg text-sm font-semibold">{m}</span>) || 'N/A'}
                  </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-4">{isEn ? 'Must-Have FAQ Examples' : '必加的 FAQ 范例'}</h4>
                  <div className="space-y-4">
                    {data?.faqObjections?.suggested?.map((faq, i) => (
                      <div key={i}>
                        <div className="font-bold text-slate-900 flex gap-2"><HelpCircle size={16} className="text-rose-400 mt-0.5 shrink-0" /> {faq.q}</div>
                        <div className="text-sm text-slate-600 mt-1 pl-6">{faq.a}</div>
                      </div>
                    )) || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <AdvancedAuditSection 
        supabase={supabase} 
        url={url} 
        goal={reportData.goal} 
        audience={reportData.audience} 
        lang={lang} 
      />
    </div>
  );
};

export default Report;
