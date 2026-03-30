import React, { useState, useCallback } from 'react';
import useStore from '../../store';
import { bookingsAPI } from '../../api';
import { MOCK_SERVICES, MOCK_ROOMS } from '../../utils/mockData';
import { logger } from '../../utils/logger';
import toast from 'react-hot-toast';

const inputStyle = {
  width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
  borderRadius:8, padding:'9px 12px', color:'#e2e8f0', fontSize:13, outline:'none',
  boxSizing:'border-box', fontFamily:'inherit',
};
const labelStyle = { display:'block', fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:700, letterSpacing:0.8, textTransform:'uppercase', marginBottom:5 };
const secStyle   = { marginBottom:16, padding:'14px 16px', background:'rgba(255,255,255,0.03)', borderRadius:10, border:'1px solid rgba(255,255,255,0.06)' };

const INIT = { client_name:'', client_phone:'', therapist_id:'', service_id:'', room_id:'', start_time:'', request_type:'Standard', notes:'' };

const BookingForm = () => {
  // Primitives only from store
  const isCreateOpen = useStore((s) => s.isCreateOpen);
  const selectedDate = useStore((s) => s.selectedDate);
  const therapists   = useStore((s) => s.therapists);
  const services     = useStore((s) => s.services.length ? s.services : MOCK_SERVICES);
  const rooms        = useStore((s) => s.rooms.length    ? s.rooms    : MOCK_ROOMS);

  const [form, setForm]     = useState({ ...INIT, start_time: `${selectedDate}T10:00` });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = useCallback((k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  }, []);

  const validate = () => {
    const e = {};
    if (!form.client_name.trim()) e.client_name = 'Required';
    if (!form.therapist_id)       e.therapist_id = 'Required';
    if (!form.service_id)         e.service_id   = 'Required';
    if (!form.start_time)         e.start_time   = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    const t = therapists.find((x) => x.id === parseInt(form.therapist_id));
    const s = services.find((x)   => x.id === parseInt(form.service_id));
    const r = rooms.find((x)      => x.id === parseInt(form.room_id));

    const start = new Date(form.start_time).toISOString();
    const end   = new Date(new Date(form.start_time).getTime() + (s?.duration || 60) * 60000).toISOString();

    const payload = {
      client:       { name: form.client_name, phone: form.client_phone },
      therapist_id: parseInt(form.therapist_id),
      service_id:   parseInt(form.service_id),
      room_id:      parseInt(form.room_id) || null,
      start_time:   start, end_time: end,
      notes:        form.notes,
      request_type: form.request_type,
      status:       'confirmed',
    };

    let id = Date.now();
    try {
      const resp = await bookingsAPI.create(payload);
      id = resp.data?.data?.id || resp.data?.id || id;
    } catch {}

    useStore.getState().addBooking({
      ...payload, id,
      booking_ref: `BK${id}`,
      therapist: t, service: s, room: r,
    });

    toast.success('Booking created');
    logger.action('BOOKING_CREATED', { id, client: form.client_name });
    setForm({ ...INIT, start_time: `${selectedDate}T10:00` });
    useStore.getState().closeCreate();
    setLoading(false);
  };

  const close = () => useStore.getState().closeCreate();

  if (!isCreateOpen) return null;

  const err = (k) => errors[k] && <div style={{ color:'#ef4444', fontSize:11, marginTop:3 }}>{errors[k]}</div>;
  const brd = (k) => ({ borderColor: errors[k] ? '#ef4444' : 'rgba(255,255,255,0.1)' });

  return (
    <>
      <div onClick={close} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:60, backdropFilter:'blur(3px)' }}/>
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:460, maxWidth:'95vw', maxHeight:'90vh', background:'#0d0d20', border:'1px solid rgba(255,255,255,0.09)', borderRadius:18, zIndex:70, display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.75)', animation:'modalIn 0.22s ease' }}>
        <style>{`@keyframes modalIn{from{opacity:0;transform:translate(-50%,-52%)}to{opacity:1;transform:translate(-50%,-50%)}}`}</style>

        {/* Header */}
        <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:19, fontWeight:800, color:'#f1f5f9' }}>New Booking</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginTop:2 }}>{selectedDate} · Fill required fields</div>
          </div>
          <button onClick={close} style={{ background:'rgba(255,255,255,0.07)', border:'none', borderRadius:8, width:32, height:32, cursor:'pointer', color:'#94a3b8', fontSize:20, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 24px' }}>

          <div style={secStyle}>
            <span style={{ ...labelStyle, marginBottom:10 }}>Client Information</span>
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>Full Name *</label>
              <input value={form.client_name} onChange={(e) => set('client_name', e.target.value)} placeholder="e.g. Alice Smith" style={{ ...inputStyle, ...brd('client_name') }}/>
              {err('client_name')}
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input value={form.client_phone} onChange={(e) => set('client_phone', e.target.value)} placeholder="+1 000 000 0000" style={inputStyle}/>
            </div>
          </div>

          <div style={secStyle}>
            <span style={{ ...labelStyle, marginBottom:10 }}>Service &amp; Staff</span>
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>Service *</label>
              <select value={form.service_id} onChange={(e) => set('service_id', e.target.value)} style={{ ...inputStyle, cursor:'pointer', ...brd('service_id') }}>
                <option value="">— Select service —</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.duration}min · ${s.price}</option>)}
              </select>
              {err('service_id')}
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>Therapist (T) *</label>
              <select value={form.therapist_id} onChange={(e) => set('therapist_id', e.target.value)} style={{ ...inputStyle, cursor:'pointer', ...brd('therapist_id') }}>
                <option value="">— Select therapist —</option>
                {therapists.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.gender})</option>)}
              </select>
              {err('therapist_id')}
            </div>
            <div>
              <label style={labelStyle}>Room (R)</label>
              <select value={form.room_id} onChange={(e) => set('room_id', e.target.value)} style={{ ...inputStyle, cursor:'pointer' }}>
                <option value="">— Any available —</option>
                {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>

          <div style={secStyle}>
            <span style={{ ...labelStyle, marginBottom:10 }}>Schedule &amp; Type</span>
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>Start Time *</label>
              <input type="datetime-local" value={form.start_time} onChange={(e) => set('start_time', e.target.value)} style={{ ...inputStyle, colorScheme:'dark', ...brd('start_time') }}/>
              {err('start_time')}
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>Request Type</label>
              <select value={form.request_type} onChange={(e) => set('request_type', e.target.value)} style={{ ...inputStyle, cursor:'pointer' }}>
                {['Standard','VIP','Couple','Corporate'].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Notes</label>
              <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} placeholder="Special requests, allergies…" style={{ ...inputStyle, resize:'vertical' }}/>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 24px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:10, flexShrink:0 }}>
          <button onClick={handleSubmit} disabled={loading} style={{ flex:1, padding:'12px', background:'linear-gradient(135deg,#7c6aff,#6356e8)', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:14, cursor:loading?'not-allowed':'pointer', opacity:loading?.7:1, fontFamily:'inherit' }}>
            {loading ? 'Creating…' : 'Create Booking'}
          </button>
          <button onClick={close} style={{ padding:'12px 20px', background:'rgba(255,255,255,0.07)', color:'#94a3b8', border:'none', borderRadius:10, fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};

export default BookingForm;
