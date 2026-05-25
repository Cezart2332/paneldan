import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../api';

const HARDCODED_LEVELS = [
  {
    id: 1,
    title: 'Nivel 1',
    goal: 'scop: obisnuirea cu senzatiile, gandurile si situatiile usoare',
    color: '#5cb85c',
    gradient_colors: '#5cb85c,#4cae4c',
    difficulty: 'Usor',
    duration: '5-10 min',
  },
  {
    id: 2,
    title: 'Nivel 2',
    goal: 'scop: sa inveti ca si in contexte mai incomode esti in siguranta',
    color: '#f0ad4e',
    gradient_colors: '#f0ad4e,#eea236',
    difficulty: 'Moderat',
    duration: '10-20 min',
  },
  {
    id: 3,
    title: 'Nivel 3',
    goal: 'scop: infruntarea situatiilor si gandurilor cele mai temute',
    color: '#d9534f',
    gradient_colors: '#d9534f,#c9302c',
    difficulty: 'Avansat',
    duration: '20-30 min',
  },
];

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeLevelId, setActiveLevelId] = useState(1);
  const [challengeModal, setChallengeModal] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const activeLevel = HARDCODED_LEVELS.find((l) => l.id === activeLevelId);
  const levelChallenges = challenges.filter((c) => c.level_id === activeLevelId);

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const chRes = await adminApi.challenges();
      setChallenges(chRes.items || []);
    } catch (e) {
      setError(e.message || 'Eroare la incarcarea provocarilor');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchChallenges(); }, [fetchChallenges]);

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
      fetchChallenges();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteChallenge = async (id) => {
    if (!confirm('Stergi aceasta provocare?')) return;
    setDeletingId(id);
    try {
      await adminApi.deleteChallenge(id);
      fetchChallenges();
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
        <p>Gestioneaza provocarile din aplicatie pe cele 3 nivele</p>
      </div>

      {/* Level Tabs */}
      <div className="section-tabs">
        {HARDCODED_LEVELS.map((lvl) => (
          <button
            key={lvl.id}
            className={`section-tab ${activeLevelId === lvl.id ? 'section-tab--active' : ''}`}
            onClick={() => setActiveLevelId(lvl.id)}
            style={activeLevelId === lvl.id ? { borderColor: lvl.color } : {}}
          >
            <span className="level-tab__dot" style={{ backgroundColor: lvl.color }} />
            {lvl.title}
          </button>
        ))}
      </div>

      {/* Active Level Content */}
      {activeLevel && (
        <div className="section-detail">
          <div className="section-detail__header">
            <div className="level-header__main">
              <span className="level-color-bar" style={{ backgroundColor: activeLevel.color }} />
              <div>
                <h2>{activeLevel.title}</h2>
                <div className="level-meta">
                  <span className="badge" style={{ backgroundColor: activeLevel.color + '22', color: activeLevel.color }}>
                    {activeLevel.difficulty}
                  </span>
                  <span className="level-meta__item">{activeLevel.duration}</span>
                </div>
              </div>
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
