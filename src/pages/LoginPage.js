import React, { useState } from 'react';
import { authAPI } from '../api';
import useStore from '../store';
import { logger } from '../utils/logger';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [form, setForm] = useState({
    email: 'react@hipster-inc.com',
    password: 'React@123',
    key_pass: '07ba959153fe7eec778361bf42079439',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const resp  = await authAPI.login(form.email, form.password, form.key_pass);
      const d     = resp.data?.data || resp.data;
      const token = d?.token || d?.access_token || 'demo-token';
      const user  = d?.user  || { email: form.email, name: 'Staff User' };

      // Always call actions via getState() — avoids stale-closure / re-render loops
      useStore.getState().setAuth(user, token);
      toast.success(`Welcome, ${user.name || user.email}!`);
      logger.action('LOGIN_SUCCESS', { email: form.email });

    } catch (err) {
      // Demo-mode fallback when API is unreachable
      if (
        form.email    === 'react@hipster-inc.com' &&
        form.password === 'React@123'
      ) {
        useStore.getState().setAuth(
          { name: 'Demo Staff', email: form.email },
          'demo-token-' + Date.now()
        );
        toast.success('Logged in (demo mode)');
        logger.action('LOGIN_DEMO');
      } else {
        const msg = err?.message || 'Login failed. Check credentials.';
        setError(msg);
        toast.error(msg);
        logger.error('LOGIN_FAILED', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === 'Enter') handleLogin(); };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 60% 40%,rgba(124,106,255,0.13) 0%,transparent 55%), radial-gradient(ellipse at 20% 70%,rgba(236,72,153,0.09) 0%,transparent 50%), #080816',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Inter",system-ui,sans-serif',
    }}>
      {/* grid bg */}
      <div style={{ position:'fixed', inset:0, zIndex:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)', backgroundSize:'48px 48px' }}/>

      <div style={{ position:'relative', zIndex:1, width:400, padding:40, background:'rgba(15,15,30,0.92)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20, boxShadow:'0 32px 80px rgba(0,0,0,0.65)' }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:56, height:56, borderRadius:16, background:'linear-gradient(135deg,#7c6aff,#EC4899)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, margin:'0 auto 14px', boxShadow:'0 8px 24px rgba(124,106,255,0.4)' }}>✦</div>
          <div style={{ fontSize:22, fontWeight:800, color:'#f1f5f9', letterSpacing:-0.5 }}>NatureLand</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.38)', marginTop:4 }}>Spa &amp; Wellness Booking</div>
        </div>

        {/* Fields */}
        {[
          { key:'email',    label:'Email',    type:'email'    },
          { key:'password', label:'Password', type:'password' },
          { key:'key_pass', label:'Key Pass', type:'text'     },
        ].map(({ key, label, type }) => (
          <div key={key} style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:11, color:'rgba(255,255,255,0.42)', fontWeight:700, letterSpacing:0.8, textTransform:'uppercase', marginBottom:6 }}>
              {label}
            </label>
            <input
              type={type}
              value={form[key]}
              onChange={set(key)}
              onKeyDown={handleKey}
              style={{
                width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
                borderRadius:10, padding:'11px 14px', color:'#e2e8f0', outline:'none', boxSizing:'border-box',
                fontFamily: key === 'key_pass' ? 'monospace' : 'inherit',
                fontSize:   key === 'key_pass' ? 11 : 13,
                letterSpacing: key === 'key_pass' ? 0.4 : 0,
              }}
            />
          </div>
        ))}

        {error && (
          <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'10px 14px', color:'#fca5a5', fontSize:12, marginBottom:16 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width:'100%', padding:'13px', marginTop:8,
            background: loading ? 'rgba(124,106,255,0.5)' : 'linear-gradient(135deg,#7c6aff,#6356e8)',
            color:'#fff', border:'none', borderRadius:12, fontWeight:700, fontSize:15,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 16px rgba(124,106,255,0.4)',
            transition:'all 0.2s', fontFamily:'inherit',
          }}
        >
          {loading ? 'Signing in…' : 'Sign In →'}
        </button>

        <div style={{ marginTop:20, textAlign:'center', fontSize:11, color:'rgba(255,255,255,0.22)' }}>
          Credentials pre-filled · API + demo fallback
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
