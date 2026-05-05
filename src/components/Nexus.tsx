"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { createAssignment } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

type Phase = "idle" | "dragging" | "uploading" | "analyzing" | "done" | "error";

type Props = {
  onComplete?: () => void;
};

export function Nexus({ onComplete }: Props) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("idle");
  const [fileName, setFileName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [course, setCourse] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const resetState = () => {
    setPhase("idle");
    setFileName("");
    setErrorMsg("");
    setCourse("");
    setShowForm(false);
    setPendingFile(null);
  };

  const processFile = useCallback(
    async (file: File, courseName: string) => {
      if (!user) return;
      if (file.type !== "application/pdf") {
        setErrorMsg("Only PDF files are supported.");
        setPhase("error");
        return;
      }

      setFileName(file.name);
      setPhase("uploading");

      try {
        // Upload to Firebase Storage
        const storageRef = ref(
          storage,
          `pdfs/${user.uid}/${Date.now()}_${file.name}`
        );
        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);

        setPhase("analyzing");

        // Send PDF as multipart form-data — avoids base64 bloat & body size limits
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/analyze", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Server error ${res.status}`);
        }

        const data = await res.json();

        // Save to Firestore
        await createAssignment({
          uid: user.uid,
          name: data.assignmentName || file.name.replace(".pdf", ""),
          course: courseName || "General",
          rawText: "",
          dueDate: data.dueDate,
          roadmap: data.tasks || [],
          progress: 0,
          storageRef: downloadUrl,
        });

        setPhase("done");
        toast.success("Roadmap created!", {
          description: `${data.tasks?.length ?? 0} tasks generated for "${data.assignmentName}"`,
        });
        setTimeout(() => {
          resetState();
          onComplete?.();
        }, 2000);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        setErrorMsg(message);
        setPhase("error");
        toast.error("Analysis failed", { description: message });
      }
    },
    [user, onComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setPhase("idle");
      const file = e.dataTransfer.files[0];
      if (file) {
        setPendingFile(file);
        setShowForm(true);
      }
    },
    []
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      setShowForm(true);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingFile) {
      setShowForm(false);
      processFile(pendingFile, course);
    }
  };

  const isActive = phase !== "idle" && phase !== "error";

  return (
    <div className="space-y-4">
      {/* Course form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-[#111827] text-sm">
                  {pendingFile?.name}
                </p>
                <p className="text-xs text-[#9CA3AF]">Which course is this for?</p>
              </div>
              <button onClick={resetState} className="text-[#D1D5DB] hover:text-[#6B7280]">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="flex gap-2">
              <input
                autoFocus
                type="text"
                placeholder="e.g. HIST 201, Advanced Biology"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="flex-1 text-sm px-3 py-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent placeholder:text-[#D1D5DB]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#6366F1] text-white text-sm font-medium rounded-xl hover:bg-[#4F46E5] transition-colors"
              >
                Analyze
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drop zone */}
      {!showForm && (
        <motion.div
          onDragEnter={() => !isActive && setPhase("dragging")}
          onDragLeave={() => phase === "dragging" && setPhase("idle")}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`
            relative rounded-2xl border-2 border-dashed transition-all duration-300
            flex flex-col items-center justify-center text-center
            min-h-[200px] px-8 py-10 select-none
            ${phase === "dragging"
              ? "border-[#6366F1] bg-[#EEF2FF] scale-[1.01]"
              : phase === "done"
              ? "border-emerald-300 bg-[#ECFDF5]"
              : phase === "error"
              ? "border-red-300 bg-red-50"
              : isActive
              ? "nexus-pulse border-[#A5B4FC] bg-[#F5F3FF]"
              : "border-[#E5E7EB] bg-white hover:border-[#C7D2FE] hover:bg-[#F5F7FF]"
            }
          `}
        >
          <AnimatePresence mode="wait">
            {phase === "idle" || phase === "dragging" ? (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center mx-auto">
                  <Upload size={22} className="text-[#6366F1]" />
                </div>
                <div>
                  <p className="font-semibold text-[#374151] mb-1">
                    {phase === "dragging" ? "Release to upload" : "Drop your assignment PDF"}
                  </p>
                  <p className="text-sm text-[#9CA3AF]">
                    or{" "}
                    <label className="text-[#6366F1] underline underline-offset-2 cursor-pointer hover:text-[#4F46E5]">
                      browse files
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={handleFileInput}
                      />
                    </label>
                  </p>
                  <p className="text-xs text-[#D1D5DB] mt-2">PDF · Max 20MB</p>
                </div>
              </motion.div>
            ) : phase === "uploading" ? (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#F5F3FF] border border-[#C4B5FD] flex items-center justify-center mx-auto">
                  <FileText size={22} className="text-[#7C3AED] animate-pulse" />
                </div>
                <div>
                  <p className="font-semibold text-[#374151] text-sm">Uploading</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5 truncate max-w-[200px] mx-auto">{fileName}</p>
                </div>
                <PulseDots color="violet" />
              </motion.div>
            ) : phase === "analyzing" ? (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-3"
              >
                <div className="relative w-14 h-14 mx-auto">
                  <div className="w-14 h-14 rounded-2xl bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center">
                    <Sparkles size={22} className="text-[#6366F1]" />
                  </div>
                  <div className="absolute inset-0 rounded-2xl border-2 border-[#6366F1] animate-ping opacity-20" />
                </div>
                <div>
                  <p className="font-semibold text-[#374151] text-sm">Gemini is reading...</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">Extracting tasks and deadlines</p>
                </div>
                <PulseDots color="indigo" />
              </motion.div>
            ) : phase === "done" ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center mx-auto">
                  <CheckCircle2 size={22} className="text-emerald-500" />
                </div>
                <p className="font-semibold text-emerald-700 text-sm">Roadmap created!</p>
              </motion.div>
            ) : (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
                  <AlertCircle size={22} className="text-red-400" />
                </div>
                <div>
                  <p className="font-semibold text-red-600 text-sm">Analysis failed</p>
                  <p className="text-xs text-red-400 mt-0.5 max-w-[240px] mx-auto">{errorMsg}</p>
                </div>
                <button
                  onClick={resetState}
                  className="text-xs text-[#6366F1] underline underline-offset-2"
                >
                  Try again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

function PulseDots({ color }: { color: "indigo" | "violet" }) {
  const cls =
    color === "indigo"
      ? "bg-[#6366F1]"
      : "bg-[#7C3AED]";
  return (
    <div className="flex gap-1.5 justify-center">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${cls}`}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
