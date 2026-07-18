import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Upload, X, Loader, Pencil, Folder, Paperclip, Save } from 'lucide-react';
import { api } from '../../utils/api';

export default function ApplyModal({ project, onClose, defaultRole = 'gig_expert', onApplied, existingApplication }) {
  const isEditMode = !!existingApplication;

  const [bidAmount, setBidAmount] = useState(isEditMode ? String(existingApplication.bid_amount) : '');
  const [estimatedDays, setEstimatedDays] = useState(isEditMode ? String(existingApplication.estimated_days) : '');
  const [proposal, setProposal] = useState(isEditMode ? (existingApplication.proposal || '') : '');
  const [coverLetter, setCoverLetter] = useState(isEditMode ? (existingApplication.cover_letter || '') : '');
  
  // Validation Errors State
  const [errors, setErrors] = useState({ bidAmount: '', estimatedDays: '', proposal: '' });

  // File Upload State
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  // Track if user wants to remove the existing attachment
  const [removeExistingAttachment, setRemoveExistingAttachment] = useState(false);


  const handleBidAmountBlur = () => {
    if (!bidAmount) {
      setErrors(prev => ({ ...prev, bidAmount: 'Bid amount is required.' }));
    } else if (isNaN(Number(bidAmount)) || Number(bidAmount) <= 0) {
      setErrors(prev => ({ ...prev, bidAmount: 'Please enter a valid positive bid amount.' }));
    } else {
      setErrors(prev => ({ ...prev, bidAmount: '' }));
    }
  };

  const handleEstimatedDaysBlur = () => {
    if (!estimatedDays) {
      setErrors(prev => ({ ...prev, estimatedDays: 'Estimated duration is required.' }));
    } else if (isNaN(Number(estimatedDays)) || Number(estimatedDays) <= 0) {
      setErrors(prev => ({ ...prev, estimatedDays: 'Please enter a valid positive number of days.' }));
    } else {
      setErrors(prev => ({ ...prev, estimatedDays: '' }));
    }
  };



  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = React.useRef(null);

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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleClearFile = () => {
    setFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Trigger validation on all fields before submitting
    let hasErrors = false;
    const currentErrors = { bidAmount: '', estimatedDays: '', proposal: '' };

    if (!bidAmount) {
      currentErrors.bidAmount = 'Bid amount is required.';
      hasErrors = true;
    } else if (isNaN(Number(bidAmount)) || Number(bidAmount) <= 0) {
      currentErrors.bidAmount = 'Please enter a valid positive bid amount.';
      hasErrors = true;
    }

    if (!estimatedDays) {
      currentErrors.estimatedDays = 'Estimated duration is required.';
      hasErrors = true;
    } else if (isNaN(Number(estimatedDays)) || Number(estimatedDays) <= 0) {
      currentErrors.estimatedDays = 'Please enter a valid positive number of days.';
      hasErrors = true;
    }

    if (proposal && proposal.trim().length > 0 && proposal.trim().length < 20) {
      currentErrors.proposal = 'Proposal must be at least 20 characters long.';
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(currentErrors);
      return toast.error('Please correct the validation errors before submitting.');
    }

    try {
      setSubmitting(true);

      // Construct multipart form data for file attachment support
      const formData = new FormData();
      formData.append('bid_amount', bidAmount);
      formData.append('estimated_days', estimatedDays);
      formData.append('proposal', proposal);
      if (coverLetter) formData.append('cover_letter', coverLetter);
      if (file) formData.append('attachment', file);
      // Signal to backend to clear attachment if user removed it
      if (isEditMode && removeExistingAttachment && !file) {
        formData.append('attachment_url', '');
      }

      if (isEditMode) {
        await api.putFile(`/projects/applications/${existingApplication.id}/edit`, formData);
        toast.success('Your proposal has been updated successfully!');
      } else {
        await api.postFile(`/projects/${project.id}/applications`, formData);
        toast.success('Your application/bid has been submitted successfully!');
      }
      
      if (onApplied) onApplied();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to submit bid/proposal.');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/80 backdrop-blur-[4px] z-[9998] transition-opacity duration-150" 
      />
      
      {/* Modal Container */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-lg bg-[#0c0c0e] border border-[#23232a] rounded-[10px] p-6 md:p-8 z-[9999] shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        <header className="flex justify-between items-start mb-6">
          <div className="space-y-1 min-w-0 pr-6">
            <div className="flex items-center gap-2">
              {isEditMode && <Pencil size={14} className="text-[#70d64d] shrink-0" />}
              <h3 className="text-lg font-bold text-white tracking-tight">
                {isEditMode ? 'Edit Proposal' : 'Submit Bid Proposal'}
              </h3>
            </div>
            <p className="text-xs text-gray-500 truncate">{project.title} ({project.project_code})</p>
            {isEditMode && (
              <p className="text-[10.5px] text-amber-400/80 font-medium">
                ⚠️ Editing is only allowed while your proposal is under initial review.
              </p>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-white border border-[#23232a] rounded-[6px] p-1.5 transition-all duration-150 bg-transparent cursor-pointer" 
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </header>


        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="bidAmount" className="text-xs font-bold text-gray-400">Your Bid Amount (₹) *</label>
              <input 
                type="number" 
                id="bidAmount"
                value={bidAmount}
                onChange={(e) => {
                  setBidAmount(e.target.value);
                  if (errors.bidAmount) setErrors(prev => ({ ...prev, bidAmount: '' }));
                }}
                onBlur={handleBidAmountBlur}
                placeholder="e.g. 25000"
                className={`w-full bg-[#121214] border ${errors.bidAmount ? 'border-red-500/80 focus:border-red-500' : 'border-[#23232a] focus:border-[#70d64d]'} text-white rounded-[6px] py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-[#70d64d]/10 transition-all duration-150`}
                required
              />
              {errors.bidAmount && <span className="text-red-400 text-[10px] font-semibold mt-0.5">{errors.bidAmount}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="estimatedDays" className="text-xs font-bold text-gray-400">Estimated Duration (Days) *</label>
              <input 
                type="number" 
                id="estimatedDays"
                value={estimatedDays}
                onChange={(e) => {
                  setEstimatedDays(e.target.value);
                  if (errors.estimatedDays) setErrors(prev => ({ ...prev, estimatedDays: '' }));
                }}
                onBlur={handleEstimatedDaysBlur}
                placeholder="e.g. 15"
                className={`w-full bg-[#121214] border ${errors.estimatedDays ? 'border-red-500/80 focus:border-red-500' : 'border-[#23232a] focus:border-[#70d64d]'} text-white rounded-[6px] py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-[#70d64d]/10 transition-all duration-150`}
                required
              />
              {errors.estimatedDays && <span className="text-red-400 text-[10px] font-semibold mt-0.5">{errors.estimatedDays}</span>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="proposal" className="text-xs font-bold text-gray-400">Execution Proposal &amp; Strategy (Optional)</label>
            <textarea 
              id="proposal"
              rows={4}
              value={proposal}
              onChange={(e) => {
                setProposal(e.target.value);
                if (errors.proposal) setErrors(prev => ({ ...prev, proposal: '' }));
              }}
              // onBlur={handleProposalBlur}
              placeholder="Describe your step-by-step approach, references, and relevant experience..."
              className={`w-full bg-[#121214] border ${errors.proposal ? 'border-red-500/80 focus:border-red-500' : 'border-[#23232a] focus:border-[#70d64d]'} text-white rounded-[6px] py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-[#70d64d]/10 transition-all duration-150 resize-none`}
            
            />
            {errors.proposal ? (
              <span className="text-red-400 text-[10px] font-semibold mt-0.5">{errors.proposal}</span>
            ) : (
              <span className="text-[10px] text-gray-500">Min 20 characters. Explain why you are the best fit.</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="coverLetter" className="text-xs font-bold text-gray-400">Cover Letter (Optional)</label>
            <textarea 
              id="coverLetter"
              rows={3}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Brief message to the project administrators..."
              className="w-full bg-[#121214] border border-[#23232a] text-white rounded-[6px] py-3 px-4 text-sm outline-none focus:border-[#70d64d] focus:ring-2 focus:ring-[#70d64d]/10 transition-all duration-150 resize-none"
            />
          </div>

          {/* Document Attachment Upload */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-400">Supporting Attachment (Optional)</label>
            
            {/* Show existing attachment in edit mode */}
            {isEditMode && existingApplication.attachment_url && !removeExistingAttachment && !file && (
              <div className="bg-[#121214] border border-[#1e1e24] rounded-[6px] p-3 flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0 pr-4">
                  
                  <Paperclip className="text-[#70d64d]" size={18} />
                  <a
                    href={existingApplication.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#70d64d] font-semibold hover:underline truncate"
                  >
                    Current Attachment
                  </a>
                  <span className="text-[10px] text-gray-500 shrink-0">(existing)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRemoveExistingAttachment(true)}
                  className="text-gray-500 hover:text-red-400 p-1 transition bg-transparent border-none cursor-pointer"
                  aria-label="Remove existing attachment"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {(!isEditMode || !existingApplication?.attachment_url || removeExistingAttachment) && !file ? (
              <div 
                className={`dropzone-container border border-dashed rounded-[6px] p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[110px] ${
                  isDragActive ? 'border-[#70d64d] bg-[#70d64d]/5' : 'border-[#23232a] bg-[#121214] hover:border-white/20'
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.zip,.rar,.tar,.doc,.docx"
                  className="hidden"
                />
                <Upload size={20} className="text-[#70d64d] mb-1" />
                <span className="text-xs text-gray-400">
                  {(isEditMode && removeExistingAttachment) ? 'Upload a replacement file' : 'Drag & drop file here, or'} <span className="text-[#70d64d] font-semibold hover:underline">browse</span>
                </span>
                <span className="text-[10px] text-gray-500 mt-1">PDF, Word, or Zip up to 25MB</span>
              </div>
            ) : file ? (
              <div className="bg-[#121214] border border-[#1e1e24] rounded-[6px] p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 pr-4">
                  <span className="text-lg shrink-0">📄</span>
                  <span className="text-xs text-gray-300 font-semibold truncate">{file.name}</span>
                  <span className="text-[10px] text-gray-500 shrink-0">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
                <button 
                  type="button" 
                  onClick={handleClearFile} 
                  className="text-gray-500 hover:text-white p-1 transition bg-transparent border-none cursor-pointer"
                  aria-label="Remove attachment"
                >
                  <X size={14} />
                </button>
              </div>
            ) : null}

          </div>

          <div className="flex justify-end items-center gap-3 pt-3 border-t border-[#1e1e24]">
            <button 
              type="button" 
              onClick={onClose} 
              className="bg-transparent border border-[#23232a] hover:bg-white/5 hover:border-gray-500 text-white font-bold px-5 py-2.5 rounded-[6px] text-xs transition duration-150 cursor-pointer"
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="bg-[#70d64d] text-black hover:bg-[#60c43d] font-bold px-5 py-2.5 rounded-[6px] text-xs flex items-center gap-1.5 shadow-[0_4px_12px_rgba(112,214,77,0.2)] disabled:opacity-50 transition duration-150 cursor-pointer"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader size={14} className="animate-spin" /> {isEditMode ? 'Updating...' : 'Submitting...'}
                </>
              ) : isEditMode ? (
                <><Save size={13} /> Update Proposal</>
              ) : 'Submit Proposal'}
            </button>
          </div>

        </form>
      </div>
    </>
  );
}
