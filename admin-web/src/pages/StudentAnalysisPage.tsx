import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { ModalityBarChart } from '../components/Charts';
import { MODALITY_META } from '../../../shared/constants/theme';
import { ModalityKey } from '../../../shared/types';

export const StudentAnalysisPage: React.FC = () => {
  const { students } = useAdmin();
  const [selectedId, setSelectedId] = useState(students[0]?.id || 'stu-aarav');
  const student = students.find((s) => s.id === selectedId) || students[0];

  const scores = student.latestAssessmentResult?.scores;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#39245F]">Student Analysis</h1>
          <p className="text-sm text-[#64587A]">
            Assessment modality percentages are strictly separated from daily activity completion.
          </p>
        </div>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white border border-[#E2D6F8] font-bold text-sm"
        >
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.className})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-[#E2D6F8] space-y-4">
          <h2 className="text-lg font-extrabold text-[#39245F]">
            {student.name}'s Latest Assessment Modality Profile
          </h2>
          {scores ? (
            <ModalityBarChart
              items={[
                { label: 'Visual', value: scores.visual, color: '#F59E0B' },
                { label: 'Auditory', value: scores.auditory, color: '#3B82F6' },
                { label: 'Read/Write', value: scores.read_write, color: '#22C55E' },
                { label: 'Kinesthetic', value: scores.kinesthetic, color: '#06B6D4' },
              ]}
            />
          ) : (
            <p className="text-sm text-[#64587A]">No completed assessment yet.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#E2D6F8] space-y-4">
          <h2 className="text-lg font-extrabold text-[#39245F]">
            Daily Activity Completion & Difficulty Progression
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3.5 rounded-xl bg-[#FAF8FF] border border-[#E2D6F8]">
              <p className="text-xs text-[#64587A]">Completed Daily Activities</p>
              <p className="text-xl font-extrabold text-[#39245F]">{student.completedActivitiesCount}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FAF8FF] border border-[#E2D6F8]">
              <p className="text-xs text-[#64587A]">Total Stars Earned</p>
              <p className="text-xl font-extrabold text-[#FFB800]">⭐ {student.stars}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-[#64587A]">Current Adapted Difficulty per Modality</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(['visual', 'auditory', 'read_write', 'kinesthetic'] as ModalityKey[]).map((m) => (
                <div key={m} className="p-2.5 rounded-xl bg-[#F3EEFC] flex justify-between font-bold">
                  <span>{MODALITY_META[m].technicalName}</span>
                  <span className="text-[#7041C6]">{student.currentAdaptedDifficulty[m]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-[#E2D6F8] space-y-3">
        <h2 className="text-lg font-extrabold text-[#39245F]">Assessment History</h2>
        {student.assessmentHistory.length === 0 ? (
          <p className="text-sm text-[#64587A]">No historical assessments recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {student.assessmentHistory.map((h) => (
              <div key={h.id} className="p-3.5 rounded-xl bg-[#FAF8FF] border border-[#E2D6F8] flex flex-wrap justify-between text-sm">
                <div>
                  <strong>{h.assessmentName}</strong>
                  <span className="text-xs text-[#64587A] ml-2">({h.completedAt})</span>
                </div>
                <div className="text-xs font-bold text-[#39245F]">
                  Visual {h.scores.visual}% • Auditory {h.scores.auditory}% • Read/Write {h.scores.read_write}% • Kinesthetic {h.scores.kinesthetic}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
