import React, { useState } from 'react';
import { Search, Plus, Check, X, Archive, Eye, Copy } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { ActivityItem, ModalityKey } from '../../../shared/types';
import { MODALITY_META } from '../../../shared/constants/theme';
import { ALL_CLASSES, ALL_SUBJECTS } from '../../../shared/constants/modalities';
import { VisualDiagramViewer } from '../components/VisualDiagramViewer';
import { AudioPlayerWeb } from '../components/AudioPlayerWeb';

export const ActivityBankPage: React.FC = () => {
  const { activityBank, setActivityApproval, addActivityToBank } = useAdmin();
  const [search, setSearch] = useState('');
  const [modalityFilter, setModalityFilter] = useState<'all' | ModalityKey>('all');
  const [statusFilter, setStatusFilter] = useState('All');
  const [previewItem, setPreviewItem] = useState<ActivityItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const [newForm, setNewForm] = useState({
    name: '',
    modality: 'visual' as ModalityKey,
    category: 'games_puzzles' as const,
    gameType: 'Diagram Detective',
    className: ALL_CLASSES[1],
    subject: ALL_SUBJECTS[0],
    chapter: 'Chapter 1',
    topic: '',
    difficulty: 'Medium' as const,
  });

  const filtered = activityBank.filter((a) => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.topic.toLowerCase().includes(search.toLowerCase());
    const matchMod = modalityFilter === 'all' || a.modality === modalityFilter;
    const matchStatus = statusFilter === 'All' || a.approvalStatus === statusFilter;
    return matchSearch && matchMod && matchStatus;
  });

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.name.trim()) return;
    addActivityToBank({
      id: `act-man-${Date.now()}`,
      name: newForm.name,
      modality: newForm.modality,
      category: newForm.category,
      gameType: newForm.gameType,
      className: newForm.className,
      subject: newForm.subject,
      chapter: newForm.chapter,
      topic: newForm.topic || newForm.name,
      originalDifficulty: newForm.difficulty,
      difficulty: newForm.difficulty,
      targetAbility: `${MODALITY_META[newForm.modality].technicalName} skill`,
      scoringMethod: 'correctness_only',
      approvalStatus: 'Approved',
      aiGenerated: false,
      estimatedMinutes: 5,
      starReward: 12,
      createdAt: new Date().toISOString().slice(0, 10),
      customization: {
        gameTheme: `${newForm.topic || newForm.name} Theme`,
        backgroundStyle: 'VarchLearn Lavender Canvas',
        objects: ['Interactive Cards'],
        visualsDescription: 'Manual Admin-created activity',
        mission: `Complete ${newForm.name}!`,
        instructions: 'Follow the on-screen steps carefully.',
        vocabulary: [newForm.subject],
        scenario: 'Created manually by Admin.',
        rewardSteps: ['Complete activity', 'Earn 12 Stars'],
        progressStages: ['Start', 'Done'],
      },
    });
    setShowAdd(false);
  };

  const handleReuse = (item: ActivityItem) => {
    addActivityToBank({
      ...item,
      id: `act-copy-${Date.now()}`,
      name: `${item.name} (Copy)`,
      createdAt: new Date().toISOString().slice(0, 10),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#39245F]">Activity Bank</h1>
          <p className="text-sm text-[#64587A]">
            Only Approved activities are available for Assessments and Daily Activity Assignments.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7041C6] text-white text-sm font-bold"
        >
          <Plus className="w-4 h-4" /> Add Manually
        </button>
      </div>

      {/* Modality Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'visual', 'auditory', 'read_write', 'kinesthetic'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setModalityFilter(m)}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${modalityFilter === m
                ? 'bg-[#7041C6] text-white'
                : 'bg-white border border-[#E2D6F8] text-[#39245F]'
              }`}
          >
            {m === 'all' ? 'All Modalities' : MODALITY_META[m].technicalName}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-2xl border border-[#E2D6F8]">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#8F84A6]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activity name or topic..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E2D6F8] text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-[#E2D6F8] text-sm"
        >
          <option value="All">All Approval Statuses</option>
          <option value="Approved">Approved</option>
          <option value="Pending Review">Pending Review</option>
          <option value="Rejected">Rejected</option>
          <option value="Archived">Archived</option>
        </select>
      </div>

      <div className="md:hidden space-y-3">
        {filtered.map((item) => {
          const meta = MODALITY_META[item.modality];
          return (
            <div key={item.id} className="bg-white rounded-2xl p-4 border border-[#E2D6F8] space-y-2.5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-extrabold text-[#24163D] text-sm">{item.name}</div>
                  <div className="text-xs text-[#64587A]">{item.className} • {item.subject} • {item.difficulty}</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0" style={{ backgroundColor: meta.bgColor, color: meta.color }}>
                  {meta.technicalName}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64587A]">{item.gameType}</span>
                <span className={`px-2 py-0.5 rounded-full font-bold ${item.approvalStatus === 'Approved' ? 'bg-emerald-100 text-emerald-700' : item.approvalStatus === 'Pending Review' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>
                  {item.approvalStatus}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button onClick={() => setPreviewItem(item)} className="flex-1 min-h-[40px] px-3 py-1.5 rounded-xl bg-[#F3EEFC] text-[#7041C6] text-xs font-bold">Preview</button>
                {item.approvalStatus !== 'Approved' ? (
                  <button onClick={() => setActivityApproval(item.id, 'Approved')} className="min-h-[40px] px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold">Approve</button>
                ) : null}
                <button onClick={() => handleReuse(item)} className="min-h-[40px] px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold">Reuse</button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="hidden md:block bg-white rounded-2xl border border-[#E2D6F8] overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#FAF8FF] text-[#39245F] border-b border-[#E2D6F8]">
            <tr>
              <th className="p-4 font-bold">Activity Name</th>
              <th className="p-4 font-bold">Modality / Category</th>
              <th className="p-4 font-bold">Class & Subject</th>
              <th className="p-4 font-bold">Difficulty</th>
              <th className="p-4 font-bold">Status</th>
              <th className="p-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3EEFC]">
            {filtered.map((item) => {
              const meta = MODALITY_META[item.modality];
              return (
                <tr key={item.id} className="hover:bg-[#FAF8FF]">
                  <td className="p-4">
                    <div className="font-bold text-[#24163D]">{item.name}</div>
                    <div className="text-xs text-[#64587A]">
                      {item.gameType} • {item.textbookSource || 'Manual / Built-in'}
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{ backgroundColor: meta.bgColor, color: meta.color }}
                    >
                      {meta.technicalName}
                    </span>
                    <div className="text-xs text-[#64587A] mt-1">
                      {item.category === 'question_sets' ? 'Question Set' : 'Games & Puzzles'}
                    </div>
                  </td>
                  <td className="p-4 text-xs">
                    <div className="font-bold">{item.className} • {item.subject}</div>
                    <div className="text-[#64587A]">{item.topic}</div>
                  </td>
                  <td className="p-4 font-semibold">{item.difficulty}</td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${item.approvalStatus === 'Approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : item.approvalStatus === 'Pending Review'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                    >
                      {item.approvalStatus}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => setPreviewItem(item)}
                      className="p-1.5 rounded-lg hover:bg-[#F3EEFC] text-[#7041C6]"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {item.approvalStatus !== 'Approved' ? (
                      <button
                        onClick={() => setActivityApproval(item.id, 'Approved')}
                        className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600"
                        title="Approve"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    ) : null}
                    <button
                      onClick={() => setActivityApproval(item.id, 'Rejected')}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"
                      title="Reject"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setActivityApproval(item.id, 'Archived')}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                      title="Archive"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReuse(item)}
                      className="p-1.5 rounded-lg hover:bg-[#F3EEFC] text-blue-600"
                      title="Reuse / Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Preview Modal */}
      {previewItem ? (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2D6F8] pb-3">
              <div>
                <h3 className="text-xl font-extrabold text-[#39245F]">{previewItem.name}</h3>
                <p className="text-xs font-bold text-[#7041C6]">
                  {MODALITY_META[previewItem.modality].technicalName} • {previewItem.gameType} • {previewItem.scoringMethod}
                </p>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual preview */}
            {previewItem.modality === 'visual' && (
              <VisualDiagramViewer
                data={
                  previewItem.customization.learningExperience && 'nodes' in previewItem.customization.learningExperience
                    ? (previewItem.customization.learningExperience as any)
                    : null
                }
                title={
                  previewItem.customization.learningInput?.diagramTitle ||
                  previewItem.customization.activitySpec?.title ||
                  `${previewItem.topic} Visual Diagram`
                }
                description={
                  previewItem.customization.visualsDescription ||
                  previewItem.customization.activitySpec?.description ||
                  `Interactive diagram for ${previewItem.topic}.`
                }
                nodes={
                  (previewItem.customization.learningExperience as any)?.nodes ||
                  previewItem.customization.learningInput?.diagramParts ||
                  previewItem.customization.activitySpec?.interactionData?.availableElements?.map((el, i) => ({
                    id: el.id,
                    label: el.label,
                    role: 'Interactive Component',
                    description: el.description || 'Visual component',
                    x: 22 + (i % 2) * 56,
                    y: 22 + Math.floor(i / 2) * 48,
                  }))
                }
                connections={
                  (previewItem.customization.learningExperience as any)?.connections
                }
                instructions={previewItem.customization.instructions}
              />
            )}

            {/* Auditory preview */}
            {previewItem.modality === 'auditory' && (
              <AudioPlayerWeb
                data={
                  previewItem.customization.learningExperience && 'narrationScript' in previewItem.customization.learningExperience
                    ? (previewItem.customization.learningExperience as any)
                    : null
                }
                audioTitle={previewItem.name}
                narrationScript={
                  (previewItem.customization.learningExperience as any)?.narrationScript ||
                  previewItem.customization.learningInput?.audioTranscript ||
                  previewItem.customization.scenario
                }
                segments={
                  (previewItem.customization.learningExperience as any)?.segments ||
                  previewItem.customization.learningInput?.audioSegments
                }
              />
            )}

            <div className="bg-[#FAF8FF] p-4 rounded-xl border border-[#E2D6F8] text-sm space-y-1.5">
              <p><strong>Theme:</strong> {previewItem.customization.gameTheme}</p>
              <p><strong>Mission:</strong> {previewItem.customization.mission}</p>
              <p><strong>Instructions:</strong> {previewItem.customization.instructions}</p>
              <p><strong>Vocabulary:</strong> {previewItem.customization.vocabulary.join(', ')}</p>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setPreviewItem(null)} className="px-5 py-2 rounded-xl bg-[#7041C6] text-white font-bold text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Add Manual Modal */}
      {showAdd ? (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddManual} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-3">
            <h3 className="text-lg font-extrabold text-[#39245F]">Add Activity Manually</h3>
            <input
              required
              placeholder="Activity Name"
              value={newForm.name}
              onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-[#E2D6F8]"
            />
            <select
              value={newForm.modality}
              onChange={(e) => setNewForm({ ...newForm, modality: e.target.value as ModalityKey })}
              className="w-full p-2.5 rounded-xl border border-[#E2D6F8]"
            >
              <option value="visual">Visual</option>
              <option value="auditory">Auditory</option>
              <option value="read_write">Read/Write</option>
              <option value="kinesthetic">Kinesthetic</option>
            </select>
            <input
              placeholder="Topic"
              value={newForm.topic}
              onChange={(e) => setNewForm({ ...newForm, topic: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-[#E2D6F8]"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl border">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-[#7041C6] text-white font-bold">
                Add to Bank
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
};
