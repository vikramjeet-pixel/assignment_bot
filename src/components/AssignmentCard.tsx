"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Roadmap } from "./Roadmap";
import { Assignment, deleteAssignment } from "@/lib/firestore";
import {
  CalendarDays,
  BookOpen,
  Trash2,
  ChevronRight,
  CheckCircle2,
  Clock,
} from "lucide-react";

type Props = {
  assignment: Assignment;
  index: number;
};

const PHASE_STYLES = {
  research: {
    bg: "bg-[#ECFDF5]",
    border: "border-[#A7F3D0]",
    badge: "bg-[#ECFDF5] text-emerald-700 border-[#A7F3D0]",
    dot: "bg-emerald-400",
    bar: "progress-mint",
    label: "Research",
  },
  writing: {
    bg: "bg-[#F5F3FF]",
    border: "border-[#C4B5FD]",
    badge: "bg-[#F5F3FF] text-violet-700 border-[#C4B5FD]",
    dot: "bg-violet-400",
    bar: "progress-lavender",
    label: "Writing",
  },
  action: {
    bg: "bg-[#E0F2FE]",
    border: "border-[#7DD3FC]",
    badge: "bg-[#E0F2FE] text-sky-700 border-[#7DD3FC]",
    dot: "bg-sky-400",
    bar: "progress-sky",
    label: "Action",
  },
};

function getDominantPhase(assignment: Assignment) {
  if (!assignment.roadmap || assignment.roadmap.length === 0) return "action";
  const counts = { research: 0, writing: 0, action: 0 };
  for (const task of assignment.roadmap) {
    counts[task.phase] = (counts[task.phase] || 0) + task.daysAllocated;
  }
  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]) as keyof typeof PHASE_STYLES;
}

function getDaysUntilDue(dueDate?: string) {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const now = new Date();
  const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export function AssignmentCard({ assignment, index }: Props) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const phase = getDominantPhase(assignment);
  const style = PHASE_STYLES[phase];
  const daysLeft = getDaysUntilDue(assignment.dueDate);
  const progress = Math.min(100, Math.max(0, assignment.progress ?? 0));

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!assignment.id) return;
    setDeleting(true);
    await deleteAssignment(assignment.id);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.07, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      >
        <Card
          onClick={() => setOpen(true)}
          className={`
            group relative cursor-pointer overflow-hidden
            border border-[#E5E7EB] rounded-2xl bg-white
            shadow-[0_1px_3px_rgba(0,0,0,0.04)]
            hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]
            hover:-translate-y-0.5 transition-all duration-300
            p-0
          `}
        >
          {/* Phase color strip */}
          <div className={`h-1.5 w-full ${style.bg} border-b ${style.border}`} />

          <div className="p-5">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[#111827] text-base leading-snug truncate">
                  {assignment.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <BookOpen size={12} className="text-[#9CA3AF]" />
                  <span className="text-xs text-[#6B7280] truncate">{assignment.course}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  className={`text-xs font-medium border ${style.badge} shadow-none`}
                >
                  {style.label}
                </Badge>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-50 text-[#D1D5DB] hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-[#9CA3AF] mb-1.5">
                <span>{assignment.roadmap?.length ?? 0} tasks</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${style.bar} transition-all duration-700`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {daysLeft !== null ? (
                  <>
                    {daysLeft <= 3 ? (
                      <Clock size={12} className="text-red-400" />
                    ) : daysLeft <= 0 ? (
                      <CheckCircle2 size={12} className="text-emerald-400" />
                    ) : (
                      <CalendarDays size={12} className="text-[#9CA3AF]" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        daysLeft <= 0
                          ? "text-emerald-500"
                          : daysLeft <= 3
                          ? "text-red-400"
                          : "text-[#6B7280]"
                      }`}
                    >
                      {daysLeft <= 0
                        ? "Submitted"
                        : daysLeft === 1
                        ? "Due tomorrow"
                        : `${daysLeft} days left`}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-[#D1D5DB]">No due date</span>
                )}
              </div>
              <ChevronRight
                size={15}
                className="text-[#D1D5DB] group-hover:text-[#6366F1] group-hover:translate-x-0.5 transition-all duration-200"
              />
            </div>
          </div>
        </Card>
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-[#E5E7EB] bg-white shadow-xl p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#F3F4F6]">
            <DialogTitle className="text-xl font-semibold text-[#111827]">
              {assignment.name}
            </DialogTitle>
            <p className="text-sm text-[#6B7280] mt-0.5">{assignment.course}</p>
          </DialogHeader>
          <div className="px-6 py-5">
            <Roadmap assignment={assignment} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
