import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { ComparisonRowChart } from '../components/Charts';

export const ProgressAnalysisPage: React.FC = () => {
  const { students } = useAdmin();
  const studentsWithHistory = students.filter((s) => s.assessmentHistory.length >= 2);
  const [selectedId, setSelectedId] = useState(
    studentsWithHistory[0]?.id || students[0]?.id || 'stu-aarav'
  );

  const student = students.find((s) => s.id === selectedId) || students[0];
  const prev = student.assessmentHistory[0];
  const latest = student.assessmentHistory[student.assessmentHistory.length - 1];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#39245F]">Progress Analysis</h1>
          <p className="text-sm text-[#64587A]">
            Compare previous vs. latest assessment results across modalities (daily activity performance is never combined here).
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

      <div className="bg-white rounded-2xl p-6 border border-[#E2D6F8] space-y-5">
        {prev && latest && prev.id !== latest.id ? (
          <>
            <div className="text-sm text-[#64587A]">
              Comparing <strong>{prev.assessmentName}</strong> ({prev.completedAt}) →{' '}
              <strong>{latest.assessmentName}</strong> ({latest.completedAt})
            </div>
            <div className="space-y-4">
              <ComparisonRowChart label="Visual" previous={prev.scores.visual} latest={latest.scores.visual} color="#F59E0B" />
              <ComparisonRowChart label="Auditory" previous={prev.scores.auditory} latest={latest.scores.auditory} color="#3B82F6" />
              <ComparisonRowChart label="Read/Write" previous={prev.scores.read_write} latest={latest.scores.read_write} color="#22C55E" />
              <ComparisonRowChart label="Kinesthetic" previous={prev.scores.kinesthetic} latest={latest.scores.kinesthetic} color="#06B6D4" />
            </div>
          </>
        ) : (
          <p className="text-sm text-[#64587A]">
            {student.name} has {student.assessmentHistory.length} completed assessment(s). Complete a second assessment to view historical modality deltas. (Try selecting Aarav!)
          </p>
        )}
      </div>
    </div>
  );
};
