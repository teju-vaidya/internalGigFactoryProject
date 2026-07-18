import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Paperclip, Upload, UploadCloud } from 'lucide-react';
import { api } from '../../utils/api';
import { RichTextEditor, MultiAutocomplete, SingleAutocomplete } from '../AdminShared';
import { toast } from 'react-toastify';
import * as yup from 'yup';
import ConfirmDialog from './ConfirmDialog';

// ─── Recalculate weights proportionally based on budget ──────────────────────
const recalculateMilestoneWeights = (list) => {
  const validBudgets = list.map(m => parseFloat(m.budget) || 0);
  const totalBudget = validBudgets.reduce((sum, b) => sum + b, 0);
  if (list.length === 0) return list;
  
  if (totalBudget > 0) {
    let sumWeights = 0;
    const updated = list.map((m, idx) => {
      const budget = parseFloat(m.budget) || 0;
      let weight = Math.round((budget / totalBudget) * 1000) / 10; // 1 decimal place
      if (idx === list.length - 1) {
        weight = Math.round((100 - sumWeights) * 10) / 10;
      } else {
        sumWeights += weight;
      }
      return {
        ...m,
        weight_percentage: weight
      };
    });
    return updated;
  } else {
    let sumWeights = 0;
    const count = list.length;
    const updated = list.map((m, idx) => {
      let weight = Math.round((100 / count) * 10) / 10;
      if (idx === list.length - 1) {
        weight = Math.round((100 - sumWeights) * 10) / 10;
      } else {
        sumWeights += weight;
      }
      return {
        ...m,
        weight_percentage: weight
      };
    });
    return updated;
  }
};

const adjustMilestoneWeightsOnAdd = (existingMilestones) => {
  const sum = existingMilestones.reduce((acc, m) => acc + (parseFloat(m.weight_percentage) || 0), 0);
  if (sum < 100) {
    const remainder = Math.round((100 - sum) * 10) / 10;
    return {
      updatedExisting: existingMilestones,
      newWeight: remainder > 0 ? remainder : 0
    };
  } else {
    const n = existingMilestones.length;
    const newWeight = Math.round((100 / (n + 1)) * 10) / 10;
    const scaleFactor = (100 - newWeight) / sum;
    
    let tempSum = 0;
    const updatedExisting = existingMilestones.map((m, idx) => {
      const w = parseFloat(m.weight_percentage) || 0;
      const newW = Math.round((w * scaleFactor) * 10) / 10;
      tempSum += newW;
      return { ...m, weight_percentage: newW };
    });
    
    if (updatedExisting.length > 0) {
      const lastIdx = updatedExisting.length - 1;
      const finalWeight = Math.round((100 - newWeight - (tempSum - updatedExisting[lastIdx].weight_percentage)) * 10) / 10;
      updatedExisting[lastIdx].weight_percentage = finalWeight > 0 ? finalWeight : 0;
    }
    
    return {
      updatedExisting,
      newWeight
    };
  }
};

const normalizeWeights = (milestoneList) => {
  if (milestoneList.length === 0) return milestoneList;
  const total = milestoneList.reduce((sum, m) => sum + (parseFloat(m.weight_percentage) || 0), 0);
  if (total === 0) {
    const evenWeight = Math.round((100 / milestoneList.length) * 10) / 10;
    let tempSum = 0;
    return milestoneList.map((m, idx) => {
      if (idx === milestoneList.length - 1) {
        return { ...m, weight_percentage: Math.round((100 - tempSum) * 10) / 10 };
      }
      tempSum += evenWeight;
      return { ...m, weight_percentage: evenWeight };
    });
  }
  
  let tempSum = 0;
  const scaled = milestoneList.map((m, idx) => {
    const w = parseFloat(m.weight_percentage) || 0;
    const newW = Math.round((w / total * 100) * 10) / 10;
    tempSum += newW;
    return { ...m, weight_percentage: newW };
  });
  
  const lastIdx = scaled.length - 1;
  scaled[lastIdx].weight_percentage = Math.round((100 - (tempSum - scaled[lastIdx].weight_percentage)) * 10) / 10;
  return scaled;
};


// ─── Yup Validation Schema ───────────────────────────────────────────────────
const projectSchema = yup.object().shape({
  title: yup.string().required('Project title is required').min(3, 'Title must be at least 3 characters'),
  projectType: yup.string().oneOf(['fixed', 'hourly'], 'Invalid project type').required('Project type is required'),
  priority: yup.string().oneOf(['high', 'medium', 'low'], 'Invalid priority').required('Priority is required'),
  budget: yup.number()
    .typeError('Budget must be a number')
    .positive('Budget must be a positive number')
    .required('Budget is required'),
  estimatedHours: yup.number()
    .typeError('Estimated hours must be a number')
    .positive('Estimated hours must be a positive number')
    .nullable()
    .transform((value, originalValue) => originalValue === '' ? null : value),
  startDate: yup.date()
    .typeError('Invalid start date')
    .nullable()
    .transform((value, originalValue) => originalValue === '' ? null : value),
  endDate: yup.date()
    .typeError('Invalid end date')
    .nullable()
    .transform((value, originalValue) => originalValue === '' ? null : value),
  description: yup.string()
    .required('Project description is required')
    .test('min-length', 'Description must be at least 10 characters', val => {
      const plainText = (val || '').replace(/<[^>]*>/g, '').trim();
      return plainText.length >= 10;
    }),
  milestones: yup.array().of(
    yup.object().shape({
      title: yup.string().required('Milestone title is required'),
      budget: yup.number()
        .typeError('Milestone budget must be a number')
        .positive('Milestone budget must be a positive number')
        .required('Milestone budget is required'),
      weight_percentage: yup.number()
        .typeError('Milestone weight must be a number')
        .min(0, 'Weight cannot be negative')
        .max(100, 'Weight cannot exceed 100%')
        .nullable()
    })
  )
  .test('budget-addition', 'Sum of milestone budgets must not exceed project budget', function(milestonesValue, context) {
    if (context?.options?.context?.validateBudget === false) {
      return true;
    }
    const parentBudget = context.parent.budget || 0;
    const sum = (milestonesValue || []).reduce((acc, m) => acc + (parseFloat(m.budget) || 0), 0);
    return sum <= parentBudget;
  })
  .test('sum-of-weights', 'Total milestone weight cannot exceed 100%', function(milestonesValue) {
    const sum = (milestonesValue || []).reduce((acc, m) => acc + (parseFloat(m.weight_percentage) || 0), 0);
    return sum <= 100.1;
  })
});

const defaultMilestone = (no = 1) => ({
  milestone_no: no,
  title: '',
  description: '',
  budget: '',
  weight_percentage: '',
  start_date: '',
  due_date: '',
});

// ─── Unified Project Form Modal ───────────────────────────────────────────────
// Props:
//   project?  — if provided → Edit mode; omit → Create mode
//   onClose   — called when modal should close
//   onCreate? — called after successful create (receives new project data)
//   onSave?   — called after successful update (receives updated project data)
export default function ProjectFormModal({ project, onClose, onCreate, onSave }) {
  const isEdit = Boolean(project?.id);
  const isProjectCompleted = isEdit && project?.status === 'completed';

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm',
    variant: 'primary',
    promptPlaceholder: '',
    defaultValue: '',
    onConfirm: () => {},
  });

  const showConfirm = ({
    title,
    message,
    type = 'confirm',
    variant = 'primary',
    confirmText,
    cancelText,
    promptPlaceholder = '',
    defaultValue = '',
    onConfirm,
    onCancel,
  }) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      type,
      variant,
      confirmText,
      cancelText,
      promptPlaceholder,
      defaultValue,
      onConfirm: async (val) => {
        if (onConfirm) await onConfirm(val);
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
      onCancel: () => {
        if (onCancel) onCancel();
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  // ── Form state — defaulted from project if editing ────────────────────────
  const [title, setTitle] = useState(project?.title || '');
  const [description, setDescription] = useState(project?.description || '');
  const [projectType, setProjectType] = useState(project?.project_type || 'fixed');
  const [category, setCategory] = useState(project?.category || '');
  const [priority, setPriority] = useState(project?.priority || 'medium');
  const [status, setStatus] = useState(project?.status || 'open');
  const [budget, setBudget] = useState(project?.budget || '');
  const [estimatedHours, setEstimatedHours] = useState(project?.estimated_hours || '');
  const [startDate, setStartDate] = useState(
    project?.start_date ? project.start_date.substring(0, 10) : ''
  );
  const [endDate, setEndDate] = useState(
    project?.end_date
      ? project.end_date.substring(0, 10)
      : project?.deadline
        ? project.deadline.substring(0, 10)
        : ''
  );

  // Skills + deliverable tags as arrays
  const [skills, setSkills] = useState(
    project?.project_skills
      ? project.project_skills.map(s => s.skill_name)
      : (project?.skills || [])
  );
  const [tags, setTags] = useState(
    project?.project_tags
      ? project.project_tags.map(t => t.tag_name)
      : (project?.tags || [])
  );

  // Milestones
  const [milestones, setMilestones] = useState(() => {
    const initialList = project?.milestones?.length > 0
      ? project.milestones.map((ms, idx) => ({
          id: ms.id,
          milestone_no: ms.milestone_no || idx + 1,
          title: ms.title || '',
          description: ms.description || '',
          budget: ms.budget || '',
          weight_percentage: ms.weight_percentage || '',
          start_date: ms.start_date ? ms.start_date.substring(0, 10) : '',
          due_date: ms.due_date ? ms.due_date.substring(0, 10) : '',
        }))
      : [defaultMilestone(1)];
    return initialList;
  });

  const sumWeights = milestones.reduce((sum, m) => sum + (parseFloat(m.weight_percentage) || 0), 0);
  const sumBudgets = milestones.reduce((sum, m) => sum + (parseFloat(m.budget) || 0), 0);
  const projBudget = parseFloat(budget) || 0;

  // ── Suggestion lists ──────────────────────────────────────────────────────
  const [allSkills, setAllSkills] = useState([]);
  const [allDeliverables, setAllDeliverables] = useState([]);
  const [allCategories, setAllCategories] = useState([]);

  // ── File state ────────────────────────────────────────────────────────────
  const [existingFiles, setExistingFiles] = useState(project?.files || []);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  // ── UI state ──────────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch suggestion lists on mount
  useEffect(() => {
    api.get('/projects/meta/skills').then(res => setAllSkills(res.skills || [])).catch(() => {});
    api.get('/projects/meta/deliverables').then(res => setAllDeliverables(res.deliverables || [])).catch(() => {});
    api.get('/projects/meta/categories').then(res => setAllCategories(res.categories || [])).catch(() => {});
  }, []);

  // In edit mode: fetch full project files
  useEffect(() => {
    if (isEdit && project?.id) {
      api.get(`/projects/${project.id}`)
        .then(res => {
          if (res.project?.files) setExistingFiles(res.project.files);
        })
        .catch(() => {});
    }
  }, [isEdit, project?.id]);

  // ── Milestone helpers ─────────────────────────────────────────────────────
  const addMilestone = () => {
    setMilestones(prev => {
      const { updatedExisting, newWeight } = adjustMilestoneWeightsOnAdd(prev);
      const newMs = {
        ...defaultMilestone(prev.length + 1),
        weight_percentage: newWeight,
      };
      return [...updatedExisting, newMs];
    });
  };

  const handleNormalizeWeights = () => {
    setMilestones(prev => normalizeWeights(prev));
    toast.success('Milestone weights auto-balanced to sum to exactly 100%!');
  };

  const updateMilestone = (index, field, value) =>
    setMilestones(prev => {
      const newList = prev.map((item, idx) => idx === index ? { ...item, [field]: value } : item);
      return newList;
    });

  const removeMilestone = (index) =>
    setMilestones(prev =>
      prev.filter((_, idx) => idx !== index).map((item, idx) => ({ ...item, milestone_no: idx + 1 }))
    );

  // ── File helpers ──────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    if (e.target.files) setSelectedFiles(prev => [...prev, ...Array.from(e.target.files)]);
  };

  const removeSelectedFile = (index) =>
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== index));

  const handleRemoveExistingFile = (fileId) => {
    showConfirm({
      title: 'Delete Document',
      message: 'Are you sure you want to delete this document?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/projects/files/${fileId}`);
          setExistingFiles(prev => prev.filter(f => f.id !== fileId));
          toast.success('Document deleted.');
        } catch {
          toast.error('Failed to delete document.');
        }
      }
    });
  };

  // ── Blur validation ───────────────────────────────────────────────────────
  const handleBlur = async (field, value) => {
    try {
      await yup.reach(projectSchema, field).validate(value);
      setErrors(prev => ({ ...prev, [field]: '' }));
    } catch (err) {
      setErrors(prev => ({ ...prev, [field]: err.message }));
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    const runValidation = async (validateBudget) => {
      try {
        await projectSchema.validate(
          { title, projectType, priority, budget, estimatedHours, startDate, endDate, description, milestones },
          { abortEarly: false, context: { validateBudget } }
        );
        return { isValid: true, errors: {} };
      } catch (err) {
        if (err.name === 'ValidationError') {
          const newErrors = {};
          err.inner.forEach(e => { newErrors[e.path] = e.message; });
          return { isValid: false, errors: newErrors, inner: err.inner };
        }
        throw err;
      }
    };

    const submitPayload = async () => {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        project_type: projectType,
        priority,
        category: category.trim() || null,
        budget: budget ? parseFloat(budget) : null,
        estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
        start_date: startDate || null,
        end_date: endDate || null,
        skills,
        tags,
        milestones: milestones
          .filter(ms => ms.title && ms.title.trim() !== '')
          .map((ms, idx) => ({
            ...(ms.id ? { id: ms.id } : {}),
            milestone_no: idx + 1,
            title: ms.title.trim(),
            description: ms.description || '',
            budget: ms.budget ? parseFloat(ms.budget) : null,
            weight_percentage: ms.weight_percentage ? parseFloat(ms.weight_percentage) : null,
            start_date: ms.start_date || null,
            due_date: ms.due_date || null,
          })),
      };

      try {
        if (isEdit) {
          // ── Edit mode ──────────────────────────────────────────────────────
          await api.put(`/projects/${project.id}`, { ...payload, status });

          // Upload new files
          for (const file of selectedFiles) {
            const fd = new FormData();
            fd.append('file', file);
            await api.postFile(`/projects/${project.id}/files`, fd);
          }

          toast.success('Project updated successfully!');
          if (onSave) onSave({ ...project, ...payload, status });
        } else {
          // ── Create mode ────────────────────────────────────────────────────
          const data = await api.post('/projects', payload);
          const newProjectId = data.project.id;

          // Upload supporting docs
          for (const file of selectedFiles) {
            const fd = new FormData();
            fd.append('file', file);
            await api.postFile(`/projects/${newProjectId}/files`, fd);
          }

          toast.success('Project created successfully!');
          if (onCreate) onCreate(data.project);
        }
        onClose();
      } catch (err) {
        toast.error(err.message || (isEdit ? 'Failed to update project.' : 'Failed to create project.'));
      } finally {
        setIsSubmitting(false);
      }
    };

    const { isValid, errors: valErrors, inner } = await runValidation(true);
    if (!isValid) {
      const budgetError = inner.find(e => e.path === 'milestones' && e.type === 'budget-addition');
      const otherErrors = inner.filter(e => !(e.path === 'milestones' && e.type === 'budget-addition'));

      if (budgetError && otherErrors.length === 0) {
        showConfirm({
          title: 'Budget Validation Warning',
          message: `${budgetError.message}. Do you want to enforce this budget validation constraint (selecting 'Yes' will block saving so you can edit the budgets, while selecting 'No' will bypass this check and save)?`,
          variant: 'warning',
          confirmText: 'Yes, Enforce & Edit',
          cancelText: 'No, Bypass & Save',
          onConfirm: () => {
            setErrors({ milestones: budgetError.message });
            toast.warn('Please correct the milestone budgets.');
            setIsSubmitting(false);
          },
          onCancel: () => {
            submitPayload();
          }
        });
        return;
      } else {
        const newErrors = {};
        inner.forEach(e => { newErrors[e.path] = e.message; });
        setErrors(newErrors);
        toast.warn('Please correct validation errors.');
        setIsSubmitting(false);
        return;
      }
    }

    await submitPayload();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-[2px] z-[700]" />
      <div className="fixed left-1/2 top-1/2 z-[701] w-[90vw] max-w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-[12px] border border-[#23232a] bg-[#0c0c0e] shadow-[0_24px_80px_rgba(0,0,0,0.5)] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#23232a] px-6 py-5 bg-[#0c0c0e]">
          <div>
            <h2 className="text-white text-xl font-extrabold m-0">
              {isEdit ? 'Edit Project' : 'Create New Project'}
            </h2>
            <p className="text-gray-500 text-xs mt-1">
              {isEdit
                ? 'Modify project metadata, documents, and milestones.'
                : 'Fill in project details, documents, and milestones.'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white border-none bg-transparent cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-5 max-h-[78vh] overflow-y-auto bg-[#0c0c0e]">

          {/* Row 1: Title + Category */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="text-gray-300 text-xs font-semibold uppercase tracking-wider block">Project Title *</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={() => handleBlur('title', title)}
                className={`mt-2 w-full rounded-[6px] border ${errors.title ? 'border-red-500/80' : 'border-[#23232a] focus:border-[#70d64d]'} bg-[#0c0c0e] px-4 py-3 text-white text-[0.85rem] outline-none transition-colors`}
                placeholder="e.g. Industrial MEP HVAC Layout Drafting"
                required
                disabled={isProjectCompleted}
              />
              {errors.title && <span className="text-red-400 text-xs mt-1 block">{errors.title}</span>}
            </div>
            <div className={` ${isProjectCompleted ? 'pointer-events-none opacity-60' : ''}`}>
              <SingleAutocomplete
                label="Category"
                value={category}
                onChange={setCategory}
                suggestions={allCategories}
                placeholder="e.g. Web Development, MEP Design..."
              />
            </div>
          </div>

          {/* Row 2: Status (edit only) + Project Type */}
          <div className={`grid gap-4 ${isEdit ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
            {isEdit && (
              <div>
                <label className="text-gray-300 text-xs font-semibold uppercase tracking-wider block">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="mt-2 w-full rounded-[6px] border border-[#23232a] bg-[#0c0c0e] px-4 py-3 text-white text-[0.85rem] outline-none focus:border-[#70d64d] transition-colors cursor-pointer"
                >
                  <option value="open">Not Started (Open)</option>
                  <option value="assigned">In Progress (Assigned)</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            )}
            <div>
              <label className="text-gray-300 text-xs font-semibold uppercase tracking-wider block">Project Type</label>
              <select
                value={projectType}
                onChange={e => setProjectType(e.target.value)}
                onBlur={() => handleBlur('projectType', projectType)}
                className="mt-2 w-full rounded-[6px] border border-[#23232a] bg-[#0c0c0e] px-4 py-3 text-white text-[0.85rem] outline-none focus:border-[#70d64d] transition-colors cursor-pointer"
                disabled={isProjectCompleted}
              >
                <option value="fixed">Fixed</option>
                <option value="hourly">Hourly</option>
              </select>
            </div>
          </div>

          {/* Row 3: Priority + Budget */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="text-gray-300 text-xs font-semibold uppercase tracking-wider block">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                onBlur={() => handleBlur('priority', priority)}
                className="mt-2 w-full rounded-[6px] border border-[#23232a] bg-[#0c0c0e] px-4 py-3 text-white text-[0.85rem] outline-none focus:border-[#70d64d] transition-colors cursor-pointer"
                disabled={isProjectCompleted}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-gray-300 text-xs font-semibold uppercase tracking-wider block">Budget *</label>
              <input
                value={budget}
                onChange={e => setBudget(e.target.value)}
                onBlur={() => handleBlur('budget', budget)}
                className={`mt-2 w-full rounded-[6px] border ${errors.budget ? 'border-red-500/80' : 'border-[#23232a] focus:border-[#70d64d]'} bg-[#0c0c0e] px-4 py-3 text-white text-[0.85rem] outline-none transition-colors`}
                type="number"
                placeholder="e.g. 30000"
                required
                disabled={isProjectCompleted}
              />
              {errors.budget && <span className="text-red-400 text-xs mt-1 block">{errors.budget}</span>}
            </div>
          </div>

          {/* Row 4: Estimated Hours + Start Date + End Date */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <label className="text-gray-300 text-xs font-semibold uppercase tracking-wider block">Estimated Hours</label>
              <input
                value={estimatedHours}
                onChange={e => setEstimatedHours(e.target.value)}
                onBlur={() => handleBlur('estimatedHours', estimatedHours)}
                className={`mt-2 w-full rounded-[6px] border ${errors.estimatedHours ? 'border-red-500/80' : 'border-[#23232a] focus:border-[#70d64d]'} bg-[#0c0c0e] px-4 py-3 text-white text-[0.85rem] outline-none transition-colors`}
                type="number"
                placeholder="e.g. 80"
                disabled={isProjectCompleted}
              />
              {errors.estimatedHours && <span className="text-red-400 text-xs mt-1 block">{errors.estimatedHours}</span>}
            </div>
            <div>
              <label className="text-gray-300 text-xs font-semibold uppercase tracking-wider block">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                onBlur={() => handleBlur('startDate', startDate)}
                className={`mt-2 w-full rounded-[6px] border ${errors.startDate ? 'border-red-500/80' : 'border-[#23232a] focus:border-[#70d64d]'} bg-[#0c0c0e] px-4 py-3 text-white text-[0.85rem] outline-none transition-colors`}
                disabled={isProjectCompleted}
              />
              {errors.startDate && <span className="text-red-400 text-xs mt-1 block">{errors.startDate}</span>}
            </div>
            <div>
              <label className="text-gray-300 text-xs font-semibold uppercase tracking-wider block">End Date (Deadline)</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                onBlur={() => handleBlur('endDate', endDate)}
                className={`mt-2 w-full rounded-[6px] border ${errors.endDate ? 'border-red-500/80' : 'border-[#23232a] focus:border-[#70d64d]'} bg-[#0c0c0e] px-4 py-3 text-white text-[0.85rem] outline-none transition-colors`}
                disabled={isProjectCompleted}
              />
              {errors.endDate && <span className="text-red-400 text-xs mt-1 block">{errors.endDate}</span>}
            </div>
          </div>

          {/* Project Description Rich Text */}
          <div>
            <label className="text-gray-300 text-xs font-semibold uppercase tracking-wider block">
              Project Description * <span className="text-gray-600 normal-case font-normal">(Rich Text)</span>
            </label>
            <div className={`rounded-[8px] border ${errors.description ? 'border-red-500/80' : 'border-transparent'} ${isProjectCompleted ? 'pointer-events-none opacity-60' : ''}`}>
              <RichTextEditor
                value={description}
                onChange={val => {
                  setDescription(val);
                  if (errors.description) {
                    const plain = val.replace(/<[^>]*>/g, '').trim();
                    if (plain.length >= 10) setErrors(prev => ({ ...prev, description: '' }));
                  }
                }}
                onBlur={() => handleBlur('description', description)}
                placeholder="Provide a detailed description of the project deliverables and specifications..."
              />
            </div>
            {errors.description && <span className="text-red-400 text-xs mt-1 block">{errors.description}</span>}
          </div>

          {/* Skills + Deliverables Autocomplete */}
          <div className={`grid gap-4 lg:grid-cols-2 ${isProjectCompleted ? 'pointer-events-none opacity-60' : ''}`}>
            <MultiAutocomplete
              label="Required Skills & Expertise"
              value={skills}
              onChange={setSkills}
              suggestions={allSkills}
              placeholder="Type skill, press Enter or comma..."
            />
            <MultiAutocomplete
              label="Project Deliverables"
              value={tags}
              onChange={setTags}
              suggestions={allDeliverables}
              placeholder="Type deliverable, press Enter or comma..."
            />
          </div>

          {/* Supporting Documents */}
          <div className={`space-y-3 border border-[#23232a] rounded-[8px] p-4 ${isProjectCompleted ? 'pointer-events-none opacity-60' : ''}`}>
            <div>
              <h4 className="text-white text-sm font-semibold m-0">Supporting Documents</h4>
              <p className="text-gray-500 text-xs m-0 mb-3">
                {isEdit ? 'Manage existing or upload new files.' : 'Upload documents and assets for this project.'}
              </p>
            </div>
            
            <div 
              className={`dropzone-container border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[120px] ${
                isDragActive ? 'border-[#b5ff14] bg-[#b5ff14]/5' : 'border-[#23232a] bg-[#121215] hover:border-white/20'
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              <input 
                type="file" 
                multiple 
                ref={fileInputRef}
                className="hidden" 
                onChange={handleFileChange} 
              />
              <div className="flex flex-col items-center gap-1.5 text-gray-400">
                <UploadCloud size={24} className="text-gray-500" />
                <span className="text-[0.8rem] font-medium text-white">
                  Drag &amp; drop files here, or <span className="text-[#b5ff14] font-semibold hover:underline">browse</span>
                </span>
                <span className="text-[0.7rem] text-gray-500">
                  Multiple files supported
                </span>
              </div>
            </div>

            {/* Existing files (edit mode) */}
            {isEdit && existingFiles.length > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                <span className="text-gray-500 text-[0.7rem] uppercase font-bold tracking-wider">Uploaded Files:</span>
                {existingFiles.map(file => (
                  <div key={file.id} className="flex justify-between items-center bg-[#121215] border border-[#23232a] px-3 py-2 rounded-[6px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip size={14} className="text-gray-500 shrink-0" />
                      <a
                        href={file.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white text-[0.8rem] hover:text-[#70d64d] hover:underline truncate font-semibold"
                      >
                        {file.file_name}
                      </a>
                    </div>
                    <button type="button" onClick={() => handleRemoveExistingFile(file.id)}
                      className="bg-transparent border-none text-[#ef4444] hover:text-red-400 cursor-pointer p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Newly selected files */}
            {selectedFiles.length > 0 && (
              <div className="flex flex-col gap-2 mt-3">
                {isEdit && (
                  <span className="text-amber-500 text-[0.7rem] uppercase font-bold tracking-wider">
                    New Files to Upload (Saved on submit):
                  </span>
                )}
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-[#121215] border border-[#23232a] px-3 py-2 rounded-[6px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip size={14} className="text-gray-500 shrink-0" />
                      <span className="text-white text-[0.8rem] truncate font-semibold">{file.name}</span>
                      <span className="text-gray-500 text-[0.7rem]">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button type="button" onClick={() => removeSelectedFile(idx)}
                      className="bg-transparent border-none text-[#ef4444] hover:text-red-400 cursor-pointer p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Milestones */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-t border-[#23232a] pt-4">
              <div>
                <h3 className="text-white font-extrabold text-sm uppercase tracking-wider m-0">Milestones</h3>
                <p className="text-gray-500 text-xs mt-1">
                  {isEdit ? 'Manage milestone tasks.' : 'Add milestone details and release budgets.'}
                </p>
              </div>
              {!isProjectCompleted && (
                <div className="flex gap-2">
                  <button type="button" onClick={handleNormalizeWeights}
                    className="inline-flex items-center gap-2 rounded-[6px] border border-[#23232a] bg-[#0c0c0e] px-4 py-2 text-gray-300 hover:text-white font-extrabold text-[0.8rem] cursor-pointer transition-colors">
                    Auto-Balance Weights
                  </button>
                  <button type="button" onClick={addMilestone}
                    className="inline-flex items-center gap-2 rounded-[6px] bg-[#70d64d] px-4 py-2 text-black font-extrabold text-[0.8rem] border-none cursor-pointer hover:bg-[#8ee67b] transition-colors">
                    <Plus size={14} /> Add Milestone
                  </button>
                </div>
              )}
            </div>

            {/* Real-time Calculation Panel */}
            <div className="bg-[#121215] border border-[#23232a] rounded-[8px] p-4 text-[0.8rem] space-y-2">
              <div className="flex justify-between items-center text-gray-300">
                <span>Total Milestone Weight:</span>
                <span className={`font-bold ${Math.abs(sumWeights - 100) < 0.1 ? 'text-[#70d64d]' : sumWeights > 100 ? 'text-red-400' : 'text-amber-400'}`}>
                  {sumWeights.toFixed(1)}% / 100%
                </span>
              </div>
              
              <div className="flex justify-between items-center text-gray-300">
                <span>Total Milestone Budget:</span>
                <span className={`font-bold ${sumBudgets <= projBudget ? 'text-white' : 'text-red-400'}`}>
                  {sumBudgets.toLocaleString()} of {projBudget.toLocaleString()}
                </span>
              </div>

              {sumBudgets > projBudget && (
                <div className="text-red-400 text-[0.75rem] font-medium bg-red-400/5 p-2 rounded border border-red-400/10 mt-1">
                  ⚠️ Milestone budgets exceed project budget.
                </div>
              )}

              {sumWeights > 100.1 && (
                <div className="text-red-400 text-[0.75rem] font-medium bg-red-400/5 p-2 rounded border border-red-400/10 mt-1">
                  ⚠️ Milestone weights exceed 100%. Please adjust them or click &quot;Auto-Balance Weights&quot;.
                </div>
              )}
              
              {sumWeights < 99.9 && (
                <div className="text-amber-400 text-[0.75rem] font-medium bg-amber-400/5 p-2 rounded border border-amber-400/10 mt-1">
                  💡 Note: Milestone weights are at {sumWeights.toFixed(1)}%. You can save now or add more milestones up to 100%. Click &quot;Auto-Balance Weights&quot; to scale them up.
                </div>
              )}

              {Math.abs(sumWeights - 100) < 0.1 && (
                <div className="text-[#70d64d] text-[0.75rem] font-medium bg-[#70d64d]/5 p-2 rounded border border-[#70d64d]/10 mt-1">
                  ✅ Milestone weights sum up to exactly 100%.
                </div>
              )}
            </div>

            {errors.milestones && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-[6px] p-3 font-semibold">
                {errors.milestones}
              </div>
            )}

            {milestones.map((milestone, index) => (
              <div key={index} className="rounded-[8px] border border-[#23232a] bg-[#121215] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-white font-bold text-sm m-0">Milestone #{milestone.milestone_no}</h4>
                    <p className="text-gray-500 text-xs mt-1">Define the work package and release amount.</p>
                  </div>
                  {milestones.length > 1 && !isProjectCompleted && (
                    <button type="button" onClick={() => removeMilestone(index)}
                      className="text-red-400 hover:text-red-300 border-none bg-transparent cursor-pointer">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className={`grid gap-4 lg:grid-cols-2 mt-4 ${isProjectCompleted ? 'pointer-events-none opacity-60' : ''}`}>
                  <div>
                    <label className="text-gray-300 text-xs">Title *</label>
                    <input
                      value={milestone.title}
                      onChange={e => updateMilestone(index, 'title', e.target.value)}
                      className="mt-2 w-full rounded-[6px] border border-[#23232a] bg-[#0c0c0e] px-4 py-3 text-white text-[0.85rem] outline-none focus:border-[#70d64d] transition-colors"
                      placeholder="e.g. Design Wireframes Approval"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 text-xs">Budget *</label>
                    <input
                      value={milestone.budget}
                      onChange={e => updateMilestone(index, 'budget', e.target.value)}
                      className="mt-2 w-full rounded-[6px] border border-[#23232a] bg-[#0c0c0e] px-4 py-3 text-white text-[0.85rem] outline-none focus:border-[#70d64d] transition-colors"
                      type="number"
                      placeholder="e.g. 12000"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 text-xs">Weight % *</label>
                    <input
                      value={milestone.weight_percentage}
                      onChange={e => updateMilestone(index, 'weight_percentage', e.target.value)}
                      className={`mt-2 w-full rounded-[6px] border ${errors[`milestones[${index}].weight_percentage`] ? 'border-red-500/80' : 'border-[#23232a] focus:border-[#70d64d]'} bg-[#0c0c0e] px-4 py-3 text-white text-[0.85rem] outline-none transition-colors`}
                      type="number"
                      step="any"
                      placeholder="e.g. 25"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 text-xs">Start Date</label>
                    <input
                      type="date"
                      value={milestone.start_date}
                      onChange={e => updateMilestone(index, 'start_date', e.target.value)}
                      className="mt-2 w-full rounded-[6px] border border-[#23232a] bg-[#0c0c0e] px-4 py-3 text-white text-[0.85rem] outline-none focus:border-[#70d64d] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 text-xs">Due Date</label>
                    <input
                      type="date"
                      value={milestone.due_date}
                      onChange={e => updateMilestone(index, 'due_date', e.target.value)}
                      className="mt-2 w-full rounded-[6px] border border-[#23232a] bg-[#0c0c0e] px-4 py-3 text-white text-[0.85rem] outline-none focus:border-[#70d64d] transition-colors"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="text-gray-300 text-xs">Description</label>
                    <RichTextEditor
                      value={milestone.description}
                      onChange={val => updateMilestone(index, 'description', val)}
                      placeholder="e.g. Complete wireframes, interactive user flows..."
                      compact
                      minHeight="100px"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#23232a]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-[6px] border border-[#23232a] bg-[#0c0c0e] px-5 py-3 text-[0.85rem] text-gray-300 hover:text-white cursor-pointer transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-[6px] bg-[#70d64d] px-6 py-3 text-[0.85rem] font-bold text-black border-none cursor-pointer hover:bg-[#8ee67b] transition disabled:opacity-50"
            >
              {isSubmitting
                ? (isEdit ? 'Saving...' : 'Creating...')
                : (isEdit ? 'Save Changes' : 'Create Project')}
            </button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        variant={confirmConfig.variant}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        promptPlaceholder={confirmConfig.promptPlaceholder}
        defaultValue={confirmConfig.defaultValue}
        onConfirm={confirmConfig.onConfirm}
        onCancel={confirmConfig.onCancel || (() => setConfirmConfig(prev => ({ ...prev, isOpen: false })))}
      />
    </>
  );
}
