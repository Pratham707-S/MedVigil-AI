// Owner: Rohit. Mobile-first demo shell with a backend-aware, fictional-data fallback.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { API_BASE, demoDraft, demoTimeline } from './data/demo';
import { IntakePanel } from './features/intake/IntakePanel';
import { DraftReview } from './features/prescriptions/DraftReview';
import { UploadCard } from './features/prescriptions/UploadCard';
import { SummaryPanel } from './features/reports/SummaryPanel';
import { TimelinePanel } from './features/timeline/TimelinePanel';
import './styles.css';

function App() {
  const [screen, setScreen] = useState('home');
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [medicines, setMedicines] = useState([...demoDraft.medicines, { name: 'Vitamin D', dose: '1000 IU', frequency: 'daily', source: 'patient-reported' }]);
  const [timeline] = useState(demoTimeline);
  const [language, setLanguage] = useState('English');

  const upload = async (file) => {
    setBusy(true); setStatus('');
    try {
      const form = new FormData(); form.append('file', file); form.append('patient_id', 'demo-patient');
      const response = await fetch(`${API_BASE}/prescriptions/upload`, { method: 'POST', body: form });
      if (!response.ok) throw new Error('API unavailable');
      setDraft(await response.json()); setScreen('review');
    } catch {
      setDraft({ ...demoDraft, source_filename: file.name }); setStatus('Demo mode: backend unavailable, so a fictional draft is ready to review.'); setScreen('review');
    } finally { setBusy(false); }
  };

  const confirm = async () => {
    setBusy(true);
    try {
      const response = await fetch(`${API_BASE}/prescriptions/${draft.prescription_id}/confirm`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...draft, source_filename: draft.source_filename }) });
      if (!response.ok) throw new Error('API unavailable');
    } catch { setStatus('Saved in demo mode. Connect the backend to persist this confirmation.'); }
    setMedicines(draft.medicines); setBusy(false); setScreen('medicines');
  };

  return <div className="app-shell"><header className="topbar"><div className="brand-mark">O</div><div><div className="brand-name">ORBIX</div><div className="brand-sub">by MedVigil AI</div></div><label className="language"><span>文</span><select value={language} onChange={(event) => setLanguage(event.target.value)}><option>English</option><option>हिन्दी</option><option>मराठी</option></select></label></header><main>{language !== 'English' && <div className="translation-note">{language} labels are coming next · English demo labels shown</div>}{status && <div className="demo-banner">{status}</div>}{screen === 'home' && <><section className="welcome"><div className="eyebrow">GOOD MORNING, ASHA</div><h1>Your medicines,<br/><em>made clearer.</em></h1><p>One calm place for prescriptions, questions, and your next doctor visit.</p></section><UploadCard onUpload={upload} busy={busy}/></>}{screen === 'review' && <DraftReview draft={draft} onChange={setDraft} onConfirm={confirm} onBack={() => setScreen('home')} busy={busy}/>} {screen === 'medicines' && <IntakePanel medicines={medicines} onAdd={(item) => setMedicines((current) => [...current, item])}/>} {screen === 'timeline' && <TimelinePanel timeline={timeline}/>} {screen === 'summary' && <SummaryPanel medicines={medicines} timeline={timeline}/>}</main><nav className="bottom-nav">{[['home','⌂','Home'],['medicines','＋','My medicines'],['timeline','◷','Timeline'],['summary','▤','Summary']].map(([id, icon, label]) => <button className={screen === id ? 'selected' : ''} onClick={() => setScreen(id)} key={id}><span>{icon}</span>{label}</button>)}</nav></div>;
}

createRoot(document.getElementById('root')).render(<App />);
