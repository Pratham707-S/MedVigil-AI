export function UploadCard({ onUpload, busy }) {
  const pick = (event) => {
    const file = event.target.files?.[0];
    if (file) onUpload(file);
    event.target.value = '';
  };

  return (
    <section className="hero-card">
      <div className="eyebrow">01 · PRESCRIPTION</div>
      <h2>Make your medication story clearer.</h2>
      <p className="muted">Upload a prescription and we’ll turn it into an editable draft for review.</p>
      <div className="upload-grid">
        <label className="upload-choice"><span className="choice-icon">⌾</span><strong>Camera</strong><small>Take a photo</small><input type="file" accept="image/*" capture="environment" onChange={pick} disabled={busy} /></label>
        <label className="upload-choice"><span className="choice-icon">▧</span><strong>Gallery</strong><small>Choose an image</small><input type="file" accept="image/*" onChange={pick} disabled={busy} /></label>
        <label className="upload-choice"><span className="choice-icon">▤</span><strong>PDF</strong><small>Choose a document</small><input type="file" accept="application/pdf,.pdf" onChange={pick} disabled={busy} /></label>
      </div>
      {busy && <div className="inline-status">Creating an editable draft…</div>}
      <div className="safe-note">Fictional demo · AI output always needs human review</div>
    </section>
  );
}
