import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type RoadmapTask = {
  step: number;
  description: string;
  daysAllocated: number;
  phase: "research" | "writing" | "action";
};

export type Assignment = {
  id?: string;
  uid: string;
  name: string;
  course: string;
  rawText: string;
  dueDate?: string;
  roadmap: RoadmapTask[];
  progress: number;
  storageRef?: string;
  createdAt?: Timestamp;
};

export type Profile = {
  uid: string;
  voiceSampleText?: string;
  styleVector?: number[];
  displayName?: string;
  photoURL?: string;
};

export function subscribeToAssignments(
  uid: string,
  callback: (assignments: Assignment[]) => void
) {
  const q = query(collection(db, "assignments"), where("uid", "==", uid));
  return onSnapshot(q, (snapshot) => {
    const data: Assignment[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Assignment, "id">),
    }));
    data.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.seconds - a.createdAt.seconds;
    });
    callback(data);
  });
}

export async function createAssignment(
  data: Omit<Assignment, "id" | "createdAt">
) {
  return addDoc(collection(db, "assignments"), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function updateAssignment(id: string, data: Partial<Assignment>) {
  return updateDoc(doc(db, "assignments", id), data);
}

export async function deleteAssignment(id: string) {
  return deleteDoc(doc(db, "assignments", id));
}

export async function upsertProfile(uid: string, data: Partial<Profile>) {
  return updateDoc(doc(db, "profiles", uid), data);
}
