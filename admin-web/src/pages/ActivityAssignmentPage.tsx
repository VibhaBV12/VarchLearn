import React, { useMemo, useState } from 'react';
import { RefreshCw, CheckCircle, AlertTriangle, Eye } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { computeDailyAllocation, MAX_DAILY_ACTIVITIES } from '../../../shared/utils/allocationEngine';
import { MODALITY_META } from '../../../shared/constants/theme';
import { ActivityItem, DailyPathNode, ModalityKey } from '../../../shared/types';

export const ActivityAssignmentPage: React.FC = () => {
  const { students, activityBank, studentPendingNodes, publishDailyAssignment } = useAdmin();
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || 'stu-aarav');
  const [customReplacements, setCustomReplacements] = useState<Record<number, ActivityItem>>({});
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [previewAct, setPreviewAct] = useState<ActivityItem | null>(null);
  const [approved, setApproved] = useState(false);
  const [publishedMsg, setPublishedMsg] = useState('');

  const student = students.find((s) => s.id === selectedStudentId) || students[0];
  const approvedBank = useMemo(
    () => activityBank.filter((a) => a.approvalStatus === 'Approved'),
    [activityBank]
  );

  const pendingCarryForward = studentPendingNodes[student.id] || [];

  const proposal = useMemo(
    () =>
      computeDailyAllocation({
        studentId: student.id,
        latestScores: student.latestAssessmentResult?.scores || null,
        pendingCarryForward,
        approvedBank,
        studentClassName: student.className,
      }),
    [student, pendingCarryForward, approvedBank]
  );

  const finalNewActivities = proposal.proposedNewActivities.map(
    (act, idx) => customReplacements[idx] || act
  );

  const handlePublish = () => {
    const today = new Date().toISOString().slice(0, 10);
    const newNodes: DailyPathNode[] = finalNewActivities.map((act, idx) => ({
      id: `pub-${Date.now()}-${idx}`,
      activityId: act.id,
      activity: act,
      assignedDate: today,
      isCarriedForward: false,
      status: idx === 0 && pendingCarryForward.length === 0 ? 'current' : 'available',
      orderIndex: pendingCarryForward.length + idx,
    }));
    const combined = [...pendingCarryForward, ...newNodes].slice(0, MAX_DAILY_ACTIVITIES);
    publishDailyAssignment(student.id, combined);
    setPublishedMsg(
      `Published ${combined.length} daily activities (${pendingCarryForward.length} carried forward + ${newNodes.length} new) to ${student.name}'s adventure path!`
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#39245F]">Daily Activity Assignment</h1>
          <p className="text-sm text-[#64587A]">
            Proposes personalized daily activities from Approved Bank items based on latest assessment & carry-forward limits (max 12/day).
          </p>
        </div>

        <select
          value={selectedStudentId}
          onChange={(e) => {
            setSelectedStudentId(e.target.value);
            setCustomReplacements({});
            setApproved(false);
            setPublishedMsg('');
          }}
          className="px-4 py-2.5 rounded-xl bg-white border border-[#E2D6F8] font-bold text-sm text-[#39245F]"
        >
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.className})
            </option>
          ))}
        </select>
      </div>

      {/* Latest Assessment & Weakest/Tied Modalities */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2D6F8] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold text-[#39245F]">
            Latest Assessment Snapshot — {student.name}
          </h2>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#F3EEFC] text-[#7041C6]">
            {proposal.weakestModalities.length > 1
              ? `Tied Weakest (${proposal.weakestModalities.length}): ${proposal.weakestModalities
                  .map((m) => MODALITY_META[m].technicalName)
                  .join(' & ')}`
              : proposal.weakestModalities.length === 1
              ? `Weakest: ${MODALITY_META[proposal.weakestModalities[0]].technicalName}`
              : 'No Assessment Yet (Balanced)'}
          </span>
        </div>

        {student.latestAssessmentResult ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['visual', 'auditory', 'read_write', 'kinesthetic'] as ModalityKey[]).map((m) => {
              const meta = MODALITY_META[m];
              const score = student.latestAssessmentResult!.scores[m];
              const spec = proposal.breakdownByModality[m];
              return (
                <div
                  key={m}
                  className={`p-4 rounded-xl border ${
                    spec.isWeakest ? 'bg-amber-50 border-amber-300' : 'bg-[#FAF8FF] border-[#E2D6F8]'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold" style={{ color: meta.color }}>
                      {meta.technicalName}
                    </span>
                    <span className="text-base font-extrabold text-[#24163D]">{score}%</span>
                  </div>
                  <p className="text-[11px] text-[#64587A] mt-1">
                    {spec.gamesCount} Games + {spec.questionSetsCount} Q-Set ({spec.questionsPerSet} Qs)
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[#64587A]">No completed assessment found for this student.</p>
        )}
      </div>

      {/* 12-Item Limit & Carry-Forward Summary */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2D6F8] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold text-[#39245F]">
            Daily Allocation Summary ({proposal.totalCount} / {proposal.maxLimit} Max Items)
          </h2>
          <span className="text-xs font-bold text-[#64587A]">
            Carried Forward: {pendingCarryForward.length} • New Proposed: {finalNewActivities.length}
          </span>
        </div>

        {proposal.wasTruncated && proposal.truncationReason ? (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>{proposal.truncationReason}</span>
          </div>
        ) : null}

        {pendingCarryForward.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-[#64587A]">
              Carried-Forward Pending Activities (Original Dates Preserved)
            </p>
            {pendingCarryForward.map((n) => (
              <div
                key={n.id}
                className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-sm"
              >
                <div>
                  <span className="font-bold text-[#24163D]">{n.activity.name}</span>
                  <span className="text-xs text-[#64587A] ml-2">
                    ({MODALITY_META[n.activity.modality].technicalName} • Assigned: {n.assignedDate})
                  </span>
                </div>
                <span className="text-xs font-bold text-amber-700">Carry-Forward</span>
              </div>
            ))}
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase text-[#64587A]">
            New Proposed Activities (From Approved Activity Bank)
          </p>
          {finalNewActivities.map((act, idx) => (
            <div
              key={`${act.id}-${idx}`}
              className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#FAF8FF] border border-[#E2D6F8] text-sm"
            >
              <div>
                <span className="font-bold text-[#24163D]">{act.name}</span>
                <span className="text-xs text-[#64587A] ml-2">
                  {MODALITY_META[act.modality].technicalName} •{' '}
                  {act.category === 'question_sets'
                    ? `Question Set (${proposal.breakdownByModality[act.modality].questionsPerSet} Qs)`
                    : act.gameType}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewAct(act)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#E2D6F8] text-xs font-bold text-[#7041C6]"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <button
                  onClick={() => setReplacingIndex(idx)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#E2D6F8] text-xs font-bold text-[#39245F]"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Replace
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            onClick={() => setApproved(true)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border ${
              approved
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                : 'border-[#7041C6] text-[#7041C6]'
            }`}
          >
            {approved ? 'Assignment Approved ✓' : 'Approve Assignment'}
          </button>
          <button
            disabled={!approved}
            onClick={handlePublish}
            className="px-5 py-2 rounded-xl bg-[#7041C6] text-white text-sm font-bold disabled:opacity-45"
          >
            Publish Assignment
          </button>
        </div>

        {publishedMsg ? (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm font-bold text-emerald-800">
            <CheckCircle className="w-4 h-4" /> {publishedMsg}
          </div>
        ) : null}
      </div>

      {/* Replace Activity Modal */}
      {replacingIndex !== null ? (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-3">
            <h3 className="text-lg font-extrabold text-[#39245F]">Choose Replacement Activity</h3>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {approvedBank.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setCustomReplacements((prev) => ({ ...prev, [replacingIndex]: a }));
                    setReplacingIndex(null);
                  }}
                  className="w-full text-left p-3 rounded-xl border border-[#E2D6F8] hover:bg-[#F3EEFC] text-sm"
                >
                  <div className="font-bold">{a.name}</div>
                  <div className="text-xs text-[#64587A]">
                    {MODALITY_META[a.modality].technicalName} • {a.gameType}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button onClick={() => setReplacingIndex(null)} className="px-4 py-2 rounded-xl border">
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Preview Activity Modal */}
      {previewAct ? (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-3">
            <h3 className="text-lg font-extrabold text-[#39245F]">{previewAct.name}</h3>
            <p className="text-xs font-bold text-[#7041C6]">{previewAct.gameType}</p>
            <p className="text-sm text-[#64587A]">{previewAct.customization.instructions}</p>
            <div className="flex justify-end">
              <button onClick={() => setPreviewAct(null)} className="px-4 py-2 rounded-xl bg-[#7041C6] text-white font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
