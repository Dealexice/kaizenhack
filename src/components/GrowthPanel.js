'use client';

import { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  ExternalLink,
  TrendingUp,
  Star,
  AlertTriangle,
  Trophy,
  Loader2,
} from 'lucide-react';
import { saveDiagnosis, savePracticeTasks, completePracticeTask, awardKPoints } from '@/lib/firestore';
import { K_POINT_VALUES, getCurrentMilestone, getNextMilestone } from '@/lib/kpoints';

export default function GrowthPanel({
  moduleId,
  userId,
  allChunks,
  diagnosis,
  setDiagnosis,
  practiceTasks,
  setPracticeTasks,
  kPoints,
  setKPoints,
}) {
  const [diagLoading, setDiagLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);

  async function generateDiagnosis() {
    if (!allChunks.length) {
      alert('Please upload some sources first (feedback, mark schemes, learning outcomes).');
      return;
    }
    setDiagLoading(true);
    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chunks: allChunks, previousDiagnoses: [] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setDiagnosis(data.diagnosis);
      await saveDiagnosis(moduleId, data.diagnosis);
      await awardKPoints(userId, 'COMPLETE_DIAGNOSIS', K_POINT_VALUES.COMPLETE_DIAGNOSIS);
      setKPoints((prev) => prev + K_POINT_VALUES.COMPLETE_DIAGNOSIS);
    } catch (err) {
      console.error('Diagnosis failed:', err);
      alert('Failed to generate diagnosis: ' + err.message);
    } finally {
      setDiagLoading(false);
    }
  }

  async function generatePracticeTasks() {
    if (!diagnosis?.weaknesses?.length) {
      alert('Generate a diagnosis first to identify weaknesses.');
      return;
    }
    setTasksLoading(true);
    try {
      const res = await fetch('/api/practice-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weaknesses: diagnosis.weaknesses,
          chunks: allChunks,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const tasks = data.tasks.map((t, i) => ({
        ...t,
        id: `task_${Date.now()}_${i}`,
        completed: false,
      }));
      setPracticeTasks(tasks);
      await savePracticeTasks(moduleId, data.tasks);
    } catch (err) {
      console.error('Practice tasks failed:', err);
      alert('Failed to generate tasks: ' + err.message);
    } finally {
      setTasksLoading(false);
    }
  }

  async function handleTaskComplete(taskId) {
    setPracticeTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: true } : t))
    );
    try {
      await awardKPoints(userId, 'COMPLETE_PRACTICE_TASK', K_POINT_VALUES.COMPLETE_PRACTICE_TASK);
      setKPoints((prev) => prev + K_POINT_VALUES.COMPLETE_PRACTICE_TASK);
    } catch (err) {
      console.error('Failed to award K-points:', err);
    }
  }

  const milestone = getCurrentMilestone(kPoints);
  const nextMilestone = getNextMilestone(kPoints);
  const progress = nextMilestone
    ? Math.min(100, ((kPoints - (milestone?.points || 0)) / (nextMilestone.points - (milestone?.points || 0))) * 100)
    : 100;

  const hasRecurring = diagnosis?.weaknesses?.some((w) => w.recurring);

  return (
    <div className="flex flex-col h-full">
      {/* Panel Header */}
      <div className="p-4 border-b border-[#E5E5E7] flex-shrink-0">
        <h2 className="font-semibold text-sm text-[#1A1A1A]">Growth</h2>
        <p className="text-xs text-gray-400 mt-0.5">Your progress &amp; insights</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* K-Points Overview */}
        <div className="bg-gradient-to-br from-[#A71930] to-[#8B1428] rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Star size={18} className="fill-yellow-300 text-yellow-300" />
              <span className="text-2xl font-bold">{kPoints}</span>
              <span className="text-sm text-white/70">K-points</span>
            </div>
            <span className="text-lg">{milestone?.emoji}</span>
          </div>
          <p className="text-xs text-white/70 mb-2">{milestone?.label}</p>
          {nextMilestone && (
            <>
              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-300 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] text-white/50 mt-1">
                {nextMilestone.points - kPoints} pts to {nextMilestone.label}{' '}
                {nextMilestone.emoji}
              </p>
            </>
          )}
        </div>

        {/* Diagnosis Report */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#1A1A1A]">
              Diagnosis Report
            </h3>
            <button
              onClick={generateDiagnosis}
              disabled={diagLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#A71930] hover:bg-[#8B1428] text-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              {diagLoading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Sparkles size={12} />
              )}
              {diagLoading ? 'Generating...' : 'Generate'}
            </button>
          </div>

          {diagnosis ? (
            <div className="space-y-2">
              {diagnosis.overallSummary && (
                <p className="text-xs text-gray-600 bg-[#F5F5F7] rounded-lg p-3 leading-relaxed">
                  {diagnosis.overallSummary}
                </p>
              )}

              {/* Strengths */}
              {diagnosis.strengths?.map((s, i) => (
                <div
                  key={i}
                  className="border-l-3 border-[#1E8E3E] bg-white rounded-lg p-3 shadow-sm"
                >
                  <div className="flex items-start gap-2">
                    <CheckCircle2
                      size={14}
                      className="text-[#1E8E3E] mt-0.5 flex-shrink-0"
                    />
                    <div>
                      <p className="text-xs font-semibold text-[#1A1A1A]">
                        {s.title}
                      </p>
                      {s.learningOutcome && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-[#1E8E3E]/10 text-[#1E8E3E] text-[10px] rounded font-medium">
                          {s.learningOutcome}
                        </span>
                      )}
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                        {s.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Weaknesses */}
              {diagnosis.weaknesses?.map((w, i) => (
                <div
                  key={i}
                  className="border-l-3 border-[#D97706] bg-white rounded-lg p-3 shadow-sm"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      size={14}
                      className="text-[#D97706] mt-0.5 flex-shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-[#1A1A1A]">
                          {w.title}
                        </p>
                        {w.recurring && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[9px] rounded font-bold">
                            RECURRING
                          </span>
                        )}
                      </div>
                      {w.learningOutcome && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-[#D97706]/10 text-[#D97706] text-[10px] rounded font-medium">
                          {w.learningOutcome}
                        </span>
                      )}
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                        {w.description}
                      </p>
                      {w.suggestedAction && (
                        <p className="text-[11px] text-[#0072CE] mt-1 font-medium">
                          → {w.suggestedAction}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#F5F5F7] rounded-lg p-4 text-center">
              <Sparkles size={24} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs text-gray-400">
                Upload sources and click Generate to get your diagnosis.
              </p>
            </div>
          )}
        </div>

        {/* Practice Tasks */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#1A1A1A]">
              Practice Tasks
            </h3>
            {diagnosis?.weaknesses?.length > 0 && (
              <button
                onClick={generatePracticeTasks}
                disabled={tasksLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#0072CE] text-[#0072CE] hover:bg-[#0072CE]/5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                {tasksLoading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <TrendingUp size={12} />
                )}
                {tasksLoading ? 'Creating...' : 'Create tasks'}
              </button>
            )}
          </div>

          {practiceTasks.length > 0 ? (
            <div className="space-y-2">
              {practiceTasks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-white rounded-lg p-3 shadow-sm border border-[#E5E5E7] ${
                    task.completed ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() =>
                        !task.completed && handleTaskComplete(task.id)
                      }
                      className="mt-0.5 flex-shrink-0 cursor-pointer"
                      disabled={task.completed}
                    >
                      {task.completed ? (
                        <CheckCircle2
                          size={16}
                          className="text-[#1E8E3E]"
                        />
                      ) : (
                        <Circle
                          size={16}
                          className="text-gray-300 hover:text-[#1E8E3E]"
                        />
                      )}
                    </button>
                    <div>
                      <p
                        className={`text-xs font-semibold ${
                          task.completed
                            ? 'line-through text-gray-400'
                            : 'text-[#1A1A1A]'
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                        {task.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {task.estimatedTime && (
                          <span className="text-[10px] text-gray-400">
                            ⏱ {task.estimatedTime}
                          </span>
                        )}
                        {task.difficulty && (
                          <span className="text-[10px] text-gray-400 capitalize">
                            📊 {task.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#F5F5F7] rounded-lg p-4 text-center">
              <TrendingUp size={24} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs text-gray-400">
                Practice tasks will appear here after diagnosis.
              </p>
            </div>
          )}
        </div>

        {/* Tutor Booking CTA */}
        {hasRecurring && (
          <div className="bg-[#A71930]/5 border border-[#A71930]/20 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle
                size={16}
                className="text-[#A71930] mt-0.5 flex-shrink-0"
              />
              <div>
                <p className="text-xs font-semibold text-[#A71930]">
                  Recurring issue detected
                </p>
                <p className="text-[11px] text-gray-600 mt-1">
                  Some weaknesses have appeared across multiple assessments.
                  Consider booking time with your tutor or module lead.
                </p>
                <a
                  href="https://www.kcl.ac.uk/student-support"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={async () => {
                    try {
                      await awardKPoints(userId, 'BOOK_TUTOR', K_POINT_VALUES.BOOK_TUTOR);
                      setKPoints((prev) => prev + K_POINT_VALUES.BOOK_TUTOR);
                    } catch {}
                  }}
                  className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-[#A71930] text-white text-xs font-medium rounded-lg hover:bg-[#8B1428] transition-colors"
                >
                  Book with tutor
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Progress Summary */}
        <div className="bg-[#F5F5F7] rounded-lg p-4">
          <h3 className="text-xs font-semibold text-gray-500 mb-2">
            Progress Summary
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 text-center">
              <Trophy size={16} className="mx-auto text-[#1E8E3E] mb-1" />
              <p className="text-lg font-bold text-[#1A1A1A]">
                {diagnosis?.strengths?.length || 0}
              </p>
              <p className="text-[10px] text-gray-400">Strengths</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <AlertTriangle size={16} className="mx-auto text-[#D97706] mb-1" />
              <p className="text-lg font-bold text-[#1A1A1A]">
                {diagnosis?.weaknesses?.length || 0}
              </p>
              <p className="text-[10px] text-gray-400">To Improve</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <CheckCircle2 size={16} className="mx-auto text-[#0072CE] mb-1" />
              <p className="text-lg font-bold text-[#1A1A1A]">
                {practiceTasks.filter((t) => t.completed).length}/
                {practiceTasks.length || 0}
              </p>
              <p className="text-[10px] text-gray-400">Tasks Done</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <Star
                size={16}
                className="mx-auto fill-yellow-400 text-yellow-400 mb-1"
              />
              <p className="text-lg font-bold text-[#1A1A1A]">{kPoints}</p>
              <p className="text-[10px] text-gray-400">K-points</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
