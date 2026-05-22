import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../api';

export default function ChallengesPage() {
  const [levels, setLevels] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeLevelId, setActiveLevelId] = useState(null);

  const [levelModal, setLevelModal] = useState(null);
  const [challengeModal, setChallengeModal] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [lvlRes, chRes] = await Promise.all([
        adminApi.challengeLevels(),
        adminApi.challenges(),
      ]);
      const lvls = lvlRes.items || [];
      setLevels(lvls);
      setChallenges(chRes.items || []);
      if (!activeLevelId && lvls.length > 0) {
        setActiveLevelId(lvls[0].id);
      }
    } catch (e) {
      setError(e.message || 'Eroare la incarcarea datelor');
    } finally {
      setLoading(false);
    }
  }, [activeLevelId]);

  useEffect(() => { fetchAll(); }, []);

  const activeLevel = levels.find((l) => l.id === activeLevelId);
  const levelChallenges = challenges.filter((c) => c.level_id === activeLevelId);

  const handleSaveLevel = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      title: form.title.value.trim(),
      goal: form.goal.value.trim() || null,
      color: form.color.value.trim() || '#5cb85c',
      gradient_colors: form.gradient_colors.value.trim() || '#5cb85c,#4cae4c',
      difficulty: form.difficulty.value.trim() || 'Ușor',
      duration: form.duration.value.trim() || '5-10 min',
      sort_order: Number(form.sort_order.value) || 0,
    };
    try {
      if (levelModal.id) {
        await adminApi.updateChallengeLevel(levelModal.id, data);
      } else {
        const res = await adminApi.createChallengeLevel(data);
        setActiveLevelId(res.id);
      }
      setLevelModal(null);
      fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveChallenge = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      level_id: Number(form.level_id.value),
      title: form.title.value.trim(),
      est: form.est.value.trim() || '5 min',
      sort_order: Number(form.sort_order.value) || 0,
    };
    try {
      if (challengeModal.id) {
        await adminApi.updateChallenge(challengeModal.id, data);
      } else {
        await adminApi.createChallenge(data);
      }
      setChallengeModal(null);
      fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteLevel = async (id) => {
    if (!confirm('Stergi acest nivel? Toate provocarile asociate vor fi sterse.')) return;
    try {
      await adminApi.deleteChallengeLevel(id);
      if (activeLevelId === id) setActiveLevelId(null);
      fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteChallenge = async (id) => {
    if (!confirm('Stergi aceasta provocare?')) return;
    setDeletingId(id);
    try {
      await adminApi.deleteChallenge(id);
      fetchAll();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="page-loading">Se incarca...</div>;
  if (error) return <div className="page-error">{error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Provocari</h1>
        <p>Gestioneaza nivelele si provocarile din aplicatie</p>
      </div>

      {/* Level Tabs */}
      <div className="section-tabs">
        {levels.map((lvl) => (
          <button
            key={lvl.id}
            className={`section-tab ${activeLevelId === lvl.id ? 'section-tab--active' : ''}`}
            onClick={() => setActiveLevelId(lvl.id)}
            style={activeLevelId === lvl.id ? { borderColor: lvl.color || '#5cb85c' } : {}}
          >
            <span className="level-tab__dot" style={{ backgroundColor: lvl.color || '#5cb85c' }} />
            {lvl.title}
          </button>
        ))}
        <button
          className="section-tab section-tab--add"
          onClick={() => setLevelModal({ title: '', goal: '', color: '#5cb85c', gradient_colors: '#5cb85c,#4cae4c', difficulty: 'Ușor', duration: '5-10 min', sort_order: 0 })}
        >
          + Nivel nou
        </button>
      </div>

      {/* Active Level Content */}
      {activeLevel && (
        <div className="section-detail">
          <div className="section-detail__header">
            <div className="level-header__main">
              <span className="level-color-bar" style={{ backgroundColor: activeLevel.color || '#5cb85c' }} />
              <div>
                <h2>{activeLevel.title}</h2>
                <div className="level-meta">
                  <span className="badge" style={{ backgroundColor: (activeLevel.color || '#5cb85c') + '22', color: activeLevel.color || '#5cb85c' }}>
                    {activeLevel.difficulty}
                  </span>
                  <span className="level-meta__item">{activeLevel.duration}</span>
                </div>
              </div>
            </div>
            <div className="section-detail__actions">
              <button className="btn btn-ghost btn-sm" onClick={() => setLevelModal(activeLevel)}>
                Editeaza nivelul
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteLevel(activeLevel.id)}>
                Sterge nivelul
              </button>
            </div>
          </div>

          {activeLevel.goal && (
            <p className="section-detail__desc">{activeLevel.goal}</p>
          )}

          {/* Challenges List */}
          <div className="subsections-header">
            <h3>Provocari ({levelChallenges.length})</h3>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setChallengeModal({ level_id: activeLevel.id, title: '', est: '5 min', sort_order: 0 })}
            >
              + Adauga provocare
            </button>
          </div>

          {levelChallenges.length === 0 && (
            <div className="cms-empty">
              <p>Nicio provocare inca.</p>
              <button
                className="btn btn-primary"
                onClick={() => setChallengeModal({ level_id: activeLevel.id, title: '', est: '5 min', sort_order: 0 })}
              >
                Creaza prima provocare
              </button>
            </div>
          )}

          <div className="challenges-list">
            {levelChallenges.map((ch, index) => (
              <div key={ch.id} className="challenge-row">
                <span className="challenge-row__number">{index + 1}</span>
                <span className="challenge-row__title">{ch.title}</span>
                <span className="challenge-row__est">{ch.est}</span>
                <div className="challenge-row__actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => setChallengeModal(ch)}>
                    Editeaza
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteChallenge(ch.id)}
                    disabled={deletingId === ch.id}
                  >
                    {deletingId === ch.id ? '...' : 'Sterge'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {levels.length === 0 && !activeLevel && (
        <div className="cms-empty cms-empty--big">
          <p>Niciun nivel creat inca.</p>
          <button
            className="btn btn-primary"
            onClick={() => setLevelModal({ title: '', goal: '', color: '#5cb85c', gradient_colors: '#5cb85c,#4cae4c', difficulty: 'Ușor', duration: '5-10 min', sort_order: 0 })}
          >
            Creaza primul nivel
          </button>
        </div>
      )}

      {/* Level Modal */}
      {levelModal && (
        <div className="modal-overlay" onClick={() => setLevelModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{levelModal.id ? 'Editeaza nivelul' : 'Nivel nou'}</h3>
            <form onSubmit={handleSaveLevel}>
              <div className="form-group">
                <label>Titlu *</label>
                <input name="title" defaultValue={levelModal.title} required placeholder="Ex: Nivel 4" />
              </div>
              <div className="form-group">
                <label>Scop</label>
                <textarea name="goal" defaultValue={levelModal.goal || ''} rows={3} placeholder="Ex: Infruntarea situatiilor cele mai temute" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Culoare *</label>
                  <input name="color" defaultValue={levelModal.color || '#5cb85c'} required placeholder="#5cb85c" />
                </div>
                <div className="form-group">
                  <label>Gradient colors</label>
                  <input name="gradient_colors" defaultValue={levelModal.gradient_colors || '#5cb85c,#4cae4c'} placeholder="#5cb85c,#4cae4c" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Dificultate</label>
                  <input name="difficulty" defaultValue={levelModal.difficulty || 'Ușor'} placeholder="Ușor" />
                </div>
                <div className="form-group">
                  <label>Durata</label>
                  <input name="duration" defaultValue={levelModal.duration || '5-10 min'} placeholder="5-10 min" />
                </div>
                <div className="form-group">
                  <label>Ordine</label>
                  <input name="sort_order" type="number" defaultValue={levelModal.sort_order || 0} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Salveaza</button>
                <button type="button" className="btn btn-ghost" onClick={() => setLevelModal(null)}>Anuleaza</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Challenge Modal */}
      {challengeModal && (
        <div className="modal-overlay" onClick={() => setChallengeModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{challengeModal.id ? 'Editeaza provocarea' : 'Provocare noua'}</h3>
            <form onSubmit={handleSaveChallenge}>
              <input type="hidden" name="level_id" value={challengeModal.level_id} />
              <div className="form-group">
                <label>Titlu *</label>
                <input name="title" defaultValue={challengeModal.title} required placeholder="Ex: Mergi 10 minute pe jos" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Durata estimata</label>
                  <input name="est" defaultValue={challengeModal.est || '5 min'} placeholder="5 min" />
                </div>
                <div className="form-group">
                  <label>Ordine</label>
                  <input name="sort_order" type="number" defaultValue={challengeModal.sort_order || 0} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Salveaza</button>
                <button type="button" className="btn btn-ghost" onClick={() => setChallengeModal(null)}>Anuleaza</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
