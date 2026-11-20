import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { ModalityBarChart } from '../components/Charts';

export const ClassAnalysisPage: React.FC = () => {
  const { classes, students } = useAdmin();
  const [classId, setClassId] = useState(classes[1]?.id || classes[0]?.id);
  const cls = classes.find((c) => c.id === classId) || classes[0];

  const classStudents = students.filter((s) => s.classId === cls.id);
  const completed = classStudents.filter((s) => s.latestAssessmentResult !== null);

  const avg = (key: 'visual' | 'auditory' | 'read_write' | 'kinesthetic') =>
    completed.length
      ? Math.round(
          completed.reduce((sum, s) => sum + s.latestAssessmentResult!.scores[key], 0) /
            completed.length
        )
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#39245F]">Class Analysis</h1>
          <p className="text-sm text-[#64587A]">
            Class-wise modality averages, completion rates, and assessment distribution.
          </p>
        </div>
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white border border-[#E2D6F8] font-bold text-sm"
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} (Section {c.section})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#E2D6F8]">
          <p className="text-xs text-[#64587A] font-semibold">Students in {cls.name}</p>
          <p className="text-2xl font-extrabold text-[#39245F]">{classStudents.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#E2D6F8]">
          <p className="text-xs text-[#64587A] font-semibold">Assessment Completion</p>
          <p className="text-2xl font-extrabold text-[#7041C6]">
            {completed.length}/{classStudents.length}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#E2D6F8]">
          <p className="text-xs text-[#64587A] font-semibold">Subjects</p>
          <p className="text-sm font-bold text-[#24163D] mt-1">{cls.subjects.join(', ')}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-[#E2D6F8]">
        <h2 className="text-lg font-extrabold text-[#39245F] mb-2">
          {cls.name} — Average Modality Profile
        </h2>
        <ModalityBarChart
          items={[
            { label: 'Visual', value: avg('visual'), color: '#F59E0B' },
            { label: 'Auditory', value: avg('auditory'), color: '#3B82F6' },
            { label: 'Read/Write', value: avg('read_write'), color: '#22C55E' },
            { label: 'Kinesthetic', value: avg('kinesthetic'), color: '#06B6D4' },
          ]}
        />
      </div>
    </div>
  );
};
