import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { RichTextEditor } from '../AdminShared';

export default function MilestoneModal({ milestone = null, onClose, onSave, projectBudget = 0, existingMilestones = [] }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('');
  const [weightPercentage, setWeightPercentage] = useState('');
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    if (milestone) {
      setTitle(milestone.title || '');
      setDescription(milestone.description || '');
      setStartDate(milestone.start_date ? milestone.start_date.substring(0, 10) : '');
      setDueDate(milestone.due_date ? milestone.due_date.substring(0, 10) : '');
      setAmount(milestone.budget || milestone.amount || '');
      setWeightPercentage(milestone.weight_percentage || '');
      setStatus(milestone.status || 'pending');
    }
  }, [milestone]);



  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      title: title.trim(),
      description: description ? description.trim() : '',
      start_date: startDate || null,
      due_date: dueDate || null,
      budget: amount ? Number(amount) : null,
      amount: amount ? Number(amount) : null,
      weight_percentage: weightPercentage ? Number(weightPercentage) : null,
      status,
    };
    onSave(payload);
  };

  const inputClass = "mt-2 w-full rounded-[8px] border border-[#23232a] bg-[#0c0c0e] px-4 py-3 text-white text-[0.85rem] outline-none focus:border-[#70d64d] transition-colors";

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-[6px] z-[800]" />
      
      {/* Modal Container */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[580px] bg-[#121215] border border-[#23232a] rounded-[16px] p-[24px] text-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] z-[801] flex flex-col gap-4">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#23232a] pb-3">
          <h3 className="m-0 text-[1.15rem] font-extrabold text-white">
            {milestone ? 'Edit Milestone' : 'Add Milestone'}
          </h3>
          <button onClick={onClose} className="bg-transparent border-none text-gray-500 hover:text-white cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Scrollable Fields Wrapper */}
          <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
            
            {/* Title */}
            <div>
              <label className="text-gray-300 text-xs">Title *</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className={inputClass} 
                placeholder="e.g. Design Wireframes Approval"
                required 
              />
            </div>

            {/* Amount & Weight */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-300 text-xs">Amount (Budget) *</label>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  className={inputClass} 
                  placeholder="e.g. 15000"
                  required 
                />
              </div>
              <div>
                <label className="text-gray-300 text-xs">Weight % *</label>
                <input 
                  type="number" 
                  step="any"
                  value={weightPercentage} 
                  onChange={(e) => setWeightPercentage(e.target.value)} 
                  className={inputClass} 
                  placeholder="e.g. 25"
                  required 
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-300 text-xs">Start Date</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  className={inputClass} 
                />
              </div>
              <div>
                <label className="text-gray-300 text-xs">Due Date</label>
                <input 
                  type="date" 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)} 
                  className={inputClass} 
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-gray-300 text-xs">Status</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)} 
                className={inputClass}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed" className='cursor-not-allowed text-gray-500' disabled title='to mark milestone as completed use mark as complete cta on milestone card'>Completed</option>
              </select>
            </div>

            {/* Description (Rich Text Editor) */}
            <div>
              <label className="text-gray-300 text-xs">Description</label>
              <div className="mt-2">
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Describe the milestone goals, deliverables, and approval criteria..."
                  compact
                  minHeight="120px"
                />
              </div>
            </div>

          </div>

          {/* Footer Actions (Fixed at the bottom of form) */}
          <div className="flex justify-end gap-3 border-t border-[#23232a] pt-4 mt-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="bg-transparent border border-[#2c2c35] text-[#a1a1aa] rounded-[8px] px-5 py-2.5 text-[0.85rem] font-semibold cursor-pointer hover:bg-white/[0.02] transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="bg-[#70d64d] text-black border-none rounded-[8px] px-6 py-2.5 text-[0.85rem] font-bold cursor-pointer hover:bg-[#8ee67b] transition-colors"
            >
              {milestone ? 'Save Changes' : 'Create Milestone'}
            </button>
          </div>

        </form>
      </div>
    </>
  );
}
