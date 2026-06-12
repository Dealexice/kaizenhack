import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ─── Modules ────────────────────────────────────────────────────────
export async function createModule(userId, { name, code }) {
  const ref = await addDoc(collection(db, 'modules'), {
    name,
    code,
    ownerId: userId,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getUserModules(userId) {
  const q = query(
    collection(db, 'modules'),
    where('ownerId', '==', userId)
  );
  const snap = await getDocs(q);
  const modules = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  // Sort client-side to avoid composite index requirement
  modules.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });
  return modules;
}

export async function getModule(moduleId) {
  const snap = await getDoc(doc(db, 'modules', moduleId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function deleteModule(moduleId) {
  await deleteDoc(doc(db, 'modules', moduleId));
}

// ─── Sources ────────────────────────────────────────────────────────
export async function addSource(moduleId, sourceData) {
  const ref = await addDoc(collection(db, 'modules', moduleId, 'sources'), {
    ...sourceData,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getModuleSources(moduleId) {
  const q = query(
    collection(db, 'modules', moduleId, 'sources'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteSource(moduleId, sourceId) {
  await deleteDoc(doc(db, 'modules', moduleId, 'sources', sourceId));
}

export async function updateSource(moduleId, sourceId, sourceData) {
  await updateDoc(doc(db, 'modules', moduleId, 'sources', sourceId), sourceData);
}

// ─── Conversations ──────────────────────────────────────────────────
export async function createConversation(moduleId) {
  const ref = await addDoc(
    collection(db, 'modules', moduleId, 'conversations'),
    {
      messages: [],
      createdAt: serverTimestamp(),
    }
  );
  return ref.id;
}

export async function getConversation(moduleId, conversationId) {
  const snap = await getDoc(
    doc(db, 'modules', moduleId, 'conversations', conversationId)
  );
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateConversationMessages(
  moduleId,
  conversationId,
  messages
) {
  await updateDoc(
    doc(db, 'modules', moduleId, 'conversations', conversationId),
    { messages }
  );
}

export async function getModuleConversations(moduleId) {
  const q = query(
    collection(db, 'modules', moduleId, 'conversations'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── Diagnoses ──────────────────────────────────────────────────────
export async function saveDiagnosis(moduleId, diagnosisData) {
  const ref = await addDoc(
    collection(db, 'modules', moduleId, 'diagnoses'),
    {
      ...diagnosisData,
      createdAt: serverTimestamp(),
    }
  );
  return ref.id;
}

export async function getModuleDiagnoses(moduleId) {
  const q = query(
    collection(db, 'modules', moduleId, 'diagnoses'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── Practice Tasks ─────────────────────────────────────────────────
export async function savePracticeTasks(moduleId, tasks) {
  const refs = [];
  for (const task of tasks) {
    const ref = await addDoc(
      collection(db, 'modules', moduleId, 'practiceTasks'),
      {
        ...task,
        completed: false,
        createdAt: serverTimestamp(),
      }
    );
    refs.push(ref.id);
  }
  return refs;
}

export async function getModulePracticeTasks(moduleId) {
  const q = query(
    collection(db, 'modules', moduleId, 'practiceTasks'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function completePracticeTask(moduleId, taskId) {
  await updateDoc(doc(db, 'modules', moduleId, 'practiceTasks', taskId), {
    completed: true,
    completedAt: serverTimestamp(),
  });
}

// ─── K-Points ───────────────────────────────────────────────────────
export async function awardKPoints(userId, type, amount) {
  // Add event
  await addDoc(collection(db, 'users', userId, 'kpoints'), {
    type,
    amount,
    createdAt: serverTimestamp(),
  });
  // Update total
  await updateDoc(doc(db, 'users', userId), {
    kPoints: increment(amount),
  });
}

export async function getUserKPoints(userId) {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? snap.data().kPoints || 0 : 0;
}

export async function getKPointsHistory(userId) {
  const q = query(
    collection(db, 'users', userId, 'kpoints'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
