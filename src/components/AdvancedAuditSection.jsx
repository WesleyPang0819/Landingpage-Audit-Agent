import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Loader2, AlertTriangle, CheckCircle, PenTool,
  TrendingUp, Lightbulb, Shield, Eye, Calendar, Download, Copy, Languages, FileText, X
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';

const AdvancedAuditSection = ({ supabase, url, goal, audience, lang: initialLang }) => {
  const { user, memberProfile, isVip, requireAuth } = useAuth();
  const [status, setStatus] = useState('idle');
  const [report, setReport] = useState(null);
  const [reportLang, setReportLang] = useState(null);
  const [error, setError] = useState(null);
  const [currentLang, setCurrentLang] = useState(initialLang);
  const [isExporting, setIsExporting] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    setCurrentLang(initialLang);
  }, [initialLang]);

  const run = async () => {
    // 1. Soft Gate: Must be logged in
    requireAuth('advanced_audit', async () => {
      // 2. VIP Gate Check
      if (memberProfile?.status === 'blocked') {
        setError('ACCOUNT_BLOCKED');
        setStatus('error');
        return;
      }

      if (!isVip) {
        setShowUpgradeModal(true);
        return;
      }

      // 3. Execution
      setStatus('loading');
      setError(null);
      const langToUse = currentLang;
      try {
        const { data, error: fnErr } = await supabase.functions.invoke('advanced-audit', {
          body: { url, goal, audience, lang: langToUse }
        });
        
        // Handle specific error codes from Edge Function
        if (data?.error === 'VIP_REQUIRED') {
          setShowUpgradeModal(true);
          setStatus('idle');
          return;
        }
        if (data?.error === 'ACCOUNT_BLOCKED') {
          setError('ACCOUNT_BLOCKED');
          setStatus('error');
          return;
        }

        if (fnErr) throw new Error(fnErr.message);
        if (data?.error) throw new Error(data.error);
        if (!data.success) throw new Error(data.error || 'Failed');
        
        setReport(data.report);
        setReportLang(langToUse);
        setStatus('success');
      } catch (err) {
        setError(err.message);
        setStatus('error');
      }
    });
  };

  const handleExportPDF = () => {
    if (!report || !window.html2pdf || !reportLang) return;
    
    setIsExporting(true);
    const element = reportRef.current;
    element.style.display = 'block';
    
    const isEnReport = reportLang === 'en';
    const opt = {
      margin: [15, 15],
      filename: isEnReport ? `Advanced_Audit_${url.replace(/[^a-zA-Z0-9]/g, '_')}.pdf` : `进阶审计报告_${url.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0, scrollX: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    window.html2pdf().set(opt).from(element).save().then(() => {
      element.style.display = 'none';
      setIsExporting(false);
    }).catch(err => {
      console.error('PDF Export Error:', err);
      element.style.display = 'none';
      setIsExporting(false);
    });
  };

  const isEnUI = currentLang === 'en';
  const isEnReport = reportLang === 'en';
  const needsReRun = report && reportLang !== currentLang;

  return (
    <div className="mt-10 mb-20">

      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="text-indigo-500" />
            {isEnUI ? 'Advanced AI Analysis' : '进阶 AI 深度分析'}
          </h2>
          <p className="text-slate-500 text-sm">
            {isEnUI ? 'Deep CRO audit powered by GPT-5.4-mini' : '基于 GPT-5.4-mini 的深度转化率优化审计'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button 
            onClick={() => setCurrentLang(currentLang === 'en' ? 'zh' : 'en')}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-indigo-500 transition-colors shadow-sm"
          >
            <Languages size={14} className="text-indigo-500" />
            {currentLang === 'en' ? 'English' : '简体中文'}
          </button>

          {status === 'success' && (
            <button 
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 disabled:opacity-70"
            >
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {isEnUI ? (isExporting ? 'Generating PDF...' : 'Export PDF') : (isExporting ? '正在生成 PDF...' : '导出 PDF 报告')}
            </button>
          )}
        </div>
      </div>

      {/* RE-RUN NOTICE */}
      {needsReRun && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4">
          <p className="text-sm text-amber-800">
            <AlertTriangle size={16} className="inline mr-2 text-amber-500" />
            {isEnUI 
              ? `The current report is in ${reportLang === 'en' ? 'English' : 'Chinese'}. To get a full report in English, please re-run the analysis.`
              : `当前报告语言为${reportLang === 'en' ? '英文' : '中文'}。如需纯华文报告，请重新点击“运行分析”。`}
          </p>
          <button onClick={run} className="px-4 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 whitespace-nowrap">
            {isEnUI ? 'Re-run Analysis' : '重新运行'}
          </button>
        </div>
      )}

      {/* IDLE */}
      {status === 'idle' && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 md:p-10 shadow-2xl border border-indigo-800/40">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"/>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"/>
          </div>
          <div className="relative flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-xs font-bold uppercase tracking-wider mb-4">
                <Sparkles size={12}/> AI-Powered Deep Audit
              </div>
              <h3 className="text-3xl font-black text-white mb-3 leading-tight">
                {isEnUI ? 'Unlock Advanced AI Analysis' : '解锁进阶 AI 深度分析'}
              </h3>
              <p className="text-slate-300 text-base leading-relaxed max-w-2xl">
                {isEnUI 
                  ? 'Get a deeper CRO audit with copy rewrites, CTA improvements, offer clarity diagnosis, trust and objection mapping, visual hierarchy feedback, and a 7-day optimization plan.'
                  : '获取更深度的 CRO 审计：包括文案重写、CTA 改进、产品清晰度诊断、信任与异议映射、视觉层级反馈以及 7 天优化计划。'}
              </p>
              <div className="flex flex-wrap gap-3 mt-5">
                {(isEnUI ? ['Copy Rewrites','CTA Improvements','Offer Clarity','Objection Map','7-Day Plan'] : ['文案重写','CTA 改进','产品清晰度','异议映射','7天计划']).map(f => (
                  <span key={f} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-slate-300">
                    <CheckCircle size={12} className="text-indigo-400"/> {f}
                  </span>
                ))}
              </div>
            </div>
            <div className="shrink-0">
              <button onClick={run} className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-bold text-lg rounded-2xl shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:scale-105">
                <Sparkles size={20} className="group-hover:rotate-12 transition-transform"/>
                {isEnUI ? 'Run Advanced AI Analysis' : '运行进阶 AI 分析'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOADING */}
      {status === 'loading' && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-10 shadow-2xl border border-indigo-800/40 text-center">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"/>
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center mx-auto mb-4">
              <Loader2 size={32} className="text-indigo-400 animate-spin"/>
            </div>
            <h3 className="text-2xl font-black text-white mb-2">
              {isEnUI ? 'Running Advanced AI Analysis...' : '正在运行进阶 AI 分析...'}
            </h3>
            <p className="text-slate-400 text-sm">
              {isEnUI ? 'GPT-5.4-mini is analyzing your landing page. This may take 15–30 seconds.' : 'GPT-5.4-mini 正在分析您的落地页，预计耗时 15-30 秒。'}
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {(isEnUI ? ['Analyzing copy...','Mapping objections...','Building 7-day plan...'] : ['分析文案中...','映射异议中...','构建 7 天计划...']).map((s,i) => (
                <span key={i} style={{animationDelay:`${i*0.4}s`}} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-slate-400 animate-pulse">{s}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ERROR */}
      {status === 'error' && (
        <div className="rounded-3xl bg-red-50 border border-red-200 p-8 text-center">
          <AlertTriangle size={40} className="text-red-400 mx-auto mb-3"/>
          <h3 className="text-xl font-black text-red-800 mb-2">
            {error === 'ACCOUNT_BLOCKED' 
              ? (isEnUI ? 'Account Blocked' : '账号已封禁')
              : (isEnUI ? 'Analysis Failed' : '分析失败')}
          </h3>
          <p className="text-red-600 text-sm mb-4 font-mono bg-red-100 p-3 rounded-lg max-w-xl mx-auto break-all">
            {error === 'ACCOUNT_BLOCKED'
              ? (isEnUI ? 'You are not allowed to use this service. Please contact support.' : '您被禁止使用此服务，请联系管理员。')
              : error}
          </p>
          {error !== 'ACCOUNT_BLOCKED' && (
            <button onClick={run} className="px-6 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700">
              {isEnUI ? 'Retry' : '重试'}
            </button>
          )}
        </div>
      )}

      {/* SUCCESS */}
      {status === 'success' && report && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Copy Rewrites */}
          {report.copyRewrites && (
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-indigo-900/5 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-6 md:p-8">
                <h4 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md"><PenTool size={20}/></div>
                  {isEnReport ? 'Copy Rewrites' : '文案重写建议'}
                </h4>
                <p className="text-indigo-100 text-sm mt-2 font-medium opacity-90">
                  {isEnReport ? 'AI-generated high-converting copy' : '针对您的受众定制的高转化文案建议'}
                </p>
              </div>
              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {report.copyRewrites.headline && (
                  <div className="bg-slate-50 border border-slate-200 p-6 rounded-[24px] md:col-span-2 group hover:border-indigo-200 transition-colors">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-2">
                      {isEnReport ? 'New Headline (H1)' : '新标题 (H1)'}
                    </span>
                    <p className="text-slate-900 font-black text-xl md:text-2xl leading-tight group-hover:text-indigo-900 transition-colors">{report.copyRewrites.headline}</p>
                  </div>
                )}
                {report.copyRewrites.subheadline && (
                  <div className="bg-slate-50 border border-slate-200 p-6 rounded-[24px] group hover:border-purple-200 transition-colors">
                    <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest block mb-2">
                      {isEnReport ? 'New Subheadline (H2)' : '新副标题 (H2)'}
                    </span>
                    <p className="text-slate-900 font-bold text-sm md:text-base leading-relaxed">{report.copyRewrites.subheadline}</p>
                  </div>
                )}
                {report.copyRewrites.cta && (
                  <div className="bg-slate-50 border border-slate-200 p-6 rounded-[24px] flex flex-col justify-center group hover:border-emerald-200 transition-colors">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-3">
                      {isEnReport ? 'Recommended CTA' : '推荐按钮文字'}
                    </span>
                    <div className="inline-block bg-emerald-600 text-white font-black px-6 py-3 rounded-xl text-sm w-fit shadow-lg shadow-emerald-600/20">
                      {report.copyRewrites.cta}
                    </div>
                  </div>
                )}
                {report.copyRewrites.bodyHook && (
                  <div className="bg-slate-50 border border-slate-200 p-6 rounded-[24px] md:col-span-2">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-2">
                      {isEnReport ? 'Opening Body Hook' : '首屏引导钩子'}
                    </span>
                    <p className="text-slate-700 font-medium italic leading-relaxed text-sm md:text-base border-l-4 border-blue-200 pl-4 py-1">"{report.copyRewrites.bodyHook}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CTA + Offer Clarity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {report.ctaImprovements && (
              <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-6 md:p-8">
                <h4 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-6">
                  <TrendingUp size={24} className="text-emerald-500"/> {isEnReport ? 'CTA Improvements' : 'CTA 优化细节'}
                </h4>
                <ul className="space-y-4">
                  {report.ctaImprovements.map((item, i) => (
                    <li key={i} className="flex gap-4 text-sm md:text-base text-slate-700 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50 group hover:bg-emerald-50 transition-all">
                      <CheckCircle size={20} className="text-emerald-500 shrink-0 mt-0.5"/>
                      <span className="font-medium leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {report.offerClarity && (
              <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-6 md:p-8">
                <h4 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-6">
                  <Lightbulb size={24} className="text-yellow-500"/> {isEnReport ? 'Offer Clarity' : '产品清晰度诊断'}
                </h4>
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-100 p-4 rounded-2xl">
                    <span className="text-[10px] font-black text-red-600 uppercase tracking-widest block mb-1">{isEnReport ? 'Current Problem' : '当前问题'}</span>
                    <p className="text-sm md:text-base text-red-900 font-bold leading-relaxed">{report.offerClarity.currentProblem}</p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl">
                    <span className="text-[10px] font-black text-yellow-700 uppercase tracking-widest block mb-1">{isEnReport ? 'Root Cause' : '根本原因'}</span>
                    <p className="text-sm md:text-base text-yellow-900 font-medium leading-relaxed">{report.offerClarity.diagnosis}</p>
                  </div>
                  <div className="bg-green-50 border border-green-100 p-4 rounded-2xl">
                    <span className="text-[10px] font-black text-green-700 uppercase tracking-widest block mb-1">{isEnReport ? 'Key Action' : '核心建议'}</span>
                    <p className="text-sm md:text-base text-green-900 font-bold leading-relaxed">{report.offerClarity.recommendation}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Objection Map */}
          {report.trustObjectionMap && (
            <div className="bg-white rounded-3xl border shadow-sm p-6">
              <h4 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-5">
                <Shield size={20} className="text-rose-500"/> {isEnReport ? 'Trust & Objection Map' : '信任与异议映射'}
              </h4>
              <div className="space-y-4">
                {report.trustObjectionMap.map((item, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl">
                      <span className="text-[10px] font-bold text-rose-600 uppercase block mb-1">
                        {isEnReport ? `Visitor Objection #${i+1}` : `访客疑虑 #${i+1}`}
                      </span>
                      <p className="text-sm font-semibold text-rose-900">"{item.objection}"</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        {isEnReport ? 'Page Response Strategy' : '页面应对策略'}
                      </span>
                      <p className="text-sm font-medium text-slate-700">{item.response}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visual Hierarchy + 7-Day Plan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {report.visualHierarchyFeedback && (
              <div className="bg-white rounded-3xl border shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Eye size={20} className="text-purple-500"/> {isEnReport ? 'Visual Hierarchy' : '视觉层级'}
                  </h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${(report.visualHierarchyFeedback.score||0)>=70?'bg-green-100 text-green-700':(report.visualHierarchyFeedback.score||0)>=50?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>
                    {isEnReport ? 'Score' : '评分'}: {report.visualHierarchyFeedback.score}/100
                  </span>
                </div>
                <div className="bg-purple-50 border border-purple-100 p-3 rounded-xl mb-4">
                  <span className="text-[10px] font-bold text-purple-600 uppercase block mb-1">{isEnReport ? 'Main Issue' : '主要问题'}</span>
                  <p className="text-sm font-medium text-purple-900">{report.visualHierarchyFeedback.mainIssue}</p>
                </div>
                <ul className="space-y-2">
                  {report.visualHierarchyFeedback.recommendations?.map((r, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700">
                      <CheckCircle size={14} className="text-purple-400 mt-0.5 shrink-0"/>{r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {report.sevenDayPlan && (
              <div className="bg-slate-900 rounded-3xl p-6 text-white">
                <h4 className="text-lg font-black text-white flex items-center gap-2 mb-4">
                  <Calendar size={20} className="text-indigo-300"/> {isEnReport ? '7-Day Optimization Plan' : '7 天优化执行计划'}
                </h4>
                <div className="space-y-2">
                  {report.sevenDayPlan.map((item) => (
                    <div key={item.day} className="flex gap-3 bg-white/5 border border-white/10 p-3 rounded-xl">
                      <span className="font-mono text-indigo-300 font-black text-sm shrink-0 w-6">D{item.day}</span>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">{item.focus}</span>
                        <p className="text-sm text-slate-300 font-medium leading-snug">{item.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= HIDDEN PRINTABLE PDF TEMPLATE ================= */}
      <div style={{ display: 'none' }}>
        <div ref={reportRef} style={{ width: '190mm', padding: '15mm', background: 'white', fontFamily: 'sans-serif', color: '#1e293b' }}>
          <div style={{ borderBottom: '2px solid #6366f1', paddingBottom: '10mm', marginBottom: '10mm' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#1e293b', margin: 0 }}>
              {isEnReport ? 'Advanced AI CRO Audit' : '进阶 AI 落地页转化率审计报告'}
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
              URL: {url} • Date: {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* 1. Copy Rewrites */}
          {report?.copyRewrites && (
            <div style={{ marginBottom: '10mm', pageBreakInside: 'avoid' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#4f46e5', marginBottom: '8px' }}>
                {isEnReport ? '1. Copy Rewrites' : '1. 文案重写建议'}
              </h2>
              <div style={{ padding: '6mm', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ marginBottom: '6mm' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isEnReport ? 'Headline (H1)' : '主标题'}</span>
                  <p style={{ fontSize: '22px', fontWeight: '900', margin: '2px 0', lineHeight: '1.2', color: '#0f172a' }}>{report.copyRewrites.headline}</p>
                </div>
                <div style={{ marginBottom: '6mm' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isEnReport ? 'Subheadline' : '副标题'}</span>
                  <p style={{ fontSize: '15px', fontWeight: '600', margin: '2px 0', lineHeight: '1.5', color: '#334155' }}>{report.copyRewrites.subheadline}</p>
                </div>
                <div style={{ marginBottom: '6mm' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isEnReport ? 'CTA Button' : '按钮文字'}</span>
                  <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '4px 0', color: '#059669' }}>{report.copyRewrites.cta}</p>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isEnReport ? 'Body Hook' : '首屏引导文案'}</span>
                  <p style={{ fontSize: '14px', fontStyle: 'italic', margin: '2px 0', color: '#475569', lineHeight: '1.6' }}>"{report.copyRewrites.bodyHook}"</p>
                </div>
              </div>
            </div>
          )}

          {/* 2. CTA & 3. Offer */}
          <div style={{ display: 'flex', gap: '10mm', marginBottom: '10mm', pageBreakInside: 'avoid' }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>{isEnReport ? '2. CTA Details' : '2. CTA 优化细节'}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3mm' }}>
                {report?.ctaImprovements?.map((item, i) => (
                  <div key={i} style={{ fontSize: '13px', padding: '3mm', background: '#ecfdf5', borderLeft: '3px solid #10b981', color: '#065f46', borderRadius: '4px' }}>{item}</div>
                ))}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>{isEnReport ? '3. Offer Clarity' : '3. 产品清晰度'}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3mm' }}>
                <div style={{ padding: '3mm', background: '#fff1f2', borderRadius: '8px' }}>
                  <strong style={{ fontSize: '11px', color: '#e11d48' }}>{isEnReport ? 'Problem' : '当前问题'}:</strong>
                  <p style={{ fontSize: '12px', margin: '1mm 0 0 0' }}>{report?.offerClarity?.currentProblem}</p>
                </div>
                <div style={{ padding: '3mm', background: '#fefce8', borderRadius: '8px' }}>
                  <strong style={{ fontSize: '11px', color: '#a16207' }}>{isEnReport ? 'Diagnosis' : '原因分析'}:</strong>
                  <p style={{ fontSize: '12px', margin: '1mm 0 0 0' }}>{report?.offerClarity?.diagnosis}</p>
                </div>
                <div style={{ padding: '3mm', background: '#f0fdf4', borderRadius: '8px' }}>
                  <strong style={{ fontSize: '11px', color: '#16a34a' }}>{isEnReport ? 'Action' : '核心建议'}:</strong>
                  <p style={{ fontSize: '12px', margin: '1mm 0 0 0' }}>{report?.offerClarity?.recommendation}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Trust & Objection Map */}
          {report?.trustObjectionMap && (
            <div style={{ marginBottom: '10mm', pageBreakInside: 'avoid' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>{isEnReport ? '4. Trust & Objection Map' : '4. 信任与异议映射图'}</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: '1px solid #e2e8f0' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '4mm', textAlign: 'left', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 'bold' }}>{isEnReport ? 'Visitor Objection' : '访客疑虑'}</th>
                    <th style={{ padding: '4mm', textAlign: 'left', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 'bold' }}>{isEnReport ? 'Response Strategy' : '应对策略'}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.trustObjectionMap.map((item, i) => (
                    <tr key={i}>
                      <td style={{ padding: '4mm', border: '1px solid #e2e8f0', fontWeight: '800', background: '#fff5f5', color: '#991b1b', width: '40%' }}>{item.objection}</td>
                      <td style={{ padding: '4mm', border: '1px solid #e2e8f0', color: '#334155', lineHeight: '1.5' }}>{item.response}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 5. Visual Hierarchy & 6. 7-Day Plan */}
          <div style={{ display: 'flex', gap: '10mm', pageBreakInside: 'avoid' }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>{isEnReport ? '5. Visual Hierarchy' : '5. 视觉层级反馈'}</h2>
              <div style={{ padding: '4mm', border: '1px solid #f3e8ff', background: '#faf5ff', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3mm' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#7e22ce' }}>{isEnReport ? 'Score' : '评分'}: {report?.visualHierarchyFeedback?.score}/100</span>
                </div>
                <p style={{ fontSize: '13px', color: '#6b21a8', fontWeight: 'bold', marginBottom: '2mm' }}>{report?.visualHierarchyFeedback?.mainIssue}</p>
                <ul style={{ fontSize: '12px', paddingLeft: '5mm', margin: 0 }}>
                  {report?.visualHierarchyFeedback?.recommendations?.map((r, i) => <li key={i} style={{ marginBottom: '1.5mm', color: '#581c87' }}>{r}</li>)}
                </ul>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>{isEnReport ? '6. 7-Day Plan' : '6. 7 天优化计划'}</h2>
              <div style={{ background: '#0f172a', padding: '5mm', borderRadius: '12px', color: 'white' }}>
                {report?.sevenDayPlan?.map((item) => (
                  <div key={item.day} style={{ fontSize: '11px', marginBottom: '3mm', borderBottom: '1px solid #334155', paddingBottom: '2mm' }}>
                    <strong style={{ color: '#818cf8', display: 'block', fontSize: '10px' }}>DAY {item.day} - {item.focus.toUpperCase()}</strong>
                    <p style={{ margin: '1mm 0 0 0', color: '#cbd5e1' }}>{item.action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20mm', paddingTop: '8mm', borderTop: '1px solid #e2e8f0', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
            Landing Page Audit Agent • Professional CRO Report • {url}
          </div>
        </div>
      </div>

      {/* UPGRADE TO VIP MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="relative p-8 md:p-10">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-5 rotate-3">
                <Sparkles size={30} fill="currentColor" />
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">
                {isEnUI ? 'VIP Feature Locked' : 'VIP 功能已锁定'}
              </h3>
              <p className="text-slate-500 text-sm font-semibold mb-5">
                {isEnUI
                  ? 'Advanced AI Analysis is available for VIP members only.'
                  : '进阶 AI 分析仅对 VIP 会员开放。'}
              </p>

              <div className="space-y-2 mb-6">
                {(isEnUI ? [
                  'AI-powered deep landing page analysis',
                  'Copy rewrites',
                  'CTA improvements',
                  'Offer clarity diagnosis',
                  'Trust and objection mapping',
                  'Visual hierarchy feedback',
                  '7-day optimization plan',
                ] : [
                  'AI 深度落地页分析',
                  '文案重写建议',
                  'CTA 优化',
                  '产品清晰度诊断',
                  '信任与异议映射',
                  '视觉层级反馈',
                  '7 天优化计划',
                ]).map(feat => (
                  <div key={feat} className="flex items-center gap-2.5 text-sm text-slate-700 font-medium">
                    <CheckCircle size={15} className="text-indigo-500 shrink-0" />
                    {feat}
                  </div>
                ))}
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-5">
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-black text-indigo-700">$3.99</span>
                  <span className="text-sm font-bold text-indigo-500">/month</span>
                  <span className="ml-2 text-[10px] font-black text-indigo-400 uppercase tracking-wider bg-indigo-100 px-2 py-0.5 rounded-full">Early Access</span>
                </div>
                <div className="flex flex-col gap-1 text-xs text-indigo-600 font-semibold">
                  <span>✓ 10× Advanced AI Analysis / month</span>
                  <span>✓ Basic Audit — unlimited</span>
                  <span>✓ Full CRO breakdown, copy rewrites, CTA improvements, 7-day plan</span>
                </div>
              </div>

              <a
                href={`https://wa.me/601110870288?text=Hi%2C%20I%20want%20to%20activate%20VIP%20for%20Landing%20Page%20Audit%20Agent.%20My%20account%20email%20is%3A%20${encodeURIComponent(user?.email || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-green-500/25 text-base mb-4"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {isEnUI ? 'Activate VIP via WhatsApp' : '通过 WhatsApp 开通 VIP'}
              </a>

              <p className="text-center text-xs text-slate-400 font-medium leading-relaxed">
                {isEnUI
                  ? "After payment confirmation, I'll manually activate VIP for your account. Please refresh the app after activation."
                  : '付款确认后，管理员将手动为您开通 VIP。开通后请刷新页面。'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedAuditSection;
