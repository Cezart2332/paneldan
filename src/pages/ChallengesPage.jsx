import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../api';

export default function ChallengesPage() {
  const [levels, setLevels] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [levelModal, setLevelModal] = useState(null);
  const [challengeModal, setChallengeModal] = useState(null);
  const [expandedLevels, setExpandedLevels] = useState(new Set());

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [lvlRes, chRes] = await Promise.all([
        adminApi.challengeLevels(),
        adminApi.challenges(),
      ]);
      setLevels(lvlRes.items || []);
      setChallenges(chRes.items || []);
    } catch (e) {
      setError(e.message || 'Eroare la incarcarea datelor');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const toggleLevel = (id) => {
    setExpandedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSaveLevel = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      title: form.title.value,
      goal: form.goal.value || null,
      color: form.color.value || '#5cb85c',
      gradient_colors: form.gradient_colors.value || '#5cb85c,#4cae4c',
      difficulty: form.difficulty.value || 'Ușor',
      duration: form.duration.value || '5-10 min',
      sort_order: Number(form.sort_order.value) || 0,
    };
    try {
      if (levelModal.id) {
        await adminApi.updateChallengeLevel(levelModal.id, data);
      } else {
        await adminApi.createChallengeLevel(data);
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
      title: form.title.value,
      est: form.est.value || '5 min',
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
      fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteChallenge = async (id) => {
    if (!confirm('Stergi aceasta provocare?')) return;
    try {
      await adminApi.deleteChallenge(id);
      fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="page-loading">Se incarca...</div>;
  if (error) return <div className="page-error">{error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Provocari</h1>
        <button className="btn btn-primary" onClick={() => setLevelModal({ title: '', goal: '', color: '#5cb85c', gradient_colors: '#5cb85c,#4cae4c', difficulty: 'Ușor', duration: '5-10 min', sort_order: 0 })}>
          + Nivel nou
        </button>
      </div>

      <div className="tree">
        {levels.map((lvl) => (
          <div key={lvl.id} className="tree-section">
            <div className="tree-row tree-row--section">
              <button className="tree-toggle" onClick={() => toggleLevel(lvl.id)}>
                {expandedLevels.has(lvl.id) ? '▼' : '▶'}
              </button>
              <span className="tree-label tree-label--bold">{lvl.title}</span>
              <span className="tree-meta">{lvl.difficulty} · {lvl.duration}</span>
              <div className="tree-actions">
                <button className="btn btn-sm" onClick={() => setChallengeModal({ level_id: lvl.id, title: '', est: '5 min', sort_order: 0 })}>
                  + Provocare
                </button>
                <button className="btn btn-sm" onClick={() => setLevelModal(lvl)}>Editeaza</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDeleteLevel(lvl.id)}>Sterge</button>
              </div>
            </div>

            {expandedLevels.has(lvl.id) && (
              <div className="tree-children">
                {challenges.filter((c) => c.level_id === lvl.id).map((ch) => (
                  <div key={ch.id} className="tree-row tree-row--video">
                    <span className="tree-label">{ch.title}</span>
                    <span className="tree-meta">{ch.est}</span>
                    <div className="tree-actions">
                      <button className="btn btn-sm" onClick={() => setChallengeModal(ch)}>Editeaza</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDeleteChallenge(ch.id)}>Sterge</button>
                    </div>
                  </div>
                ))}
                {challenges.filter((c) => c.level_id === lvl.id).length === 0 && (
                  <div className="tree-empty">Nicio provocare</div>
                )}
              </div>
            )}
          </div>
        ))}
        {levels.length === 0 && <div className="tree-empty">Niciun nivel</div>}
      </div>

      {/* Level Modal */}
      {levelModal && (
        <div className="modal-overlay" onClick={() => setLevelModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{levelModal.id ? 'Editeaza nivelul' : 'Nivel nou'}</h3>
            <form onSubmit={handleSaveLevel}>
              <div className="form-group">
                <label>Titlu</label>
                <input name="title" defaultValue={levelModal.title} required />
              </div>
              <div className="form-group">
                <label>Scop</label>
                <textarea name="goal" defaultValue={levelModal.goal || ''} rows={3} />
              </div>
              <div className="form-group">
                <label>Culoare</label>
                <input name="color" defaultValue={levelModal.color || '#5cb85c'} />
              </div>
              <div className="form-group">
                <label>Gradient colors</label>
                <input name="gradient_colors" defaultValue={levelModal.gradient_colors || '#5cb85c,#4cae4c'} />
              </div>
              <div className="form-group">
                <label>Dificultate</label>
                <input name="difficulty" defaultValue={levelModal.difficulty || 'Ușor'} />
              </div>
              <div className="form-group">
                <label>Durata</label>
                <input name="duration" defaultValue={levelModal.duration || '5-10 min'} />
              </div>
              <div className="form-group">
                <label>Ordine</label>
                <input name="sort_order" type="number" defaultValue={levelModal.sort_order || 0} />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Salveaza</button>
                <button type="button" className="btn" onClick={() => setLevelModal(null)}>Anuleaza</button>
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
                <label>Titlu</label>
                <input name="title" defaultValue={challengeModal.title} required />
              </div>
              <div className="form-group">
                <label>Durata estimata</label>
                <input name="est" defaultValue={challengeModal.est || '5 min'} />
              </div>
              <div className="form-group">
                <label>Ordine</label>
                <input name="sort_order" type="number" defaultValue={challengeModal.sort_order || 0} />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Salveaza</button>
                <button type="button" className="btn" onClick={() => setChallengeModal(null)}>Anuleaza</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
