import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../store/useAuthStore';
import './Profile.css';
import { api } from '../../utils/api';

// Import subcomponents
import { ProfileSkeleton } from '../../components/Profile/ProfileSkeleton';
import { ProfileHeader } from '../../components/Profile/ProfileHeader';
import { ProfileStats } from '../../components/Profile/ProfileStats';
import { ProfileAbout } from '../../components/Profile/ProfileAbout';
import { WorkHistory } from '../../components/Profile/WorkHistory';
import { TeamStructure } from '../../components/Profile/TeamStructure';
import { CapabilityCloud } from '../../components/Profile/CapabilityCloud';
import { ServiceSpecs } from '../../components/Profile/ServiceSpecs';
import { DocumentsList } from '../../components/Profile/DocumentsList';
import { EditProfileModal } from '../../components/Profile/EditProfileModal';
import { profileGigExpertSchema, profileAgencySchema } from '../../components/Profile/ProfileSchema';


const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const SERVICE_LABELS = {
  BIM: 'BIM & 2D Drafting',
  Audit: 'As-Built Audit',
  Peer: 'Peer Review',
  BOQ: 'BOQ Creation',
  Viz: '3D Visualisation',
};

const FIELD_TABS = {
  title: 'basic',
  availability: 'basic',
  experienceYears: 'basic',
  hourlyRate: 'basic',
  bio: 'basic',
  agencyName: 'basic',
  industry: 'basic',
  description: 'basic',
  employeeCount: 'basic',
  foundedYear: 'basic',
  city: 'basic',
  country: 'basic',
  selectedServices: 'services',
  commercialBasis: 'commercials',
  noticePeriod: 'commercials',
  portfolioUrl: 'commercials',
  website: 'commercials',
  linkedinUrl: 'commercials',
  portfolioPdfUrl: 'commercials',
  legalNamePan: 'legal',
  personalPan: 'legal',
  resumeUrl: 'legal',
  companyPan: 'legal',
  gstNumber: 'legal',
  cin: 'legal'
};

export const Profile = () => {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const isLoading = useAuthStore((state) => state.isProfileLoading);
  const error = useAuthStore((state) => state.profileError);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState('basic');
  const [errors, setErrors] = useState({});
  const [documents, setDocuments] = useState([]);


  const fetchDocuments = async () => {
    try {
      const res = await api.get('/profiles/documents');
      if (res && res.success) {
        setDocuments(res.documents || []);
      }
    } catch (err) {
      console.error('Failed to load profile documents:', err);
    }
  };

  const handleUploadDocument = async (formData) => {
    try {
      const res = await api.postFile('/profiles/documents', formData);
      if (res && res.success) {
        toast.success('Document uploaded successfully!');
        fetchDocuments();
        return true;
      }
      return false;
    } catch (err) {
      toast.error(err.message || 'Failed to upload document.');
      return false;
    }
  };

  const handleRenameDocument = async (id, newName) => {
    try {
      const res = await api.put(`/profiles/documents/${id}`, { documentName: newName });
      if (res && res.success) {
        toast.success('Document renamed successfully!');
        fetchDocuments();
        return true;
      }
      return false;
    } catch (err) {
      toast.error(err.message || 'Failed to rename document.');
      return false;
    }
  };

  const handleDeleteDocument = async (id) => {
    try {
      const res = await api.delete(`/profiles/documents/${id}`);
      if (res && res.success) {
        toast.success('Document deleted successfully!');
        fetchDocuments();
        return true;
      }
      return false;
    } catch (err) {
      toast.error(err.message || 'Failed to delete document.');
      return false;
    }
  };



  useEffect(() => {
    fetchProfile();
    fetchDocuments();
  }, [fetchProfile]);

  useEffect(() => {
    if (isEditModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isEditModalOpen]);

  const handleEditClick = () => {
    setActiveTab('basic');
    const isGigExpertRole = user?.role === 'gig_expert';
    const initialSelectedServices = profile?.service_details?.selectedServices || [];
    const bimDetails = profile?.service_details?.bimDetails || { softwareStack: [], maxLod: '', cdeExperience: '' };
    const auditDetails = profile?.service_details?.auditDetails || { equipmentOwned: '', serviceRadius: '' };
    const peerReviewDetails = profile?.service_details?.peerReviewDetails || { teamExperience: '', specialisation: '' };
    const boqDetails = profile?.service_details?.boqDetails || { measurementStandards: '', estimationSoftware: '' };
    const vizDetails = profile?.service_details?.vizDetails || { renderingEngines: '', hardwareCapacity: '', animationCapability: 'No' };
    
    if (isGigExpertRole) {
      setFormData({
        title: profile?.title || '',
        bio: profile?.bio || '',
        experienceYears: profile?.experience_years || 0,
        hourlyRate: profile?.hourly_rate || 0,
        availability: profile?.availability || 'AVAILABLE',
        portfolioUrl: profile?.portfolio_url || '',
        resumeUrl: profile?.resume_url || '',
        portfolioPdfUrl: profile?.portfolio_pdf_url || '',
        linkedinUrl: profile?.linkedin_url || '',
        legalNamePan: profile?.legal_name_pan || '',
        personalPan: profile?.personal_pan || '',
        commercialBasis: profile?.commercial_basis || '',
        noticePeriod: profile?.notice_period || '',
        selectedServices: initialSelectedServices,
        skillsList: (profile?.gig_expert_skills || []).map(s => s.skill_name).join(', '),
        bimDetails,
        auditDetails,
        peerReviewDetails,
        boqDetails,
        vizDetails,
        profilePhoto: profile?.user?.profile_photo || '',
      });
    } else {
      setFormData({
        agencyName: profile?.agency_name || '',
        description: profile?.description || '',
        gstNumber: profile?.gst_number || '',
        website: profile?.website || '',
        portfolioPdfUrl: profile?.portfolio_pdf_url || '',
        employeeCount: profile?.employee_count || 0,
        foundedYear: profile?.founded_year || 2020,
        industry: profile?.industry || '',
        city: profile?.city || '',
        country: profile?.country || '',
        linkedinUrl: profile?.linkedin_url || '',
        cin: profile?.cin || '',
        companyPan: profile?.company_pan || '',
        commercialBasis: profile?.commercial_basis || '',
        noticePeriod: profile?.notice_period || '',
        selectedServices: initialSelectedServices,
        bimDetails,
        auditDetails,
        peerReviewDetails,
        boqDetails,
        vizDetails,
        logo: profile?.logo || '',
      });
    }
    setErrors({});
    setIsEditModalOpen(true);
  };

  const handleServiceToggle = (serviceId) => {
    const currentSelected = formData.selectedServices || [];
    const newSelected = currentSelected.includes(serviceId)
      ? currentSelected.filter(id => id !== serviceId)
      : [...currentSelected, serviceId];
    
    setFormData({ ...formData, selectedServices: newSelected });
    if (errors.selectedServices) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.selectedServices;
        return copy;
      });
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isGigExpert) {
          setFormData((prev) => ({ ...prev, profilePhoto: reader.result }));
        } else {
          setFormData((prev) => ({ ...prev, logo: reader.result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNestedChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handleSoftwareToggle = (swName) => {
    setFormData((prev) => {
      const stack = prev.bimDetails?.softwareStack || [];
      const newStack = stack.includes(swName)
        ? stack.filter((s) => s !== swName)
        : [...stack, swName];
      return {
        ...prev,
        bimDetails: { ...prev.bimDetails, softwareStack: newStack }
      };
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const isGigExpertRole = user?.role === 'gig_expert';

    // Yup Validation
    const schema = isGigExpertRole ? profileGigExpertSchema : profileAgencySchema;
    try {
      await schema.validate(formData, { abortEarly: false });
      setErrors({});
    } catch (err) {
      if (err.inner) {
        const newErrors = {};
        err.inner.forEach((validationError) => {
          newErrors[validationError.path] = validationError.message;
        });
        setErrors(newErrors);

        // Switch to the tab containing the first error
        const firstErrorField = err.inner[0].path;
        const targetTab = FIELD_TABS[firstErrorField] || 'basic';
        setActiveTab(targetTab);

        toast.warning('Please correct form validation errors before saving.');
      } else {
        toast.error(err.message || 'Validation failed.');
      }
      setIsSaving(false);
      return;
    }

    let payload = { ...formData };
    
    // Normalize and clean payload data
    if (isGigExpertRole) {
      payload.personalPan = (formData.personalPan || '').trim().toUpperCase();
      payload.legalNamePan = (formData.legalNamePan || '').trim();
    } else {
      payload.companyPan = (formData.companyPan || '').trim().toUpperCase();
    }

    const serviceDetails = {
      selectedServices: formData.selectedServices || [],
      bimDetails: formData.bimDetails || { softwareStack: [], maxLod: '', cdeExperience: '' },
      auditDetails: formData.auditDetails || { equipmentOwned: '', serviceRadius: '' },
      peerReviewDetails: formData.peerReviewDetails || { teamExperience: '', specialisation: '' },
      boqDetails: formData.boqDetails || { measurementStandards: '', estimationSoftware: '' },
      vizDetails: formData.vizDetails || { renderingEngines: '', hardwareCapacity: '', animationCapability: 'No' }
    };
    
    payload.serviceDetails = serviceDetails;

    if (isGigExpertRole) {
      const customSkills = formData.skillsList
        ? formData.skillsList.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      payload.skillsList = Array.from(new Set([...customSkills, ...formData.selectedServices]));
      payload.experienceYears = parseInt(formData.experienceYears, 10) || 0;
      payload.hourlyRate = parseFloat(formData.hourlyRate) || 0;
    } else {
      payload.employeeCount = formData.employeeCount ? parseInt(formData.employeeCount, 10) : 0;
      payload.foundedYear = formData.foundedYear ? parseInt(formData.foundedYear, 10) : 2020;
    }
    
    delete payload.selectedServices;
    delete payload.bimDetails;
    delete payload.auditDetails;
    delete payload.peerReviewDetails;
    delete payload.boqDetails;
    delete payload.vizDetails;

    const res = await updateProfile(payload);
    setIsSaving(false);
    if (res && res.success) {
      toast.success('Profile updated successfully!');
      setIsEditModalOpen(false);
    } else {
      toast.error(res?.error || 'Failed to update profile.');
    }
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return (
      <div className="profile-workspace-view text-center p-10">
        <p className="text-[#ef4444] font-semibold">Failed to load profile details: {error}</p>
      </div>
    );
  }

  const role = user?.role || 'gig_expert';
  const isGigExpert = role === 'gig_expert';
  const name = isGigExpert ? profile?.user?.full_name : profile?.agency_name;
  const avatar = isGigExpert ? profile?.user?.profile_photo : profile?.logo;
  const subtitle = isGigExpert ? profile?.title : profile?.industry || 'Digital Services Agency';
  const emailVal = profile?.user?.email;
  const phoneVal = profile?.user?.mobile;
  const locationVal = profile?.city && profile?.country ? `${profile.city}, ${profile.country}` : 'Not Specified';
  const webVal = isGigExpert ? profile?.portfolio_url : profile?.website;
  const initials = getInitials(name);

  const skills = isGigExpert 
    ? (profile?.gig_expert_skills || [])
    : (profile?.service_details?.selectedServices || []).map(code => ({ skill_name: SERVICE_LABELS[code] || code }));
  
  const isIncomplete = profile && (profile.profile_completion ?? 0) <= 70;

  return (
    <div className="profile-workspace-view animate-fade-in">
      {isIncomplete && (
        <div className="bg-gradient-to-r from-[rgba(181,255,20,0.06)] to-[rgba(18,18,21,0.95)] border border-[rgba(181,255,20,0.3)] rounded-xl p-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 shadow-xl relative overflow-hidden backdrop-blur-md">
          {/* Decorative glow effect */}
          <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-[#b5ff14] opacity-[0.03] blur-[80px] pointer-events-none rounded-full" />
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#b5ff14] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#b5ff14]"></span>
              </span>
              <h3 className="text-white font-extrabold text-[1.1rem] tracking-wide m-0">
                Action Required: Complete Your Profile ({profile.profile_completion ?? 0}%)
              </h3>
            </div>
            
            <p className="text-gray-300 text-[0.88rem] leading-relaxed mb-4 max-w-4xl">
              Your profile is currently only <strong>{profile.profile_completion ?? 0}%</strong> complete. To gain full access to the GigFactory platform and apply for active gigs or view projects, you must complete at least <strong>70%</strong> of your profile.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div className="bg-[#121215] border border-[#23232a] rounded-lg p-3">
                <h4 className="text-white font-bold text-[0.8rem] mb-1">🚀 Visibility & Gigs</h4>
                <p className="text-gray-500 text-[0.75rem] leading-snug">
                  Complete profiles rank higher in search algorithms. Clients and admins prioritize candidates with fully defined skills.
                </p>
              </div>
              <div className="bg-[#121215] border border-[#23232a] rounded-lg p-3">
                <h4 className="text-white font-bold text-[0.8rem] mb-1">🤝 Trust & Bid Success</h4>
                <p className="text-gray-500 text-[0.75rem] leading-snug">
                  Adding experience, portfolio links, and bio builds client trust, making you 5x more likely to win active proposals.
                </p>
              </div>
              <div className="bg-[#121215] border border-[#23232a] rounded-lg p-3">
                <h4 className="text-white font-bold text-[0.8rem] mb-1">📋 Legal Compliance</h4>
                <p className="text-gray-500 text-[0.75rem] leading-snug">
                  Verified documents (such as PAN cards and resumes) are mandatory to qualify for legal contracts and payout processing.
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleEditClick}
            className="whitespace-nowrap bg-[#b5ff14] text-black font-extrabold text-[0.85rem] px-6 py-3 rounded-lg cursor-pointer hover:bg-[#a2e60c] transition-all duration-200 shadow-[0_0_15px_rgba(181,255,20,0.25)] hover:scale-[1.02]"
          >
            Complete Profile Now
          </button>
        </div>
      )}

      <ProfileHeader
        
        isGigExpert={isGigExpert}
        name={name}
        avatar={avatar}
        subtitle={subtitle}
        emailVal={emailVal}
        phoneVal={phoneVal}
        locationVal={locationVal}
        webVal={webVal}
        foundedYear={profile?.founded_year}
        initials={initials}
        availability={profile?.availability}
        handleEditClick={handleEditClick}
      />

      <ProfileStats
        isGigExpert={isGigExpert}
        totalProjects={profile?.total_projects}
        hourlyRate={profile?.hourly_rate}
        commercialBasis={profile?.commercial_basis}
        employeeCount={profile?.employee_count}
      />

      <div className="profile-details-split-grid">
        <div className="profile-details-left-pane">
          <ProfileAbout
            isGigExpert={isGigExpert}
            bio={profile?.bio}
            description={profile?.description}
          />

          {isGigExpert ? (
            <WorkHistory workHistory={profile?.work_history} />
          ) : (
            <TeamStructure teamMembers={profile?.team_members || []} employeeCount={profile?.employee_count} />
          )}
        </div>

        <div className="profile-details-right-pane">
          <CapabilityCloud
            isGigExpert={isGigExpert}
            skills={skills}
          />

          <ServiceSpecs serviceDetails={profile?.service_details} />

          <DocumentsList 
         
            isGigExpert={isGigExpert}
            resumeUrl={profile?.resume_url}
            portfolioPdfUrl={profile?.portfolio_pdf_url}
            verifications={profile?.verifications}
            documents={documents}
            onUpload={handleUploadDocument}
            onRename={handleRenameDocument}
            onDelete={handleDeleteDocument}
            isAdmin={false}
          />
        </div>
      </div>

      {isEditModalOpen && (
        <EditProfileModal
          isGigExpert={isGigExpert}
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          setErrors={setErrors}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isSaving={isSaving}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleFormSubmit}
          profile={profile}
          handlePhotoUpload={handlePhotoUpload}
          handleServiceToggle={handleServiceToggle}
          handleSoftwareToggle={handleSoftwareToggle}
          handleNestedChange={handleNestedChange}
        />
      )}
    </div>
  );
};