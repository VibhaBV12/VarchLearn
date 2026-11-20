import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Eye, Power } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { ClassGroup, Student } from '../../../shared/types';

export const ClassStudentManagementPage: React.FC = () => {
  const {
    classes,
    students,
    addClass,
    updateClass,
    addStudent,
    updateStudent,
    toggleStudentStatus,
    removeStudent,
  } = useAdmin();

  const [activeTab, setActiveTab] = useState<'classes' | 'students'>('classes');
  const [openedClass, setOpenedClass] = useState<ClassGroup | null>(null);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [classModal, setClassModal] = useState<{ open: boolean; editing?: ClassGroup }>({ open: false });
  const [classForm, setClassForm] = useState({ name: '', section: 'A', gradeLevel: 5 });

  const [studentModal, setStudentModal] = useState<{ open: boolean; editing?: Student }>({ open: false });
  const [stuForm, setStuForm] = useState({ name: '', username: '', classId: classes[0]?.id || 'cls-5', recoveryPin: '1234' });

  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Student | null>(null);

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.username.toLowerCase().includes(search.toLowerCase());
    const matchesClass = classFilter === 'All' || s.className === classFilter;
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    const matchesOpened = !openedClass || s.classId === openedClass.id;
    return matchesSearch && matchesClass && matchesStatus && matchesOpened;
  });

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name.trim()) return;
    if (classModal.editing) {
      updateClass({ ...classModal.editing, ...classForm });
    } else {
      addClass({
        ...classForm,
        studentCount: 0,
        subjects: ['Science', 'Mathematics', 'English', 'Social Studies'],
      });
    }
    setClassModal({ open: false });
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stuForm.name.trim() || !stuForm.username.trim()) return;
    const cls = classes.find((c) => c.id === stuForm.classId) || classes[0];
    if (studentModal.editing) {
      updateStudent({
        ...studentModal.editing,
        name: stuForm.name,
        username: stuForm.username,
        classId: cls.id,
        className: cls.name,
        recoveryPin: stuForm.recoveryPin,
      });
    } else {
      addStudent({
        name: stuForm.name,
        username: stuForm.username,
        classId: cls.id,
        className: cls.name,
        passwordHash: 'learn123',
        recoveryPin: stuForm.recoveryPin,
        avatarMascot: 'vee',
        status: 'Active',
        stars: 0,
        completedActivitiesCount: 0,
        badges: ['New Explorer'],
        latestAssessmentResult: null,
        assessmentHistory: [],
        currentAdaptedDifficulty: { visual: 'Easy', auditory: 'Easy', read_write: 'Easy', kinesthetic: 'Easy' },
        difficultyHistory: [],
      });
    }
    setStudentModal({ open: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#39245F]">Class & Student Management</h1>
          <p className="text-sm text-[#64587A]">
            Manage classes, student accounts, activation status, and assessment profiles.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('classes')}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${
              activeTab === 'classes' ? 'bg-[#7041C6] text-white' : 'bg-white border border-[#E2D6F8] text-[#39245F]'
            }`}
          >
            Classes ({classes.length})
          </button>
          <button
            onClick={() => {
              setOpenedClass(null);
              setActiveTab('students');
            }}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${
              activeTab === 'students' ? 'bg-[#7041C6] text-white' : 'bg-white border border-[#E2D6F8] text-[#39245F]'
            }`}
          >
            Students ({students.length})
          </button>
        </div>
      </div>

      {activeTab === 'classes' && !openedClass ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setClassForm({ name: '', section: 'A', gradeLevel: 5 });
                setClassModal({ open: true });
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7041C6] text-white text-sm font-bold"
            >
              <Plus className="w-4 h-4" /> Add Class
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {classes.map((cls) => {
              const count = students.filter((s) => s.classId === cls.id).length;
              return (
                <div key={cls.id} className="bg-white rounded-2xl p-5 border border-[#E2D6F8] space-y-3 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-extrabold text-[#39245F]">{cls.name}</h3>
                      <p className="text-xs text-[#64587A]">
                        Section {cls.section} • Grade {cls.gradeLevel}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setClassForm({ name: cls.name, section: cls.section, gradeLevel: cls.gradeLevel });
                        setClassModal({ open: true, editing: cls });
                      }}
                      className="p-2 rounded-lg hover:bg-[#F3EEFC] text-[#7041C6]"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-[#24163D]">{count} Enrolled Students</p>
                  <button
                    onClick={() => {
                      setOpenedClass(cls);
                      setActiveTab('students');
                    }}
                    className="w-full py-2 rounded-xl bg-[#F3EEFC] text-[#7041C6] text-sm font-bold hover:bg-[#E2D6F8]"
                  >
                    Open Class & View Students
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {openedClass ? (
            <div className="flex items-center justify-between bg-[#F3EEFC] p-3.5 rounded-xl border border-[#E2D6F8]">
              <span className="font-bold text-[#39245F]">
                Viewing Students in {openedClass.name} (Section {openedClass.section})
              </span>
              <button
                onClick={() => setOpenedClass(null)}
                className="text-xs font-bold text-[#7041C6] underline"
              >
                Show All Classes
              </button>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-[#E2D6F8]">
            <div className="flex flex-wrap gap-3 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-3 text-[#8F84A6]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by student name or username..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E2D6F8] text-sm"
                />
              </div>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#E2D6F8] text-sm"
              >
                <option value="All">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#E2D6F8] text-sm"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <button
              onClick={() => {
                setStuForm({ name: '', username: '', classId: classes[0]?.id || 'cls-5', recoveryPin: '1234' });
                setStudentModal({ open: true });
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7041C6] text-white text-sm font-bold"
            >
              <Plus className="w-4 h-4" /> Add Student
            </button>
          </div>

          <div className="md:hidden space-y-3">
            {filteredStudents.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl p-4 border border-[#E2D6F8] space-y-2.5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-extrabold text-[#24163D]">{s.name}</div>
                    <div className="text-xs text-[#64587A]">@{s.username} • {s.className}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${s.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                    {s.status}
                  </span>
                </div>
                <div className="text-xs text-[#64587A]">
                  Latest: {s.latestAssessmentResult ? s.latestAssessmentResult.assessmentName : 'Not completed yet'}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button onClick={() => setViewingStudent(s)} className="flex-1 min-h-[40px] px-3 py-1.5 rounded-xl bg-[#F3EEFC] text-[#7041C6] text-xs font-bold">Profile</button>
                  <button onClick={() => { setStuForm({ name: s.name, username: s.username, classId: s.classId, recoveryPin: s.recoveryPin }); setStudentModal({ open: true, editing: s }); }} className="min-h-[40px] px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold">Edit</button>
                  <button onClick={() => toggleStudentStatus(s.id)} className="min-h-[40px] px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold">{s.status === 'Active' ? 'Deactivate' : 'Activate'}</button>
                  <button onClick={() => setConfirmDelete(s)} className="min-h-[40px] px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold">Remove</button>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden md:block bg-white rounded-2xl border border-[#E2D6F8] overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF8FF] text-[#39245F] border-b border-[#E2D6F8]">
                <tr>
                  <th className="p-4 font-bold">Student</th>
                  <th className="p-4 font-bold">Username</th>
                  <th className="p-4 font-bold">Class</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Latest Assessment</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EEFC]">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-[#FAF8FF]">
                    <td className="p-4 font-bold text-[#24163D]">{s.name}</td>
                    <td className="p-4 text-[#64587A]">@{s.username}</td>
                    <td className="p-4">{s.className}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          s.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-[#64587A]">
                      {s.latestAssessmentResult ? s.latestAssessmentResult.assessmentName : 'Not completed yet'}
                    </td>
                    <td className="p-4 text-right space-x-1">
                      <button
                        onClick={() => setViewingStudent(s)}
                        className="p-2 rounded-lg hover:bg-[#F3EEFC] text-[#7041C6]"
                        title="View Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setStuForm({
                            name: s.name,
                            username: s.username,
                            classId: s.classId,
                            recoveryPin: s.recoveryPin,
                          });
                          setStudentModal({ open: true, editing: s });
                        }}
                        className="p-2 rounded-lg hover:bg-[#F3EEFC] text-blue-600"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleStudentStatus(s.id)}
                        className="p-2 rounded-lg hover:bg-[#F3EEFC] text-amber-600"
                        title="Activate / Deactivate"
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(s)}
                        className="p-2 rounded-lg hover:bg-rose-50 text-rose-600"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Class Add/Edit Modal */}
      {classModal.open ? (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveClass} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-extrabold text-[#39245F]">
              {classModal.editing ? 'Edit Class' : 'Add New Class'}
            </h3>
            <input
              required
              placeholder="Class Name (e.g., Class 7)"
              value={classForm.name}
              onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-[#E2D6F8]"
            />
            <input
              required
              placeholder="Section (e.g., A)"
              value={classForm.section}
              onChange={(e) => setClassForm({ ...classForm, section: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-[#E2D6F8]"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setClassModal({ open: false })} className="px-4 py-2 rounded-xl border">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-[#7041C6] text-white font-bold">
                Save Class
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Student Add/Edit Modal */}
      {studentModal.open ? (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveStudent} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-extrabold text-[#39245F]">
              {studentModal.editing ? 'Edit Student' : 'Add New Student'}
            </h3>
            <input
              required
              placeholder="Student Name"
              value={stuForm.name}
              onChange={(e) => setStuForm({ ...stuForm, name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-[#E2D6F8]"
            />
            <input
              required
              placeholder="Username"
              value={stuForm.username}
              onChange={(e) => setStuForm({ ...stuForm, username: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-[#E2D6F8]"
            />
            <select
              value={stuForm.classId}
              onChange={(e) => setStuForm({ ...stuForm, classId: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-[#E2D6F8]"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              required
              maxLength={4}
              placeholder="4-digit Recovery PIN"
              value={stuForm.recoveryPin}
              onChange={(e) => setStuForm({ ...stuForm, recoveryPin: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-[#E2D6F8]"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setStudentModal({ open: false })} className="px-4 py-2 rounded-xl border">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-[#7041C6] text-white font-bold">
                Save Student
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Student Profile Details Modal */}
      {viewingStudent ? (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4">
            <h3 className="text-xl font-extrabold text-[#39245F]">{viewingStudent.name}'s Profile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div><span className="text-[#64587A]">Username:</span> <strong>@{viewingStudent.username}</strong></div>
              <div><span className="text-[#64587A]">Class:</span> <strong>{viewingStudent.className}</strong></div>
              <div><span className="text-[#64587A]">Account Status:</span> <strong>{viewingStudent.status}</strong></div>
              <div><span className="text-[#64587A]">Registered:</span> <strong>{viewingStudent.registrationDate}</strong></div>
            </div>
            <div className="bg-[#FAF8FF] p-3.5 rounded-xl border border-[#E2D6F8] text-sm">
              <p className="font-bold text-[#39245F]">Latest Assessment</p>
              <p className="text-[#64587A]">
                {viewingStudent.latestAssessmentResult
                  ? `${viewingStudent.latestAssessmentResult.assessmentName} (${viewingStudent.latestAssessmentResult.completedAt})`
                  : 'No completed assessment yet'}
              </p>
              <p className="font-bold text-[#39245F] mt-2">
                Assessment History ({viewingStudent.assessmentHistory.length})
              </p>
              {viewingStudent.assessmentHistory.map((h) => (
                <div key={h.id} className="text-xs text-[#64587A] mt-1">
                  • {h.assessmentName} — {h.completedAt}
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button onClick={() => setViewingStudent(null)} className="px-4 py-2 rounded-xl bg-[#7041C6] text-white font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Remove Student Confirmation */}
      {confirmDelete ? (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-extrabold text-rose-600">Remove Student?</h3>
            <p className="text-sm text-[#64587A]">
              Are you sure you want to remove <strong>{confirmDelete.name}</strong> (@{confirmDelete.username})?
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-xl border">
                Cancel
              </button>
              <button
                onClick={() => {
                  removeStudent(confirmDelete.id);
                  setConfirmDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
