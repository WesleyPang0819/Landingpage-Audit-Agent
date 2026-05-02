import React, { useState, useEffect } from 'react';
import { Shield, Search, RefreshCcw, Trash2, Lock, Users, FileText, Ban, CheckCircle, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Admin({ showToast }) {
  const { supabase, user, isAdmin, loading: authLoading } = useAuth();
  const [leads, setLeads] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('leads'); // 'leads' or 'members'

  // 独立登录表单状态
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!supabase) return;
    setIsLoggingIn(true);
    setLoginError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    if (error) setLoginError(error.message);
    else if (showToast) showToast('Admin logged in successfully');
    setIsLoggingIn(false);
  };

  const fetchLeads = async () => {
    if (!supabase || !isAdmin) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('test_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error && showToast) showToast(error.message, 'error');
    else setLeads(data || []);
    setLoading(false);
  };

  const fetchMembers = async () => {
    if (!supabase || !isAdmin) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });

    if (error && showToast) showToast(error.message, 'error');
    else setMembers(data || []);
    setLoading(false);
  };

  const fetchAll = () => {
    fetchLeads();
    fetchMembers();
  };

  useEffect(() => { 
    if (user && isAdmin) {
      fetchAll();
    }
  }, [supabase, user, isAdmin]);

  const updateLeadStatus = async (id, newStatus) => {
    if (!supabase) return;
    const { error } = await supabase.from('test_leads').update({ status: newStatus }).eq('id', id);
    if (error && showToast) showToast("Update failed: " + error.message, 'error');
    else {
      setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus } : l));
      if (showToast) showToast("Status updated");
    }
  };

  const updateMemberStatus = async (id, newStatus) => {
    if (!supabase) return;
    const { error } = await supabase.from('members').update({ status: newStatus }).eq('id', id);
    if (error && showToast) showToast("Update failed: " + error.message, 'error');
    else {
      setMembers(members.map(m => m.id === id ? { ...m, status: newStatus } : m));
      if (showToast) showToast(newStatus === 'blocked' ? "Member blocked" : "Member activated");
    }
  };

  const updateMemberPlan = async (id, newPlan) => {
    if (!supabase) return;
    const { error } = await supabase.from('members').update({ plan: newPlan }).eq('id', id);
    if (error && showToast) showToast("Update failed: " + error.message, 'error');
    else {
      setMembers(members.map(m => m.id === id ? { ...m, plan: newPlan } : m));
      if (showToast) showToast(newPlan === 'vip' ? "VIP activated" : "VIP removed");
    }
  };

  const deleteLead = async (id) => {
    if (!supabase) return;
    if (!window.confirm("Permanently delete?")) return;
    const { error } = await supabase.from('test_leads').delete().eq('id', id);
    if (error && showToast) showToast("Delete failed", 'error');
    else {
      setLeads(leads.filter(l => l.id !== id));
      if (showToast) showToast("Deleted successfully");
    }
  };

  const filteredLeads = leads.filter(l => {
    const ms = (l.email||'').toLowerCase().includes(search) || (l.name||'').toLowerCase().includes(search);
    const mf = filter === 'all' || l.status === filter || (!l.status && filter === 'pending');
    return ms && mf;
  });

  const filteredMembers = members.filter(m => {
    const ms = (m.email||'').toLowerCase().includes(search);
    const mf = filter === 'all' || m.status === filter;
    return ms && mf;
  });

  if (authLoading) return <div className="p-10 flex-1 flex items-center justify-center text-slate-400">Verifying access...</div>;

  // 未登录或非管理员时，显示专属的 Admin Login 页面
  if (!user || !isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-sm w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
          <div className="text-center mb-8 mt-2">
             <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-100">
               <Shield className="w-8 h-8 text-purple-600"/>
             </div>
             <h2 className="text-2xl font-black">Admin Access</h2>
             <p className="text-slate-500 text-sm mt-2">Authorized personnel only.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</label>
              <input type="email" required value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} className="w-full p-3.5 bg-slate-50 border rounded-xl mt-1 outline-none focus:bg-white focus:ring-2 focus:ring-purple-500 transition-all" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
              <input type="password" required value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} className="w-full p-3.5 bg-slate-50 border rounded-xl mt-1 outline-none focus:bg-white focus:ring-2 focus:ring-purple-500 transition-all" />
            </div>
            {loginError && <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-lg flex items-center gap-2"><Lock size={16}/>{loginError}</div>}
            {user && !isAdmin && <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-lg">Access Denied: You don't have admin privileges.</div>}
            
            <button type="submit" disabled={isLoggingIn} className="w-full bg-purple-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-200 hover:bg-purple-700 hover:shadow-xl transition-all flex justify-center items-center gap-2">
              {isLoggingIn ? <RefreshCcw className="animate-spin w-5 h-5"/> : <><Shield size={18}/> Authenticate</>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 以下为登录成功后的 Admin 控制台
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto w-full flex-1">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black flex items-center gap-3"><Shield className="text-purple-600"/> Admin Console</h1>
        <div className="flex gap-3 items-center">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="px-3 py-1.5 text-xs font-bold text-slate-500">{leads.length} leads</span>
            <span className="px-3 py-1.5 text-xs font-bold text-slate-500">{members.length} members</span>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6">
        <button 
          onClick={() => { setActiveTab('leads'); setSearch(''); setFilter('all'); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'leads' ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
        >
          <FileText size={16}/> Leads
        </button>
        <button 
          onClick={() => { setActiveTab('members'); setSearch(''); setFilter('all'); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'members' ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
        >
          <Users size={16}/> Members
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="p-4 bg-slate-50 flex flex-col md:flex-row gap-4 border-b">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 text-slate-400 w-4 h-4"/>
            <input type="text" placeholder={activeTab === 'leads' ? "Search leads..." : "Search members by email..."} value={search} onChange={e=>setSearch(e.target.value.toLowerCase())} className="w-full pl-9 pr-4 py-2 bg-white border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <select value={filter} onChange={e=>setFilter(e.target.value)} className="px-3 py-2 bg-white border rounded-lg text-sm outline-none">
             <option value="all">All Status</option>
             {activeTab === 'leads' ? (
               <>
                 <option value="pending">Pending</option>
                 <option value="contacted">Contacted</option>
               </>
             ) : (
               <>
                 <option value="active">Active</option>
                 <option value="blocked">Blocked</option>
               </>
             )}
          </select>
          <button onClick={fetchAll} className="flex gap-2 items-center justify-center text-sm font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 px-4 py-2 rounded-lg transition-colors"><RefreshCcw size={14} className={loading ? 'animate-spin' : ''}/> Refresh</button>
        </div>

        {/* ===== LEADS TABLE ===== */}
        {activeTab === 'leads' && (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                  <tr><th className="p-4">Lead Info</th><th className="p-4">Contact</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y">
                  {filteredLeads.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{l.name}</div>
                        <div className="text-xs text-slate-500 mt-1">{l.email}</div>
                      </td>
                      <td className="p-4 text-xs font-mono bg-slate-50/30">{l.country_code} {l.phone}</td>
                      <td className="p-4">
                        <select value={l.status || 'pending'} onChange={(e)=>updateLeadStatus(l.id, e.target.value)} className={`text-xs font-bold uppercase px-3 py-1.5 rounded-full border outline-none cursor-pointer ${(!l.status || l.status === 'pending') ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                          <option value="pending">Pending</option>
                          <option value="contacted">Contacted</option>
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={()=>deleteLead(l.id)} className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors" title="Delete Lead"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                  {filteredLeads.length === 0 && (
                    <tr><td colSpan="4" className="text-center p-12 text-slate-400">No matching leads found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y">
              {filteredLeads.map(l => (
                <div key={l.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900">{l.name || '—'}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{l.email}</div>
                    </div>
                    <button onClick={()=>deleteLead(l.id)} className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors shrink-0" title="Delete Lead"><Trash2 size={16}/></button>
                  </div>
                  <div className="text-xs font-mono text-slate-500 bg-slate-50 px-3 py-2 rounded-lg">{l.country_code} {l.phone}</div>
                  <select value={l.status || 'pending'} onChange={(e)=>updateLeadStatus(l.id, e.target.value)} className={`w-full text-xs font-bold uppercase px-3 py-2 rounded-lg border outline-none cursor-pointer ${(!l.status || l.status === 'pending') ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                    <option value="pending">Pending</option>
                    <option value="contacted">Contacted</option>
                  </select>
                </div>
              ))}
              {filteredLeads.length === 0 && (
                <div className="text-center p-12 text-slate-400">No matching leads found.</div>
              )}
            </div>
          </>
        )}

        {/* ===== MEMBERS TABLE ===== */}
        {activeTab === 'members' && (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                  <tr><th className="p-4">Member Email</th><th className="p-4">Joined</th><th className="p-4">Plan</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y">
                  {filteredMembers.map(m => {
                    const isVip = m.plan?.toLowerCase() === 'vip';
                    return (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{m.email || 'Unknown'}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-1">{m.id?.slice(0, 8)}...</div>
                      </td>
                      <td className="p-4 text-xs text-slate-500">
                        {m.created_at ? new Date(m.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-bold uppercase px-3 py-1.5 rounded-full border flex items-center gap-1 w-fit ${isVip ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                          {isVip && <Crown size={11}/>} {isVip ? 'VIP' : 'Free'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-bold uppercase px-3 py-1.5 rounded-full border ${m.status === 'blocked' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                          {m.status || 'active'}
                        </span>
                      </td>
                      <td className="p-4 text-right flex justify-end gap-1">
                        {isVip ? (
                          <button onClick={() => updateMemberPlan(m.id, 'free')} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold" title="Remove VIP">
                            <Crown size={16}/> Remove VIP
                          </button>
                        ) : (
                          <button onClick={() => updateMemberPlan(m.id, 'vip')} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold" title="Grant VIP">
                            <Crown size={16}/> Grant VIP
                          </button>
                        )}
                        {m.status === 'blocked' ? (
                          <button onClick={()=>updateMemberStatus(m.id, 'active')} className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold" title="Activate">
                            <CheckCircle size={16}/> Activate
                          </button>
                        ) : (
                          <button onClick={()=>updateMemberStatus(m.id, 'blocked')} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold" title="Block">
                            <Ban size={16}/> Block
                          </button>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                  {filteredMembers.length === 0 && (
                    <tr><td colSpan="5" className="text-center p-12 text-slate-400">No members found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y">
              {filteredMembers.map(m => {
                const isVip = m.plan?.toLowerCase() === 'vip';
                return (
                  <div key={m.id} className="p-4 space-y-3">
                    {/* Email + ID */}
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{m.email || 'Unknown'}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{m.id?.slice(0, 8)}...</div>
                    </div>

                    {/* Badges row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full border flex items-center gap-1 ${isVip ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        {isVip && <Crown size={10}/>} {isVip ? 'VIP' : 'Free'}
                      </span>
                      <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${m.status === 'blocked' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                        {m.status || 'active'}
                      </span>
                      <span className="text-xs text-slate-400 ml-auto">
                        {m.created_at ? new Date(m.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      {isVip ? (
                        <button onClick={() => updateMemberPlan(m.id, 'free')} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                          <Crown size={14}/> Remove VIP
                        </button>
                      ) : (
                        <button onClick={() => updateMemberPlan(m.id, 'vip')} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                          <Crown size={14}/> Grant VIP
                        </button>
                      )}
                      {m.status === 'blocked' ? (
                        <button onClick={() => updateMemberStatus(m.id, 'active')} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                          <CheckCircle size={14}/> Activate
                        </button>
                      ) : (
                        <button onClick={() => updateMemberStatus(m.id, 'blocked')} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                          <Ban size={14}/> Block
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredMembers.length === 0 && (
                <div className="text-center p-12 text-slate-400">No members found.</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
