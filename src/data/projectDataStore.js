import { initialProjects, initialApplications, initialMilestonesByProject } from './adminProjectSeed';

const PROJECTS_KEY = 'admin-projects-data';
const APPLICATIONS_KEY = 'admin-project-applications';
const MILESTONES_KEY = 'admin-project-milestones';

const readJson = (key, fallback) => {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const ensureSeed = () => {
  if (!localStorage.getItem(PROJECTS_KEY)) writeJson(PROJECTS_KEY, initialProjects);
  if (!localStorage.getItem(APPLICATIONS_KEY)) writeJson(APPLICATIONS_KEY, initialApplications);
  if (!localStorage.getItem(MILESTONES_KEY)) writeJson(MILESTONES_KEY, initialMilestonesByProject);
};

ensureSeed();

export function getProjects() {
  
  return readJson(PROJECTS_KEY, initialProjects);
}

export function getProjectById(id) {
  return getProjects().find((project) => String(project.id) === String(id)) || null;
}

export function saveProjects(projects) {
  writeJson(PROJECTS_KEY, projects);
  return projects;
}

export function getApplications() {
  return readJson(APPLICATIONS_KEY, initialApplications);
}

export function getApplicationsByProject(projectId) {
  return getApplications().filter((app) => String(app.projectId) === String(projectId));
}

export function saveApplications(applications) {
  writeJson(APPLICATIONS_KEY, applications);
}

export function addApplication(application) {
  const apps = [application, ...getApplications()];
  saveApplications(apps);
  return apps;
}

export function updateApplication(applicationId, updates) {
  const apps = getApplications().map((app) =>
    app.id === applicationId ? { ...app, ...updates } : app
  );
  saveApplications(apps);
  return apps;
}

export function getMilestonesByProject(projectId) {
  const all = readJson(MILESTONES_KEY, initialMilestonesByProject) || {};
  return all[String(projectId)] || [];
}

export function saveMilestonesByProject(projectId, milestones) {
  const all = readJson(MILESTONES_KEY, initialMilestonesByProject) || {};
  all[String(projectId)] = milestones;
  writeJson(MILESTONES_KEY, all);
  return milestones;
}

export function addMilestone(projectId, milestone) {
  const nextId = Date.now();
  const milestones = getMilestonesByProject(projectId);
  const created = { ...milestone, id: nextId, payments: milestone.payments || [] };
  saveMilestonesByProject(projectId, [created, ...milestones]);
  return created;
}

export function updateMilestone(projectId, milestoneId, updates) {
  const milestones = getMilestonesByProject(projectId).map((ms) =>
    ms.id === milestoneId ? { ...ms, ...updates } : ms
  );
  saveMilestonesByProject(projectId, milestones);
  return milestones;
}

export function deleteMilestone(projectId, milestoneId) {
  const milestones = getMilestonesByProject(projectId).filter((ms) => ms.id !== milestoneId);
  saveMilestonesByProject(projectId, milestones);
  return milestones;
}

export function addPaymentToMilestone(projectId, milestoneId, payment) {
  const milestones = getMilestonesByProject(projectId).map((ms) => {
    if (ms.id !== milestoneId) return ms;
    const nextPaymentId = Date.now();
    return {
      ...ms,
      payments: [
        ...(ms.payments || []),
        { id: nextPaymentId, ...payment }
      ],
    };
  });
  saveMilestonesByProject(projectId, milestones);
  return milestones;
}

export function addProject(project) {
  const projects = getProjects();
  const nextId = Date.now();
  const created = { ...project, id: nextId, deadline: project.end_date || project.deadline || '' };
  const updated = [created, ...projects];
  saveProjects(updated);
  return created;
}

export function updateProject(project) {
  const projects = getProjects().map((item) =>
    String(item.id) === String(project.id) ? { ...item, ...project, deadline: project.end_date || project.deadline || item.deadline } : item
  );
  saveProjects(projects);
  return project;
}

export function deleteProject(projectId) {
  const projects = getProjects().filter((project) => String(project.id) !== String(projectId));
  saveProjects(projects);
  return projects;
}
