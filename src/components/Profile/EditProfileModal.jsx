import React from 'react';
import { createPortal } from 'react-dom';
import { Check, X, FileText } from 'lucide-react';
import { api } from '../../utils/api';
import { toast } from 'react-toastify';

const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const EditProfileModal = ({
  isGigExpert,
  formData,
  setFormData,
  errors = {},
  setErrors,
  activeTab,
  setActiveTab,
  isSaving,
  onClose,
  onSubmit,
  profile,
  handlePhotoUpload,
  handleServiceToggle,
  handleSoftwareToggle,
  handleNestedChange
}) => {
  const handleFieldChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };
  const [uploadingPdf, setUploadingPdf] = React.useState(false);
  const [uploadedPdfName, setUploadedPdfName] = React.useState('');
  const portfolioPdfInputRef = React.useRef(null);

  React.useEffect(() => {
    if (formData.portfolioPdfUrl) {
      const parts = formData.portfolioPdfUrl.split('/');
      setUploadedPdfName(parts[parts.length - 1]);
    } else {
      setUploadedPdfName('');
    }
  }, [formData.portfolioPdfUrl]);

  const handlePortfolioPdfChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Max allowed size is 10MB.');
      return;
    }

    setUploadingPdf(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);

      const res = await api.postFile('/auth/upload', uploadData);
      if (res && res.success) {
        setFormData({ ...formData, portfolioPdfUrl: res.fileUrl });
        setUploadedPdfName(file.name);
        toast.success('Portfolio PDF uploaded successfully!');
      } else {
        toast.error(res.message || 'Upload failed.');
      }
    } catch (err) {
      toast.error(err.message || 'Upload failed.');
    } finally {
      setUploadingPdf(false);
    }
  };
  return createPortal(
    <div className="profile-modal-overlay">
      <div className="profile-modal-card">
        <div className="profile-modal-header">
          <h2>Edit Profile Details</h2>
          <button type="button" className="profile-modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>
        
        <div className="profile-modal-tabs">
          {['basic', 'services', 'commercials', 'legal'].map((tab) => (
            <button 
              key={tab}
              type="button" 
              className={`tab-link ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'basic' && 'Basic Info'}
              {tab === 'services' && 'Services Offered'}
              {tab === 'commercials' && 'Commercials & Links'}
              {tab === 'legal' && 'Legal & Tax'}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="profile-modal-form">
          <div className="profile-modal-scroll-area">
            {activeTab === 'basic' && (
              <>
                <div className="form-group avatar-upload-group flex flex-row items-center gap-5 mb-5 border-b border-[#23232a] pb-5">
                  <div className="avatar-preview-box w-20 h-20 rounded-xl border border-[#23232a] bg-[#1c1c22] flex items-center justify-center overflow-hidden text-[#8a8f98] text-2xl font-extrabold">
                    {isGigExpert ? (
                      formData.profilePhoto ? (
                        <img src={formData.profilePhoto} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        getInitials(profile?.user?.full_name)
                      )
                    ) : (
                      formData.logo ? (
                        <img src={formData.logo} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        getInitials(profile?.agency_name)
                      )
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="m-0">{isGigExpert ? 'Profile Photo' : 'Agency Logo'}</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="avatar-file-input"
                    />
                    <button
                      type="button"
                      className="edit-profile-action-btn text-[0.8rem] py-1.5 px-3"
                      onClick={() => document.getElementById('avatar-file-input').click()}
                    >
                      Upload Photo
                    </button>
                  </div>
                </div>

                {isGigExpert ? (
                  <>
                    <div className="form-row-2">
                      <div className="form-group">
                        <label>Professional Title</label>
                        <input
                          type="text"
                          value={formData.title || ''}
                          onChange={(e) => handleFieldChange('title', e.target.value)}
                          placeholder="e.g. Senior BIM Modeler"
                        />
                        {errors.title && <span className="validation-error">{errors.title}</span>}
                      </div>
                      <div className="form-group">
                        <label>Availability Status</label>
                        <select
                          value={formData.availability || 'AVAILABLE'}
                          onChange={(e) => handleFieldChange('availability', e.target.value)}
                        >
                          <option value="AVAILABLE">AVAILABLE</option>
                          <option value="NOT AVAILABLE">NOT AVAILABLE</option>
                        </select>
                        {errors.availability && <span className="validation-error">{errors.availability}</span>}
                      </div>
                    </div>
                    
                    <div className="form-row-2">
                      <div className="form-group">
                        <label>Years of Experience</label>
                        <input
                          type="number"
                          value={formData.experienceYears || ''}
                          onChange={(e) => handleFieldChange('experienceYears', e.target.value)}
                          placeholder="e.g. 5"
                        />
                        {errors.experienceYears && <span className="validation-error">{errors.experienceYears}</span>}
                      </div>
                      <div className="form-group">
                        <label>Hourly Rate (INR)</label>
                        <input
                          type="number"
                          value={formData.hourlyRate || ''}
                          onChange={(e) => handleFieldChange('hourlyRate', e.target.value)}
                          placeholder="e.g. 1500"
                        />
                        {errors.hourlyRate && <span className="validation-error">{errors.hourlyRate}</span>}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Biography</label>
                      <textarea
                        rows={4}
                        value={formData.bio || ''}
                        onChange={(e) => handleFieldChange('bio', e.target.value)}
                        placeholder="Write a short summary about your professional background..."
                      />
                      {errors.bio && <span className="validation-error">{errors.bio}</span>}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-row-2">
                      <div className="form-group">
                        <label>Agency Name</label>
                        <input
                          type="text"
                          value={formData.agencyName || ''}
                          onChange={(e) => handleFieldChange('agencyName', e.target.value)}
                          placeholder="e.g. Matrix Design Studios"
                        />
                        {errors.agencyName && <span className="validation-error">{errors.agencyName}</span>}
                      </div>
                      <div className="form-group">
                        <label>Industry Sector</label>
                        <input
                          type="text"
                          value={formData.industry || ''}
                          onChange={(e) => handleFieldChange('industry', e.target.value)}
                          placeholder="e.g. Construction & Engineering"
                        />
                        {errors.industry && <span className="validation-error">{errors.industry}</span>}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>About Our Agency</label>
                      <textarea
                        rows={4}
                        value={formData.description || ''}
                        onChange={(e) => handleFieldChange('description', e.target.value)}
                        placeholder="Describe your agency's services and focus areas..."
                      />
                      {errors.description && <span className="validation-error">{errors.description}</span>}
                    </div>

                    <div className="form-row-2">
                      <div className="form-group">
                        <label>Total Employees</label>
                        <input
                          type="number"
                          value={formData.employeeCount || ''}
                          onChange={(e) => handleFieldChange('employeeCount', e.target.value)}
                          placeholder="e.g. 50"
                        />
                        {errors.employeeCount && <span className="validation-error">{errors.employeeCount}</span>}
                      </div>
                      <div className="form-group">
                        <label>Founded Year</label>
                        <input
                          type="number"
                          value={formData.foundedYear || ''}
                          onChange={(e) => handleFieldChange('foundedYear', e.target.value)}
                          placeholder="e.g. 2018"
                        />
                        {errors.foundedYear && <span className="validation-error">{errors.foundedYear}</span>}
                      </div>
                    </div>

                    <div className="form-row-2">
                      <div className="form-group">
                        <label>City</label>
                        <input
                          type="text"
                          value={formData.city || ''}
                          onChange={(e) => handleFieldChange('city', e.target.value)}
                          placeholder="e.g. Mumbai"
                        />
                        {errors.city && <span className="validation-error">{errors.city}</span>}
                      </div>
                      <div className="form-group">
                        <label>Country</label>
                        <input
                          type="text"
                          value={formData.country || ''}
                          onChange={(e) => handleFieldChange('country', e.target.value)}
                          placeholder="e.g. India"
                        />
                        {errors.country && <span className="validation-error">{errors.country}</span>}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {activeTab === 'services' && (
              <div className="form-group">
                <label className="mb-3">Services Provided (Select at least one)</label>
                <div className="services-checkbox-grid">
                  {[
                    { id: 'BIM', label: 'BIM & 2D Drafting' },
                    { id: 'Audit', label: 'As-Built Audit' },
                    { id: 'Peer', label: 'Peer Review' },
                    { id: 'BOQ', label: 'BOQ Creation' },
                    { id: 'Viz', label: '3D Visualisation' }
                  ].map((service) => {
                    const isChecked = (formData.selectedServices || []).includes(service.id);
                    return (
                      <div 
                        key={service.id} 
                        className={`service-checkbox-card ${isChecked ? 'active' : ''}`}
                        onClick={() => handleServiceToggle(service.id)}
                      >
                        <div className="checkbox-indicator">
                          {isChecked && <Check size={12} strokeWidth={3} color="#000" />}
                        </div>
                        <span className="checkbox-label">{service.label}</span>
                      </div>
                    );
                  })}
                </div>
                {errors.selectedServices && <span className="validation-error mb-[15px]">{errors.selectedServices}</span>}

                <div className="dynamic-panels-container flex flex-col gap-4 mt-4">
                  {(formData.selectedServices || []).includes('BIM') && (
                    <div className="nested-service-panel">
                      <h4 className="nested-panel-title">BIM &amp; 2D Drafting Details</h4>
                      <div className="form-group mb-[15px]">
                        <label>SOFTWARE STACK</label>
                        <div className="software-chips">
                          {['Revit', 'AutoCAD', 'Navisworks', 'Tekla', 'Civil 3D'].map((sw) => {
                            const isSel = (formData.bimDetails?.softwareStack || []).includes(sw);
                            return (
                              <div 
                                key={sw} 
                                className={`software-chip ${isSel ? 'active' : ''}`}
                                onClick={() => handleSoftwareToggle(sw)}
                              >
                                {sw}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="form-row-2">
                        <div className="form-group">
                          <label>MAX LOD CAPABILITY</label>
                          <select 
                            value={formData.bimDetails?.maxLod || ''}
                            onChange={(e) => handleNestedChange('bimDetails', 'maxLod', e.target.value)}
                          >
                            <option value="">Select option</option>
                            <option value="LOD 300">LOD 300</option>
                            <option value="LOD 350">LOD 350</option>
                            <option value="LOD 400">LOD 400</option>
                            <option value="LOD 500">LOD 500</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>CDE EXPERIENCE</label>
                          <input 
                            type="text"
                            placeholder="e.g., BIM 360, ACC, ProjectWise"
                            value={formData.bimDetails?.cdeExperience || ''}
                            onChange={(e) => handleNestedChange('bimDetails', 'cdeExperience', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {(formData.selectedServices || []).includes('Audit') && (
                    <div className="nested-service-panel">
                      <h4 className="nested-panel-title">As-Built Audit Details</h4>
                      <div className="form-row-2">
                        <div className="form-group">
                          <label>EQUIPMENT OWNED</label>
                          <input 
                            type="text"
                            placeholder="e.g., Laser Scanner, Total Station, Drone"
                            value={formData.auditDetails?.equipmentOwned || ''}
                            onChange={(e) => handleNestedChange('auditDetails', 'equipmentOwned', e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>SERVICE RADIUS</label>
                          <select 
                            value={formData.auditDetails?.serviceRadius || ''}
                            onChange={(e) => handleNestedChange('auditDetails', 'serviceRadius', e.target.value)}
                          >
                            <option value="">Select option</option>
                            <option value="City-wide">City-wide</option>
                            <option value="State-wide">State-wide</option>
                            <option value="Nationwide">Nationwide</option>
                            <option value="Pan-India + Export">Pan-India + Export</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {(formData.selectedServices || []).includes('Peer') && (
                    <div className="nested-service-panel">
                      <h4 className="nested-panel-title">Peer Review Details</h4>
                      <div className="form-row-2">
                        <div className="form-group">
                          <label>{isGigExpert ? 'TOTAL YEARS OF EXPERIENCE *' : 'TOTAL TEAM EXPERIENCE *'}</label>
                          <input 
                            type="text"
                            placeholder="e.g., 5, 8"
                            value={formData.peerReviewDetails?.teamExperience || ''}
                            onChange={(e) => handleNestedChange('peerReviewDetails', 'teamExperience', e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>SPECIALISATION</label>
                          <select 
                            value={formData.peerReviewDetails?.specialisation || ''}
                            onChange={(e) => handleNestedChange('peerReviewDetails', 'specialisation', e.target.value)}
                          >
                            <option value="">Select option</option>
                            <option value="Structural">Structural</option>
                            <option value="MEP">MEP</option>
                            <option value="Architectural">Architectural</option>
                            <option value="Fire &amp; Life Safety">Fire &amp; Life Safety</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {(formData.selectedServices || []).includes('BOQ') && (
                    <div className="nested-service-panel">
                      <h4 className="nested-panel-title">BOQ Details</h4>
                      <div className="form-row-2">
                        <div className="form-group">
                          <label>MEASUREMENT STANDARDS</label>
                          <select 
                            value={formData.boqDetails?.measurementStandards || ''}
                            onChange={(e) => handleNestedChange('boqDetails', 'measurementStandards', e.target.value)}
                          >
                            <option value="">Select option</option>
                            <option value="IS 1200">IS 1200</option>
                            <option value="RICS">RICS</option>
                            <option value="NRM2">NRM2</option>
                            <option value="SMM7">SMM7</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>ESTIMATION SOFTWARE</label>
                          <input 
                            type="text"
                            placeholder="e.g., CostX, PlanSwift, Excel"
                            value={formData.boqDetails?.estimationSoftware || ''}
                            onChange={(e) => handleNestedChange('boqDetails', 'estimationSoftware', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {(formData.selectedServices || []).includes('Viz') && (
                    <div className="nested-service-panel">
                      <h4 className="nested-panel-title">3D Visualisation Details</h4>
                      <div className="form-group mb-[15px]">
                        <label>RENDERING ENGINE(S)</label>
                        <input 
                          type="text"
                          placeholder="e.g., V-Ray, Corona, Lumion, Unreal Engine"
                          value={formData.vizDetails?.renderingEngines || ''}
                          onChange={(e) => handleNestedChange('vizDetails', 'renderingEngines', e.target.value)}
                        />
                      </div>
                      <div className="form-row-2">
                        <div className="form-group">
                          <label>HARDWARE CAPACITY</label>
                          <select 
                            value={formData.vizDetails?.hardwareCapacity || ''}
                            onChange={(e) => handleNestedChange('vizDetails', 'hardwareCapacity', e.target.value)}
                          >
                            <option value="">Select option</option>
                            <option value="Dedicated Render Farm / High-end GPU">Dedicated Render Farm / High-end GPU</option>
                            <option value="Cloud Rendering">Cloud Rendering</option>
                            <option value="Standard Workstation">Standard Workstation</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>ANIMATION CAPABILITY</label>
                          <select 
                            value={formData.vizDetails?.animationCapability || 'No'}
                            onChange={(e) => handleNestedChange('vizDetails', 'animationCapability', e.target.value)}
                          >
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {isGigExpert && (
                  <div className="form-group mt-5">
                    <label>Additional Custom Skills (comma separated)</label>
                    <input
                      type="text"
                      value={formData.skillsList || ''}
                      onChange={(e) => setFormData({ ...formData, skillsList: e.target.value })}
                      placeholder="e.g. Revit, AutoCAD, Dynamo"
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'commercials' && (
              <>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Standard Commercial Basis</label>
                    <select
                      value={formData.commercialBasis || ''}
                      onChange={(e) => handleFieldChange('commercialBasis', e.target.value)}
                    >
                      <option value="">Select Option</option>
                      <option value="Hourly Rate">Hourly Rate</option>
                      <option value="Per Sq. Ft.">Per Sq. Ft.</option>
                      <option value="Per Sheet">Per Sheet</option>
                      <option value="Fixed Project Fee">Fixed Project Fee / Lump Sum</option>
                    </select>
                    {errors.commercialBasis && <span className="validation-error">{errors.commercialBasis}</span>}
                  </div>
                  <div className="form-group">
                    <label>Notice Period / Lead Time</label>
                    <select
                      value={formData.noticePeriod || ''}
                      onChange={(e) => handleFieldChange('noticePeriod', e.target.value)}
                    >
                      <option value="">Select Option</option>
                      <option value="Immediate">Immediate</option>
                      <option value="1 Week">1 Week</option>
                      <option value="2 Weeks">2 Weeks</option>
                      <option value="4 Weeks">4 Weeks</option>
                    </select>
                    {errors.noticePeriod && <span className="validation-error">{errors.noticePeriod}</span>}
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>{isGigExpert ? 'Portfolio URL' : 'Website URL'}</label>
                    <input
                      type="url"
                      value={isGigExpert ? (formData.portfolioUrl || '') : (formData.website || '')}
                      onChange={(e) => {
                        if (isGigExpert) {
                          handleFieldChange('portfolioUrl', e.target.value);
                        } else {
                          handleFieldChange('website', e.target.value);
                        }
                      }}
                      placeholder="https://mywebsite.com"
                    />
                    {isGigExpert ? (
                      errors.portfolioUrl && <span className="validation-error">{errors.portfolioUrl}</span>
                    ) : (
                      errors.website && <span className="validation-error">{errors.website}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>LinkedIn URL</label>
                    <input
                      type="url"
                      value={formData.linkedinUrl || ''}
                      onChange={(e) => handleFieldChange('linkedinUrl', e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                    />
                    {errors.linkedinUrl && <span className="validation-error">{errors.linkedinUrl}</span>}
                  </div>
                </div>

                <div className="form-group mt-3">
                  <label>OR UPLOAD PORTFOLIO (PDF)</label>
                  <div className="flex items-center gap-3 bg-[#0c0c0e] border border-[#232328] rounded-md p-3 relative">
                    <input 
                      type="file"
                      ref={portfolioPdfInputRef}
                      onChange={handlePortfolioPdfChange}
                      accept=".pdf"
                      className="hidden"
                    />
                    <button 
                      type="button" 
                      onClick={() => portfolioPdfInputRef.current && portfolioPdfInputRef.current.click()}
                      style={{ backgroundColor: 'var(--accent-lime)', color: '#000' }}
                      className="py-2 px-4 rounded font-bold text-sm hover:opacity-90 transition-opacity flex-shrink-0"
                      disabled={uploadingPdf}
                    >
                      {uploadingPdf ? 'Uploading...' : 'Choose File'}
                    </button>
                    <span className="text-[#8a8f98] text-sm truncate flex-1 pr-2">
                      {uploadedPdfName || (formData.portfolioPdfUrl ? 'Portfolio uploaded (PDF)' : 'No file chosen')}
                    </span>
                    {formData.portfolioPdfUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, portfolioPdfUrl: '' });
                          setUploadedPdfName('');
                          if (errors.portfolioPdfUrl) {
                            setErrors((prev) => {
                              const next = { ...prev };
                              delete next.portfolioPdfUrl;
                              return next;
                            });
                          }
                        }}
                        className="text-gray-500 hover:text-white bg-transparent border-none cursor-pointer flex items-center justify-center p-1"
                        title="Remove file"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  {errors.portfolioPdfUrl && <span className="validation-error">{errors.portfolioPdfUrl}</span>}
                  <p className="text-[11px] text-[#6c727f] mt-1.5 mb-0">Provide a link or upload a PDF (max 10MB allowed)</p>
                </div>
              </>
            )}

            {activeTab === 'legal' && (
              isGigExpert ? (
                <>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Legal Name (as on PAN) *</label>
                      <input
                        type="text"
                        value={formData.legalNamePan || ''}
                        onChange={(e) => handleFieldChange('legalNamePan', e.target.value)}
                        placeholder="Full Name as per PAN document"
                      />
                      {errors.legalNamePan && <span className="validation-error">{errors.legalNamePan}</span>}
                    </div>
                    <div className="form-group">
                      <label>Personal PAN Card *</label>
                      <input
                        type="text"
                        value={formData.personalPan || ''}
                        onChange={(e) => handleFieldChange('personalPan', e.target.value.toUpperCase())}
                        placeholder="10-digit PAN code"
                        maxLength={10}
                      />
                      {errors.personalPan && <span className="validation-error">{errors.personalPan}</span>}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Resume / CV URL</label>
                    <input
                      type="url"
                      value={formData.resumeUrl || ''}
                      onChange={(e) => handleFieldChange('resumeUrl', e.target.value)}
                      placeholder="Link to uploaded Resume PDF"
                    />
                    {errors.resumeUrl && <span className="validation-error">{errors.resumeUrl}</span>}
                  </div>
                </>
              ) : (
                <>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Company PAN Card *</label>
                      <input
                        type="text"
                        value={formData.companyPan || ''}
                        onChange={(e) => handleFieldChange('companyPan', e.target.value.toUpperCase())}
                        placeholder="10-digit Company PAN code"
                        maxLength={10}
                      />
                      {errors.companyPan && <span className="validation-error">{errors.companyPan}</span>}
                    </div>
                    <div className="form-group">
                      <label>GST Number</label>
                      <input
                        type="text"
                        value={formData.gstNumber || ''}
                        onChange={(e) => handleFieldChange('gstNumber', e.target.value.toUpperCase())}
                        placeholder="15-digit GST number"
                        maxLength={15}
                      />
                      {errors.gstNumber && <span className="validation-error">{errors.gstNumber}</span>}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>CIN (Corporate Identification Number)</label>
                    <input
                      type="text"
                      value={formData.cin || ''}
                      onChange={(e) => handleFieldChange('cin', e.target.value.toUpperCase())}
                      placeholder="21-character CIN code"
                      maxLength={21}
                    />
                    {errors.cin && <span className="validation-error">{errors.cin}</span>}
                  </div>
                </>
              )
            )}
          </div>
          <div className="profile-modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={isSaving}>
              {isSaving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
