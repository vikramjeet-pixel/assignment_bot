"use client";

import { motion } from "framer-motion";
import { Assignment, RoadmapTask, updateAssignment } from "@/lib/firestore";
import { useState } from "react";
import {
  BookOpen,
  PenLine,
  Zap,
  CalendarDays,
  CheckCircle2,
  Circle,
} from "lucide-react";

const PHASE_CONFIG = {
  research: {
    icon: BookOpen,
    bg: "bg-[#ECFDF5]",
    border: "border-[#A7F3D0]",
    iconColor: "text-emerald-500",
    dot: "bg-emerald-400",
    connectorColor: "bg-emerald-200",
    label: "Research",
    textColor: "text-emerald-700",
  },
  writing: {
    icon: PenLine,
    bg: "bg-[#F5F3FF]",
    border: "border-[#C4B5FD]",
    iconColor: "text-violet-500",
    dot: "bg-violet-400",
    connectorColor: "bg-violet-200",
    label: "Writing",
    textColor: "text-violet-700",
  },
  action: {
    icon: Zap,
    bg: "bg-[#E0F2FE]",
    border: "border-[#7DD3FC]",
    iconColor: "text-sky-500",
    dot: "bg-sky-400",
    connectorColor: "bg-sky-200",
    label: "Action",
    textColor: "text-sky-700",
  },
};

type TaskRowProps = {
  task: RoadmapTask;
  index: number;
  isLast: boolean;
  completed: boolean;
  onToggle: () => void;
};

function TaskRow({ task, index, isLast, completed, onToggle }: TaskRowProps) {
  const cfg = PHASE_CONFIG[task.phase] ?? PHASE_CONFIG.action;
  const Icon = cfg.icon;

  return (
    <motion.div
      className="flex gap-4"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Timeline spine */}
      <div className="flex flex-col items-center">
        <button
          onClick={onToggle}
          className={`
            w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0
            transition-all duration-300 shadow-sm
            ${completed
              ? `${cfg.bg} ${cfg.border} ${cfg.iconColor}`
              : "bg-white border-[#E5E7EB] text-[#D1D5DB] hover:border-[#6366F1] hover:text-[#6366F1]"
            }
          `}
        >
          {completed ? (
            <CheckCircle2 size={16} />
          ) : (
            <Circle size={16} />
          )}
        </button>
        {!isLast && (
          <div className={`w-px flex-1 mt-1.5 mb-1.5 min-h-[32px] ${completed ? cfg.connectorColor : "bg-[#E5E7EB]"}`} />
        )}
      </div>

      {/* Task card */}
      <div className={`
        flex-1 mb-4 rounded-xl border p-4 transition-all duration-300
        ${completed
          ? `${cfg.bg} ${cfg.border}`
          : "bg-white border-[#E5E7EB] hover:border-[#D1D5DB]"
        }
      `}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${cfg.bg} border ${cfg.border}`}>
              <Icon size={12} className={cfg.iconColor} />
            </div>
            <span className={`text-xs font-medium uppercase tracking-wide ${cfg.textColor}`}>
              {cfg.label} · Step {task.step}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-[#9CA3AF] shrink-0">
            <CalendarDays size={11} />
            <span>{task.daysAllocated}d</span>
          </div>
        </div>
        <p className={`text-sm leading-relaxed ${completed ? "text-[#6B7280] line-through" : "text-[#374151]"}`}>
          {task.description}
        </p>
      </div>
    </motion.div>
  );
}

type Props = {
  assignment: Assignment;
};

export function Roadmap({ assignment }: Props) {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  if (!assignment.roadmap || assignment.roadmap.length === 0) {
    return (
      <div className="text-center py-12 text-[#9CA3AF]">
        <div className="w-12 h-12 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mx-auto mb-3">
          <CalendarDays size={20} className="text-[#D1D5DB]" />
        </div>
        <p className="text-sm">No roadmap generated yet.</p>
      </div>
    );
  }

  const toggleStep = async (stepIndex: number) => {
    const next = new Set(completedSteps);
    if (next.has(stepIndex)) {
      next.delete(stepIndex);
    } else {
      next.add(stepIndex);
    }
    setCompletedSteps(next);

    if (assignment.id) {
      const progress = Math.round((next.size / assignment.roadmap.length) * 100);
      await updateAssignment(assignment.id, { progress });
    }
  };

  const dueDate = assignment.dueDate
    ? new Date(assignment.dueDate).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div>
      {dueDate && (
        <div className="flex items-center gap-2 mb-6 px-4 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl w-fit">
          <CalendarDays size={14} className="text-[#6366F1]" />
          <span className="text-sm font-medium text-[#374151]">Due {dueDate}</span>
        </div>
      )}

      <div>
        {assignment.roadmap.map((task, i) => (
          <TaskRow
            key={i}
            task={task}
            index={i}
            isLast={i === assignment.roadmap.length - 1}
            completed={completedSteps.has(i)}
            onToggle={() => toggleStep(i)}
          />
        ))}
      </div>

      <div className="mt-2 p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
        <div className="flex justify-between text-sm text-[#6B7280] mb-2">
          <span>{completedSteps.size} of {assignment.roadmap.length} completed</span>
          <span className="font-medium text-[#111827]">
            {Math.round((completedSteps.size / assignment.roadmap.length) * 100)}%
          </span>
        </div>
        <div className="h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-400"
            initial={{ width: 0 }}
            animate={{
              width: `${Math.round((completedSteps.size / assignment.roadmap.length) * 100)}%`,
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}
