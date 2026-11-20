import React, { useState } from 'react';
import {
  Upload,
  Sparkles,
  RefreshCw,
  CheckCircle,
  XCircle,
  FileText,
  Sliders,
  BookOpen,
  Volume2,
  Eye,
  PenTool,
  Move,
  ClipboardList,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import {
  aiContentService,
  ConceptMapData,
  ConceptExplanationData,
  AllModalitiesData,
  GeneratedAssessmentData,
} from '../services/aiContentService';
import {
  ActivityCategory,
  ActivityItem,
  ActivitySpecification,
  DifficultyLevel,
  ModalityKey,
  TextbookMock,
} from '../../../shared/types';
import { ALL_CLASSES, ALL_SUBJECTS } from '../../../shared/constants/modalities';
import { MODALITY_META } from '../../../shared/constants/theme';
import { VisualDiagramViewer } from '../components/VisualDiagramViewer';
import { AudioPlayerWeb } from '../components/AudioPlayerWeb';

export const TextbookAiGenerationPage: React.FC = () => {
  const { setActivityApproval, updateActivity, students, classes } = useAdmin();
  const [mode, setMode] = useState<'pdf' | 'topic'>('pdf');
  const [activeTab, setActiveTab] = useState<'concept' | 'modalities' | 'activities' | 'assessment'>('activities');

  // Shared inputs
  const [className, setClassName] = useState('Class 6');
  const [subject, setSubject] = useState('Science');
  const [modality, setModality] = useState<ModalityKey>('visual');
  const [category, setCategory] = useState<ActivityCategory>('games_puzzles');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Medium');

  // PDF workflow state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfFileName, setPdfFileName] = useState('Class_6_Science_Living_World.pdf');
  const [extracting, setExtracting] = useState(false);
  const [extractedBook, setExtractedBook] = useState<TextbookMock | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');

  // Topic workflow state
  const [customTopic, setCustomTopic] = useState('Parts of a Plant');
  const [customSubtopic, setCustomSubtopic] = useState('Roots, Stem, Leaf & Flower');

  // AI Generation States
  const [extractingConcepts, setExtractingConcepts] = useState(false);
  const [conceptMap, setConceptMap] = useState<ConceptMapData | null>(null);
  const [conceptExplanation, setConceptExplanation] = useState<ConceptExplanationData | null>(null);

  const [generatingModalities, setGeneratingModalities] = useState(false);
  const [allModalities, setAllModalities] = useState<AllModalitiesData | null>(null);

  const [generating, setGenerating] = useState(false);
  const [generatedList, setGeneratedList] = useState<ActivityItem[]>([]);
  const [selectedActivityIdx, setSelectedActivityIdx] = useState(0);

  const [generatingAssessment, setGeneratingAssessment] = useState(false);
  const [generatedAssessment, setGeneratedAssessment] = useState<GeneratedAssessmentData | null>(null);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(['cls-5']);

  const [actionMsg, setActionMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [approving, setApproving] = useState(false);
  const [savingAssessment, setSavingAssessment] = useState(false);

  // Free-text teacher prompt & dedicated ActivitySpecification states
  const [teacherPrompt, setTeacherPrompt] = useState(
    'Create an interactive water-cycle activity in which students drag the stages of evaporation, condensation and precipitation into the correct order. Include visual representations and immediate feedback.'
  );
  const [generatingCustomSpec, setGeneratingCustomSpec] = useState(false);
  const [currentSpec, setCurrentSpec] = useState<ActivitySpecification | null>(null);
  const [editingInstructions, setEditingInstructions] = useState(false);
  const [editedInstructions, setEditedInstructions] = useState('');
  const [simulatedPlaced, setSimulatedPlaced] = useState<string[]>([]);

  const currentChapter = extractedBook?.chapters.find((c) => c.id === selectedChapterId);
  const currentTopic = currentChapter?.topics.find((t) => t.id === selectedTopicId);
  const activeTopicTitle = mode === 'pdf' && currentTopic ? currentTopic.title : customTopic;
  const activeChapterTitle =
    mode === 'pdf' && currentChapter
      ? `Chapter ${currentChapter.number}: ${currentChapter.title}`
      : 'Topic-Based Unit';

  // 1. PDF Upload & Text Extraction
  const handleSimulatePdf = async () => {
    setExtracting(true);
    setActionMsg('');
    setErrorMsg('');
    try {
      const book = await aiContentService.simulatePdfExtraction({
        file: pdfFile,
        fileName: pdfFileName,
        className,
        subject,
      });
      setExtractedBook(book);
      const firstCh = book.chapters[0];
      setSelectedChapterId(firstCh?.id || '');
      setSelectedTopicId(firstCh?.topics[0]?.id || '');
      setActionMsg(`Textbook "${book.fileName}" successfully parsed with ${book.chapters.length} chapters.`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to upload and extract textbook PDF.');
    } finally {
      setExtracting(false);
    }
  };

  // 2. Concept Extraction
  const handleExtractConceptMap = async () => {
    setExtractingConcepts(true);
    setActionMsg('');
    setErrorMsg('');
    try {
      const res = await aiContentService.extractConcepts({
        textbookId: mode === 'pdf' ? extractedBook?.id : undefined,
        className,
        subject,
        chapter: activeChapterTitle,
        topic: activeTopicTitle,
      });
      setConceptMap(res.conceptMap);

      // Also generate structured explanation
      const expRes = await aiContentService.generateConceptExplanation({
        className,
        subject,
        chapter: activeChapterTitle,
        topic: activeTopicTitle,
        conceptMap: res.conceptMap,
      });
      setConceptExplanation(expRes.explanation);
      setActiveTab('concept');
      setActionMsg(`Extracted grounded concept knowledge map for "${activeTopicTitle}" (${res.source}).`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to extract concepts.');
    } finally {
      setExtractingConcepts(false);
    }
  };

  // 3. Generate 4 Modalities
  const handleGenerateModalities = async () => {
    if (!conceptMap) {
      await handleExtractConceptMap();
    }
    setGeneratingModalities(true);
    setActionMsg('');
    setErrorMsg('');
    try {
      const currentMap = conceptMap || (await aiContentService.extractConcepts({
        textbookId: mode === 'pdf' ? extractedBook?.id : undefined,
        className,
        subject,
        chapter: activeChapterTitle,
        topic: activeTopicTitle,
      })).conceptMap;

      const res = await aiContentService.generateModalities({
        className,
        subject,
        chapter: activeChapterTitle,
        topic: activeTopicTitle,
        conceptMap: currentMap,
      });
      setAllModalities(res.modalities);
      setActiveTab('modalities');
      setActionMsg(`Synthesized all 4 modality representations for "${activeTopicTitle}".`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to generate multimodal content.');
    } finally {
      setGeneratingModalities(false);
    }
  };

  // 4. Generate Single Activity
  const handleGenerateSingleActivity = async () => {
    setGenerating(true);
    setActionMsg('');
    setErrorMsg('');
    try {
      if (mode === 'pdf' && !extractedBook) {
        throw new Error('Please upload and extract a textbook PDF first.');
      }
      const act = await aiContentService.simulateActivityGeneration({
        className,
        subject,
        chapter: activeChapterTitle,
        topic: activeTopicTitle,
        subtopic: mode === 'pdf' && currentTopic ? currentTopic.subtopics[0] : customSubtopic,
        modality,
        category,
        difficulty,
        textbookId: mode === 'pdf' ? extractedBook?.id : undefined,
        textbookSource: mode === 'pdf' ? extractedBook?.fileName || pdfFileName : undefined,
      });
      setGeneratedList((prev) => [act, ...prev]);
      setSelectedActivityIdx(0);
      setActiveTab('activities');
      setActionMsg(`Generated ${MODALITY_META[modality].studentName} activity: "${act.name}".`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to generate activity.');
    } finally {
      setGenerating(false);
    }
  };

  // 5. Batch Generate All 4 Modalities
  const handleGenerateBatchActivities = async () => {
    setGenerating(true);
    setActionMsg('');
    setErrorMsg('');
    try {
      if (mode === 'pdf' && !extractedBook) {
        throw new Error('Please upload and extract a textbook PDF first.');
      }
      const res = await aiContentService.generateBatchActivities({
        textbookId: mode === 'pdf' ? extractedBook?.id : undefined,
        className,
        subject,
        chapter: activeChapterTitle,
        topic: activeTopicTitle,
        subtopic: mode === 'pdf' && currentTopic ? currentTopic.subtopics[0] : customSubtopic,
        category,
        difficulty,
      });
      setGeneratedList(res.activities);
      setSelectedActivityIdx(0);
      setActiveTab('activities');
      setActionMsg(`Successfully generated 4-modality activity batch for "${activeTopicTitle}"!`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to generate batch activities.');
    } finally {
      setGenerating(false);
    }
  };

  // 5b. Generate from Teacher Free-Text Instruction (Dedicated Activity Engine)
  const handleGenerateCustomActivity = async () => {
    setGeneratingCustomSpec(true);
    setActionMsg('');
    setErrorMsg('');
    try {
      const res = await aiContentService.generateCustomActivity({
        className,
        subject,
        chapter: activeChapterTitle,
        topic: activeTopicTitle,
        difficulty,
        modality,
        teacherInstruction: teacherPrompt,
        textbookId: extractedBook?.id,
      });

      setCurrentSpec(res.specification);
      setEditedInstructions(res.specification.studentInstructions);
      setSimulatedPlaced([]);

      const activityFromSpec: ActivityItem = {
        id: res.specification.id,
        name: res.specification.title,
        modality: res.specification.modality,
        category: 'games_puzzles',
        gameType: res.specification.activityType,
        className,
        subject,
        chapter: activeChapterTitle,
        topic: activeTopicTitle,
        originalDifficulty: difficulty,
        difficulty,
        targetAbility: res.specification.learningObjective,
        scoringMethod: 'correctness_only',
        approvalStatus: 'Pending Review',
        aiGenerated: true,
        estimatedMinutes: res.specification.estimatedDurationMinutes,
        starReward: res.specification.starReward,
        createdAt: new Date().toISOString().slice(0, 10),
        customization: {
          gameTheme: `${activeTopicTitle} Studio`,
          backgroundStyle: 'VarchLearn Studio',
          objects: res.specification.interactionData.availableElements.map((e) => e.label),
          visualsDescription: res.specification.description,
          mission: res.specification.learningObjective,
          instructions: res.specification.studentInstructions,
          vocabulary: res.specification.interactionData.availableElements.map((e) => e.label),
          scenario: res.specification.description,
          rewardSteps: ['Complete Interactive Task', `Earn ${res.specification.starReward} Stars`],
          progressStages: ['Learn', 'Interact', 'Master'],
          activitySpec: res.specification,
        },
      };

      setGeneratedList((prev) => [activityFromSpec, ...prev]);
      setSelectedActivityIdx(0);
      setActiveTab('activities');
      setActionMsg(`Dedicated Activity Specification generated via ${res.source}. Renderer: ${res.specification.rendererType}`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to generate custom activity specification.');
    } finally {
      setGeneratingCustomSpec(false);
    }
  };

  const handleSaveCustomSpecification = async () => {
    if (!currentSpec) return;
    setApproving(true);
    setActionMsg('');
    setErrorMsg('');
    try {
      const toSave: ActivitySpecification = {
        ...currentSpec,
        studentInstructions: editingInstructions ? editedInstructions : currentSpec.studentInstructions,
      };
      const res = await aiContentService.saveCustomActivity({
        specification: toSave,
        chapter: activeChapterTitle,
        textbookId: extractedBook?.id,
        approvalStatus: 'Approved',
      });
      setActionMsg(`Activity "${res.activity.name}" approved and persisted to PostgreSQL!`);
      setGeneratedList((prev) =>
        prev.map((act) => (act.id === currentSpec.id ? { ...act, approvalStatus: 'Approved' } : act))
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to persist custom activity specification.');
    } finally {
      setApproving(false);
    }
  };

  // 6. Generate Assessment
  const handleGenerateAssessment = async () => {
    setGeneratingAssessment(true);
    setActionMsg('');
    setErrorMsg('');
    try {
      const currentMap = conceptMap || (await aiContentService.extractConcepts({
        textbookId: mode === 'pdf' ? extractedBook?.id : undefined,
        className,
        subject,
        chapter: activeChapterTitle,
        topic: activeTopicTitle,
      })).conceptMap;

      const res = await aiContentService.generateAssessment({
        className,
        subject,
        chapter: activeChapterTitle,
        topic: activeTopicTitle,
        conceptMap: currentMap,
        difficulty,
        questionCount: 8,
      });
      setGeneratedAssessment(res.assessment);
      setActiveTab('assessment');
      setActionMsg(`Generated 4-modality diagnostic assessment with ${res.assessment.questions.length} questions.`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to generate assessment.');
    } finally {
      setGeneratingAssessment(false);
    }
  };

  // 7. Approve Activity
  const handleApproveActivity = async (activity: ActivityItem) => {
    setApproving(true);
    setErrorMsg('');
    try {
      await updateActivity(activity);
      await setActivityApproval(activity.id, 'Approved');
      setActionMsg(`"${activity.name}" approved in database and published to Activity Bank!`);
      setGeneratedList((prev) => prev.filter((a) => a.id !== activity.id));
      if (selectedActivityIdx >= generatedList.length - 1) {
        setSelectedActivityIdx(Math.max(0, generatedList.length - 2));
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to approve activity.');
    } finally {
      setApproving(false);
    }
  };

  // 8. Save & Assign Assessment
  const handleSaveAssessment = async (publishNow: boolean) => {
    if (!generatedAssessment) return;
    setSavingAssessment(true);
    setErrorMsg('');
    try {
      const res = await aiContentService.saveGeneratedAssessment({
        assessment: generatedAssessment,
        classIds: selectedClassIds,
        publishNow,
      });
      setActionMsg(res.message);
      setGeneratedAssessment(null);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save assessment.');
    } finally {
      setSavingAssessment(false);
    }
  };

  const currentGenerated = generatedList[selectedActivityIdx] || null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#39245F]">
            AI Learning Content & Activity Generation Engine
          </h1>
          <p className="text-sm text-[#64587A]">
            Transform uploaded textbook text into grounded concepts, 4 multimodal representations, interactive activities, and diagnostic assessments.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('pdf')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              mode === 'pdf' ? 'bg-[#7041C6] text-white shadow-md' : 'bg-white border border-[#E2D6F8] text-[#39245F]'
            }`}
          >
            Textbook PDF Mode
          </button>
          <button
            onClick={() => setMode('topic')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              mode === 'topic' ? 'bg-[#7041C6] text-white shadow-md' : 'bg-white border border-[#E2D6F8] text-[#39245F]'
            }`}
          >
            Direct Topic Mode
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {errorMsg ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-rose-500 hover:text-rose-700">✕</button>
        </div>
      ) : null}
      {actionMsg ? (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" /> {actionMsg}
          </span>
          <button onClick={() => setActionMsg('')} className="text-emerald-500 hover:text-emerald-700">✕</button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Configuration & Pipeline Triggers */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-[#E2D6F8] space-y-4 shadow-sm">
            <h2 className="text-base font-extrabold text-[#39245F] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#7041C6]" /> 1. Source Context & Target Audience
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#39245F]">Grade / Class</label>
                <select
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl border border-[#E2D6F8] text-sm font-semibold"
                >
                  {ALL_CLASSES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[#39245F]">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl border border-[#E2D6F8] text-sm font-semibold"
                >
                  {ALL_SUBJECTS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {mode === 'pdf' ? (
              <div className="space-y-3 p-4 rounded-xl bg-[#FAF8FF] border border-[#E2D6F8]">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[#39245F]">
                    <Upload className="w-3.5 h-3.5 text-[#7041C6]" /> Choose Textbook PDF
                  </label>
                  <span className="text-[11px] text-[#64587A]">Text-based PDF</span>
                </div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setPdfFile(file);
                      setPdfFileName(file.name);
                    }
                  }}
                  className="text-xs w-full"
                />
                <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-[#E2D6F8] text-xs">
                  <span className="flex items-center gap-1.5 font-semibold text-[#39245F] truncate max-w-[180px]">
                    <FileText className="w-4 h-4 text-[#7041C6] flex-shrink-0" /> {pdfFileName}
                  </span>
                  <button
                    type="button"
                    onClick={handleSimulatePdf}
                    disabled={extracting}
                    className="px-3 py-1.5 rounded-lg bg-[#7041C6] text-white font-bold text-xs hover:bg-[#592ea6] disabled:opacity-50"
                  >
                    {extracting ? 'Extracting...' : 'Upload & Extract'}
                  </button>
                </div>

                {extractedBook ? (
                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-[#64587A]">Detected Chapter</label>
                      <select
                        value={selectedChapterId}
                        onChange={(e) => {
                          setSelectedChapterId(e.target.value);
                          const ch = extractedBook.chapters.find((c) => c.id === e.target.value);
                          setSelectedTopicId(ch?.topics[0]?.id || '');
                        }}
                        className="w-full mt-0.5 p-2 rounded-xl border border-[#E2D6F8] text-xs font-semibold bg-white"
                      >
                        {extractedBook.chapters.map((ch) => (
                          <option key={ch.id} value={ch.id}>
                            Chapter {ch.number}: {ch.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {currentChapter ? (
                      <div>
                        <label className="text-[11px] font-bold text-[#64587A]">Detected Topic Inside Chapter</label>
                        <select
                          value={selectedTopicId}
                          onChange={(e) => setSelectedTopicId(e.target.value)}
                          className="w-full mt-0.5 p-2 rounded-xl border border-[#E2D6F8] text-xs font-semibold bg-white"
                        >
                          {currentChapter.topics.map((t) => (
                            <option key={t.id} value={t.id}>
                              Topic: {t.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="space-y-3 p-4 rounded-xl bg-[#FAF8FF] border border-[#E2D6F8]">
                <div>
                  <label className="text-xs font-bold text-[#39245F]">Topic Title</label>
                  <input
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="e.g. Cellular Respiration, Reflection of Light, Fractions"
                    className="w-full mt-1 p-2 rounded-xl border border-[#E2D6F8] text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#39245F]">Subtopic (Optional)</label>
                  <input
                    value={customSubtopic}
                    onChange={(e) => setCustomSubtopic(e.target.value)}
                    placeholder="e.g. Glycolysis, Laws of Reflection"
                    className="w-full mt-1 p-2 rounded-xl border border-[#E2D6F8] text-sm font-semibold"
                  />
                </div>
              </div>
            )}

            {/* Concept Extraction Button */}
            <button
              onClick={handleExtractConceptMap}
              disabled={extractingConcepts || (mode === 'pdf' && !extractedBook)}
              className="w-full py-2.5 rounded-xl border-2 border-[#7041C6] text-[#7041C6] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#FAF8FF] transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-[#7041C6]" />
              {extractingConcepts ? 'Extracting Grounded Concepts...' : 'Extract & Organize Concept Knowledge Map'}
            </button>
          </div>

          {/* Activity & Assessment Generation Controls */}
          <div className="bg-white rounded-2xl p-5 border border-[#E2D6F8] space-y-4 shadow-sm">
            <h2 className="text-base font-extrabold text-[#39245F] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#7041C6]" /> 2. Content & Activity Generator
            </h2>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-bold text-[#39245F]">Modality</label>
                <select
                  value={modality}
                  onChange={(e) => setModality(e.target.value as ModalityKey)}
                  className="w-full mt-1 p-2 rounded-xl border border-[#E2D6F8] text-xs font-semibold"
                >
                  <option value="visual">Visual</option>
                  <option value="auditory">Auditory</option>
                  <option value="read_write">Read/Write</option>
                  <option value="kinesthetic">Kinesthetic</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[#39245F]">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ActivityCategory)}
                  className="w-full mt-1 p-2 rounded-xl border border-[#E2D6F8] text-xs font-semibold"
                >
                  <option value="games_puzzles">Interactive Games</option>
                  <option value="question_sets">Question Sets</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[#39245F]">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                  className="w-full mt-1 p-2 rounded-xl border border-[#E2D6F8] text-xs font-semibold"
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {/* Single Activity Generation */}
              <button
                type="button"
                onClick={handleGenerateSingleActivity}
                disabled={generating || (mode === 'pdf' && !extractedBook)}
                className="w-full py-2.5 rounded-xl bg-[#7041C6] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#582ea6] transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {generating ? 'Generating with Groq AI...' : `Generate Single ${MODALITY_META[modality].studentName} Activity`}
              </button>

              {/* Batch 4-Modality Generation */}
              <button
                type="button"
                onClick={handleGenerateBatchActivities}
                disabled={generating || (mode === 'pdf' && !extractedBook)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#7041C6] to-[#9333EA] text-white font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 transition-all disabled:opacity-50 shadow-sm"
              >
                <Layers className="w-4 h-4" />
                ⚡ Batch Generate All 4 Modalities (Visual, Auditory, R/W, Kinesthetic)
              </button>

              {/* Generate Assessment */}
              <button
                type="button"
                onClick={handleGenerateAssessment}
                disabled={generatingAssessment || (mode === 'pdf' && !extractedBook)}
                className="w-full py-2.5 rounded-xl border border-[#7041C6] bg-[#FAF8FF] text-[#7041C6] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#F3EEFC] transition-all disabled:opacity-50"
              >
                <ClipboardList className="w-4 h-4" />
                {generatingAssessment ? 'Generating Diagnostic Assessment...' : '📝 Generate 4-Modality Diagnostic Assessment'}
              </button>
            </div>

            {/* Free-Text Teacher Activity Prompt (Dedicated Multimodal Engine) */}
            <div className="pt-3 border-t border-[#E2D6F8] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-[#39245F] flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-[#7041C6]" /> Teacher's Natural Language Instruction
                </label>
                <span className="text-[10px] bg-purple-100 text-[#7041C6] font-bold px-2 py-0.5 rounded-full">
                  AI Dedicated Engine
                </span>
              </div>
              <textarea
                value={teacherPrompt}
                onChange={(e) => setTeacherPrompt(e.target.value)}
                rows={3}
                placeholder="Describe your desired learning activity in natural language (e.g. 'Create an interactive water-cycle activity in which students drag the stages of evaporation, condensation and precipitation into the correct order. Include visual representations and immediate feedback.')"
                className="w-full p-2.5 rounded-xl border border-[#E2D6F8] text-xs text-[#24163D] font-medium focus:outline-none focus:border-[#7041C6] bg-[#FAF8FF] resize-none"
              />
              <button
                type="button"
                onClick={handleGenerateCustomActivity}
                disabled={generatingCustomSpec || (mode === 'pdf' && !extractedBook)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 transition-all disabled:opacity-50 shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                {generatingCustomSpec
                  ? 'Interpreting & Building Specification...'
                  : '✨ Generate Activity from Instruction (Dedicated Engine)'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Multimodal & Generated Content Workspace */}
        <div className="lg:col-span-7 space-y-4">
          {/* Workspace Tabs */}
          <div className="flex border-b border-[#E2D6F8] bg-white rounded-t-2xl px-3 pt-2 gap-2 text-xs font-bold overflow-x-auto">
            <button
              onClick={() => setActiveTab('activities')}
              className={`pb-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-all ${
                activeTab === 'activities'
                  ? 'border-[#7041C6] text-[#7041C6]'
                  : 'border-transparent text-[#64587A] hover:text-[#39245F]'
              }`}
            >
              <Sparkles className="w-4 h-4" /> Generated Activities ({generatedList.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('modalities');
                if (!allModalities) handleGenerateModalities();
              }}
              className={`pb-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-all ${
                activeTab === 'modalities'
                  ? 'border-[#7041C6] text-[#7041C6]'
                  : 'border-transparent text-[#64587A] hover:text-[#39245F]'
              }`}
            >
              <Layers className="w-4 h-4" /> 4-Modality Perspectives
            </button>
            <button
              onClick={() => setActiveTab('concept')}
              className={`pb-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-all ${
                activeTab === 'concept'
                  ? 'border-[#7041C6] text-[#7041C6]'
                  : 'border-transparent text-[#64587A] hover:text-[#39245F]'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Concept Knowledge Map
            </button>
            <button
              onClick={() => setActiveTab('assessment')}
              className={`pb-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-all ${
                activeTab === 'assessment'
                  ? 'border-[#7041C6] text-[#7041C6]'
                  : 'border-transparent text-[#64587A] hover:text-[#39245F]'
              }`}
            >
              <ClipboardList className="w-4 h-4" /> Diagnostic Assessment
            </button>
          </div>

          {/* TAB 1: GENERATED ACTIVITIES WORKSPACE */}
          {activeTab === 'activities' && (
            <div className="bg-white rounded-b-2xl rounded-tr-2xl p-6 border border-[#E2D6F8] space-y-4 shadow-sm min-h-[460px]">
              {generatedList.length === 0 ? (
                <div className="h-80 flex flex-col items-center justify-center text-center text-sm text-[#8F84A6] bg-[#FAF8FF] rounded-xl border border-dashed border-[#E2D6F8] p-6 space-y-2">
                  <Sparkles className="w-8 h-8 text-[#7041C6] opacity-60" />
                  <p className="font-bold text-[#39245F]">No Generated Activities in Workspace</p>
                  <p className="max-w-md text-xs">
                    Choose a topic or textbook excerpt and click "Generate Activity" or "⚡ Batch Generate All 4 Modalities" to produce interactive learning content.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Activity Selector Carousel / Pill Row */}
                  {generatedList.length > 1 ? (
                    <div className="flex gap-2 pb-2 overflow-x-auto">
                      {generatedList.map((act, idx) => (
                        <button
                          key={act.id || idx}
                          onClick={() => setSelectedActivityIdx(idx)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                            selectedActivityIdx === idx
                              ? 'bg-[#7041C6] text-white shadow-sm'
                              : 'bg-[#FAF8FF] text-[#39245F] border border-[#E2D6F8]'
                          }`}
                        >
                          <span>{MODALITY_META[act.modality].studentName}</span>
                          <span className="opacity-75">({act.gameType})</span>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {currentGenerated ? (
                    <div className="space-y-4 text-sm">
                      {/* Editable Title & Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2D6F8] pb-3">
                        <input
                          value={currentGenerated.name}
                          onChange={(e) => {
                            const updated = { ...currentGenerated, name: e.target.value };
                            setGeneratedList((prev) =>
                              prev.map((a, i) => (i === selectedActivityIdx ? updated : a))
                            );
                          }}
                          className="font-extrabold text-[#39245F] text-base border-b border-transparent hover:border-[#E2D6F8] focus:border-[#7041C6] flex-1 mr-2 pb-0.5 outline-none"
                        />
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#F3EEFC] text-[#7041C6]">
                            {MODALITY_META[currentGenerated.modality].technicalName}
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {currentGenerated.difficulty}
                          </span>
                        </div>
                      </div>

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-[#FAF8FF] p-3.5 rounded-xl border border-[#E2D6F8] text-xs">
                        <p><strong>Game Type:</strong> {currentGenerated.gameType}</p>
                        <p><strong>Theme:</strong> {currentGenerated.customization.gameTheme}</p>
                        <p><strong>Reward:</strong> {currentGenerated.starReward} Stars</p>
                        <p><strong>Est. Time:</strong> {currentGenerated.estimatedMinutes} mins</p>
                        <p><strong>Ability:</strong> {currentGenerated.targetAbility}</p>
                        <p><strong>Status:</strong> {currentGenerated.approvalStatus}</p>
                      </div>

                      {/* Dedicated ActivitySpecification Card & Interactive Simulator */}
                      {currentGenerated.customization.activitySpec ? (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-[#FAF8FF] to-[#F3EEFC] border-2 border-[#7041C6] text-xs space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-[#E2D6F8]">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#7041C6] text-white">
                                SCHEMA V2.0.0
                              </span>
                              <span className="font-extrabold text-[#39245F]">
                                Renderer: {currentGenerated.customization.activitySpec.rendererType}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                setEditingInstructions(!editingInstructions);
                                if (!editedInstructions) {
                                  setEditedInstructions(currentGenerated.customization.activitySpec?.studentInstructions || '');
                                }
                              }}
                              className="text-[11px] font-bold text-[#7041C6] hover:underline"
                            >
                              {editingInstructions ? 'Done Editing' : '✏️ Edit Instructions'}
                            </button>
                          </div>

                          {editingInstructions ? (
                            <div className="space-y-1">
                              <label className="font-bold text-[#39245F]">Edit Student Instructions:</label>
                              <textarea
                                value={editedInstructions}
                                onChange={(e) => setEditedInstructions(e.target.value)}
                                rows={2}
                                className="w-full p-2 rounded-lg border border-[#E2D6F8] bg-white text-xs font-medium"
                              />
                            </div>
                          ) : (
                            <p className="text-[#39245F]">
                              <strong>Student Instructions:</strong> {editedInstructions || currentGenerated.customization.activitySpec.studentInstructions}
                            </p>
                          )}

                          <div className="p-2.5 rounded-lg bg-white border border-[#E2D6F8] space-y-1">
                            <p className="font-bold text-[#7041C6]">
                              Phase 1 Overview: {currentGenerated.customization.activitySpec.learningContent.overview}
                            </p>
                            <p className="text-[#64587A] italic">
                              💡 Key Takeaway: {currentGenerated.customization.activitySpec.learningContent.keyTakeaway}
                            </p>
                          </div>

                          {/* Live Interactive In-Admin Simulator */}
                          <div className="p-3 rounded-lg bg-white border border-[#7041C6]/30 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#39245F] flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-[#7041C6]" /> Live Simulator (Test Student Interaction):
                              </span>
                              <button
                                onClick={() => setSimulatedPlaced([])}
                                className="text-[10px] text-gray-500 hover:text-gray-800 underline"
                              >
                                Reset Simulator
                              </button>
                            </div>

                            {/* Sequential Slot Simulator */}
                            <div className="flex flex-wrap gap-1.5">
                              {currentGenerated.customization.activitySpec.interactionData.correctSolution.expectedSequence?.map((seqId: string, sIdx: number) => {
                                const placedId = simulatedPlaced[sIdx];
                                const placedElem = currentGenerated.customization.activitySpec?.interactionData.availableElements.find((e: any) => e.id === placedId);
                                const isCorrect = placedId === seqId;
                                return (
                                  <div
                                    key={sIdx}
                                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${
                                      placedId
                                        ? isCorrect
                                          ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                                          : 'bg-amber-50 border-amber-400 text-amber-800'
                                        : 'bg-gray-50 border-dashed border-gray-300 text-gray-400'
                                    }`}
                                  >
                                    <span>Step {sIdx + 1}:</span>
                                    <span>{placedElem ? placedElem.label : 'Empty Slot'}</span>
                                    {placedId && isCorrect ? '✓' : ''}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Elements Tray */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {currentGenerated.customization.activitySpec.interactionData.availableElements.map((el: any) => {
                                const isUsed = simulatedPlaced.includes(el.id);
                                return (
                                  <button
                                    key={el.id}
                                    disabled={isUsed}
                                    onClick={() => setSimulatedPlaced([...simulatedPlaced, el.id])}
                                    className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                                      isUsed
                                        ? 'opacity-40 bg-gray-100 border-gray-200'
                                        : 'bg-purple-50 border-purple-200 text-[#7041C6] hover:bg-purple-100'
                                    }`}
                                  >
                                    + {el.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] text-emerald-700 font-semibold">
                              Feedback on completion: "{currentGenerated.customization.activitySpec.feedback.correct}"
                            </span>
                          </div>
                        </div>
                      ) : null}

                      {/* Live Modality-Specific Interactive Preview */}
                      {currentGenerated.modality === 'visual' && (
                        <div className="space-y-1">
                          <VisualDiagramViewer
                            data={
                              currentGenerated.customization.learningExperience && 'nodes' in currentGenerated.customization.learningExperience
                                ? (currentGenerated.customization.learningExperience as any)
                                : null
                            }
                            title={
                              currentGenerated.customization.learningInput?.diagramTitle ||
                              currentGenerated.customization.activitySpec?.title ||
                              `${currentGenerated.topic} Interactive Diagram`
                            }
                            description={
                              currentGenerated.customization.visualsDescription ||
                              currentGenerated.customization.activitySpec?.description ||
                              `Interactive visual schematic illustrating ${currentGenerated.topic}.`
                            }
                            visualType={
                              (currentGenerated.customization.learningExperience as any)?.visualType ||
                              (currentGenerated.customization.activitySpec?.activityType === 'concept_map_completion'
                                ? 'concept_map'
                                : currentGenerated.customization.activitySpec?.activityType === 'flowchart_construction'
                                ? 'process_flow'
                                : 'annotated_diagram')
                            }
                            nodes={
                              (currentGenerated.customization.learningExperience as any)?.nodes ||
                              currentGenerated.customization.learningInput?.diagramParts ||
                              currentGenerated.customization.activitySpec?.interactionData?.availableElements?.map((el, i) => ({
                                id: el.id,
                                label: el.label,
                                role: 'Interactive Component',
                                description: el.description || 'Target element for visual learning.',
                                x: 22 + (i % 2) * 56,
                                y: 22 + Math.floor(i / 2) * 48,
                              }))
                            }
                            connections={
                              (currentGenerated.customization.learningExperience as any)?.connections ||
                              (currentGenerated.customization.activitySpec?.interactionData?.targetZones
                                ? currentGenerated.customization.activitySpec.interactionData.targetZones
                                    .filter((z) => z.expectedElementId)
                                    .map((z) => ({
                                      from: z.expectedElementId!,
                                      to: z.id,
                                      label: z.label,
                                      style: 'solid' as const,
                                    }))
                                : undefined)
                            }
                            instructions={
                              currentGenerated.customization.activitySpec?.studentInstructions ||
                              currentGenerated.customization.instructions ||
                              'Click and inspect each hotspot on the diagram.'
                            }
                            inspectionTasks={
                              (currentGenerated.customization.learningExperience as any)?.inspectionTasks
                            }
                            challenge={
                              (currentGenerated.customization.learningExperience as any)?.challenge
                            }
                          />
                        </div>
                      )}

                      {currentGenerated.modality === 'auditory' && (
                        <div className="space-y-1">
                          <AudioPlayerWeb
                            data={
                              currentGenerated.customization.learningExperience && 'narrationScript' in currentGenerated.customization.learningExperience
                                ? (currentGenerated.customization.learningExperience as any)
                                : null
                            }
                            audioTitle={currentGenerated.name}
                            narrationScript={
                              (currentGenerated.customization.learningExperience as any)?.narrationScript ||
                              currentGenerated.customization.learningInput?.audioTranscript ||
                              currentGenerated.customization.activitySpec?.learningContent?.overview ||
                              currentGenerated.customization.scenario
                            }
                            speakerInstructions={
                              (currentGenerated.customization.learningExperience as any)?.speakerInstructions
                            }
                            segments={
                              (currentGenerated.customization.learningExperience as any)?.segments ||
                              currentGenerated.customization.learningInput?.audioSegments ||
                              (currentGenerated.customization.activitySpec
                                ? [
                                    {
                                      index: 1,
                                      title: 'Overview & Principles',
                                      transcriptSnippet: currentGenerated.customization.activitySpec.learningContent.overview,
                                      keyListenFor: 'System fundamentals',
                                    },
                                    {
                                      index: 2,
                                      title: 'Key Takeaways & Instructions',
                                      transcriptSnippet: `${currentGenerated.customization.activitySpec.learningContent.keyTakeaway} ${currentGenerated.customization.activitySpec.studentInstructions}`,
                                      keyListenFor: 'Functional instructions',
                                    },
                                  ]
                                : undefined)
                            }
                          />
                        </div>
                      )}

                      {/* Modality-Specific Learning Experience & Input Preview */}
                      <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-xs space-y-2">
                        <p className="font-bold text-[#39245F] flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-[#7041C6]" /> Two-Phase Learning Experience:
                        </p>
                        {(() => {
                          const exp = currentGenerated.customization.learningExperience as any;
                          if (!exp) return null;
                          return (
                            <div className="bg-white p-2.5 rounded-lg border border-purple-100 space-y-1">
                              <span className="font-bold text-[#7041C6] uppercase text-[10px] tracking-wider">
                                Phase 1: {exp.visualType || exp.kinestheticType || (exp.segments ? 'Auditory Narration' : exp.passageTitle ? 'Structured Reading' : 'Concept Immersion')}
                              </span>
                              {exp.vocabularyNotes ? (
                                <p className="text-[#39245F]">
                                  <strong>Key Terms ({exp.vocabularyNotes.length}):</strong> {exp.vocabularyNotes.map((v: any) => v.term).join(' • ')}
                                </p>
                              ) : null}
                              {exp.processSteps ? (
                                <p className="text-[#39245F]">
                                  <strong>Sequence Stages ({exp.processSteps.length}):</strong> {exp.processSteps.map((s: any) => s.label).join(' → ')}
                                </p>
                              ) : null}
                              {exp.simulationVariables ? (
                                <p className="text-[#39245F]">
                                  <strong>Sim Variables ({exp.simulationVariables.length}):</strong> {exp.simulationVariables.map((v: any) => `${v.label} (opt: ${v.optimalValue})`).join(', ')}
                                </p>
                              ) : null}
                            </div>
                          );
                        })()}
                        {currentGenerated.customization.learningInput?.readingPassage ? (
                          <p className="text-[#39245F]">
                            Reading Passage: "{currentGenerated.customization.learningInput.readingPassage}"
                          </p>
                        ) : null}
                        {currentGenerated.customization.learningInput?.interactiveModelParts ? (
                          <p className="text-[#39245F]">
                            Interactive Movable Parts: {currentGenerated.customization.learningInput.interactiveModelParts.join(', ')}
                          </p>
                        ) : null}
                      </div>

                      {/* Questions Section */}
                      {currentGenerated.questions && currentGenerated.questions.length > 0 ? (
                        <div className="p-3.5 rounded-xl bg-[#FAF8FF] border border-[#E2D6F8] text-xs space-y-2 max-h-56 overflow-y-auto">
                          <p className="font-bold text-[#39245F]">Questions ({currentGenerated.questions.length}):</p>
                          {currentGenerated.questions.map((q, qi) => (
                            <div key={q.id || qi} className="bg-white p-3 rounded-xl border border-[#E2D6F8] space-y-1">
                              <p className="font-bold text-[#24163D]">{qi + 1}. {q.prompt}</p>
                              <div className="grid grid-cols-2 gap-1 text-[#64587A] pt-1">
                                {q.options.map((opt, oi) => (
                                  <span key={oi} className={oi === q.correctIndex ? 'font-bold text-emerald-600' : ''}>
                                    {String.fromCharCode(65 + oi)}. {opt} {oi === q.correctIndex ? '✓' : ''}
                                  </span>
                                ))}
                              </div>
                              {q.explanation ? (
                                <p className="text-[11px] text-[#7041C6] pt-1"><strong>Explanation:</strong> {q.explanation}</p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {/* Action Bar */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E2D6F8]">
                        {currentGenerated.customization.activitySpec ? (
                          <button
                            onClick={handleSaveCustomSpecification}
                            disabled={approving}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold hover:opacity-95 transition-all disabled:opacity-50 shadow-sm"
                          >
                            <CheckCircle className="w-4 h-4" /> {approving ? 'Persisting...' : 'Approve & Save Activity Specification'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApproveActivity(currentGenerated)}
                            disabled={approving}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-sm"
                          >
                            <CheckCircle className="w-4 h-4" /> {approving ? 'Approving...' : 'Approve & Save to Database'}
                          </button>
                        )}
                        <button
                          onClick={currentGenerated.customization.activitySpec ? handleGenerateCustomActivity : handleGenerateSingleActivity}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F3EEFC] text-[#7041C6] text-xs font-bold hover:bg-[#E9D5FF] transition-all"
                        >
                          <RefreshCw className="w-4 h-4" /> Regenerate Item
                        </button>
                        <button
                          onClick={() => {
                            setGeneratedList((prev) => prev.filter((_, i) => i !== selectedActivityIdx));
                            setSelectedActivityIdx(0);
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100 transition-all"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 4-MODALITY PERSPECTIVES */}
          {activeTab === 'modalities' && (
            <div className="bg-white rounded-b-2xl rounded-tr-2xl p-6 border border-[#E2D6F8] space-y-4 shadow-sm min-h-[460px]">
              {!allModalities ? (
                <div className="h-80 flex flex-col items-center justify-center text-center text-sm text-[#8F84A6] bg-[#FAF8FF] rounded-xl border border-dashed border-[#E2D6F8] p-6 space-y-2">
                  <Layers className="w-8 h-8 text-[#7041C6] opacity-60" />
                  <p className="font-bold text-[#39245F]">Multimodal Representations Not Yet Built</p>
                  <p className="max-w-md text-xs">
                    Click below to generate independent representations of "{activeTopicTitle}" across Visual, Auditory, Read/Write, and Kinesthetic modalities.
                  </p>
                  <button
                    onClick={handleGenerateModalities}
                    disabled={generatingModalities}
                    className="px-4 py-2 rounded-xl bg-[#7041C6] text-white font-bold text-xs"
                  >
                    {generatingModalities ? 'Synthesizing...' : 'Generate 4-Modality Perspectives'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-[#E2D6F8] pb-3">
                    <h3 className="font-extrabold text-[#39245F] text-sm">
                      4 Independent VARK Representations: {allModalities.topicTitle}
                    </h3>
                    <button
                      onClick={handleGenerateModalities}
                      disabled={generatingModalities}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF8FF] border border-[#E2D6F8] text-[#7041C6] font-bold text-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Visual Card */}
                    <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-3">
                      <div className="flex items-center gap-1.5 font-bold text-amber-800">
                        <Eye className="w-4 h-4 text-amber-600" /> Visual: {allModalities.visual.title}
                      </div>
                      <p className="text-[#64587A]">{allModalities.visual.description}</p>
                      <VisualDiagramViewer
                        title={allModalities.visual.title}
                        description={allModalities.visual.description}
                        visualType={(allModalities.visual.diagramType as any) || 'annotated_diagram'}
                        nodes={allModalities.visual.elements}
                        connections={allModalities.visual.connections}
                        instructions={allModalities.visual.svgSpecification?.instructions}
                      />
                    </div>

                    {/* Auditory Card */}
                    <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-3">
                      <div className="flex items-center gap-1.5 font-bold text-blue-800">
                        <Volume2 className="w-4 h-4 text-blue-600" /> Auditory: {allModalities.auditory.title}
                      </div>
                      <AudioPlayerWeb
                        audioTitle={allModalities.auditory.title}
                        narrationScript={allModalities.auditory.narrationScript}
                        speakerInstructions={allModalities.auditory.speakerInstructions}
                        segments={allModalities.auditory.audioSegments}
                      />
                    </div>

                    {/* Read/Write Card */}
                    <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-purple-800">
                        <PenTool className="w-4 h-4 text-purple-600" /> Read/Write: {allModalities.readWrite.title}
                      </div>
                      <p className="text-[#39245F]">"{allModalities.readWrite.readingPassage.slice(0, 160)}..."</p>
                      <p className="text-[#64587A]"><strong>Focus:</strong> {allModalities.readWrite.analysisFocus}</p>
                    </div>

                    {/* Kinesthetic Card */}
                    <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                        <Move className="w-4 h-4 text-emerald-600" /> Kinesthetic: {allModalities.kinesthetic.title}
                      </div>
                      <p className="text-[#64587A]">{allModalities.kinesthetic.scenario}</p>
                      <div className="space-y-1 pt-1">
                        <p className="font-semibold text-[#39245F]">Components ({allModalities.kinesthetic.interactiveComponents.length}):</p>
                        {allModalities.kinesthetic.interactiveComponents.map((c, i) => (
                          <p key={i} className="text-[#64587A] pl-2">• <strong>{c.name}</strong> ({c.description})</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CONCEPT KNOWLEDGE MAP */}
          {activeTab === 'concept' && (
            <div className="bg-white rounded-b-2xl rounded-tr-2xl p-6 border border-[#E2D6F8] space-y-4 shadow-sm min-h-[460px]">
              {!conceptMap ? (
                <div className="h-80 flex flex-col items-center justify-center text-center text-sm text-[#8F84A6] bg-[#FAF8FF] rounded-xl border border-dashed border-[#E2D6F8] p-6 space-y-2">
                  <BookOpen className="w-8 h-8 text-[#7041C6] opacity-60" />
                  <p className="font-bold text-[#39245F]">No Concept Map Extracted Yet</p>
                  <p className="max-w-md text-xs">
                    Click "Extract & Organize Concept Knowledge Map" on the left panel to analyze the textbook text.
                  </p>
                  <button
                    onClick={handleExtractConceptMap}
                    disabled={extractingConcepts}
                    className="px-4 py-2 rounded-xl bg-[#7041C6] text-white font-bold text-xs"
                  >
                    {extractingConcepts ? 'Extracting...' : 'Extract Concept Map'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="border-b border-[#E2D6F8] pb-3">
                    <h3 className="font-extrabold text-[#39245F] text-sm">
                      Concept Knowledge Base: {conceptMap.topicTitle} ({conceptMap.gradeLevel})
                    </h3>
                  </div>

                  {conceptExplanation ? (
                    <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-2">
                      <h4 className="font-bold text-[#39245F] text-xs">{conceptExplanation.title}</h4>
                      <p className="text-[#64587A] leading-relaxed">{conceptExplanation.summary}</p>
                      {conceptExplanation.sections.map((sec, i) => (
                        <div key={i} className="pt-1 space-y-0.5">
                          <p className="font-bold text-[#7041C6]">{sec.heading}</p>
                          <p className="text-[#39245F]">{sec.content}</p>
                          {sec.realWorldConnection ? (
                            <p className="text-[#64587A] italic">Real-World: {sec.realWorldConnection}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {/* Definitions & Terminology */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-[#FAF8FF] border border-[#E2D6F8] space-y-2">
                      <p className="font-bold text-[#39245F]">Core Definitions:</p>
                      {conceptMap.definitions.map((d, i) => (
                        <div key={i} className="pl-2 border-l-2 border-[#7041C6]">
                          <p className="font-semibold text-[#39245F]">{d.term}</p>
                          <p className="text-[#64587A]">{d.definition}</p>
                        </div>
                      ))}
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#FAF8FF] border border-[#E2D6F8] space-y-2">
                      <p className="font-bold text-[#39245F]">Misconceptions & Corrections:</p>
                      {conceptMap.misconceptions && conceptMap.misconceptions.length > 0 ? (
                        conceptMap.misconceptions.map((m, i) => (
                          <div key={i} className="pl-2 border-l-2 border-rose-400">
                            <p className="text-rose-700 font-semibold">Flawed: {m.misconception}</p>
                            <p className="text-emerald-700">Scientific: {m.correction}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-[#64587A]">Direct conceptual foundation verified without ambiguity.</p>
                      )}
                    </div>
                  </div>

                  {/* Learning Objectives */}
                  <div className="p-3.5 rounded-xl bg-[#FAF8FF] border border-[#E2D6F8]">
                    <p className="font-bold text-[#39245F] mb-1">Learning Objectives:</p>
                    <ul className="list-disc list-inside space-y-1 text-[#64587A]">
                      {conceptMap.learningObjectives.map((obj, i) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DIAGNOSTIC ASSESSMENT WORKSPACE */}
          {activeTab === 'assessment' && (
            <div className="bg-white rounded-b-2xl rounded-tr-2xl p-6 border border-[#E2D6F8] space-y-4 shadow-sm min-h-[460px]">
              {!generatedAssessment ? (
                <div className="h-80 flex flex-col items-center justify-center text-center text-sm text-[#8F84A6] bg-[#FAF8FF] rounded-xl border border-dashed border-[#E2D6F8] p-6 space-y-2">
                  <ClipboardList className="w-8 h-8 text-[#7041C6] opacity-60" />
                  <p className="font-bold text-[#39245F]">No Assessment Generated Yet</p>
                  <p className="max-w-md text-xs">
                    Click "📝 Generate 4-Modality Diagnostic Assessment" on the left panel to produce a balanced assessment package.
                  </p>
                  <button
                    onClick={handleGenerateAssessment}
                    disabled={generatingAssessment}
                    className="px-4 py-2 rounded-xl bg-[#7041C6] text-white font-bold text-xs"
                  >
                    {generatingAssessment ? 'Generating...' : 'Generate Assessment'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="flex flex-wrap items-center justify-between border-b border-[#E2D6F8] pb-3 gap-2">
                    <div>
                      <h3 className="font-extrabold text-[#39245F] text-sm">{generatedAssessment.name}</h3>
                      <p className="text-[#64587A]">{generatedAssessment.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full font-bold bg-[#FAF8FF] border border-[#E2D6F8] text-[#7041C6]">
                        {generatedAssessment.totalQuestions} Questions • {generatedAssessment.totalMarks} Marks
                      </span>
                    </div>
                  </div>

                  {/* Assign to Class */}
                  <div className="p-3.5 rounded-xl bg-[#FAF8FF] border border-[#E2D6F8] space-y-2">
                    <p className="font-bold text-[#39245F]">Assign to Target Class Groups:</p>
                    <div className="flex flex-wrap gap-2">
                      {classes.map((c) => {
                        const isSelected = selectedClassIds.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            onClick={() => {
                              setSelectedClassIds(
                                isSelected
                                  ? selectedClassIds.filter((id) => id !== c.id)
                                  : [...selectedClassIds, c.id]
                              );
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-[#7041C6] text-white shadow-sm'
                                : 'bg-white text-[#39245F] border border-[#E2D6F8]'
                            }`}
                          >
                            {c.name} ({c.gradeLevel ? `Grade ${c.gradeLevel}` : ''})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Question List */}
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {generatedAssessment.questions.map((q, idx) => (
                      <div key={q.id || idx} className="p-3 rounded-xl bg-[#FAF8FF] border border-[#E2D6F8] space-y-1">
                        <div className="flex items-center justify-between font-bold text-[#39245F]">
                          <span>
                            {idx + 1}. [{q.modality.toUpperCase()}] ({q.questionType.replace(/_/g, ' ')})
                          </span>
                          <span className="text-[#7041C6]">{q.marks} Mark{q.marks > 1 ? 's' : ''}</span>
                        </div>
                        <p className="text-[#24163D] font-medium">{q.prompt}</p>
                        {q.options && q.options.length > 0 ? (
                          <div className="grid grid-cols-2 gap-1 text-[#64587A] pt-1">
                            {q.options.map((opt, oi) => (
                              <span key={oi} className={oi === q.correctIndex ? 'font-bold text-emerald-600' : ''}>
                                {String.fromCharCode(65 + oi)}. {opt} {oi === q.correctIndex ? '✓' : ''}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {q.rubric ? (
                          <div className="p-2 rounded-lg bg-purple-50 text-[11px] text-[#7041C6] space-y-0.5">
                            <p><strong>Evaluation Rubric:</strong> {q.rubric.criteria}</p>
                            <p>Full Marks: {q.rubric.fullMarksCondition}</p>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E2D6F8]">
                    <button
                      onClick={() => handleSaveAssessment(true)}
                      disabled={savingAssessment || selectedClassIds.length === 0}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7041C6] text-white text-xs font-bold hover:bg-[#592ea6] transition-all disabled:opacity-50 shadow-sm"
                    >
                      <CheckCircle className="w-4 h-4" /> {savingAssessment ? 'Saving...' : 'Save & Publish to Classes'}
                    </button>
                    <button
                      onClick={() => handleSaveAssessment(false)}
                      disabled={savingAssessment || selectedClassIds.length === 0}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF8FF] border border-[#E2D6F8] text-[#7041C6] text-xs font-bold hover:bg-[#F3EEFC] transition-all disabled:opacity-50"
                    >
                      Save as Draft
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Difficulty Adaptation Overview */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2D6F8] space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-[#7041C6]" />
          <h2 className="text-lg font-extrabold text-[#39245F]">
            Performance-Based Progressive Difficulty Adaptation
          </h2>
        </div>
        <p className="text-xs text-[#64587A]">
          Adjustments occur independently per modality (never based on speed alone). Original Admin-approved difficulty remains preserved in the database.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {students[0]?.difficultyHistory?.map((h) => (
            <div key={h.id} className="p-3.5 rounded-xl bg-[#FAF8FF] border border-[#E2D6F8] text-xs space-y-1">
              <div className="flex justify-between font-bold text-[#39245F]">
                <span>{students[0].name} • {MODALITY_META[h.modality].technicalName}</span>
                <span>{h.fromDifficulty} → {h.toDifficulty}</span>
              </div>
              <p className="text-[#64587A]">{h.reason} ({h.date})</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
