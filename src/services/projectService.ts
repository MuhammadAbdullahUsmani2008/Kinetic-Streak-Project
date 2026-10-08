/**
 * Project Service
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Project, Visibility } from '../types';

export async function getUserProjects(userId: string): Promise<Project[]> {
  const path = 'projects';
  try {
    const q = query(collection(db, path), where('ownerId', '==', userId));
    const snap = await getDocs(q);
    const projects = snap.docs.map((d) => d.data() as Project);
    // Sort descending by createdAt
    return projects.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function getProject(projectId: string): Promise<Project | null> {
  const path = `projects/${projectId}`;
  try {
    const snap = await getDoc(doc(db, 'projects', projectId));
    if (!snap.exists()) return null;
    return snap.data() as Project;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function createProject({
  ownerId,
  title,
  description,
  visibility,
}: {
  ownerId: string;
  title: string;
  description?: string;
  visibility: Visibility;
}): Promise<Project> {
  const projectId = 'proj_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
  const path = `projects/${projectId}`;
  const now = new Date().toISOString();

  const project: Project = {
    projectId,
    ownerId,
    title: title.trim(),
    description: description?.trim() || '',
    visibility,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'projects', projectId), project);
    return project;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateProject(
  projectId: string,
  updates: Partial<Pick<Project, 'title' | 'description' | 'visibility' | 'status'>>
): Promise<void> {
  const path = `projects/${projectId}`;
  try {
    await updateDoc(doc(db, 'projects', projectId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteProject(projectId: string): Promise<void> {
  const path = `projects/${projectId}`;
  try {
    await deleteDoc(doc(db, 'projects', projectId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
