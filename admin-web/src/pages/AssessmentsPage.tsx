import React, { useState } from 'react';
import { Plus, Eye, Send, Save, ArrowUp, ArrowDown } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { Assessment, AssessmentActivityConfig, ModalityKey, ScoringMethod } from '../../../shared/types';
import { MODALITY_META } from '../../../shared/constants/theme';

export const AssessmentsPage: React.FC = () => {
  const { assessments, classes, activityBank, students, saveAssessment, publishAssessment } = useAdmin();
  const [view, setView] = useState<'list' | 'create' | 'monitor'>('list');

  // Create Assessment State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(['cls-5']);
  const [selectedConfigs, setSelectedConfigs] = useState<AssessmentActivityConfig[]>([]);
  const [previewAsmt, setPreviewAsmt] = useState<Assessment | null>(null);
  const [error, setError] = useState('');

  const approvedBank = activityBank.filter((a) => a.approvalStatus === 'Approved');
  const representedModalities = new Set(selectedConfigs.map((c) => c.activity.modality));
  const allFourCovered = (['visual', 'auditory', 'read_write', 'kinesthetic'] as ModalityKey[]).every(
    (m) => representedModalities.has(m)
  );

  const toggleActivity = (actId: string) => {
    const exists = selectedConfigs.some((c) => c.activityId === actId);
    if (exists) {
      setSelectedConfigs((prev) =>
        prev.filter((c) => c.activityId !== actId).map((c, idx) => ({ ...c, order: idx + 1 }))
      );
    } else {
      const act = approvedBank.find((a) => a.id === actId);
      if (!act) return;
      setSelectedConfigs((prev) => [
        ...prev,
        {
          activityId: act.id,
          activity: act,
          order: prev.length + 1,
          scoringMethod: act.scoringMethod,
        },
      ]);
    }
  };

  const moveOrder = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= selectedConfigs.length) return;
    const copy = [...selectedConfigs];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    setSelectedConfigs(copy.map((c, i) => ({ ...c, order: i + 1 })));
  };

  const updateScoring = (actId: string, method: ScoringMethod) => {
    setSelectedConfigs((prev) =>
      prev.map((c) => (c.activityId === actId ? { ...c, scoringMethod: method } : c))
    );
  };

  const handleSave = (status: 'Draft' | 'Published') => {
    setError('');
    if (!name.trim()) {
      setError('Please enter an assessment name.');
      return;
    }
    if (selectedClassIds.length === 0) {
      setError('Please select at least one class.');
      return;
    }
    if (!allFourCovered) {
      setError('Please select at least one activity from all 4 modalities (Visual, Auditory, Read/Write, Kinesthetic).');
      return;
    }

    const newAsmt: Assessment = {
      id: `asmt-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || '4-modality learning discovery assessment',
      targetClassIds: selectedClassIds,
      targetClassNames: classes.filter((c) => selectedClassIds.includes(c.id)).map((c) => c.name),
      activities: selectedConfigs,
      status,
      publishedAt: status === 'Published' ? new Date().toISOString().slice(0, 10) : undefined,
      createdAt: new Date().toISOString().slice(0, 10),
      allowRetake: true,
      retakeCondition: 'Permitted once per term',
    };
    saveAssessment(newAsmt);
    setView('list');
    setName('');
    setDescription('');
    setSelectedConfigs([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#39245F]">Assessments</h1>
          <p className="text-sm text-[#64587A]">
            Build 4-modality assessments from approved Activity Bank items, configure per-activity scoring, and monitor completion.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${view === 'list' ? 'bg-[#7041C6] text-white' : 'bg-white border border-[#E2D6F8]'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setView('create')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold ${view === 'create' ? 'bg-[#7041C6] text-white' : 'bg-white border border-[#E2D6F8]'}`}
          >
            <Plus className="w-4 h-4" /> Create Assessment
          </button>
          <button
            onClick={() => setView('monitor')}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${view === 'monitor' ? 'bg-[#7041C6] text-white' : 'bg-white border border-[#E2D6F8]'}`}
          >
            Completion Monitor
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assessments.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl p-5 border border-[#E2D6F8] space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      a.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {a.status}
                  </span>
                  <h3 className="text-lg font-extrabold text-[#39245F] mt-2">{a.name}</h3>
                  <p className="text-xs text-[#64587A]">{a.description}</p>
                </div>
              </div>
              <div className="text-xs text-[#64587A]">
                Classes: <strong>{a.targetClassNames.join(', ')}</strong> • {a.activities.length} Activities
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setPreviewAsmt(a)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F3EEFC] text-[#7041C6] text-xs font-bold"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                {a.status === 'Draft' ? (
                  <button
                    onClick={() => publishAssessment(a.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#7041C6] text-white text-xs font-bold"
                  >
                    <Send className="w-3.5 h-3.5" /> Publish
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {view === 'create' ? (
        <div className="bg-white rounded-2xl p-6 border border-[#E2D6F8] space-y-5">
          <h2 className="text-lg font-extrabold text-[#39245F]">Create Assessment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder="Assessment Name (e.g., Class 5 — Term 2 Check)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="p-3 rounded-xl border border-[#E2D6F8] text-sm"
            />
            <input
              placeholder="Short description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="p-3 rounded-xl border border-[#E2D6F8] text-sm"
            />
          </div>

          <div>
            <p className="text-sm font-bold text-[#39245F] mb-2">Select Classes</p>
            <div className="flex flex-wrap gap-2">
              {classes.map((c) => {
                const active = selectedClassIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() =>
                      setSelectedClassIds((prev) =>
                        active ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                      )
                    }
                    className={`px-3.5 py-1.5 rounded-xl text-sm font-bold border ${
                      active ? 'bg-[#7041C6] text-white border-[#7041C6]' : 'bg-white border-[#E2D6F8]'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-[#39245F]">
                Select Approved Activities (Must cover all 4 modalities)
              </p>
              <div className="flex gap-1.5">
                {(['visual', 'auditory', 'read_write', 'kinesthetic'] as ModalityKey[]).map((m) => (
                  <span
                    key={m}
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      representedModalities.has(m)
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {MODALITY_META[m].technicalName} {representedModalities.has(m) ? '✓' : '•'}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
              {approvedBank.map((act) => {
                const picked = selectedConfigs.some((c) => c.activityId === act.id);
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => toggleActivity(act.id)}
                    className={`p-3 rounded-xl border text-left text-sm flex justify-between items-center ${
                      picked ? 'bg-[#F3EEFC] border-[#7041C6]' : 'bg-white border-[#E2D6F8]'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-[#24163D]">{act.name}</div>
                      <div className="text-xs text-[#64587A]">
                        {MODALITY_META[act.modality].technicalName} • {act.gameType}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#7041C6]">{picked ? 'Added ✓' : '+ Add'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedConfigs.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-bold text-[#39245F]">Arrange Order & Scoring Method</p>
              {selectedConfigs.map((cfg, idx) => (
                <div
                  key={cfg.activityId}
                  className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#FAF8FF] border border-[#E2D6F8] text-sm"
                >
                  <span className="font-bold">
                    {cfg.order}. {cfg.activity.name} ({MODALITY_META[cfg.activity.modality].technicalName})
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={cfg.scoringMethod}
                      onChange={(e) => updateScoring(cfg.activityId, e.target.value as ScoringMethod)}
                      className="px-2 py-1 rounded-lg border border-[#E2D6F8] text-xs"
                    >
                      <option value="correctness_only">Correctness Only</option>
                      <option value="time_and_correctness">Time + Correctness</option>
                    </select>
                    <button type="button" onClick={() => moveOrder(idx, -1)} className="p-1 rounded hover:bg-white">
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => moveOrder(idx, 1)} className="p-1 rounded hover:bg-white">
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {error ? <p className="text-sm font-bold text-rose-600">{error}</p> : null}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => handleSave('Draft')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#7041C6] text-[#7041C6] text-sm font-bold"
            >
              <Save className="w-4 h-4" /> Save Draft
            </button>
            <button
              type="button"
              onClick={() => handleSave('Published')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7041C6] text-white text-sm font-bold"
            >
              <Send className="w-4 h-4" /> Publish Assessment
            </button>
          </div>
        </div>
      ) : null}

      {view === 'monitor' ? (
        <>
        <div className="md:hidden space-y-3">
          {students.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl p-4 border border-[#E2D6F8] space-y-2">
              <div className="flex justify-between font-bold text-sm">
                <span>{s.name} ({s.className})</span>
                <span className="text-xs text-[#64587A]">{s.latestAssessmentResult ? 'Completed' : 'Pending'}</span>
              </div>
              {s.latestAssessmentResult ? (
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <div className="p-2 rounded-lg bg-[#FAF8FF]">Visual: <strong>{s.latestAssessmentResult.scores.visual}%</strong></div>
                  <div className="p-2 rounded-lg bg-[#FAF8FF]">Auditory: <strong>{s.latestAssessmentResult.scores.auditory}%</strong></div>
                  <div className="p-2 rounded-lg bg-[#FAF8FF]">Read/Write: <strong>{s.latestAssessmentResult.scores.read_write}%</strong></div>
                  <div className="p-2 rounded-lg bg-[#FAF8FF]">Kinesthetic: <strong>{s.latestAssessmentResult.scores.kinesthetic}%</strong></div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <div className="hidden md:block bg-white rounded-2xl border border-[#E2D6F8] overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FAF8FF] text-[#39245F] border-b border-[#E2D6F8]">
              <tr>
                <th className="p-4 font-bold">Student</th>
                <th className="p-4 font-bold">Class</th>
                <th className="p-4 font-bold">Latest Assessment</th>
                <th className="p-4 font-bold">Visual</th>
                <th className="p-4 font-bold">Auditory</th>
                <th className="p-4 font-bold">Read/Write</th>
                <th className="p-4 font-bold">Kinesthetic</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3EEFC]">
              {students.map((s) => (
                <tr key={s.id}>
                  <td className="p-4 font-bold">{s.name}</td>
                  <td className="p-4">{s.className}</td>
                  <td className="p-4 text-xs text-[#64587A]">
                    {s.latestAssessmentResult ? s.latestAssessmentResult.assessmentName : 'Pending'}
                  </td>
                  <td className="p-4 font-bold">{s.latestAssessmentResult ? `${s.latestAssessmentResult.scores.visual}%` : '—'}</td>
                  <td className="p-4 font-bold">{s.latestAssessmentResult ? `${s.latestAssessmentResult.scores.auditory}%` : '—'}</td>
                  <td className="p-4 font-bold">{s.latestAssessmentResult ? `${s.latestAssessmentResult.scores.read_write}%` : '—'}</td>
                  <td className="p-4 font-bold">{s.latestAssessmentResult ? `${s.latestAssessmentResult.scores.kinesthetic}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      ) : null}

      {previewAsmt ? (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-3">
            <h3 className="text-xl font-extrabold text-[#39245F]">{previewAsmt.name}</h3>
            <p className="text-sm text-[#64587A]">{previewAsmt.description}</p>
            <div className="space-y-2">
              {previewAsmt.activities.map((c) => (
                <div key={c.activityId} className="p-3 rounded-xl bg-[#FAF8FF] border border-[#E2D6F8] text-sm">
                  <strong>{c.order}. {c.activity.name}</strong> — {MODALITY_META[c.activity.modality].technicalName} ({c.scoringMethod})
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button onClick={() => setPreviewAsmt(null)} className="px-4 py-2 rounded-xl bg-[#7041C6] text-white font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
