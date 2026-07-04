import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../api';
import {
  FiActivity,
  FiAward,
  FiBookOpen,
  FiCamera,
  FiCheckCircle,
  FiChevronDown,
  FiCloud,
  FiCompass,
  FiEye,
  FiFilm,
  FiGift,
  FiGlobe,
  FiHeadphones,
  FiHeart,
  FiHome,
  FiInfo,
  FiLifeBuoy,
  FiMap,
  FiMessageCircle,
  FiMoon,
  FiMusic,
  FiPhone,
  FiPlay,
  FiPlayCircle,
  FiSettings,
  FiShield,
  FiSmile,
  FiStar,
  FiSun,
  FiTarget,
  FiThumbsUp,
  FiTrendingUp,
  FiUser,
  FiUsers,
  FiVideo,
  FiVolume2,
  FiWind,
  FiZap,
} from 'react-icons/fi';

const ICON_OPTIONS = [
  { name: 'play', label: 'Play', icon: FiPlay },
  { name: 'play-circle', label: 'Cerc play', icon: FiPlayCircle },
  { name: 'film', label: 'Film', icon: FiFilm },
  { name: 'video', label: 'Video', icon: FiVideo },
  { name: 'camera', label: 'Camera', icon: FiCamera },
  { name: 'headphones', label: 'Casti', icon: FiHeadphones },
  { name: 'music', label: 'Muzica', icon: FiMusic },
  { name: 'heart', label: 'Inima', icon: FiHeart },
  { name: 'star', label: 'Stea', icon: FiStar },
  { name: 'sun', label: 'Soare', icon: FiSun },
  { name: 'moon', label: 'Luna', icon: FiMoon },
  { name: 'cloud', label: 'Nor', icon: FiCloud },
  { name: 'shield', label: 'Scut', icon: FiShield },
  { name: 'check-circle', label: 'Bifat', icon: FiCheckCircle },
  { name: 'activity', label: 'Activitate', icon: FiActivity },
  { name: 'award', label: 'Premiu', icon: FiAward },
  { name: 'book-open', label: 'Carte', icon: FiBookOpen },
  { name: 'compass', label: 'Busola', icon: FiCompass },
  { name: 'eye', label: 'Ochi', icon: FiEye },
  { name: 'gift', label: 'Cadou', icon: FiGift },
  { name: 'globe', label: 'Glob', icon: FiGlobe },
  { name: 'home', label: 'Acasa', icon: FiHome },
  { name: 'info', label: 'Info', icon: FiInfo },
  { name: 'life-buoy', label: 'Colac', icon: FiLifeBuoy },
  { name: 'map', label: 'Harta', icon: FiMap },
  { name: 'message-circle', label: 'Mesaj', icon: FiMessageCircle },
  { name: 'phone', label: 'Telefon', icon: FiPhone },
  { name: 'settings', label: 'Setari', icon: FiSettings },
  { name: 'smile', label: 'Zambet', icon: FiSmile },
  { name: 'target', label: 'Tinta', icon: FiTarget },
  { name: 'thumbs-up', label: 'Like', icon: FiThumbsUp },
  { name: 'trending-up', label: 'Crestere', icon: FiTrendingUp },
  { name: 'user', label: 'Utilizator', icon: FiUser },
  { name: 'users', label: 'Grup', icon: FiUsers },
  { name: 'volume-2', label: 'Volum', icon: FiVolume2 },
  { name: 'wind', label: 'Vant', icon: FiWind },
  { name: 'zap', label: 'Fulger', icon: FiZap },
];

function getIconForName(iconName) {
  return ICON_OPTIONS.find((o) => o.name === iconName);
}

// Sectiunile existente din aplicatia mobila. O sectiune CMS cu unul dintre
// aceste slug-uri isi afiseaza videoclipurile direct in ecranul respectiv.
const APP_SECTIONS = [
  { slug: 'tehnica-hai', label: 'Tehnica HAI (ecranul principal)' },
  { slug: 'tehnica-hai-psihologice', label: 'Tehnica HAI — Simptome psihologice' },
  { slug: 'tehnica-hai-fizice', label: 'Tehnica HAI — Simptome fizice' },
  { slug: 'audio-anxietate', label: 'Intelege anxietatea — Audio-uri despre anxietate' },
  { slug: 'ajutor-anxietate', label: 'Ajutor — Anxietate' },
  { slug: 'ajutor-atac-panica', label: 'Ajutor — Atac de panica' },
  { slug: 'din-experienta-mea', label: 'Eu sunt Dan — Din experienta mea' },
];

function getAppSectionForSlug(slug) {
  return APP_SECTIONS.find((s) => s.slug === String(slug || '').trim().toLowerCase()) || null;
}

export default function VideosPage() {
  const [sections, setSections] = useState([]);
  const [subsections, setSubsections] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSectionId, setActiveSectionId] = useState(null);

  // Modals
  const [sectionModal, setSectionModal] = useState(null);
  const [subsectionModal, setSubsectionModal] = useState(null);
  const [videoModal, setVideoModal] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedIcon, setSelectedIcon] = useState('play');
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  // 'new' = sectiune noua pe Dashboard ("Continut nou"); 'app' = atasata unei sectiuni existente din aplicatie
  const [sectionMode, setSectionMode] = useState('new');
  const [appSlug, setAppSlug] = useState(APP_SECTIONS[0].slug);

  useEffect(() => {
    if (subsectionModal) {
      setSelectedIcon(subsectionModal.icon_name || 'play');
      setIconPickerOpen(false);
    }
  }, [subsectionModal]);

  useEffect(() => {
    if (!sectionModal) return;
    const appSection = getAppSectionForSlug(sectionModal.slug);
    setSectionMode(appSection ? 'app' : 'new');
    setAppSlug(appSection ? appSection.slug : APP_SECTIONS[0].slug);
  }, [sectionModal]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [secRes, subRes, vidRes] = await Promise.all([
        adminApi.videoSections(),
        adminApi.videoSubsections(),
        adminApi.videos(),
      ]);
      const secs = secRes.items || [];
      setSections(secs);
      setSubsections(subRes.items || []);
      setVideos(vidRes.items || []);
      // Auto-select first section if none active
      if (!activeSectionId && secs.length > 0) {
        setActiveSectionId(secs[0].id);
      }
    } catch (e) {
      setError(e.message || 'Eroare la incarcarea datelor');
    } finally {
      setLoading(false);
    }
  }, [activeSectionId]);

  useEffect(() => { fetchAll(); }, []);

  const activeSection = sections.find((s) => s.id === activeSectionId);
  const sectionSubsections = subsections.filter((s) => s.section_id === activeSectionId);

  const getSubsectionVideos = (subId) => videos.filter((v) => v.subsection_id === subId);

  const handleSaveSection = async (e) => {
    e.preventDefault();
    const form = e.target;
    const slug = sectionMode === 'app' ? appSlug : form.slug.value.trim();
    if (!slug) {
      alert('Completeaza slug-ul sectiunii.');
      return;
    }
    const duplicate = sections.find((s) => s.slug === slug && s.id !== sectionModal.id);
    if (duplicate) {
      alert(`Exista deja sectiunea "${duplicate.title}" legata de acest slug. Adauga subsectiunile si videoclipurile acolo.`);
      return;
    }
    const data = {
      title: form.title.value.trim(),
      slug,
      description: form.description.value.trim() || null,
      sort_order: Number(form.sort_order.value) || 0,
    };
    try {
      if (sectionModal.id) {
        await adminApi.updateVideoSection(sectionModal.id, data);
      } else {
        const res = await adminApi.createVideoSection(data);
        setActiveSectionId(res.id);
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
      title: form.title.value.trim(),
      description: form.description.value.trim() || null,
      icon_name: selectedIcon || 'play',
      icon_color: form.icon_color.value.trim() || '#4a90e2',
      icon_bg: form.icon_bg.value.trim() || '#eaf3ff',
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
      title: form.title.value.trim(),
      description: form.description.value.trim() || null,
      storage_key: form.storage_key.value.trim(),
      badge: form.badge.value.trim() || null,
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
    setDeletingId(id);
    try {
      await adminApi.deleteVideo(id);
      fetchAll();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
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
      if (activeSectionId === id) setActiveSectionId(null);
      fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  const statusBadge = (status) => {
    const map = {
      pending: { label: 'Asteapta fisier', class: 'badge--sub-none' },
      encoding: { label: 'Se encodeaza...', class: 'badge--sub-trial' },
      done: { label: 'Gata', class: 'badge--sub-premium' },
      failed: { label: 'Eroare', class: 'badge--sub-basic' },
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
        <p>Gestioneaza sectiunile, subsectiunile si videoclipurile din aplicatie</p>
      </div>

      {/* Section Tabs */}
      <div className="section-tabs">
        {sections.map((sec) => (
          <button
            key={sec.id}
            className={`section-tab ${activeSectionId === sec.id ? 'section-tab--active' : ''}`}
            onClick={() => setActiveSectionId(sec.id)}
          >
            {sec.title}
          </button>
        ))}
        <button
          className="section-tab section-tab--add"
          onClick={() => setSectionModal({ title: '', slug: '', description: '', sort_order: 0 })}
        >
          + Sectiune noua
        </button>
      </div>

      {/* Active Section Content */}
      {activeSection && (
        <div className="section-detail">
          <div className="section-detail__header">
            <div>
              <h2>{activeSection.title}</h2>
              <span className="section-slug">slug: {activeSection.slug}</span>
              {(() => {
                const appSection = getAppSectionForSlug(activeSection.slug);
                return (
                  <span className={`badge ${appSection ? 'badge--sub-premium' : 'badge--sub-none'} section-placement-badge`}>
                    {appSection ? `In aplicatie: ${appSection.label}` : 'Dashboard — Continut nou'}
                  </span>
                );
              })()}
            </div>
            <div className="section-detail__actions">
              <button className="btn btn-ghost btn-sm" onClick={() => setSectionModal(activeSection)}>
                Editeaza sectiunea
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteSection(activeSection.id)}>
                Sterge sectiunea
              </button>
            </div>
          </div>

          {activeSection.description && (
            <p className="section-detail__desc">{activeSection.description}</p>
          )}

          {/* Subsections */}
          <div className="subsections-header">
            <h3>Subsectiuni</h3>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setSubsectionModal({ section_id: activeSection.id, title: '', description: '', icon_name: 'play', icon_color: '#4a90e2', icon_bg: '#eaf3ff', sort_order: 0 })}
            >
              + Adauga subsectiune
            </button>
          </div>

          {sectionSubsections.length === 0 && (
            <div className="cms-empty">
              <p>Nicio subsectiune inca.</p>
              <button
                className="btn btn-primary"
                onClick={() => setSubsectionModal({ section_id: activeSection.id, title: '', description: '', icon_name: 'play', icon_color: '#4a90e2', icon_bg: '#eaf3ff', sort_order: 0 })}
              >
                Creaza prima subsectiune
              </button>
            </div>
          )}

          <div className="subsections-grid">
            {sectionSubsections.map((sub) => {
              const subVideos = getSubsectionVideos(sub.id);
              return (
                <div key={sub.id} className="subsection-card">
                  <div className="subsection-card__header">
                    <div className="subsection-card__icon-preview" style={{ backgroundColor: sub.icon_bg || '#eaf3ff' }}>
                      {(() => {
                        const iconOpt = getIconForName(sub.icon_name);
                        const IconComp = iconOpt?.icon;
                        return IconComp ? (
                          <IconComp size={18} color={sub.icon_color || '#4a90e2'} />
                        ) : (
                          <span style={{ color: sub.icon_color || '#4a90e2', fontSize: 18 }}>&#9654;</span>
                        );
                      })()}
                    </div>
                    <div className="subsection-card__info">
                      <h4>{sub.title}</h4>
                      {sub.description && <p>{sub.description}</p>}
                    </div>
                    <div className="subsection-card__actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => setSubsectionModal(sub)}>
                        Editeaza
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteSubsection(sub.id)}>
                        Sterge
                      </button>
                    </div>
                  </div>

                  <div className="videos-list">
                    {subVideos.length === 0 ? (
                      <div className="videos-list__empty">
                        <p>Niciun video. Adauga primul video mai jos.</p>
                      </div>
                    ) : (
                      <div className="videos-table">
                        <div className="videos-table__header">
                          <span>Video</span>
                          <span>Status</span>
                          <span>Actiuni</span>
                        </div>
                        {subVideos.map((vid) => (
                          <div key={vid.id} className="videos-table__row">
                            <div className="videos-table__info">
                              <span className="videos-table__title">{vid.title}</span>
                              <span className="videos-table__key">{vid.storage_key}</span>
                            </div>
                            <div className="videos-table__status">
                              {statusBadge(vid.encoding_status)}
                            </div>
                            <div className="videos-table__actions">
                              <label className={`btn btn-primary btn-sm ${uploadingId === vid.id ? 'btn--loading' : ''}`}>
                                {uploadingId === vid.id ? 'Se incarca...' : 'Incarca'}
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
                              <button className="btn btn-ghost btn-sm" onClick={() => setVideoModal(vid)}>
                                Editeaza
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteVideo(vid.id)}
                                disabled={deletingId === vid.id}
                              >
                                {deletingId === vid.id ? '...' : 'Sterge'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      className="btn btn-ghost btn-sm add-video-btn"
                      onClick={() => setVideoModal({ subsection_id: sub.id, title: '', description: '', storage_key: '', badge: '', sort_order: 0 })}
                    >
                      + Adauga video
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {sections.length === 0 && !activeSection && (
        <div className="cms-empty cms-empty--big">
          <p>Nicio sectiune creata inca.</p>
          <button
            className="btn btn-primary"
            onClick={() => setSectionModal({ title: '', slug: '', description: '', sort_order: 0 })}
          >
            Creaza prima sectiune
          </button>
        </div>
      )}

      {/* Section Modal */}
      {sectionModal && (
        <div className="modal-overlay" onClick={() => setSectionModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{sectionModal.id ? 'Editeaza sectiunea' : 'Sectiune noua'}</h3>
            <form onSubmit={handleSaveSection}>
              <div className="form-group">
                <label>Titlu *</label>
                <input name="title" defaultValue={sectionModal.title} required placeholder="Ex: Tehnica HAI" />
              </div>
              <div className="form-group">
                <label>Unde apar videoclipurile? *</label>
                <select
                  value={sectionMode}
                  onChange={(e) => setSectionMode(e.target.value)}
                >
                  <option value="new">Sectiune noua pe Dashboard (Continut nou)</option>
                  <option value="app">Intr-o sectiune existenta din aplicatie</option>
                </select>
              </div>
              {sectionMode === 'app' ? (
                <div className="form-group">
                  <label>Sectiunea din aplicatie *</label>
                  <select value={appSlug} onChange={(e) => setAppSlug(e.target.value)}>
                    {APP_SECTIONS.map((s) => (
                      <option key={s.slug} value={s.slug}>{s.label}</option>
                    ))}
                  </select>
                  <small className="form-hint">
                    Subsectiunile si videoclipurile adaugate aici vor aparea direct in acest ecran din aplicatie.
                  </small>
                </div>
              ) : (
                <div className="form-group">
                  <label>Slug * <small>(identificator unic, fara spatii)</small></label>
                  <input
                    name="slug"
                    defaultValue={getAppSectionForSlug(sectionModal.slug) ? '' : sectionModal.slug}
                    required
                    placeholder="Ex: meditatii-ghidate"
                  />
                  <small className="form-hint">
                    Sectiunea va aparea pe Dashboard, in blocul "Continut nou".
                  </small>
                </div>
              )}
              <div className="form-group">
                <label>Descriere</label>
                <textarea name="description" defaultValue={sectionModal.description || ''} rows={3} placeholder="Optional" />
              </div>
              <div className="form-group">
                <label>Ordine</label>
                <input name="sort_order" type="number" defaultValue={sectionModal.sort_order || 0} />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Salveaza</button>
                <button type="button" className="btn btn-ghost" onClick={() => setSectionModal(null)}>Anuleaza</button>
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
                <label>Titlu *</label>
                <input name="title" defaultValue={subsectionModal.title} required placeholder="Ex: Pasii metodei" />
              </div>
              <div className="form-group">
                <label>Descriere</label>
                <textarea name="description" defaultValue={subsectionModal.description || ''} rows={3} placeholder="Optional" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Icon</label>
                  <div className="icon-picker">
                    <button
                      type="button"
                      className="icon-picker__trigger"
                      onClick={() => setIconPickerOpen(!iconPickerOpen)}
                    >
                      {(() => {
                        const opt = getIconForName(selectedIcon);
                        const IconComp = opt?.icon;
                        return IconComp ? <IconComp size={18} /> : <FiPlay size={18} />;
                      })()}
                      <span>{getIconForName(selectedIcon)?.label || selectedIcon}</span>
                      <FiChevronDown size={14} />
                    </button>
                    {iconPickerOpen && (
                      <div className="icon-picker__dropdown">
                        <div className="icon-picker__grid">
                          {ICON_OPTIONS.map((opt) => {
                            const IconComp = opt.icon;
                            return (
                              <button
                                key={opt.name}
                                type="button"
                                className={`icon-picker__item ${selectedIcon === opt.name ? 'icon-picker__item--active' : ''}`}
                                onClick={() => {
                                  setSelectedIcon(opt.name);
                                  setIconPickerOpen(false);
                                }}
                                title={opt.label}
                              >
                                <IconComp size={18} />
                                <span>{opt.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Icon culoare</label>
                  <input name="icon_color" defaultValue={subsectionModal.icon_color || '#4a90e2'} placeholder="#4a90e2" />
                </div>
                <div className="form-group">
                  <label>Icon bg</label>
                  <input name="icon_bg" defaultValue={subsectionModal.icon_bg || '#eaf3ff'} placeholder="#eaf3ff" />
                </div>
              </div>
              <div className="form-group">
                <label>Ordine</label>
                <input name="sort_order" type="number" defaultValue={subsectionModal.sort_order || 0} />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Salveaza</button>
                <button type="button" className="btn btn-ghost" onClick={() => setSubsectionModal(null)}>Anuleaza</button>
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
                <label>Titlu *</label>
                <input name="title" defaultValue={videoModal.title} required placeholder="Ex: Pasul 5 din tehnica HAI" />
              </div>
              <div className="form-group">
                <label>Descriere</label>
                <textarea name="description" defaultValue={videoModal.description || ''} rows={3} placeholder="Optional" />
              </div>
              <div className="form-group">
                <label>Storage key * <small>(nume fisier fara extensie)</small></label>
                <input name="storage_key" defaultValue={videoModal.storage_key} required placeholder="Ex: pasul_5_tehnica_HAI" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Badge (optional)</label>
                  <input name="badge" defaultValue={videoModal.badge || ''} placeholder="Ex: 5" />
                </div>
                <div className="form-group">
                  <label>Ordine</label>
                  <input name="sort_order" type="number" defaultValue={videoModal.sort_order || 0} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Salveaza</button>
                <button type="button" className="btn btn-ghost" onClick={() => setVideoModal(null)}>Anuleaza</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
