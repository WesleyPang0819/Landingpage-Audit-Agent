import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Loader2 } from 'lucide-react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Membership State
  const [memberProfile, setMemberProfile] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [pendingAction, setPendingAction] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState('');

  // UI state for modal inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await updateAuthState(session);

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        await updateAuthState(session);
      });

      return () => {
        subscription.unsubscribe();
      };
    };

    initAuth();
  }, []);

  const ensureMemberProfile = async (currentUser) => {
    if (!currentUser) return null;
    let { data: profile, error } = await supabase.from('members').select('*').eq('id', currentUser.id).maybeSingle();
    
    // Auto-sync members table if profile doesn't exist
    if (!profile && !error) {
       const { data: newProfile, error: insertError } = await supabase.from('members').insert([{
           id: currentUser.id,
           email: currentUser.email,
           status: 'active'
       }]).select().single();
       if (!insertError) profile = newProfile;
    }
    if (!profile) profile = { id: currentUser.id, status: 'active' }; // Fallback
    
    return profile;
  };

  const updateAuthState = async (session) => {
    const currentUser = session?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
      setLoading(true); // show loading while fetching profile from DB
      const profile = await ensureMemberProfile(currentUser);
      setMemberProfile(profile);

      // Fallback: Always grant admin role to specific super-user email
      const userEmail = (currentUser.email || '').trim().toLowerCase();
      if (userEmail === 'admin123@gmail.com' || profile?.role === 'admin') {
        setRole('admin');
      } else {
        setRole(profile?.role || 'member');
      }
    } else {
      setRole(null);
      setMemberProfile(null);
    }
    setLoading(false);
  };

  const continuePendingAction = () => {
    setPendingAction(prev => {
        if (prev) {
            setTimeout(() => {
                prev();
            }, 50);
        }
        return null;
    });
    setAuthModalOpen(false);
  };

  const requireAuth = (actionName, callback) => {
    if (user) {
      if (memberProfile?.status === 'blocked') {
        setAuthError('Your account has been blocked.');
        setAuthModalOpen(true);
        return;
      }
      callback();
    } else {
      setPendingAction(() => callback);
      setAuthError('');
      setEmail('');
      setPassword('');
      setAuthModalOpen(true);
    }
  };

  const signInWithEmail = async (e) => {
    if (e) e.preventDefault();
    setLoadingAuth(true);
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
    } else {
      // Success — close modal & execute pending action immediately
      setAuthModalOpen(false);
      setPendingAction(prev => {
        if (prev) setTimeout(() => prev(), 50);
        return null;
      });
    }
    setLoadingAuth(false);
  };

  const signUpWithEmail = async (e) => {
    if (e) e.preventDefault();
    setLoadingAuth(true);
    setAuthError('');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setAuthError(error.message);
    } else if (data?.user?.identities?.length === 0) {
      // User already exists
      setAuthError('An account with this email already exists. Please log in instead.');
    } else if (data?.session) {
      // Auto logged in — close modal & execute pending action immediately
      setAuthModalOpen(false);
      setPendingAction(prev => {
        if (prev) setTimeout(() => prev(), 50);
        return null;
      });
    } else {
      // Email confirmation enabled — tell user to check email
      setAuthError('✅ Account created! Please check your email inbox and click the confirmation link, then come back and log in.');
    }
    setLoadingAuth(false);
  };

  const logout = async () => {
    // Immediately clear state so UI updates instantly
    setUser(null);
    setRole(null);
    setMemberProfile(null);
    setPendingAction(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      supabase, user, role, loading, 
      isAdmin: role === 'admin', 
      isVip: memberProfile?.plan?.toLowerCase() === 'vip',
      plan: memberProfile?.plan?.toLowerCase() || 'free',
      logout, requireAuth, memberProfile 
    }}>
      {children}
      
      {/* Global Auth Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="font-black text-xl text-slate-900">
                {authMode === 'login' ? 'Log in to unlock your audit' : 'Create a free account'}
              </h3>
              <button onClick={() => { setAuthModalOpen(false); setPendingAction(null); }} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {authMode === 'register' && (
                <p className="text-slate-500 mb-6 text-sm font-medium">Create a free account to analyze your landing page and save your report.</p>
              )}

              {authError && (
                <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${(authError.includes('✅') || authError.includes('check')) ? 'bg-green-50 text-green-700 border border-green-200' : authError.includes('already exists') ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {authError}
                </div>
              )}
              
              {memberProfile?.status === 'blocked' ? (
                 <div className="text-center py-8">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><X size={32}/></div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2">Account Blocked</h4>
                    <p className="text-slate-500 text-sm">You are not allowed to use this service.</p>
                    <button onClick={() => setAuthModalOpen(false)} className="mt-6 text-slate-500 hover:text-slate-900 font-bold">Close</button>
                 </div>
              ) : (
                <form onSubmit={authMode === 'login' ? signInWithEmail : signUpWithEmail} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
                    <input 
                      type="email" 
                      required 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                    <input 
                      type="password" 
                      required 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                      placeholder="••••••••"
                    />
                  </div>
                  <button 
                    disabled={loadingAuth}
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-blue-600/20 disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
                  >
                    {loadingAuth && <Loader2 size={18} className="animate-spin" />}
                    {authMode === 'login' ? 'Log In' : 'Create Account'}
                  </button>
                </form>
              )}
            </div>
            
            {memberProfile?.status !== 'blocked' && (
              <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}
                  className="text-sm font-bold text-blue-600 hover:text-blue-800"
                >
                  {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Log in"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;
