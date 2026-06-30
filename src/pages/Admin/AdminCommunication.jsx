import React, { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Mail,
  Send,
  Users,
  Search,
  CheckCircle,
  XCircle,
  Info,
  RefreshCw,
  AlertCircle,
  UserCheck,
  Building,
  Upload,
  X,
  Trash2,
  Plus,
  History,
  Paperclip,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { api } from '../../utils/api';
import { toast } from 'react-toastify';

export default function AdminCommunication() {
  const [target, setTarget] = useState('roles'); // 'roles' or 'specific'
  const [selectedRoles, setSelectedRoles] = useState([]); // 'gig_expert', 'agency'
  const [selectedEmails, setSelectedEmails] = useState([]); // array of specific emails
  const [subject, setSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [resultSummary, setResultSummary] = useState(null);

  // External emails states
  const [externalEmails, setExternalEmails] = useState([]);
  const [externalEmailInput, setExternalEmailInput] = useState('');

  // Attachment state
  const [attachment, setAttachment] = useState(null);
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setAttachment(e.dataTransfer.files[0]);
    }
  };

  // History states
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace('/api', '');

  // 1. Fetch Gig Experts for specific recipient picker
  const { data: freelancersData, isLoading: isFreelancersLoading } = useQuery({
    queryKey: ['admin-gigExperts-list-comm'],
    queryFn: () => api.get('/profiles/admin/gigExperts?limit=200').then(r => r.gigExperts || []),
  });

  // 2. Fetch Agencies for specific recipient picker
  const { data: agenciesData, isLoading: isAgenciesLoading } = useQuery({
    queryKey: ['admin-agencies-list-comm'],
    queryFn: () => api.get('/profiles/admin/agencies?limit=200').then(r => r.agencies || []),
  });

  // 3. Fetch communication history
  const { data: historyResponse, isLoading: isHistoryLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['admin-communication-history', historyPage, historySearch],
    queryFn: () => api.get(`/profiles/admin/communication-history?page=${historyPage}&limit=6&search=${encodeURIComponent(historySearch)}`),
    enabled: isHistoryOpen
  });

  const isLoadingUsers = isFreelancersLoading || isAgenciesLoading;

  // Unified list of users
  const usersList = useMemo(() => {
    const list = [];
    if (freelancersData) {
      freelancersData.forEach(f => {
        list.push({
          id: f.id,
          email: f.email,
          name: f.full_name || 'Gig Expert',
          role: 'gig_expert',
          photo: f.profile_photo || null
        });
      });
    }
    if (agenciesData) {
      agenciesData.forEach(a => {
        list.push({
          id: a.id,
          email: a.email,
          name: a.agency_profile?.agency_name || a.full_name || 'Agency',
          role: 'agency',
          photo: a.profile_photo || null
        });
      });
    }
    return list;
  }, [freelancersData, agenciesData]);

  // Filter users list based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return usersList;
    const term = searchTerm.toLowerCase();
    return usersList.filter(
      u =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.role.toLowerCase().includes(term)
    );
  }, [usersList, searchTerm]);

  // Handle checking/unchecking a user email
  const handleToggleEmail = (email) => {
    if (selectedEmails.includes(email)) {
      setSelectedEmails(prev => prev.filter(e => e !== email));
    } else {
      setSelectedEmails(prev => [...prev, email]);
    }
  };

  // Toggle role checkboxes
  const handleToggleRole = (role) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(prev => prev.filter(r => r !== role));
    } else {
      setSelectedRoles(prev => [...prev, role]);
    }
  };

  // Handle select/deselect all matching search
  const handleSelectAllFiltered = () => {
    const filteredEmails = filteredUsers.map(u => u.email).filter(Boolean);
    const newEmails = [...new Set([...selectedEmails, ...filteredEmails, ...externalEmails])];
    setSelectedEmails(newEmails);
  };

  const handleClearSelected = () => {
    setSelectedEmails([]);
  };

  // Add custom manual email
  const handleAddExternalEmail = () => {
    const email = externalEmailInput.trim().toLowerCase();
    if (!email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (!selectedEmails.includes(email)) {
      setSelectedEmails(prev => [...prev, email]);
    }

    if (!externalEmails.includes(email)) {
      setExternalEmails(prev => [email, ...prev]);
    }

    setExternalEmailInput('');
    toast.success(`Added external recipient: ${email}`);
  };

  const handleRemoveExternalEmail = (email) => {
    setSelectedEmails(prev => prev.filter(e => e !== email));
    setExternalEmails(prev => prev.filter(e => e !== email));
  };

  // Handle Form Dispatch
  const handleSendEmail = async (e) => {
    e.preventDefault();
    setResultSummary(null);

    // Validations
    if (!subject.trim()) {
      toast.error('Email subject is required.');
      return;
    }

    // ReactQuill returns "<p><br></p>" when empty
    const plainTextContent = emailContent.replace(/<[^>]*>/g, '').trim();
    if (!plainTextContent) {
      toast.error('Email body content is required.');
      return;
    }

    if (target === 'roles' && selectedRoles.length === 0) {
      toast.error('Please select at least one target role category.');
      return;
    }

    if (target === 'specific' && selectedEmails.length === 0) {
      toast.error('Please select at least one recipient email.');
      return;
    }

    setIsSending(true);

    try {
      const formData = new FormData();
      formData.append('target', target);
      formData.append('subject', subject);
      formData.append('content', emailContent);

      if (target === 'roles') {
        formData.append('roles', JSON.stringify(selectedRoles));
      } else {
        formData.append('emails', JSON.stringify(selectedEmails));
      }

      if (attachment) {
        formData.append('attachment', attachment);
      }

      const res = await api.postFile('/profiles/admin/send-email', formData);
      
      if (res.success) {
        toast.success(res.message || 'Emails dispatched successfully!');
        setResultSummary(res.summary);
        
        // Clear fields on total success
        setSubject('');
        setEmailContent('');
        setSelectedEmails([]);
        setSelectedRoles([]);
        setExternalEmails([]);
        setAttachment(null);

        // Refetch history in background
        refetchHistory();
      } else {
        toast.error(res.message || 'Failed to dispatch emails.');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'An error occurred while sending emails.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-[24px] pb-[40px]">
      {/* Dynamic dark theme style injections for ReactQuill */}
      <style>{`
        .ql-container {
          background-color: #0c0c0e !important;
          border-color: #23232a !important;
          color: #fff !important;
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
          font-family: 'Inter', sans-serif !important;
        }
        .ql-toolbar {
          background-color: #121215 !important;
          border-color: #23232a !important;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          font-family: 'Inter', sans-serif !important;
        }
        .ql-snow .ql-stroke {
          stroke: #9ca3af !important;
        }
        .ql-snow .ql-fill {
          fill: #9ca3af !important;
        }
        .ql-snow .ql-picker {
          color: #9ca3af !important;
        }
        .ql-editor {
          min-height: 220px;
          font-size: 0.88rem;
          line-height: 1.6;
        }
        .ql-editor.ql-blank::before {
          color: #4b5563 !important;
          font-style: normal !important;
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-[16px]">
        <div>
          <h1 className="text-white text-[1.8rem] font-extrabold m-0 tracking-tight">Admin Communication</h1>
          <p className="text-gray-400 text-[0.85rem] mt-[4px]">Send direct announcements or newsletters via email to portal users</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsHistoryOpen(true);
            setHistoryPage(1);
          }}
          className="flex items-center gap-[8px] bg-[#121215] hover:bg-[#23232a] text-white px-[16px] py-[10px] rounded-[8px] font-bold text-[0.85rem] border border-[#23232a] hover:border-[#38bdf8]/40 transition-all cursor-pointer shadow-sm"
        >
          <History size={16} className="text-[#38bdf8]" />
          View History
        </button>
      </div>

      {/* Dispatch summary results */}
      {resultSummary && (
        <div className="bg-[#121215] border border-[#23232a] rounded-[12px] p-[20px] flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-[16px] animate-fade-in">
          <div>
            <div className="flex items-center gap-[8px] text-[#70d64d]">
              <CheckCircle size={16} />
              <h4 className="text-white font-bold text-[0.95rem] m-0">Email Dispatch Complete</h4>
            </div>
            <p className="text-gray-500 text-[0.8rem] m-0 mt-[4px]">Your message was queued and dispatched to the target list.</p>
          </div>
          <div className="flex gap-[20px] bg-[#0c0c0e] px-[20px] py-[12px] rounded-[8px] border border-[#23232a] text-center self-start sm:self-auto">
            <div>
              <p className="text-gray-500 text-[0.68rem] font-bold uppercase m-0">Total</p>
              <p className="text-white text-[1.2rem] font-extrabold m-0 mt-[2px]">{resultSummary.total}</p>
            </div>
            <div className="w-[1px] bg-[#23232a]" />
            <div>
              <p className="text-[#70d64d] text-[0.68rem] font-bold uppercase m-0">Success</p>
              <p className="text-[#70d64d] text-[1.2rem] font-extrabold m-0 mt-[2px]">{resultSummary.success}</p>
            </div>
            <div className="w-[1px] bg-[#23232a]" />
            <div>
              <p className="text-[#ef4444] text-[0.68rem] font-bold uppercase m-0">Failed</p>
              <p className="text-[#ef4444] text-[1.2rem] font-extrabold m-0 mt-[2px]">{resultSummary.failed}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Form Box */}
      <form onSubmit={handleSendEmail} className="grid grid-cols-1 lg:grid-cols-3 gap-[24px]">
        {/* Left Column: Form Parameters */}
        <div className="lg:col-span-2 flex flex-col gap-[20px]">
          {/* Subject Field */}
          <div className="bg-[#121215] border border-[#23232a] rounded-[12px] p-[24px] flex flex-col gap-[16px]">
            <h3 className="text-white text-[0.95rem] font-bold m-0 flex items-center gap-[8px]">
              <Mail size={16} className="text-[#70d64d]" />
              Email Details
            </h3>

            <div className="flex flex-col gap-[6px]">
              <label className="text-gray-400 text-[0.78rem] font-bold uppercase">Subject Line</label>
              <input
                type="text"
                placeholder="Enter email subject header..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-[#0c0c0e] border border-[#23232a] focus:border-[#70d64d] text-white px-[16px] py-[10px] rounded-[8px] outline-none text-[0.88rem] transition-all"
                disabled={isSending}
              />
            </div>

            <div className="flex flex-col gap-[6px]">
              <label className="text-gray-400 text-[0.78rem] font-bold uppercase">Rich Content Message</label>
              <div className="text-[#fff]">
                <ReactQuill
                  value={emailContent}
                  onChange={setEmailContent}
                  placeholder="Draft your announcement message here..."
                  readOnly={isSending}
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      ['clean']
                    ]
                  }}
                />
              </div>
            </div>

            {/* File Attachment Selector */}
            <div className="flex flex-col gap-[6px]">
              <label className="text-gray-400 text-[0.78rem] font-bold uppercase">Attachment (Optional)</label>
              <div 
                className={`dropzone-container border border-dashed rounded-[8px] p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[120px] ${
                  isDragActive ? 'border-[#b5ff14] bg-[#b5ff14]/5' : 'border-[#23232a] bg-[#0c0c0e] hover:border-[#2f2f38]'
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
              >
                <input
                  type="file"
                  onChange={(e) => setAttachment(e.target.files[0] || null)}
                  className="hidden"
                  ref={fileInputRef}
                  disabled={isSending}
                />
                
                {attachment ? (
                  <div className="flex flex-col items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <Paperclip size={24} className="text-[#b5ff14]" />
                    <span className="text-[0.8rem] font-bold text-white max-w-[280px] truncate">
                      {attachment.name}
                    </span>
                    <span className="text-[0.7rem] text-gray-500">
                      ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setAttachment(null)}
                      className="mt-1 text-[0.75rem] text-[#ef4444] hover:underline bg-transparent border-none cursor-pointer font-bold"
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-gray-400">
                    <Upload size={24} className="text-gray-500" />
                    <span className="text-[0.8rem] font-medium text-white">
                      Drag &amp; drop file here, or <span className="text-[#b5ff14] font-semibold hover:underline">browse</span>
                    </span>
                    <span className="text-[0.7rem] text-gray-500">
                      Supports any file up to 20MB
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button Row */}
          <div className="flex justify-end gap-[12px]">
            <button
              type="submit"
              disabled={isSending}
              className="flex items-center justify-center gap-[8px] bg-[#70d64d] hover:bg-[#5bb83b] text-[#0c0c0e] px-[24px] py-[12px] rounded-[8px] font-bold text-[0.88rem] transition-all disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Sending Emails...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Dispatch Mail
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Target Selection */}
        <div className="lg:col-span-1 flex flex-col gap-[20px]">
          <div className="bg-[#121215] border border-[#23232a] rounded-[12px] p-[24px] flex flex-col gap-[20px] h-full min-h-[400px]">
            <h3 className="text-white text-[0.95rem] font-bold m-0 flex items-center gap-[8px]">
              <Users size={16} className="text-[#38bdf8]" />
              Select Recipients
            </h3>

            {/* Target Select Toggle */}
            <div className="flex gap-[4px] bg-[#0c0c0e] p-[4px] rounded-[8px] border border-[#23232a]">
              <button
                type="button"
                onClick={() => setTarget('roles')}
                className={`flex-1 py-[8px] rounded-[6px] text-[0.8rem] font-bold transition-all ${
                  target === 'roles' ? 'bg-[#23232a] text-white' : 'text-gray-500 hover:text-white'
                }`}
              >
                Bulk Categories
              </button>
              <button
                type="button"
                onClick={() => setTarget('specific')}
                className={`flex-1 py-[8px] rounded-[6px] text-[0.8rem] font-bold transition-all ${
                  target === 'specific' ? 'bg-[#23232a] text-white' : 'text-gray-500 hover:text-white'
                }`}
              >
                Specific Users
              </button>
            </div>

            {/* Option A: Role Categories Selection */}
            {target === 'roles' && (
              <div className="flex flex-col gap-[12px] animate-fade-in">
                <p className="text-gray-500 text-[0.78rem] m-0">Send email to all users belonging to selected categories.</p>

                {/* Gig Experts Category Box */}
                <div
                  onClick={() => handleToggleRole('gig_expert')}
                  className={`flex items-center justify-between p-[16px] rounded-[8px] border cursor-pointer transition-all ${
                    selectedRoles.includes('gig_expert')
                      ? 'bg-[rgba(112,214,77,0.04)] border-[#70d64d] text-white'
                      : 'bg-[#0c0c0e] border-[#23232a] text-gray-400 hover:border-[#3a3a44]'
                  }`}
                >
                  <div className="flex items-center gap-[12px]">
                    <div className="w-[36px] h-[36px] bg-[rgba(112,214,77,0.08)] border border-[rgba(112,214,77,0.15)] rounded-[6px] flex items-center justify-center">
                      <UserCheck size={16} className="text-[#70d64d]" />
                    </div>
                    <div>
                      <p className="text-white text-[0.85rem] font-bold m-0">Gig Experts</p>
                      <p className="text-gray-500 text-[0.72rem] m-0">All registered independent contractors</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes('gig_expert')}
                    onChange={() => {}} // handled by parent div click
                    className="accent-[#70d64d] pointer-events-none"
                  />
                </div>

                {/* Agencies Category Box */}
                <div
                  onClick={() => handleToggleRole('agency')}
                  className={`flex items-center justify-between p-[16px] rounded-[8px] border cursor-pointer transition-all ${
                    selectedRoles.includes('agency')
                      ? 'bg-[rgba(56,189,248,0.04)] border-[#38bdf8] text-white'
                      : 'bg-[#0c0c0e] border-[#23232a] text-gray-400 hover:border-[#3a3a44]'
                  }`}
                >
                  <div className="flex items-center gap-[12px]">
                    <div className="w-[36px] h-[36px] bg-[rgba(56,189,248,0.08)] border border-[rgba(56,189,248,0.15)] rounded-[6px] flex items-center justify-center">
                      <Building size={16} className="text-[#38bdf8]" />
                    </div>
                    <div>
                      <p className="text-white text-[0.85rem] font-bold m-0">Agencies</p>
                      <p className="text-gray-500 text-[0.72rem] m-0">All corporate agency development teams</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes('agency')}
                    onChange={() => {}} // handled by parent div click
                    className="accent-[#38bdf8] pointer-events-none"
                  />
                </div>

                {/* Shortcut to select all */}
                <div className="flex justify-between items-center mt-[10px]">
                  <button
                    type="button"
                    onClick={() => setSelectedRoles(['gig_expert', 'agency'])}
                    className="text-[#70d64d] text-[0.75rem] font-semibold hover:underline bg-transparent border-none outline-none"
                  >
                    Select All Category Roles
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRoles([])}
                    className="text-gray-500 text-[0.75rem] font-semibold hover:underline bg-transparent border-none outline-none"
                  >
                    Clear Targets
                  </button>
                </div>
              </div>
            )}

            {/* Option B: Specific User Picker Selection */}
            {target === 'specific' && (
              <div className="flex-1 flex flex-col gap-[12px] min-h-0 animate-fade-in">
                <p className="text-gray-500 text-[0.78rem] m-0">Add custom external emails or check database users.</p>

                {/* Add External Email Box */}
                <div className="flex gap-[8px]">
                  <input
                    type="email"
                    placeholder="Enter external email..."
                    value={externalEmailInput}
                    onChange={(e) => setExternalEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddExternalEmail();
                      }
                    }}
                    className="bg-[#0c0c0e] border border-[#23232a] focus:border-[#38bdf8] text-white px-[10px] py-[6px] rounded-[6px] flex-1 text-[0.78rem] outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddExternalEmail}
                    className="bg-[#38bdf8] hover:bg-[#30a8dd] text-[#0c0c0e] px-[12px] py-[6px] rounded-[6px] font-bold text-[0.78rem] transition-all flex items-center justify-center"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className="h-[1px] bg-[#23232a] my-[2px]" />

                {/* Recipient Search Box */}
                <div className="relative">
                  <Search size={14} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search database users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-[#0c0c0e] border border-[#23232a] focus:border-[#38bdf8] text-white pl-[32px] pr-[10px] py-[6px] rounded-[6px] w-full text-[0.78rem] outline-none transition-all"
                  />
                </div>

                {/* Selected counts */}
                <div className="flex justify-between items-center text-[0.75rem]">
                  <span className="text-gray-400 font-medium">
                    Selected: <span className="text-[#38bdf8] font-bold">{selectedEmails.length}</span> recipients
                  </span>
                  <div className="flex gap-[10px]">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="text-[#38bdf8] font-semibold hover:underline bg-transparent border-none outline-none"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={handleClearSelected}
                      className="text-gray-500 font-semibold hover:underline bg-transparent border-none outline-none"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* User checklist container */}
                <div className="flex-1 min-h-[160px] max-h-[300px] overflow-y-auto bg-[#0c0c0e] border border-[#23232a] rounded-[8px] p-[8px] flex flex-col gap-[4px]">
                  
                  {/* Render External Emails First */}
                  {externalEmails.length > 0 && (
                    <>
                      <p className="text-gray-500 text-[0.65rem] font-bold uppercase m-0 p-[4px]">External Contacts</p>
                      {externalEmails.map((email) => {
                        const isChecked = selectedEmails.includes(email);
                        return (
                          <div
                            key={email}
                            onClick={() => handleToggleEmail(email)}
                            className="flex items-center gap-[10px] p-[8px] rounded-[6px] cursor-pointer transition-colors border border-[#38bdf8]/20 bg-[rgba(56,189,248,0.02)]"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="accent-[#38bdf8] pointer-events-none"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-[0.8rem] font-semibold m-0 truncate leading-normal">
                                {email}
                              </p>
                              <p className="text-[#38bdf8] text-[0.68rem] m-0 truncate leading-normal font-medium">
                                External Recipient
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveExternalEmail(email);
                              }}
                              className="text-gray-500 hover:text-[#ef4444] p-[4px] transition-colors shrink-0"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        );
                      })}
                      <div className="h-[1px] bg-[#23232a] my-[4px]" />
                    </>
                  )}

                  {/* Render Database Users */}
                  <p className="text-gray-500 text-[0.65rem] font-bold uppercase m-0 p-[4px]">GigFactory Users</p>
                  {isLoadingUsers ? (
                    <div className="py-12 flex flex-col items-center gap-[12px] text-gray-600">
                      <RefreshCw size={20} className="animate-spin text-gray-500" />
                      <span className="text-[0.72rem]">Loading users list...</span>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="py-12 text-center text-gray-600 text-[0.72rem]">
                      No matching approved users found
                    </div>
                  ) : (
                    filteredUsers.map((user) => {
                      const isChecked = selectedEmails.includes(user.email);
                      return (
                        <div
                          key={user.id}
                          onClick={() => handleToggleEmail(user.email)}
                          className={`flex items-center gap-[10px] p-[8px] rounded-[6px] cursor-pointer transition-colors border ${
                            isChecked
                              ? 'bg-[rgba(56,189,248,0.03)] border-[#38bdf8]/40 hover:bg-[rgba(56,189,248,0.06)]'
                              : 'border-transparent hover:bg-[rgba(255,255,255,0.02)]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by parent div click
                            className="accent-[#38bdf8] pointer-events-none"
                          />
                          {user.photo ? (
                            <img
                              src={user.photo}
                              alt={user.name}
                              className="w-[26px] h-[26px] rounded-full object-cover border border-[#23232a]"
                            />
                          ) : (
                            <div className="w-[26px] h-[26px] rounded-full bg-[#1c1c20] flex items-center justify-center text-[0.65rem] text-gray-300 font-bold border border-[#23232a]">
                              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-[0.8rem] font-semibold m-0 truncate leading-normal">
                              {user.name}
                            </p>
                            <p className="text-gray-500 text-[0.7rem] m-0 truncate leading-normal">
                              {user.email}
                            </p>
                          </div>
                          <span
                            className={`text-[0.6rem] font-bold px-[6px] py-[2px] rounded border uppercase shrink-0 ${
                              user.role === 'gig_expert'
                                ? 'bg-[rgba(112,214,77,0.12)] text-[#70d64d] border-[rgba(112,214,77,0.25)]'
                                : 'bg-[rgba(56,189,248,0.12)] text-[#38bdf8] border-[rgba(56,189,248,0.25)]'
                            }`}
                          >
                            {user.role}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* History Slide-Over Panel */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsHistoryOpen(false)}
          />

          {/* Drawer container */}
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-[550px] bg-[#121215] border-l border-[#23232a] shadow-2xl flex flex-col h-full transform transition-all duration-300">
              
              {/* Drawer Header */}
              <div className="p-[24px] border-b border-[#23232a] flex flex-col gap-[16px]">
                <div className="flex items-center justify-between">
                  <h2 className="text-white text-[1.2rem] font-extrabold m-0 flex items-center gap-[8px]">
                    <History size={20} className="text-[#38bdf8]" />
                    Sent Communication History
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsHistoryOpen(false)}
                    className="text-gray-400 hover:text-white p-[6px] rounded-full hover:bg-[#23232a] transition-all cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* History Search bar */}
                <div className="relative">
                  <Search size={14} className="absolute left-[12px] top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by subject, content or sender..."
                    value={historySearch}
                    onChange={(e) => {
                      setHistorySearch(e.target.value);
                      setHistoryPage(1);
                    }}
                    className="bg-[#0c0c0e] border border-[#23232a] focus:border-[#38bdf8] text-white pl-[36px] pr-[16px] py-[8px] rounded-[8px] w-full text-[0.8rem] outline-none transition-all"
                  />
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-[24px] flex flex-col gap-[16px] bg-[#0c0c0e]">
                {isHistoryLoading ? (
                  <div className="flex flex-col gap-[12px] py-12 justify-center items-center text-gray-500">
                    <RefreshCw size={24} className="animate-spin text-[#38bdf8]" />
                    <span className="text-[0.8rem]">Loading communication logs...</span>
                  </div>
                ) : !historyResponse?.data || historyResponse.data.length === 0 ? (
                  <div className="text-center py-20 text-gray-500 text-[0.85rem] flex flex-col items-center gap-[12px]">
                    <Mail size={32} className="text-gray-700" />
                    <span>No past dispatched communications found.</span>
                  </div>
                ) : (
                  historyResponse.data.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedHistoryItem(item)}
                      className="bg-[#121215] border border-[#23232a] hover:border-[#3a3a44] p-[16px] rounded-[10px] cursor-pointer transition-all flex flex-col gap-[12px]"
                    >
                      <div className="flex justify-between items-start gap-[12px]">
                        <h4 className="text-white text-[0.88rem] font-bold m-0 line-clamp-1 flex-1">
                          {item.subject}
                        </h4>
                        <span className="text-gray-500 text-[0.72rem] shrink-0">
                          {new Date(item.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <p className="text-gray-400 text-[0.78rem] line-clamp-2 m-0" dangerouslySetInnerHTML={{ __html: item.content.replace(/<[^>]*>/g, '') }} />

                      <div className="flex flex-wrap items-center justify-between gap-[10px] pt-[8px] border-t border-[#23232a]/60 text-[0.75rem]">
                        <div className="flex items-center gap-[6px] text-gray-400">
                          <div className="w-[18px] h-[18px] rounded-full bg-[#23232a] flex items-center justify-center text-[0.55rem] text-gray-300 font-bold">
                            {item.sender?.full_name?.[0]?.toUpperCase() || 'A'}
                          </div>
                          <span className="truncate max-w-[120px]">{item.sender?.full_name || 'Admin'}</span>
                        </div>

                        <div className="flex items-center gap-[8px]">
                          {item.attachment_name && (
                            <div className="flex items-center gap-[4px] text-[#38bdf8] bg-[rgba(56,189,248,0.08)] px-[6px] py-[2px] rounded border border-[rgba(56,189,248,0.15)] text-[0.68rem]">
                              <Paperclip size={10} />
                              <span className="max-w-[80px] truncate">{item.attachment_name}</span>
                            </div>
                          )}

                          <span className={`px-[6px] py-[2px] rounded text-[0.68rem] font-bold ${
                            item.target === 'roles' 
                              ? 'bg-[rgba(112,214,77,0.12)] text-[#70d64d]' 
                              : 'bg-[rgba(56,189,248,0.12)] text-[#38bdf8]'
                          }`}>
                            {item.target === 'roles' ? 'Roles' : 'Specific'}
                          </span>

                          <span className="text-gray-400 font-medium">
                            Sent: <strong className="text-white">{item.success_count}</strong>/{item.recipients_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer / Pagination */}
              {historyResponse?.pagination && historyResponse.pagination.totalPages > 1 && (
                <div className="p-[20px] border-t border-[#23232a] flex items-center justify-between bg-[#121215]">
                  <span className="text-gray-500 text-[0.75rem]">
                    Page {historyPage} of {historyResponse.pagination.totalPages}
                  </span>
                  <div className="flex gap-[8px]">
                    <button
                      type="button"
                      disabled={historyPage === 1}
                      onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                      className="p-[6px] rounded-[6px] border border-[#23232a] text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#23232a] transition-all cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      disabled={historyPage === historyResponse.pagination.totalPages}
                      onClick={() => setHistoryPage(prev => Math.min(historyResponse.pagination.totalPages, prev + 1))}
                      className="p-[6px] rounded-[6px] border border-[#23232a] text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#23232a] transition-all cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-[16px] animate-fade-in">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setSelectedHistoryItem(null)}
          />

          {/* Modal Container */}
          <div className="relative bg-[#121215] border border-[#23232a] w-full max-w-[650px] max-h-[90vh] rounded-[16px] shadow-2xl flex flex-col overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-[24px] border-b border-[#23232a] flex justify-between items-start">
              <div>
                <span className="text-gray-500 text-[0.72rem] uppercase font-bold tracking-wider flex items-center gap-[6px]">
                  <Calendar size={12} />
                  {new Date(selectedHistoryItem.created_at).toLocaleString()}
                </span>
                <h3 className="text-white text-[1.15rem] font-extrabold m-0 mt-[6px] tracking-tight line-clamp-2">
                  {selectedHistoryItem.subject}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHistoryItem(null)}
                className="text-gray-400 hover:text-white p-[6px] rounded-full hover:bg-[#23232a] transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-[24px] flex flex-col gap-[20px] overflow-y-auto flex-1">
              
              {/* Metadata Info Panel */}
              <div className="grid grid-cols-2 gap-[16px] bg-[#0c0c0e] border border-[#23232a] rounded-[12px] p-[16px] text-[0.8rem]">
                <div>
                  <span className="text-gray-500 font-medium block">Sender Admin</span>
                  <span className="text-white font-semibold block mt-[2px] truncate">
                    {selectedHistoryItem.sender?.full_name || 'System Admin'} ({selectedHistoryItem.sender?.email})
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium block">Recipient Summary</span>
                  <span className="text-white font-semibold block mt-[2px]">
                    {selectedHistoryItem.success_count} Dispatched / {selectedHistoryItem.recipients_count} Target
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 font-medium block">Target List ({selectedHistoryItem.target === 'roles' ? 'Categories' : 'Specific Recipients'})</span>
                  <div className="flex flex-wrap gap-[6px] mt-[4px] max-h-[100px] overflow-y-auto">
                    {Array.isArray(selectedHistoryItem.target_details) ? (
                      selectedHistoryItem.target_details.map((detail, idx) => (
                        <span 
                          key={idx} 
                          className="bg-[#23232a] text-gray-300 border border-[#2d2d37] px-[8px] py-[2px] rounded-[4px] text-[0.72rem] select-all font-medium"
                        >
                          {detail}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 font-medium">{String(selectedHistoryItem.target_details)}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Rich Body Content */}
              <div className="flex flex-col gap-[6px]">
                <span className="text-gray-500 text-[0.75rem] uppercase font-bold">Email Content Body</span>
                <div 
                  className="bg-[#0c0c0e] border border-[#23232a] rounded-[10px] p-[20px] text-gray-200 text-[0.88rem] overflow-y-auto max-h-[300px] leading-relaxed ql-editor"
                  dangerouslySetInnerHTML={{ __html: selectedHistoryItem.content }}
                />
              </div>

              {/* Persisted File Attachment Download Box */}
              {selectedHistoryItem.attachment_name && (
                <div className="flex flex-col gap-[6px]">
                  <span className="text-gray-500 text-[0.75rem] uppercase font-bold">Campaign Attachment</span>
                  <div className="flex items-center justify-between bg-[#0c0c0e] border border-[#23232a] rounded-[10px] p-[16px] hover:border-[#2f2f38] transition-colors">
                    <div className="flex items-center gap-[12px] min-w-0">
                      <div className="w-[38px] h-[38px] rounded-[8px] bg-[rgba(56,189,248,0.08)] border border-[rgba(56,189,248,0.15)] flex items-center justify-center shrink-0">
                        <Paperclip size={18} className="text-[#38bdf8]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-[0.82rem] font-bold m-0 truncate leading-snug">
                          {selectedHistoryItem.attachment_name}
                        </p>
                        <p className="text-gray-500 text-[0.7rem] m-0 truncate mt-[1px]">
                          Click download to fetch this file from the server
                        </p>
                      </div>
                    </div>
                    
                    {selectedHistoryItem.attachment_path ? (
                      <a
                        href={`${apiBase}${selectedHistoryItem.attachment_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={selectedHistoryItem.attachment_name}
                        className="bg-[#38bdf8] hover:bg-[#30a8dd] text-[#0c0c0e] px-[16px] py-[8px] rounded-[6px] font-extrabold text-[0.78rem] transition-all flex items-center gap-[6px] shrink-0 shadow-sm cursor-pointer"
                      >
                        <Download size={14} />
                        Download
                      </a>
                    ) : (
                      <span className="text-gray-500 text-[0.7rem] italic">Path unavailable</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-[20px] bg-[#0c0c0e] border-t border-[#23232a] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedHistoryItem(null)}
                className="bg-[#23232a] hover:bg-[#2e2e38] text-white px-[20px] py-[10px] rounded-[8px] font-bold text-[0.85rem] border border-[#2d2d37] transition-all cursor-pointer"
              >
                Close details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
