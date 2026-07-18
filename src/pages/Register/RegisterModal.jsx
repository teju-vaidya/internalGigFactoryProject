import React, { useState, useEffect, useRef } from 'react';
import { Mail, Phone, User, Building2, FileText, ArrowRight, ArrowLeft, Check, CheckSquare, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { api } from '../../utils/api';
import { gigExpertSchema, agencySchema } from './RegisterSchema';
import './RegisterModal.css';
import gigfactoryLogo from '../../assets/logo.png';

const locationSuggestions = [
  'Ahmedabad, Gujarat, India',
  'Agra, Uttar Pradesh, India',
  'Amritsar, Punjab, India',
  'Aurangabad, Maharashtra, India',
  'Bengaluru, Karnataka, India',
  'Bhopal, Madhya Pradesh, India',
  'Bhubaneswar, Odisha, India',
  'Chandigarh, India',
  'Chennai, Tamil Nadu, India',
  'Coimbatore, Tamil Nadu, India',
  'Dehradun, Uttarakhand, India',
  'Delhi, NCR, India',
  'Faridabad, Haryana, India',
  'Ghaziabad, Uttar Pradesh, India',
  'Gurgaon, Haryana, India',
  'Guwahati, Assam, India',
  'Gwalior, Madhya Pradesh, India',
  'Hyderabad, Telangana, India',
  'Indore, Madhya Pradesh, India',
  'Jabalpur, Madhya Pradesh, India',
  'Jaipur, Rajasthan, India',
  'Jalandhar, Punjab, India',
  'Jammu, Jammu and Kashmir, India',
  'Jamshedpur, Jharkhand, India',
  'Jodhpur, Rajasthan, India',
  'Kanpur, Uttar Pradesh, India',
  'Kochi, Kerala, India',
  'Kolkata, West Bengal, India',
  'Kota, Rajasthan, India',
  'Kozhikode, Kerala, India',
  'Lucknow, Uttar Pradesh, India',
  'Ludhiana, Punjab, India',
  'Madurai, Tamil Nadu, India',
  'Mangalore, Karnataka, India',
  'Mumbai, Maharashtra, India',
  'Mysore, Karnataka, India',
  'Nagpur, Maharashtra, India',
  'Nashik, Maharashtra, India',
  'Noida, Uttar Pradesh, India',
  'Panaji, Goa, India',
  'Patna, Bihar, India',
  'Puducherry, India',
  'Pune, Maharashtra, India',
  'Raipur, Chhattisgarh, India',
  'Rajkot, Gujarat, India',
  'Ranchi, Jharkhand, India',
  'Shimla, Himachal Pradesh, India',
  'Siliguri, West Bengal, India',
  'Srinagar, Jammu and Kashmir, India',
  'Surat, Gujarat, India',
  'Thiruvananthapuram, Kerala, India',
  'Tiruchirappalli, Tamil Nadu, India',
  'Udaipur, Rajasthan, India',
  'Vadodara, Gujarat, India',
  'Varanasi, Uttar Pradesh, India',
  'Vijayawada, Andhra Pradesh, India',
  'Visakhapatnam, Andhra Pradesh, India',
  'Warangal, Telangana, India'
];

const RegisterModal = ({ isOpen, onClose, reapplyData = null, email = '', onSubmitSuccess }) => {
  const [role, setRole] = useState('gig_expert');
  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const portfolioPdfInputRef = useRef(null);
  const [portfolioPdfFile, setPortfolioPdfFile] = useState(null);
  const [uploadedPdfName, setUploadedPdfName] = useState('');

  // Location Autocomplete States
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [showLocations, setShowLocations] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  const [formData, setFormData] = useState({
    // Basic details
    fullName: '',
    authPersonName: '',
    designation: '',
    email: '',
    mobile: '',
    location: '',
    headquarters: '',
    linkedinUrl: '',
    website: '',

    // Legal & Tax
    legalNamePan: '',
    personalPan: '',
    registeredName: '',
    gstNumber: '',
    cin: '',
    companyPan: '',

    // Services
    selectedServices: [],
    bimDetails: { softwareStack: [], maxLod: '', cdeExperience: '' },
    auditDetails: { equipmentOwned: '', serviceRadius: '' },
    peerReviewDetails: { teamExperience: '', specialisation: '' },
    boqDetails: { measurementStandards: '', estimationSoftware: '' },
    vizDetails: { renderingEngines: '', hardwareCapacity: '', animationCapability: 'No' },

    // Commercials
    portfolioUrl: '',
    portfolioPdfUrl: '',
    commercialBasis: '',
    baseRate: '',
    noticePeriod: '',
    availability: '',
    teamSize: '',

    // Declaration
    declarationAccepted: false,
    signatureName: '',
  });

  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const validateField = async (name, value) => {
    const schema = role === 'gig_expert' ? gigExpertSchema : agencySchema;
    try {
      const currentFormData = { ...formDataRef.current, [name]: value };
      await schema.validateAt(name, currentFormData);

      // Clear existing warning for this field
      setWarnings((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });

      // If schema validation passes, check availability on the backend
      if (name === 'email' && value) {
        try {
          const check = await api.post('/auth/check-availability', { email: value });
          if (!check.available) {
            let msg = check.message;
            if (check.status === 'rejected_cooldown') {
              const formattedDate = new Date(check.canReapplyAt).toLocaleDateString('en-IN');
              msg = `Your registration request is under cooldown until ${formattedDate}. Reason: ${check.rejectionReason}`;
            }
            setErrors((prev) => ({ ...prev, email: msg }));
            return;
          } else if (check.status === 'approved') {
            setWarnings((prev) => ({ ...prev, email: check.message }));
          }
        } catch (apiErr) {
          console.warn('Availability check failed:', apiErr);
        }
      }

      if (name === 'mobile' && value) {
        try {
          const check = await api.post('/auth/check-availability', { mobile: value, currentEmail: currentFormData.email });
          if (!check.available) {
            let msg = check.message;
            if (check.status === 'rejected_cooldown') {
              const formattedDate = new Date(check.canReapplyAt).toLocaleDateString('en-IN');
              msg = `A registration request with this mobile is under cooldown until ${formattedDate}. Reason: ${check.rejectionReason}`;
            }
            setErrors((prev) => ({ ...prev, mobile: msg }));
            return;
          } else if (check.status === 'approved') {
            setWarnings((prev) => ({ ...prev, mobile: check.message }));
          }
        } catch (apiErr) {
          console.warn('Availability check failed:', apiErr);
        }
      }

      // if (name === 'companyPan' && value) {
      //   try {
      //     const check = await api.post('/auth/check-availability', {
      //       companyPan: value.toUpperCase(),
      //       currentEmail: currentFormData.email
      //     });

      //     if (!check.available) {
      //       setErrors((prev) => ({
      //         ...prev,
      //         companyPan: check.message,
      //       }));
      //       return;
      //     }

      //     // Clear error if PAN is available
      //     setErrors((prev) => {
      //       const next = { ...prev };
      //       delete next.companyPan;
      //       return next;
      //     });

      //   } catch (apiErr) {
      //     console.warn('Company PAN availability check failed:', apiErr);
      //   }
      // }


      setErrors((prev) => {
        if (!prev[name]) return prev;
        const next = { ...prev };
        delete next[name];
        return next;
      });
    } catch (err) {
      setWarnings((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      setErrors((prev) => {
        if (prev[name] === err.message) return prev;
        return {
          ...prev,
          [name]: err.message,
        };
      });
    }
  };

  // Prefill check on mount / props change
  useEffect(() => {
    if (reapplyData) {
      setRole(reapplyData.role || 'gig_expert');
      setFormData((prev) => ({
        ...prev,
        ...reapplyData,
        email: email || reapplyData.email || prev.email,
        fullName: reapplyData.role === 'gig_expert' ? (reapplyData.fullName || reapplyData.fullName || prev.fullName) : prev.fullName,
        authPersonName: reapplyData.role === 'agency' ? (reapplyData.authPersonName || reapplyData.fullName || prev.authPersonName) : prev.authPersonName,
        mobile: reapplyData.mobile || prev.mobile,
        portfolioPdfUrl: reapplyData.portfolioPdfUrl || reapplyData.portfolio_pdf_url || prev.portfolioPdfUrl,
        declarationAccepted: false,
        signatureName: ''
      }));
    } else if (email) {
      setFormData((prev) => ({
        ...prev,
        email: email
      }));
    }
  }, [reapplyData, email]);

  useEffect(() => {
    if (formData.portfolioPdfUrl) {
      const parts = formData.portfolioPdfUrl.split('/');
      setUploadedPdfName(parts[parts.length - 1]);
    } else if (!portfolioPdfFile) {
      setUploadedPdfName('');
    }
  }, [formData.portfolioPdfUrl, portfolioPdfFile]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePortfolioPdfChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrors((prev) => ({ ...prev, portfolioPdfUrl: 'Only PDF files are allowed.' }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, portfolioPdfUrl: 'Max allowed size is 10MB.' }));
      return;
    }

    setErrors((prev) => {
      const next = { ...prev };
      delete next.portfolioPdfUrl;
      return next;
    });

    setPortfolioPdfFile(file);
    setUploadedPdfName(file.name);
    setFormData((prev) => ({ ...prev, portfolioPdfUrl: '' }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({
      ...prev,
      [name]: val,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleLocationSearch = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }

    if (value.trim().length > 0) {
      const matched = locationSuggestions.filter((city) =>
        city.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredLocations(matched);
      setShowLocations(true);
      setActiveSuggestionIndex(0);
    } else {
      setShowLocations(false);
    }
  };

  const handleSelectLocation = (fieldName, city) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: city,
    }));
    setShowLocations(false);
    validateField(fieldName, city);
  };

  const handleLocationKeyDown = (e, fieldName) => {
    if (!showLocations || filteredLocations.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev + 1) % filteredLocations.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev - 1 + filteredLocations.length) % filteredLocations.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selectedCity = filteredLocations[activeSuggestionIndex];
      if (selectedCity) {
        handleSelectLocation(fieldName, selectedCity);
      }
    } else if (e.key === 'Tab') {
      const selectedCity = filteredLocations[activeSuggestionIndex];
      if (selectedCity) {
        handleSelectLocation(fieldName, selectedCity);
      }
    } else if (e.key === 'Escape') {
      setShowLocations(false);
    }
  };

  const handleLocationBlur = () => {
    const fieldName = role === 'gig_expert' ? 'location' : 'headquarters';
    setTimeout(() => {
      setShowLocations(false);
      validateField(fieldName, formDataRef.current[fieldName]);
    }, 200);
  };

  const handleServiceToggle = (serviceId) => {
    const selected = formData.selectedServices.includes(serviceId)
      ? formData.selectedServices.filter((s) => s !== serviceId)
      : [...formData.selectedServices, serviceId];

    setFormData((prev) => ({
      ...prev,
      selectedServices: selected,
    }));

    validateField('selectedServices', selected);
  };

  const handleSoftwareToggle = (swName) => {
    setFormData((prev) => {
      const stack = prev.bimDetails.softwareStack.includes(swName)
        ? prev.bimDetails.softwareStack.filter((s) => s !== swName)
        : [...prev.bimDetails.softwareStack, swName];
      return { ...prev, bimDetails: { ...prev.bimDetails, softwareStack: stack } };
    });
  };

  const handleNestedChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const schema = role === 'gig_expert' ? gigExpertSchema : agencySchema;
    try {
      // Validate all fields together
      await schema.validate(formData, { abortEarly: false });
      setErrors({});
      setSubmitting(true);

      const regFormData = new FormData();
      regFormData.append('email', formData.email);
      regFormData.append('fullName', role === 'gig_expert' ? formData.fullName : formData.authPersonName);
      regFormData.append('mobile', formData.mobile);
      regFormData.append('roleName', role);

      const appData = {
        ...formData,
        title: role === 'gig_expert' ? formData.designation : undefined,
        agencyName: role === 'agency' ? formData.registeredName : undefined,
        bio: role === 'gig_expert'
          ? `Designation: ${formData.designation}. LinkedIn: ${formData.linkedinUrl || 'N/A'}. Legal PAN Name: ${formData.legalNamePan}`
          : `Company Website: ${formData.website || 'N/A'}. Authorized signatory: ${formData.authPersonName}`,
        experienceYears: role === 'gig_expert' ? (parseInt(formData.peerReviewDetails?.teamExperience, 10) || 3) : undefined,
        employeeCount: role === 'agency' ? (parseInt(formData.teamSize, 10) || 5) : undefined,
        hourlyRate: role === 'gig_expert' ? (parseFloat(formData.baseRate) || 0) : undefined,
        availability: role === 'gig_expert' ? (formData.availability ? formData.availability.toLowerCase() : 'project basis') : undefined,
        portfolioUrl: formData.portfolioUrl || '',
        portfolioPdfUrl: formData.portfolioPdfUrl || '',
        gstNumber: role === 'agency' ? formData.gstNumber : undefined,
        website: role === 'agency' ? formData.website : undefined,
        address: role === 'agency' ? formData.headquarters : undefined,
        city: role === 'gig_expert'
          ? (formData.location ? formData.location.split(',')[0]?.trim() || 'Mumbai' : 'Mumbai')
          : (formData.headquarters ? formData.headquarters.split(',')[0]?.trim() || 'Mumbai' : 'Mumbai'),
        country: role === 'gig_expert'
          ? (formData.location ? formData.location.split(',')[1]?.trim() || 'India' : 'India')
          : (formData.headquarters ? formData.headquarters.split(',')[1]?.trim() || 'India' : 'India'),
        skillsList: formData.selectedServices,
        serviceDetails: {
          selectedServices: formData.selectedServices,
          bimDetails: formData.bimDetails,
          auditDetails: formData.auditDetails,
          peerReviewDetails: formData.peerReviewDetails,
          boqDetails: formData.boqDetails,
          vizDetails: formData.vizDetails
        }
      };

      regFormData.append('applicationData', JSON.stringify(appData));

      if (portfolioPdfFile) {
        regFormData.append('portfolioFile', portfolioPdfFile);
      }

      const response = await api.postFile('/auth/register', regFormData);
      toast.success(response.message || 'Registration request submitted successfully!');

      if (onSubmitSuccess) {
        onSubmitSuccess(response);
      }
    } catch (err) {
      if (err.inner) {
        const newErrors = {};
        err.inner.forEach((validationError) => {
          newErrors[validationError.path] = validationError.message;
        });
        setErrors(newErrors);
        toast.warning('Please correct form validation errors before submitting.');
      } else {
        toast.error(err.message || 'Failed to submit registration request.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const servicesList = [
    { id: 'BIM', label: 'BIM & 2D Drafting' },
    { id: 'Audit', label: 'As-Built Audit' },
    { id: 'Peer', label: 'Peer Review' },
    { id: 'BOQ', label: 'BOQ Creation' },
    { id: 'Viz', label: '3D Visualisation' }
  ];

  return (
    <div className="register-modal-overlay">
      <div className="register-card wizard register-modal-card">

        {/* Close Button */}
        <button type="button" className="register-modal-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>

        {/* Branding Logo */}
        <div className="register-branding-logo-box">
          <img src={gigfactoryLogo} alt="Gigfactory Logo" className="register-brand-img" />
        </div>

        {/* Header */}
        <h1 className="register-title">{reapplyData ? 'EDIT & REAPPLY APPLICATION' : 'CREATE AN ACCOUNT'}</h1>
        <p className="register-subtitle">
          {reapplyData
            ? "We've loaded your previous application details. Please review, edit, and submit again."
            : "Join GigFactory and unlock opportunities"
          }
        </p>

        <hr className="divider-line" />

        {/* Role Selection Tabs */}
        {!reapplyData && (
          <div className="role-tab-container">
            <button
              type="button"
              className={`role-tab-btn ${role === 'gig_expert' ? 'active' : ''}`}
              onClick={() => {
                setRole('gig_expert');
                setErrors({});
              }}
            >
              <User size={16} /> Gig Expert
            </button>
            <button
              type="button"
              className={`role-tab-btn ${role === 'agency' ? 'active' : ''}`}
              onClick={() => {
                setRole('agency');
                setErrors({});
              }}
            >
              <Building2 size={16} /> Agency / Company
            </button>
          </div>
        )}

        {/* Unified Scrollable Form */}
        <form onSubmit={handleSubmit} className="register-form">

          {/* SECTION 1: PROFILE DETAILS */}
          <div className="register-form-section">
            <h3 className="register-section-title">1. Profile Details</h3>
            <div className="form-grid-2">
              <div className="input-group">
                <label htmlFor="fullName">{role === 'gig_expert' ? 'Full Name *' : 'Name of Authorised Person *'}</label>
                <div className="input-wrapper">
                  <span className="input-icon"><User size={18} /></span>
                  <input type="text"
                    id="fullName"
                    name={role === 'gig_expert' ? 'fullName' : 'authPersonName'}
                    value={role === 'gig_expert' ? formData.fullName : formData.authPersonName}
                    placeholder={role === 'gig_expert' ? 'Your professional name' : 'Submitting representative'}
                    onChange={handleInputChange}
                    onBlur={(e) => validateField(e.target.name, e.target.value)} />
                </div>
                {errors[role === 'gig_expert' ? 'fullName' : 'authPersonName'] && (
                  <span className="validation-error">{errors[role === 'gig_expert' ? 'fullName' : 'authPersonName']}</span>
                )}
              </div>

              <div className="input-group">
                <label htmlFor="designation">Designation / Role *</label>
                <div className="input-wrapper">
                  <span className="input-icon"><User size={18} /></span>
                  <input
                    type="text"
                    id="designation"
                    name="designation"
                    value={formData.designation}
                    placeholder="e.g. BIM Modeller, Architect, Director"
                    onChange={handleInputChange}
                    onBlur={(e) => validateField(e.target.name, e.target.value)}
                  />
                </div>
                {errors.designation && <span className="validation-error">{errors.designation}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="email">Email Address *</label>
                <div className="input-wrapper">
                  <span className="input-icon"><Mail size={18} /></span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    placeholder="email@domain.com"
                    onChange={handleInputChange}
                    disabled={!!email}
                    onBlur={(e) => validateField(e.target.name, e.target.value)}
                  />
                </div>
                {errors.email && <span className="validation-error">{errors.email}</span>}
                {warnings.email && <span className="validation-warning">{warnings.email}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="mobile">Mobile Number *</label>
                <div className="input-wrapper">
                  <span className="input-icon"><Phone size={18} /></span>
                  <input
                    type="text"
                    id="mobile"
                    name="mobile"
                    value={formData.mobile}
                    placeholder="10-digit number"
                    onChange={handleInputChange}
                    onBlur={(e) => validateField(e.target.name, e.target.value)}
                  />
                </div>
                {errors.mobile && <span className="validation-error">{errors.mobile}</span>}
                {warnings.mobile && <span className="validation-warning">{warnings.mobile}</span>}
              </div>

              <div className="input-group relative">
                <label htmlFor="location">{role === 'gig_expert' ? 'Current Location *' : 'Company Headquarters *'}</label>
                <div className="input-wrapper">
                  <span className="input-icon"><Building2 size={18} /></span>
                  <input
                    type="text"
                    id="location"
                    name={role === 'gig_expert' ? 'location' : 'headquarters'}
                    value={role === 'gig_expert' ? formData.location : formData.headquarters}
                    placeholder="Type city..."
                    onChange={handleLocationSearch}
                    onKeyDown={(e) => handleLocationKeyDown(e, role === 'gig_expert' ? 'location' : 'headquarters')}
                    onBlur={handleLocationBlur}
                    autoComplete="off"
                  />
                </div>
                {showLocations && filteredLocations.length > 0 && (
                  <ul className="suggestions-list">
                    {filteredLocations.map((city, index) => (
                      <li
                        key={city}
                        className={`suggestion-item ${index === activeSuggestionIndex ? 'highlighted' : ''}`}
                        onMouseDown={() => handleSelectLocation(role === 'gig_expert' ? 'location' : 'headquarters', city)}
                      >
                        {city}
                      </li>
                    ))}
                  </ul>
                )}
                {errors[role === 'gig_expert' ? 'location' : 'headquarters'] && (
                  <span className="validation-error">{errors[role === 'gig_expert' ? 'location' : 'headquarters']}</span>
                )}
              </div>

              <div className="input-group">
                <label htmlFor="linkedinUrl">LinkedIn URL</label>
                <div className="input-wrapper">
                  <span className="input-icon"><Building2 size={18} /></span>
                  <input
                    type="text"
                    id="linkedinUrl"
                    name="linkedinUrl"
                    value={formData.linkedinUrl}
                    placeholder="https://linkedin.com/in/..."
                    onChange={handleInputChange}
                    onBlur={(e) => validateField(e.target.name, e.target.value)}
                  />
                </div>
                {errors.linkedinUrl && <span className="validation-error">{errors.linkedinUrl}</span>}
              </div>

              {role === 'agency' && (
                <div className="input-group col-span-2">
                  <label htmlFor="website">Company Website</label>
                  <div className="input-wrapper">
                    <span className="input-icon"><Building2 size={18} /></span>
                    <input type="text"
                      id="website"
                      name="website"
                      value={formData.website}
                      placeholder="https://..."
                      onChange={handleInputChange}
                      onBlur={(e) => validateField(e.target.name, e.target.value)}
                    />
                  </div>
                  {errors.website && <span className="validation-error">{errors.website}</span>}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: LEGAL & TAX IDENTITY */}
          <div className="register-form-section">
            <h3 className="register-section-title">2. Legal &amp; Tax Identity</h3>
            <div className="form-grid-2">
              {role === 'gig_expert' ? (
                <>
                  <div className="input-group">
                    <label htmlFor="legalNamePan">Legal Name (as per PAN) *</label>
                    <div className="input-wrapper">
                      <span className="input-icon"><User size={18} /></span>
                      <input
                        type="text"
                        id="legalNamePan"
                        name="legalNamePan"
                        value={formData.legalNamePan}
                        placeholder="Exactly as written on PAN"
                        onChange={handleInputChange}
                        onBlur={(e) => validateField(e.target.name, e.target.value)}
                      />
                    </div>
                    {errors.legalNamePan && <span className="validation-error">{errors.legalNamePan}</span>}
                  </div>

                  <div className="input-group">
                    <label htmlFor="personalPan">Personal PAN Card Number *</label>
                    <div className="input-wrapper">
                      <span className="input-icon"><FileText size={18} /></span>
                      <input
                        type="text"
                        id="personalPan"
                        name="personalPan"
                        value={formData.personalPan}
                        placeholder="10-character PAN"
                        onChange={handleInputChange}
                        onBlur={(e) => validateField(e.target.name, e.target.value)}
                      />
                    </div>
                    {errors.personalPan && <span className="validation-error">{errors.personalPan}</span>}
                  </div>
                </>
              ) : (
                <>
                  <div className="input-group">
                    <label htmlFor="registeredName">Registered Company Name *</label>
                    <div className="input-wrapper">
                      <span className="input-icon"><Building2 size={18} /></span>
                      <input
                        type="text"
                        id="registeredName"
                        name="registeredName"
                        value={formData.registeredName}
                        placeholder="As per official incorporation records"
                        onChange={handleInputChange}
                        onBlur={(e) => validateField(e.target.name, e.target.value)}
                      />
                    </div>
                    {errors.registeredName && <span className="validation-error">{errors.registeredName}</span>}
                  </div>

                  <div className="input-group">
                    <label htmlFor="companyPan">Company PAN *</label>
                    <div className="input-wrapper">
                      <span className="input-icon"><FileText size={18} /></span>
                      <input
                        type="text"
                        id="companyPan"
                        name="companyPan"
                        value={formData.companyPan}
                        placeholder="10-character Company PAN"
                        onChange={handleInputChange}
                        onBlur={(e) => validateField(e.target.name, e.target.value)}
                      />
                    </div>
                    {errors.companyPan && <span className="validation-error">{errors.companyPan}</span>}
                  </div>

                  <div className="input-group">
                    <label htmlFor="gstNumber">GST Number (GSTIN)</label>
                    <div className="input-wrapper">
                      <span className="input-icon"><FileText size={18} /></span>
                      <input
                        type="text"
                        id="gstNumber"
                        name="gstNumber"
                        value={formData.gstNumber}
                        placeholder="15-character GST"
                        onChange={handleInputChange}
                        onBlur={(e) => validateField(e.target.name, e.target.value)}
                      />
                    </div>
                    {errors.gstNumber && <span className="validation-error">{errors.gstNumber}</span>}
                  </div>

                  <div className="input-group">
                    <label htmlFor="cin">CIN</label>
                    <div className="input-wrapper">
                      <span className="input-icon"><FileText size={18} /></span>
                      <input
                        type="text"
                        id="cin"
                        name="cin"
                        value={formData.cin}
                        placeholder="Corporate Identification Number"
                        onChange={handleInputChange}
                        onBlur={(e) => validateField(e.target.name, e.target.value)}
                      />
                    </div>
                    {errors.cin && <span className="validation-error">{errors.cin}</span>}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* SECTION 3: SERVICES */}
          <div className="register-form-section">
            <h3 className="register-section-title">3. Services &amp; Specialisation</h3>
            <p className="text-[var(--text-muted)] text-[0.85rem] mb-[15px]">
              Select the services you offer (select at least one)
            </p>
            <div className="services-grid">
              {servicesList.map((service) => {
                const isActive = formData.selectedServices.includes(service.id);
                return (
                  <div
                    key={service.id}
                    className={`service-card ${isActive ? 'active' : ''}`}
                    onClick={() => handleServiceToggle(service.id)}
                  >
                    <div className="service-checkbox-indicator">
                      {isActive && <Check size={12} strokeWidth={3} />}
                    </div>
                    <span className="service-label-text">{service.label}</span>
                  </div>
                );
              })}
            </div>
            {errors.selectedServices && (
              <div className="validation-error mb-[15px]">{errors.selectedServices}</div>
            )}

            {/* DYNAMIC SERVICE CONFIGURATION PANELS */}
            <div className="dynamic-panels-container">
              {formData.selectedServices.includes('BIM') && (
                <div className="nested-service-panel">
                  <h4 className="nested-panel-title">BIM &amp; 2D Drafting Details</h4>
                  <div className="input-group mb-[15px]">
                    <label>SOFTWARE STACK</label>
                    <div className="software-chips">
                      {['Revit', 'AutoCAD', 'Navisworks', 'Tekla', 'Civil 3D'].map((sw) => {
                        const isSel = formData.bimDetails.softwareStack.includes(sw);
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
                  <div className="form-grid-2">
                    <div className="input-group">
                      <label>MAX LOD CAPABILITY</label>
                      <select
                        className="w-full p-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--text-main)] outline-none"
                        value={formData.bimDetails.maxLod}
                        onChange={(e) => handleNestedChange('bimDetails', 'maxLod', e.target.value)}
                      >
                        <option value="">Select option</option>
                        <option value="LOD 300">LOD 300</option>
                        <option value="LOD 350">LOD 350</option>
                        <option value="LOD 400">LOD 400</option>
                        <option value="LOD 500">LOD 500</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label>CDE EXPERIENCE</label>
                      <div className="input-wrapper">
                        <input
                          type="text"
                          placeholder="e.g., BIM 360, ACC, ProjectWise"
                          value={formData.bimDetails.cdeExperience}
                          onChange={(e) => handleNestedChange('bimDetails', 'cdeExperience', e.target.value)}
                          className="pl-[14px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {formData.selectedServices.includes('Audit') && (
                <div className="nested-service-panel">
                  <h4 className="nested-panel-title">As-Built Audit Details</h4>
                  <div className="form-grid-2">
                    <div className="input-group">
                      <label>EQUIPMENT OWNED</label>
                      <div className="input-wrapper">
                        <input
                          type="text"
                          placeholder="e.g., Laser Scanner, Total Station, Drone"
                          value={formData.auditDetails.equipmentOwned}
                          onChange={(e) => handleNestedChange('auditDetails', 'equipmentOwned', e.target.value)}
                          className="pl-[14px]"
                        />
                      </div>
                    </div>
                    <div className="input-group">
                      <label>SERVICE RADIUS</label>
                      <select
                        className="w-full p-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--text-main)] outline-none"
                        value={formData.auditDetails.serviceRadius}
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

              {formData.selectedServices.includes('Peer') && (
                <div className="nested-service-panel">
                  <h4 className="nested-panel-title">Peer Review Details</h4>
                  <div className="form-grid-2">
                    <div className="input-group">
                      <label>{role === 'gig_expert' ? 'TOTAL YEARS OF EXPERIENCE *' : 'TOTAL TEAM EXPERIENCE *'}</label>
                      <div className="input-wrapper">
                        <input
                          type="text"
                          placeholder="e.g., 5, 8"
                          value={formData.peerReviewDetails.teamExperience}
                          onChange={(e) => handleNestedChange('peerReviewDetails', 'teamExperience', e.target.value)}
                          className="pl-[14px]"
                        />
                      </div>
                    </div>
                    <div className="input-group">
                      <label>SPECIALISATION</label>
                      <select
                        className="w-full p-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--text-main)] outline-none"
                        value={formData.peerReviewDetails.specialisation}
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

              {formData.selectedServices.includes('BOQ') && (
                <div className="nested-service-panel">
                  <h4 className="nested-panel-title">BOQ Details</h4>
                  <div className="form-grid-2">
                    <div className="input-group">
                      <label>MEASUREMENT STANDARDS</label>
                      <select
                        className="w-full p-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--text-main)] outline-none"
                        value={formData.boqDetails.measurementStandards}
                        onChange={(e) => handleNestedChange('boqDetails', 'measurementStandards', e.target.value)}
                      >
                        <option value="">Select option</option>
                        <option value="IS 1200">IS 1200</option>
                        <option value="RICS">RICS</option>
                        <option value="NRM2">NRM2</option>
                        <option value="SMM7">SMM7</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label>ESTIMATION SOFTWARE</label>
                      <div className="input-wrapper">
                        <input
                          type="text"
                          placeholder="e.g., CostX, PlanSwift, Excel"
                          value={formData.boqDetails.estimationSoftware}
                          onChange={(e) => handleNestedChange('boqDetails', 'estimationSoftware', e.target.value)}
                          className="pl-[14px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {formData.selectedServices.includes('Viz') && (
                <div className="nested-service-panel">
                  <h4 className="nested-panel-title">3D Visualisation Details</h4>
                  <div className="input-group mb-[15px]">
                    <label>RENDERING ENGINE(S)</label>
                    <div className="input-wrapper">
                      <input
                        type="text"
                        placeholder="e.g., V-Ray, Corona, Lumion, Unreal Engine"
                        value={formData.vizDetails.renderingEngines}
                        onChange={(e) => handleNestedChange('vizDetails', 'renderingEngines', e.target.value)}
                        className="pl-[14px]"
                      />
                    </div>
                  </div>
                  <div className="form-grid-2">
                    <div className="input-group">
                      <label>HARDWARE CAPACITY</label>
                      <select
                        className="w-full p-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--text-main)] outline-none"
                        value={formData.vizDetails.hardwareCapacity}
                        onChange={(e) => handleNestedChange('vizDetails', 'hardwareCapacity', e.target.value)}
                      >
                        <option value="">Select option</option>
                        <option value="Dedicated Render Farm / High-end GPU">Dedicated Render Farm / High-end GPU</option>
                        <option value="Cloud Rendering">Cloud Rendering</option>
                        <option value="Standard Workstation">Standard Workstation</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label>ANIMATION CAPABILITY</label>
                      <select
                        className="w-full p-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--text-main)] outline-none"
                        value={formData.vizDetails.animationCapability}
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
          </div>

          {/* SECTION 4: PORTFOLIO & COMMERCIALS */}
          <div className="register-form-section">
            <h3 className="register-section-title">4. Portfolio &amp; Commercials</h3>
            <div className="form-grid-2">
              <div className="input-group col-span-2">
                <label htmlFor="portfolioUrl">Portfolio / Work Samples URL</label>
                <div className="input-wrapper">
                  <span className="input-icon"><FileText size={18} /></span>
                  <input
                    type="text"
                    id="portfolioUrl"
                    name="portfolioUrl"
                    value={formData.portfolioUrl}
                    placeholder="Dropbox / Drive / Website link"
                    onChange={handleInputChange}
                    onBlur={(e) => validateField(e.target.name, e.target.value)}
                  />
                </div>
                {errors.portfolioUrl && <span className="validation-error">{errors.portfolioUrl}</span>}
              </div>

              {/* PDF portfolio upload */}
              <div className="input-group col-span-2">
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
                  >
                    Choose File
                  </button>
                  <span className="text-[#8a8f98] text-sm truncate flex-1 pr-2">
                    {uploadedPdfName || (formData.portfolioPdfUrl ? 'Portfolio uploaded (PDF)' : 'No file chosen')}
                  </span>
                  {(formData.portfolioPdfUrl || portfolioPdfFile) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, portfolioPdfUrl: '' }));
                        setPortfolioPdfFile(null);
                        setUploadedPdfName('');
                      }}
                      className="text-gray-500 hover:text-white bg-transparent border-none cursor-pointer flex items-center justify-center p-1"
                      title="Remove file"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-[#6c727f] mt-1.5 mb-0 font-medium">Provide a link or upload a PDF (max 10MB allowed)</p>
                {errors.portfolioPdfUrl && <span className="validation-error">{errors.portfolioPdfUrl}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="commercialBasis">Standard Commercial Basis *</label>
                <select
                  id="commercialBasis"
                  name="commercialBasis"
                  className="w-full p-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--text-main)] outline-none"
                  value={formData.commercialBasis}
                  onChange={handleInputChange}
                  onBlur={(e) => validateField(e.target.name, e.target.value)}
                >
                  <option value="">Select Option</option>
                  <option value="Hourly Rate">Hourly Rate</option>
                  <option value="Per Sq. Ft.">Per Sq. Ft.</option>
                  <option value="Per Sheet">Per Sheet</option>
                  <option value="Fixed Project Fee">Fixed Project Fee / Lump Sum</option>
                </select>
                {errors.commercialBasis && <span className="validation-error">{errors.commercialBasis}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="baseRate">Base Rate (INR / Unit) *</label>
                <div className="input-wrapper">
                  <span className="input-icon"><FileText size={18} /></span>
                  <input
                    type="number"
                    id="baseRate"
                    name="baseRate"
                    value={formData.baseRate}
                    placeholder="e.g. 500, 1500"
                    onChange={handleInputChange}
                    onBlur={(e) => validateField(e.target.name, e.target.value)}
                  />
                </div>
                {errors.baseRate && <span className="validation-error">{errors.baseRate}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="noticePeriod">Notice Period / Lead Time *</label>
                <select
                  id="noticePeriod"
                  name="noticePeriod"
                  className="w-full p-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--text-main)] outline-none"
                  value={formData.noticePeriod}
                  onChange={handleInputChange}
                  onBlur={(e) => validateField(e.target.name, e.target.value)}
                >
                  <option value="">Select Option</option>
                  <option value="Immediate">Immediate</option>
                  <option value="1 Week">1 Week</option>
                  <option value="2 Weeks">2 Weeks</option>
                  <option value="4 Weeks">4 Weeks</option>
                </select>
                {errors.noticePeriod && <span className="validation-error">{errors.noticePeriod}</span>}
              </div>

              {role === 'gig_expert' ? (
                <div className="input-group">
                  <label htmlFor="availability">Availability *</label>
                  <select
                    id="availability"
                    name="availability"
                    className="w-full p-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--text-main)] outline-none"
                    value={formData.availability}
                    onChange={handleInputChange}
                    onBlur={(e) => validateField(e.target.name, e.target.value)}
                  >
                    <option value="">Select Option</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Project Basis">Project Basis</option>
                  </select>
                  {errors.availability && <span className="validation-error">{errors.availability}</span>}
                </div>
              ) : (
                <div className="input-group">
                  <label htmlFor="teamSize">Team Size *</label>
                  <div className="input-wrapper">
                    <span className="input-icon"><User size={18} /></span>
                    <input
                      type="number"
                      id="teamSize"
                      name="teamSize"
                      value={formData.teamSize}
                      placeholder="Approx. number of experts"
                      onChange={handleInputChange}
                      onBlur={(e) => validateField(e.target.name, e.target.value)}
                    />
                  </div>
                  {errors.teamSize && <span className="validation-error">{errors.teamSize}</span>}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 5: DECLARATION */}
          <div className="register-form-section">
            <h3 className="register-section-title">5. Declaration &amp; Signature</h3>

            <div className="declaration-box">
              <label htmlFor="declarationAccepted" className="declaration-checkbox-wrapper">
                <input
                  type="checkbox"
                  id="declarationAccepted"
                  name="declarationAccepted"
                  checked={formData.declarationAccepted}
                  onChange={handleInputChange}
                  onBlur={(e) => validateField(e.target.name, e.target.checked)}
                />
                <span className="declaration-text">
                  I hereby certify that all PAN / GST / CIN details provided are authentic. I represent that I am authorized to register on this platform, and I understand that onboarding is subject to a technical audit of previous work.
                </span>
              </label>
              {errors.declarationAccepted && <span className="validation-error">{errors.declarationAccepted}</span>}
            </div>

            <div className="form-grid-2">
              <div className="input-group">
                <label htmlFor="signatureName">Signature *</label>
                <div className="input-wrapper">
                  <span className="input-icon"><User size={18} /></span>
                  <input
                    type="text"
                    id="signatureName"
                    name="signatureName"
                    value={formData.signatureName}
                    placeholder="Type your full name as signature"
                    onChange={handleInputChange}
                    onBlur={(e) => validateField(e.target.name, e.target.value)}
                  />
                </div>
                {errors.signatureName && <span className="validation-error">{errors.signatureName}</span>}
              </div>

              <div className="input-group">
                <label>Submission Date</label>
                <div className="input-wrapper">
                  <span className="input-icon"><FileText size={18} /></span>
                  <input
                    type="text"
                    value={new Date().toISOString().split('T')[0]}
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="wizard-footer-actions">
            <button type="button" className="wizard-back-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="register-submit-btn w-auto py-3 px-6"
              disabled={submitting}
            >
              {submitting ? 'Submitting Application...' : (reapplyData ? 'Resubmit Application' : 'Submit Application')}
              {!submitting && <CheckSquare size={16} className="ml-1.5" />}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default RegisterModal;
