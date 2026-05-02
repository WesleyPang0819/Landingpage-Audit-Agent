import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, ArrowRight, Search, CheckCircle2, RefreshCcw, User, Mail, Phone 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getExpertAudit } from '../utils/expertAudit';
import { t, COUNTRY_CODES } from '../constants/translations';

const Analyzer = ({ lang, showToast }) => {
  const curText = t[lang];
  const navigate = useNavigate();
  const { supabase, requireAuth } = useAuth();
  
  const [auditParams, setAuditParams] = useState({ url: '', goal: curText.goals[0], audience: '' });
  const [loadingStep, setLoadingStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: '', email: '', country_code: '+60', phone: '', consent: false });
  const [leadStatus, setLeadStatus] = useState('idle');

  useEffect(() => { 
    setAuditParams(prev => ({ ...prev, goal: curText.goals[0] })); 
  }, [lang, curText.goals]);

  const handleAnalyzeClick = (e) => {
    e.preventDefault();
    if (!auditParams.url) return showToast(curText.analyzing ? 'Please enter a valid URL' : '请输入有效的网址', 'error');
    requireAuth('analyze', startAudit);
  };

  const startAudit = () => {
    setIsAnalyzing(true);
    setLoadingStep(0);
    
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setLoadingStep(step);
      if (step >= curText.loadingMsgs.length) {
        clearInterval(interval);
        generateReportAndNavigate();
      }
    }, 800);
  };

  const generateReportAndNavigate = () => {
    const isEn = lang === 'en';
    const domainName = auditParams.url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0].split('.')[0] || 'Website';
    const capName = domainName.charAt(0).toUpperCase() + domainName.slice(1);
    const { report, finalScore } = getExpertAudit(auditParams.goal, auditParams.audience, isEn, capName);
    
    const reportData = {
      url: auditParams.url, goal: auditParams.goal, score: finalScore, 
      audience: auditParams.audience || (isEn ? "General" : "广泛受众"),
      auditDetails: report
    };
    setIsAnalyzing(false);
    navigate('/report', { state: { reportData } });
  };

  const submitLead = async (e) => {
    e.preventDefault();
    if (!supabase) return showToast('System initialization in progress, please wait...', 'error');
    setLeadStatus('loading');
    const { error } = await supabase.from('test_leads').insert([{
      name: leadForm.name, email: leadForm.email, country_code: leadForm.country_code, 
      phone: leadForm.phone, consent: leadForm.consent, source: 'react_router_app'
    }]);
    
    if (error) {
      showToast(error.message, 'error');
      setLeadStatus('idle');
    } else {
      // 触发发送邮件的 Edge Function（注意：函数名必须与 supabase/functions/ 目录名一致）
      const { error: emailError } = await supabase.functions.invoke('super-endpoint', {
        body: { 
          name: leadForm.name, 
          email: leadForm.email, 
          phone: `${leadForm.country_code} ${leadForm.phone}`
        }
      });

      if (emailError) {
        // 邮件发送失败时提示，但 lead 已保存成功
        console.error('邮件发送失败:', emailError);
        showToast('Form submitted! (Email notification may be delayed)', 'success');
      }
      setLeadStatus('success');
    }
  };

  if (isAnalyzing) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
         <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-md w-full">
            <Zap className="w-12 h-12 text-blue-600 animate-pulse mx-auto mb-4"/>
            <h2 className="text-xl font-bold">{curText.analyzing}</h2>
            <div className="mt-6 space-y-3">
               {curText.loadingMsgs.map((msg, i) => (
                  <div key={i} className="flex gap-3 text-sm text-left">
                     {i < loadingStep ? <CheckCircle2 className="text-green-500 w-5 h-5"/> : (i === loadingStep ? <RefreshCcw className="text-blue-500 w-5 h-5 animate-spin"/> : <div className="w-5 h-5 border rounded-full"/>)}
                     <span className={i <= loadingStep ? 'text-slate-900 font-bold' : 'text-slate-400'}>{msg}</span>
                  </div>
               ))}
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 lg:p-12">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* LEFT COLUMN: HERO & AUDIT FORM */}
        <div className="order-1 lg:order-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] md:text-xs font-bold mb-4 uppercase tracking-wider">
            <Zap size={12} fill="currentColor"/> {curText.heroBadge}
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 leading-[1.1] tracking-tight text-slate-900">
            {curText.mainTitle} <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              {curText.mainSubtitle}
            </span>
          </h1>
          <p className="text-base md:text-lg text-slate-600 mb-8 leading-relaxed max-w-xl">
            {curText.description}
          </p>
          
          <form onSubmit={handleAnalyzeClick} className="bg-white p-6 md:p-8 rounded-[32px] shadow-2xl shadow-blue-900/5 border border-slate-100 space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2 ml-1">{curText.urlLabel}</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors"/>
                <input 
                  type="url" 
                  required 
                  value={auditParams.url} 
                  onChange={e=>setAuditParams({...auditParams, url: e.target.value})} 
                  placeholder={curText.urlPlaceholder} 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium" 
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2 ml-1">{curText.goalLabel}</label>
                <select 
                  value={auditParams.goal} 
                  onChange={e=>setAuditParams({...auditParams, goal: e.target.value})} 
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none cursor-pointer focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium appearance-none"
                >
                  {curText.goals.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2 ml-1">{curText.audienceLabel}</label>
                <input 
                  type="text" 
                  value={auditParams.audience} 
                  onChange={e=>setAuditParams({...auditParams, audience: e.target.value})} 
                  placeholder="e.g. Busy parents"
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium" 
                />
              </div>
            </div>
            <button 
              type="submit" 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.98] shadow-xl shadow-slate-900/20"
            >
              {curText.analyzeBtn} <ArrowRight size={20}/>
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: LEAD CAPTURE */}
        <div className="order-2 lg:order-2">
          <div className="bg-slate-900 p-8 md:p-12 rounded-[40px] shadow-2xl text-white relative overflow-hidden group">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -mr-32 -mt-32 transition-all group-hover:bg-blue-500/20"/>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -ml-32 -mb-32 transition-all group-hover:bg-indigo-500/20"/>
            
            {leadStatus === 'success' ? (
              <div className="text-center py-12 relative z-10">
                 <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                   <CheckCircle2 size={40} />
                 </div>
                 <h3 className="text-3xl font-black mb-4 tracking-tight">{curText.successTitle}</h3>
                 <p className="text-slate-400 mb-8 font-medium">We'll get in touch with you shortly.</p>
                 <button onClick={() => setLeadStatus('idle')} className="text-sm font-bold text-slate-400 hover:text-white underline underline-offset-4 decoration-2 transition-all">Submit another request</button>
              </div>
            ) : (
              <form onSubmit={submitLead} className="space-y-5 relative z-10">
                <div className="mb-8">
                  <h3 className="text-3xl font-black mb-2 tracking-tight">{curText.leadTitle}</h3>
                  <p className="text-slate-400 font-medium leading-relaxed">{curText.leadSub}</p>
                </div>

                <div className="space-y-4">
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-blue-400 transition-colors"/>
                    <input 
                      required 
                      value={leadForm.name} 
                      onChange={e=>setLeadForm({...leadForm, name: e.target.value})} 
                      placeholder={curText.nameLabel} 
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium" 
                    />
                  </div>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-blue-400 transition-colors"/>
                    <input 
                      type="email" 
                      required 
                      value={leadForm.email} 
                      onChange={e=>setLeadForm({...leadForm, email: e.target.value})} 
                      placeholder={curText.emailLabel} 
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium" 
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                     <select 
                        value={leadForm.country_code} 
                        onChange={e=>setLeadForm({...leadForm, country_code: e.target.value})} 
                        className="w-full sm:w-[140px] px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500/50 transition-all font-medium cursor-pointer"
                      >
                        {COUNTRY_CODES.map(c => <option key={c.code} value={c.code} className="text-black">{c.flag} {c.code}</option>)}
                     </select>
                     <div className="relative flex-1 group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-blue-400 transition-colors"/>
                        <input 
                          required 
                          value={leadForm.phone} 
                          onChange={e=>setLeadForm({...leadForm, phone: e.target.value})} 
                          placeholder={curText.phoneLabel} 
                          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium" 
                        />
                      </div>
                  </div>
                </div>

                <label className="flex items-start gap-3 mt-6 cursor-pointer group">
                  <div className="relative flex items-center mt-0.5">
                    <input 
                      type="checkbox" 
                      required 
                      checked={leadForm.consent} 
                      onChange={e=>setLeadForm({...leadForm, consent: e.target.checked})} 
                      className="w-5 h-5 rounded-md border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900 transition-all cursor-pointer"
                    />
                  </div>
                  <span className="text-xs text-slate-400 font-medium group-hover:text-slate-300 transition-colors">I agree to the privacy policy and consent to being contacted.</span>
                </label>

                <button 
                  type="submit" 
                  disabled={leadStatus==='loading'} 
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-blue-900/30 text-lg hover:scale-[1.01] active:scale-[0.98]"
                >
                  {leadStatus === 'loading' ? 'Processing...' : curText.getItNow}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Minimalist Admin Entrance at the very bottom */}
      <div className="mt-24 mb-12 text-center">
        <button 
          onClick={() => navigate('/admin')} 
          className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-300 hover:text-slate-500 transition-all duration-700"
        >
          Admin Console
        </button>
      </div>
    </div>
  );
};

export default Analyzer;
