import React, { useState, useCallback, useEffect } from 'react';
import useStore from '../../store';
import { bookingsAPI } from '../../api';
import { getStatusStyle, getTherapistColor, BOOKING_STATUSES } from '../../utils/colorUtils';
import { formatDateTime, formatTime } from '../../utils/dateUtils';
import { logger } from '../../utils/logger';
import toast from 'react-hot-toast';

// ── Read only primitives from store via selectors ──────────────────────────────
// All actions are called via useStore.getState() to avoid re-render loops

const inputStyle = {
  width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)',
  borderRadius:8, padding:'8px 12px', color:'#e2e8f0', fontSize:13, outline:'none',
  boxSizing:'border-box', fontFamily:'inherit',
};

const Field = ({ label, value, accent }) => (
  <div style={{ marginBottom:12 }}>
    <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:3 }}>{label}</div>
    <div style={{ fontSize:13, color:accent||'#e2e8f0', fontWeight:500 }}>{value||'—'}</div>
  </div>
);

const InputField = ({ label, value, onChange, type='text', options }) => (
  <div style={{ marginBottom:14 }}>
    <label style={{ display:'block', fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:700, letterSpacing:0.8, textTransform:'uppercase', marginBottom:5 }}>{label}</label>
    {options ? (
      <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    ) : (
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}/>
    )}
  </div>
);

const btnStyle = (bg, color='#fff') => ({
  padding:'9px 18px', background:bg, color, border:'none', borderRadius:8,
  cursor:'pointer', fontSize:13, fontWeight:600, transition:'opacity 0.15s', fontFamily:'inherit',
});

const BookingPanel = () => {
  // Primitives only via selectors
  const isPanelOpen        = useStore((s) => s.isPanelOpen);
  const panelMode          = useStore((s) => s.panelMode);
  const selectedBookingId  = useStore((s) => s.selectedBookingId);
  const bookingsMap        = useStore((s) => s.bookingsMap);
  const therapists         = useStore((s) => s.therapists);
  const services           = useStore((s) => s.services);
  const rooms              = useStore((s) => s.rooms);

  const booking = bookingsMap[selectedBookingId];

  const [editData, setEditData]     = useState({});
  const [loading, setLoading]       = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const ed = useCallback((k, v) => setEditData((p) => ({ ...p, [k]: v })), []);

  useEffect(() => {
    if (booking && panelMode === 'edit') {
      setEditData({
        status:       booking.status || 'confirmed',
        notes:        booking.notes  || '',
        therapist_id: String(booking.therapist_id || ''),
        service_id:   String(booking.service_id   || ''),
        room_id:      String(booking.room_id       || ''),
        start_time:   booking.start_time?.slice(0, 16) || '',
      });
    }
  }, [booking, panelMode]);

  const showToast = (msg, type='success') => toast[type](msg);

  const handleSave = async () => {
    if (!booking) return;
    setLoading(true);
    try { await bookingsAPI.update(booking.id, editData); } catch {}
    const { updateBooking, openPanel } = useStore.getState();
    const t = therapists.find((x) => x.id === parseInt(editData.therapist_id));
    const s = services.find((x)   => x.id === parseInt(editData.service_id));
    const r = rooms.find((x)      => x.id === parseInt(editData.room_id));
    updateBooking(booking.id, { ...editData, therapist:t, service:s, room:r });
    showToast('Booking updated');
    logger.action('BOOKING_SAVED', { id: booking.id });
    openPanel('view', booking.id);
    setLoading(false);
  };

  const handleCancel = async () => {
    if (!booking) return;
    setLoading(true);
    try { await bookingsAPI.cancel({ booking_id: booking.id, reason: 'Cancelled by staff' }); } catch {}
    useStore.getState().updateBooking(booking.id, { status: 'cancelled' });
    showToast('Booking cancelled');
    logger.action('BOOKING_CANCELLED', { id: booking.id });
    setConfirmCancel(false);
    setLoading(false);
  };

  const handleCheckin = async () => {
    if (!booking) return;
    setLoading(true);
    try { await bookingsAPI.update(booking.id, { status: 'checkin' }); } catch {}
    useStore.getState().updateBooking(booking.id, { status: 'checkin' });
    showToast('Client checked in');
    logger.action('BOOKING_CHECKIN', { id: booking.id });
    setLoading(false);
  };

  const handleCheckout = async () => {
    if (!booking) return;
    useStore.getState().updateBooking(booking.id, { status: 'completed' });
    showToast('Checkout complete');
    logger.action('BOOKING_CHECKOUT', { id: booking.id });
  };

  const close = () => useStore.getState().closePanel();
  const openEdit = () => useStore.getState().openPanel('edit', booking.id);
  const openView = () => useStore.getState().openPanel('view', booking.id);

  if (!isPanelOpen) return null;

  const statusStyle = booking ? getStatusStyle(booking.status) : {};
  const tColor = booking?.therapist ? getTherapistColor(booking.therapist.gender) : '#8B5CF6';

  return (
    <>
      <div onClick={close} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:40, backdropFilter:'blur(2px)' }}/>
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:380, background:'linear-gradient(180deg,#0d0d20,#10101e)', borderLeft:'1px solid rgba(255,255,255,0.07)', zIndex:50, display:'flex', flexDirection:'column', boxShadow:'-8px 0 40px rgba(0,0,0,0.55)', animation:'slideIn 0.22s ease' }}>
        <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

        {/* Header */}
        <div style={{ padding:'20px 20px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:4 }}>
                {panelMode === 'edit' ? 'Edit Booking' : 'Booking Details'}
              </div>
              {booking && <div style={{ fontSize:19, fontWeight:800, color:'#f1f5f9' }}>{booking.booking_ref}</div>}
            </div>
            <button onClick={close} style={{ background:'rgba(255,255,255,0.07)', border:'none', borderRadius:8, width:32, height:32, cursor:'pointer', color:'#94a3b8', fontSize:20, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
          </div>
          {booking && (
            <div style={{ marginTop:10, display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20, background:statusStyle.bg, color:'#fff', textTransform:'uppercase' }}>
                {statusStyle.label}
              </span>
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>{booking.request_type}</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:'18px 20px' }}>
          {!booking ? (
            <div style={{ textAlign:'center', color:'rgba(255,255,255,0.3)', marginTop:40 }}>No booking selected</div>
          ) : panelMode === 'view' ? (
            <>
              <div style={{ padding:14, background:'rgba(255,255,255,0.04)', borderRadius:10, border:'1px solid rgba(255,255,255,0.06)', marginBottom:14 }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>Client</div>
                <div style={{ fontSize:15, fontWeight:700, color:'#f1f5f9' }}>{booking.client?.name}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2 }}>{booking.client?.phone}</div>
              </div>
              <div style={{ padding:14, background:'rgba(255,255,255,0.04)', borderRadius:10, border:`1px solid ${tColor}25`, marginBottom:14, display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:'50%', background:tColor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#fff', flexShrink:0 }}>
                  {booking.therapist?.firstName?.[0]}{booking.therapist?.lastName?.[0]}
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#f1f5f9' }}>{booking.therapist?.name}</div>
                  <div style={{ fontSize:11, color:tColor, fontWeight:700 }}>T · {booking.therapist?.gender}</div>
                </div>
              </div>
              <Field label="Service"   value={booking.service?.name} />
              <Field label="Room"      value={booking.room?.name ? `R · ${booking.room.name}` : '—'} />
              <Field label="Start"     value={formatDateTime(booking.start_time)} />
              <Field label="End"       value={formatTime(booking.end_time)} />
              <Field label="Duration"  value={booking.service?.duration ? `${booking.service.duration} min` : '—'} />
              {booking.notes && <Field label="Notes" value={booking.notes} accent="#a78bfa" />}
            </>
          ) : (
            <>
              <InputField label="Status"        value={editData.status}       onChange={(v) => ed('status', v)}       options={BOOKING_STATUSES} />
              <InputField label="Therapist (T)" value={editData.therapist_id} onChange={(v) => ed('therapist_id', v)} options={[{value:'',label:'— Select —'}, ...therapists.map((t) => ({ value:String(t.id), label:`${t.name} (${t.gender})` }))]} />
              <InputField label="Service"       value={editData.service_id}   onChange={(v) => ed('service_id', v)}   options={[{value:'',label:'— Select —'}, ...services.map((s)  => ({ value:String(s.id), label:`${s.name} (${s.duration}min)` }))]} />
              <InputField label="Room (R)"      value={editData.room_id}      onChange={(v) => ed('room_id', v)}      options={[{value:'',label:'— Any —'},    ...rooms.map((r)      => ({ value:String(r.id), label:r.name }))]} />
              <InputField label="Start Time"    value={editData.start_time}   onChange={(v) => ed('start_time', v)}   type="datetime-local" />
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:700, letterSpacing:0.8, textTransform:'uppercase', marginBottom:5 }}>Notes</label>
                <textarea value={editData.notes} onChange={(e) => ed('notes', e.target.value)} rows={3}
                  style={{ ...inputStyle, resize:'vertical' }}/>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div style={{ padding:'12px 20px', borderTop:'1px solid rgba(255,255,255,0.06)', flexShrink:0, display:'flex', gap:8, flexWrap:'wrap' }}>
          {panelMode === 'view' && booking?.status !== 'cancelled' && (
            <>
              <button onClick={openEdit} style={btnStyle('#7c6aff')}>Edit</button>
              {booking.status === 'confirmed'  && <button onClick={handleCheckin}  disabled={loading} style={btnStyle('#EC4899')}>Check In</button>}
              {booking.status === 'checkin'    && <button onClick={handleCheckout}                    style={btnStyle('#10B981')}>Complete</button>}
              {!confirmCancel
                ? <button onClick={() => setConfirmCancel(true)} style={btnStyle('rgba(239,68,68,0.15)', '#ef4444')}>Cancel</button>
                : <div style={{ display:'flex', gap:6, width:'100%' }}>
                    <button onClick={handleCancel} disabled={loading} style={{ ...btnStyle('#ef4444'), flex:1 }}>Confirm Cancel</button>
                    <button onClick={() => setConfirmCancel(false)} style={{ ...btnStyle('rgba(255,255,255,0.08)', '#94a3b8'), flex:1 }}>Keep</button>
                  </div>
              }
            </>
          )}
          {panelMode === 'edit' && (
            <>
              <button onClick={handleSave}  disabled={loading} style={{ ...btnStyle('#7c6aff'), flex:1 }}>{loading ? 'Saving…' : 'Save Changes'}</button>
              <button onClick={openView}                        style={btnStyle('rgba(255,255,255,0.08)', '#94a3b8')}>Discard</button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default BookingPanel;
