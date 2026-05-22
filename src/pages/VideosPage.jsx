import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../api';

export default function VideosPage() {
  const [sections, setSections] = useState([]);
  const [subsections, setSubsections] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [sectionModal, setSectionModal] = useState(null); // null | {id?, title, slug, description, sort_order}
  const [subsectionModal, setSubsectionModal] = useState(null); // null | {id?, section_id, title, description, icon_name, icon_color, icon_bg, sort_order}
  const [videoModal, setVideoModal] = useState(null); // null | {id?, subsection_id, title, description, storage_key, badge, sort_order}
  const [uploadingId, setUploadingId] = useState(null);

  // Collapse state
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [expandedSubsections, setExpandedSubsections] = useState(new Set());

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [secRes, subRes, vidRes] = await Promise.all([
        adminApi.videoSections(),
        adminApi.videoSubsections(),
        adminApi.videos(),
      ]);
      setSections(secRes.items || []);
      setSubsections(subRes.items || []);
      setVideos(vidRes.items || []);
    } catch (e) {
      setError(e.message || 'Eroare la incarcarea datelor');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const toggleSection = (id) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSubsection = (id) => {
    setExpandedSubsections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      title: form.title.value,
      slug: form.slug.value,
      description: form.description.value || null,
      sort_order: Number(form.sort_order.value) || 0,
    };
    try {
      if (sectionModal.id) {
        await adminApi.updateVideoSection(sectionModal.id, data);
      } else {
        await adminApi.createVideoSection(data);
      }
      setSectionModal(null);
      fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveSubsection = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      section_id: Number(form.section_id.value),
      title: form.title.value,
      description: form.description.value || null,
      icon_name: form.icon_name.value || 'play-outline',
      icon_color: form.icon_color.value || '#4a90e2',
      icon_bg: form.icon_bg.value || '#eaf3ff',
      sort_order: Number(form.sort_order.value) || 0,
    };
    try {
      if (subsectionModal.id) {
        await adminApi.updateVideoSubsection(subsectionModal.id, data);
      } else {
        await adminApi.createVideoSubsection(data);
      }
      setSubsectionModal(null);
      fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveVideo = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      subsection_id: Number(form.subsection_id.value),
      title: form.title.value,
      description: form.description.value || null,
      storage_key: form.storage_key.value,
      badge: form.badge.value || null,
      sort_order: Number(form.sort_order.value) || 0,
    };
    try {
      if (videoModal.id) {
        await adminApi.updateVideo(videoModal.id, data);
      } else {
        await adminApi.createVideo(data);
      }
      setVideoModal(null);
      fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpload = async (videoId, file) => {
    setUploadingId(videoId);
    try {
      await adminApi.uploadVideo(videoId, file);
      alert('Fisier incarcat. Encoding a pornit in fundal.');
      fetchAll();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingId(null);
    }
  };

  const handleDeleteVideo = async (id) => {
    if (!confirm('Stergi acest video? Fisierele asociate vor fi sterse.')) return;
    try {
      await adminApi.deleteVideo(id);
      fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteSubsection = async (id) => {
    if (!confirm('Stergi aceasta subsectiune? Toate videoclipurile asociate vor fi sterse.')) return;
    try {
      await adminApi.deleteVideoSubsection(id);
      fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteSection = async (id) => {
    if (!confirm('Stergi aceasta sectiune? Toate subsectiunile si videoclipurile asociate vor fi sterse.')) return;
    try {
      await adminApi.deleteVideoSection(id);
      fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  const statusBadge = (status) => {
    const map = {
      pending: { label: 'Pending', class: 'status-pending' },
      encoding: { label: 'Encoding...', class: 'status-encoding' },
      done: { label: 'Done', class: 'status-done' },
      failed: { label: 'Failed', class: 'status-failed' },
    };
    const s = map[status] || map.pending;
    return <span className={`badge ${s.class}`}>{s.label}</span>;
  };

  if (loading) return <div className="page-loading">Se incarca...</div>;
  if (error) return <div className="page-error">{error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Videoclipuri</h1>
        <button className="btn btn-primary" onClick={() => setSectionModal({ title: '', slug: '', description: '', sort_order: 0 })}>
          + Sectiune noua
        </button>
      </div>

      <div className="tree">
        {sections.map((sec) => (
          <div key={sec.id} className="tree-section">
            <div className="tree-row tree-row--section">
              <button className="tree-toggle" onClick={() => toggleSection(sec.id)}>
                {expandedSections.has(sec.id) ? '▼' : '▶'}
              </button>
              <span className="tree-label tree-label--bold">{sec.title}</span>
              <span className="tree-meta">slug: {sec.slug}</span>
              <div className="tree-actions">
                <button className="btn btn-sm" onClick={() => setSubsectionModal({ section_id: sec.id, title: '', description: '', icon_name: 'play-outline', icon_color: '#4a90e2', icon_bg: '#eaf3ff', sort_order: 0 })}>
                  + Subsectiune
                </button>
                <button className="btn btn-sm" onClick={() => setSectionModal(sec)}>Editeaza</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDeleteSection(sec.id)}>Sterge</button>
              </div>
            </div>

            {expandedSections.has(sec.id) && (
              <div className="tree-children">
                {subsections.filter((s) => s.section_id === sec.id).map((sub) => (
                  <div key={sub.id} className="tree-subsection">
                    <div className="tree-row tree-row--subsection">
                      <button className="tree-toggle" onClick={() => toggleSubsection(sub.id)}>
                        {expandedSubsections.has(sub.id) ? '▼' : '▶'}
                      </button>
                      <span className="tree-label">{sub.title}</span>
                      <div className="tree-actions">
                        <button className="btn btn-sm" onClick={() => setVideoModal({ subsection_id: sub.id, title: '', description: '', storage_key: '', badge: '', sort_order: 0 })}>
                          + Video
                        </button>
                        <button className="btn btn-sm" onClick={() => setSubsectionModal(sub)}>Editeaza</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteSubsection(sub.id)}>Sterge</button>
                      </div>
                    </div>

                    {expandedSubsections.has(sub.id) && (
                      <div className="tree-children tree-children--videos">
                        {videos.filter((v) => v.subsection_id === sub.id).map((vid) => (
                          <div key={vid.id} className="tree-row tree-row--video">
                            <span className="tree-label">{vid.title}</span>
                            <span className="tree-meta">{vid.storage_key}</span>
                            {statusBadge(vid.encoding_status)}
                            <div className="tree-actions">
                              <label className="btn btn-sm">
                                {uploadingId === vid.id ? 'Se incarca...' : 'Incarca fisier'}
                                <input
                                  type="file"
                                  accept="video/mp4,video/quicktime"
                                  style={{ display: 'none' }}
                                  onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) handleUpload(vid.id, file);
                                  }}
                                  disabled={uploadingId === vid.id}
                                />
                              </label>
                              <button className="btn btn-sm" onClick={() => setVideoModal(vid)}>Editeaza</button>
                              <button className="btn btn-sm btn-danger" onClick={() => handleDeleteVideo(vid.id)}>Sterge</button>
                            </div>
                          </div>
                        ))}
                        {videos.filter((v) => v.subsection_id === sub.id).length === 0 && (
                          <div className="tree-empty">Niciun video</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {subsections.filter((s) => s.section_id === sec.id).length === 0 && (
                  <div className="tree-empty">Nicio subsectiune</div>
                )}
              </div>
            )}
          </div>
        ))}
        {sections.length === 0 && <div className="tree-empty">Nicio sectiune</div>}
      </div>

      {/* Section Modal */}
      {sectionModal && (
        <div className="modal-overlay" onClick={() => setSectionModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{sectionModal.id ? 'Editeaza sectiunea' : 'Sectiune noua'}</h3>
            <form onSubmit={handleSaveSection}>
              <div className="form-group">
                <label>Titlu</label>
                <input name="title" defaultValue={sectionModal.title} required />
              </div>
              <div className="form-group">
                <label>Slug</label>
                <input name="slug" defaultValue={sectionModal.slug} required />
              </div>
              <div className="form-group">
                <label>Descriere</label>
                <textarea name="description" defaultValue={sectionModal.description || ''} rows={3} />
              </div>
              <div className="form-group">
                <label>Ordine</label>
                <input name="sort_order" type="number" defaultValue={sectionModal.sort_order || 0} />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Salveaza</button>
                <button type="button" className="btn" onClick={() => setSectionModal(null)}>Anuleaza</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subsection Modal */}
      {subsectionModal && (
        <div className="modal-overlay" onClick={() => setSubsectionModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{subsectionModal.id ? 'Editeaza subsectiunea' : 'Subsectiune noua'}</h3>
            <form onSubmit={handleSaveSubsection}>
              <input type="hidden" name="section_id" value={subsectionModal.section_id} />
              <div className="form-group">
                <label>Titlu</label>
                <input name="title" defaultValue={subsectionModal.title} required />
              </div>
              <div className="form-group">
                <label>Descriere</label>
                <textarea name="description" defaultValue={subsectionModal.description || ''} rows={3} />
              </div>
              <div className="form-group">
                <label>Icon name</label>
                <input name="icon_name" defaultValue={subsectionModal.icon_name || 'play-outline'} />
              </div>
              <div className="form-group">
                <label>Icon color</label>
                <input name="icon_color" defaultValue={subsectionModal.icon_color || '#4a90e2'} />
              </div>
              <div className="form-group">
                <label>Icon bg</label>
                <input name="icon_bg" defaultValue={subsectionModal.icon_bg || '#eaf3ff'} />
              </div>
              <div className="form-group">
                <label>Ordine</label>
                <input name="sort_order" type="number" defaultValue={subsectionModal.sort_order || 0} />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Salveaza</button>
                <button type="button" className="btn" onClick={() => setSubsectionModal(null)}>Anuleaza</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {videoModal && (
        <div className="modal-overlay" onClick={() => setVideoModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{videoModal.id ? 'Editeaza video' : 'Video nou'}</h3>
            <form onSubmit={handleSaveVideo}>
              <input type="hidden" name="subsection_id" value={videoModal.subsection_id} />
              <div className="form-group">
                <label>Titlu</label>
                <input name="title" defaultValue={videoModal.title} required />
              </div>
              <div className="form-group">
                <label>Descriere</label>
                <textarea name="description" defaultValue={videoModal.description || ''} rows={3} />
              </div>
              <div className="form-group">
                <label>Storage key (nume fisier, fara extensie)</label>
                <input name="storage_key" defaultValue={videoModal.storage_key} required />
              </div>
              <div className="form-group">
                <label>Badge (optional)</label>
                <input name="badge" defaultValue={videoModal.badge || ''} />
              </div>
              <div className="form-group">
                <label>Ordine</label>
                <input name="sort_order" type="number" defaultValue={videoModal.sort_order || 0} />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Salveaza</button>
                <button type="button" className="btn" onClick={() => setVideoModal(null)}>Anuleaza</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
