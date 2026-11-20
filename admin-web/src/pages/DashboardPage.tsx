import React from 'react';
import { Link } from 'react-router-dom';
import { Users, GraduationCap, ClipboardCheck, Library, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { ModalityBarChart } from '../components/Charts';

export const DashboardPage: React.FC = () => {
  const { classes, students, assessments, activityBank } = useAdmin();

  const activeStudents = students.filter((s) => s.status === 'Active').length;
  const publishedAssessments = assessments.filter((a) => a.status === 'Published').length;
  const pendingAi = activityBank.filter((a) => a.approvalStatus === 'Pending Review').length;
  const completedAssessmentsCount = students.filter((s) => s.latestAssessmentResult !== null).length;

  const avgScores = (() => {
    const withResults = students.filter((s) => s.latestAssessmentResult);
    if (!withResults.length) return { visual: 0, auditory: 0, read_write: 0, kinesthetic: 0 };
    const sum = withResults.reduce(
      (acc, s) => {
        const sc = s.latestAssessmentResult!.scores;
        return {
          visual: acc.visual + sc.visual,
          auditory: acc.auditory + sc.auditory,
          read_write: acc.read_write + sc.read_write,
          kinesthetic: acc.kinesthetic + sc.kinesthetic,
        };
      },
      { visual: 0, auditory: 0, read_write: 0, kinesthetic: 0 }
    );
    return {
      visual: Math.round(sum.visual / withResults.length),
      auditory: Math.round(sum.auditory / withResults.length),
      read_write: Math.round(sum.read_write / withResults.length),
      kinesthetic: Math.round(sum.kinesthetic / withResults.length),
    };
  })();

  const kpis = [
    { label: 'Total Classes', value: classes.length, icon: GraduationCap, bg: 'bg-blue-50 text-blue-600' },
    { label: 'Total Students', value: `${students.length} (${activeStudents} Active)`, icon: Users, bg: 'bg-emerald-50 text-emerald-600' },
    { label: 'Published Assessments', value: publishedAssessments, icon: ClipboardCheck, bg: 'bg-amber-50 text-amber-600' },
    { label: 'Activity Bank', value: activityBank.length, icon: Library, bg: 'bg-purple-50 text-[#7041C6]' },
    { label: 'AI Awaiting Approval', value: pendingAi, icon: Sparkles, bg: 'bg-rose-50 text-rose-600' },
    { label: 'Assessments Completed', value: `${completedAssessmentsCount}/${students.length}`, icon: CheckCircle2, bg: 'bg-cyan-50 text-cyan-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#39245F]">Dashboard Overview</h1>
          <p className="text-sm text-[#64587A]">
            Monitor classes, assessments, AI content approvals, and modality patterns.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/ai-generation"
            className="px-4 py-2 rounded-xl bg-[#7041C6] text-white text-sm font-bold hover:bg-[#532B9E]"
          >
            + Generate AI Activity
          </Link>
          <Link
            to="/activity-assignment"
            className="px-4 py-2 rounded-xl bg-white border border-[#E2D6F8] text-[#7041C6] text-sm font-bold hover:bg-[#F3EEFC]"
          >
            Assign Daily Path
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="bg-white rounded-2xl p-5 border border-[#E2D6F8] flex items-center gap-4 shadow-sm"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${k.bg}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#64587A]">{k.label}</p>
                <p className="text-xl font-extrabold text-[#24163D]">{k.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-[#E2D6F8] shadow-sm">
          <h2 className="text-lg font-bold text-[#39245F] mb-1">
            School-Wide Assessment Modality Averages
          </h2>
          <p className="text-xs text-[#64587A] mb-3">
            Computed strictly from completed assessments (never mixed with daily activities).
          </p>
          <ModalityBarChart
            items={[
              { label: 'Visual', value: avgScores.visual, color: '#F59E0B' },
              { label: 'Auditory', value: avgScores.auditory, color: '#3B82F6' },
              { label: 'Read/Write', value: avgScores.read_write, color: '#22C55E' },
              { label: 'Kinesthetic', value: avgScores.kinesthetic, color: '#06B6D4' },
            ]}
          />
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#E2D6F8] shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-[#39245F]">Recent Activity</h2>
          <div className="space-y-3">
            {[
              { title: 'New assessment published — Class 5 Term 2 Adventure Check', time: '2 hours ago', tag: 'Assessment' },
              { title: `${pendingAi} AI-generated activities awaiting Admin approval`, time: '3 hours ago', tag: 'AI Content' },
              { title: 'Aarav (Class 5) completed 2 carried-forward activities', time: '4 hours ago', tag: 'Daily Path' },
              { title: 'Class 6 Science — Parts of a Plant pack approved', time: 'Yesterday', tag: 'Activity Bank' },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF8FF] border border-[#E2D6F8]"
              >
                <div>
                  <p className="text-sm font-bold text-[#24163D]">{item.title}</p>
                  <p className="text-xs text-[#8F84A6]">{item.time}</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#F3EEFC] text-[#7041C6]">
                  {item.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
