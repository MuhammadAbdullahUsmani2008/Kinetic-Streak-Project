import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Layers,
  Archive,
  RotateCcw,
  Trash2,
  Edit2,
  Lock,
  Globe,
  CheckCircle2,
} from 'lucide-react';
import { Activity, Project } from '../types';
import { deleteProject, updateProject } from '../services/projectService';

interface ProjectsPageProps {
  projects: Project[];
  activities: Activity[];
  onOpenCreateProject: () => void;
  onEditProject: (project: Project) => void;
  onSelectActivity: (activity: Activity) => void;
  onRefreshData: () => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  projects,
  activities,
  onOpenCreateProject,
  onEditProject,
  onSelectActivity,
  onRefreshData,
}) => {
  const [filter, setFilter] = useState<'active' | 'archived'>('active');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const displayedProjects = projects.filter((p) => p.status === filter);

  const handleToggleArchive = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    const nextStatus = project.status === 'active' ? 'archived' : 'active';
    try {
      await updateProject(project.projectId, { status: nextStatus });
      onRefreshData();
    } catch (err) {
      alert('Failed to update project status.');
    }
  };

  const handleDelete = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    if (
      !window.confirm(
        `Are you sure you want to delete project "${project.title}"? Associated activities will become standalone.`
      )
    ) {
      return;
    }

    try {
      await deleteProject(project.projectId);
      onRefreshData();
    } catch (err) {
      alert('Failed to delete project.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-950">Projects</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Organize multi-step initiatives, hobbies, or domains containing multiple habits & tasks.
          </p>
        </div>

        <button
          onClick={onOpenCreateProject}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setFilter('active')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
            filter === 'active' ? 'bg-teal-50 text-teal-800' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          Active Projects ({projects.filter((p) => p.status === 'active').length})
        </button>
        <button
          onClick={() => setFilter('archived')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
            filter === 'archived' ? 'bg-teal-50 text-teal-800' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          Archived Projects ({projects.filter((p) => p.status === 'archived').length})
        </button>
      </div>

      {displayedProjects.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-stone-200 bg-white text-stone-500 space-y-2">
          <FolderKanban className="w-10 h-10 text-stone-300 mx-auto" />
          <p className="text-sm font-bold text-stone-700">No {filter} projects found</p>
          <p className="text-xs text-stone-400">
            Create a project to cluster related habits and routines under one unified umbrella.
          </p>
          <button
            onClick={onOpenCreateProject}
            className="mt-2 text-xs text-teal-600 font-bold hover:underline cursor-pointer"
          >
            + Create Your First Project
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedProjects.map((proj) => {
            const linked = activities.filter((a) => a.projectId === proj.projectId);
            const isExpanded = selectedProjectId === proj.projectId;

            return (
              <div
                key={proj.projectId}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-teal-200 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        proj.visibility === 'public'
                          ? 'bg-sky-50 text-sky-700'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {proj.visibility === 'public' ? (
                        <>
                          <Globe className="w-3 h-3" />
                          <span>Public</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>Private</span>
                        </>
                      )}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditProject(proj);
                        }}
                        className="p-1 rounded text-stone-400 hover:text-stone-700 transition"
                        title="Edit Project"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleToggleArchive(e, proj)}
                        className="p-1 rounded text-stone-400 hover:text-stone-700 transition"
                        title={proj.status === 'active' ? 'Archive' : 'Restore'}
                      >
                        {proj.status === 'active' ? (
                          <Archive className="w-3.5 h-3.5" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, proj)}
                        className="p-1 rounded text-stone-400 hover:text-rose-600 transition"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-stone-900">{proj.title}</h3>
                  {proj.description && (
                    <p className="text-xs text-stone-500 mt-1 line-clamp-2">{proj.description}</p>
                  )}

                  {/* Linked activities badge */}
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-stone-500 font-medium">
                      {linked.length} {linked.length === 1 ? 'Activity' : 'Activities'}
                    </span>
                    <button
                      onClick={() =>
                        setSelectedProjectId(isExpanded ? null : proj.projectId)
                      }
                      className="text-teal-600 hover:underline font-semibold cursor-pointer"
                    >
                      {isExpanded ? 'Hide' : 'View Activities'}
                    </button>
                  </div>
                </div>

                {/* Expanded Activities List */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-stone-100 space-y-2">
                    {linked.length === 0 ? (
                      <p className="text-[11px] text-stone-400 italic">No activities linked yet.</p>
                    ) : (
                      linked.map((act) => (
                        <div
                          key={act.activityId}
                          onClick={() => onSelectActivity(act)}
                          className="p-2 rounded-lg bg-stone-50 hover:bg-teal-50/50 transition cursor-pointer flex items-center justify-between text-xs"
                        >
                          <span className="font-semibold text-stone-800 truncate mr-2">
                            {act.title}
                          </span>
                          <span className="text-[10px] text-teal-700 shrink-0 font-bold">
                            {act.currentStreak}d streak
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
