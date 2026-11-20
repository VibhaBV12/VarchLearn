import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { AdminSettings, ScoringMethod } from '../../../shared/types';

type SettingsTab =
  | 'profile'
  | 'classes'
  | 'subjects'
  | 'activities'
  | 'assessments'
  | 'scoring'
  | 'ai'
  | 'general';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useAdmin();
  const [tab, setTab] = useState<SettingsTab>('assessments');
  const [draft, setDraft] = useState<AdminSettings>(settings);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSettings(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'profile', label: 'Admin Profile' },
    { id: 'classes', label: 'Class Settings' },
    { id: 'subjects', label: 'Subject Settings' },
    { id: 'activities', label: 'Activity Settings' },
    { id: 'assessments', label: 'Assessment Settings' },
    { id: 'scoring', label: 'Scoring Configuration' },
    { id: 'ai', label: 'AI Generation Settings' },
    { id: 'general', label: 'General Settings' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#39245F]">Settings</h1>
        <p className="text-sm text-[#64587A]">
          Configure result visibility, retake policies, scoring methods, daily limits, and AI simulation preferences.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold ${
              tab === t.id ? 'bg-[#7041C6] text-white' : 'bg-white border border-[#E2D6F8] text-[#39245F]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 border border-[#E2D6F8] space-y-4 max-w-2xl">
        {tab === 'profile' ? (
          <div className="space-y-3">
            <h2 className="font-extrabold text-[#39245F]">Admin Profile</h2>
            <input
              value={draft.adminProfile.name}
              onChange={(e) =>
                setDraft({ ...draft, adminProfile: { ...draft.adminProfile, name: e.target.value } })
              }
              className="w-full p-2.5 rounded-xl border border-[#E2D6F8] text-sm"
            />
            <input
              value={draft.adminProfile.email}
              onChange={(e) =>
                setDraft({ ...draft, adminProfile: { ...draft.adminProfile, email: e.target.value } })
              }
              className="w-full p-2.5 rounded-xl border border-[#E2D6F8] text-sm"
            />
          </div>
        ) : null}

        {tab === 'assessments' ? (
          <div className="space-y-3 text-sm">
            <h2 className="font-extrabold text-[#39245F]">Assessment Visibility & Policy Settings</h2>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.assessmentSettings.showResultsToStudents}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    assessmentSettings: {
                      ...draft.assessmentSettings,
                      showResultsToStudents: e.target.checked,
                    },
                  })
                }
              />
              Allow students to view latest assessment results
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.assessmentSettings.showModalityPercentages}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    assessmentSettings: {
                      ...draft.assessmentSettings,
                      showModalityPercentages: e.target.checked,
                    },
                  })
                }
              />
              Show modality percentages (0–100%) to students
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.assessmentSettings.allowRetakes}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    assessmentSettings: {
                      ...draft.assessmentSettings,
                      allowRetakes: e.target.checked,
                    },
                  })
                }
              />
              Allow assessment retakes
            </label>
            <div>
              <label className="text-xs font-bold text-[#64587A]">Publishing Frequency</label>
              <select
                value={draft.assessmentSettings.publishingFrequency}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    assessmentSettings: {
                      ...draft.assessmentSettings,
                      publishingFrequency: e.target.value as any,
                    },
                  })
                }
                className="w-full mt-1 p-2.5 rounded-xl border border-[#E2D6F8]"
              >
                <option>Monthly</option>
                <option>Quarterly</option>
                <option>Term-wise</option>
                <option>On-demand</option>
              </select>
            </div>
          </div>
        ) : null}

        {tab === 'scoring' ? (
          <div className="space-y-3 text-sm">
            <h2 className="font-extrabold text-[#39245F]">Scoring Configuration</h2>
            <select
              value={draft.scoringConfig.defaultScoringMethod}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  scoringConfig: {
                    ...draft.scoringConfig,
                    defaultScoringMethod: e.target.value as ScoringMethod,
                  },
                })
              }
              className="w-full p-2.5 rounded-xl border border-[#E2D6F8]"
            >
              <option value="correctness_only">Method 2: Correctness Only</option>
              <option value="time_and_correctness">Method 1: Time + Correctness (No fixed limit)</option>
            </select>
            <p className="text-xs text-[#64587A]">
              Faster completion never compensates for poor accuracy. Per-activity overrides remain enabled in Assessment creation.
            </p>
          </div>
        ) : null}

        {tab === 'activities' ? (
          <div className="space-y-3 text-sm">
            <h2 className="font-extrabold text-[#39245F]">Daily Activity Settings</h2>
            <p>Maximum Daily Activities: <strong>{draft.activitySettings.maxDailyActivities}</strong></p>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.activitySettings.enableCarryForward}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    activitySettings: { ...draft.activitySettings, enableCarryForward: e.target.checked },
                  })
                }
              />
              Enable incomplete activity carry-forward
            </label>
          </div>
        ) : null}

        {tab === 'ai' ? (
          <div className="space-y-3 text-sm">
            <h2 className="font-extrabold text-[#39245F]">AI Generation Settings</h2>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.aiSettings.requireAdminApprovalBeforeBank}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    aiSettings: {
                      ...draft.aiSettings,
                      requireAdminApprovalBeforeBank: e.target.checked,
                    },
                  })
                }
              />
              Require Admin approval before adding to Activity Bank
            </label>
          </div>
        ) : null}

        {(tab === 'classes' || tab === 'subjects' || tab === 'general') ? (
          <div className="space-y-3 text-sm">
            <h2 className="font-extrabold text-[#39245F] capitalize">{tab} Settings</h2>
            <input
              value={draft.generalSettings.academicYear}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  generalSettings: { ...draft.generalSettings, academicYear: e.target.value },
                })
              }
              className="w-full p-2.5 rounded-xl border border-[#E2D6F8]"
            />
          </div>
        ) : null}

        <div className="flex items-center justify-between pt-2">
          {saved ? <span className="text-sm font-bold text-emerald-600">Settings saved!</span> : <span />}
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-[#7041C6] text-white text-sm font-bold"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
