import * as yup from 'yup';

// PAN Regex (Standard Indian Permanent Account Number)
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

// GSTIN Regex (Standard Indian Goods and Services Tax Identification Number)
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// Helper for optional string fields (turns empty strings into null, making them pass nullable validation)
const optionalString = () => yup.string().transform((value, originalValue) => originalValue === '' ? null : value).nullable();
const optionalUrl = (msg) => optionalString().url(msg || 'Must be a valid URL starting with http:// or https://');

export const profileGigExpertSchema = yup.object().shape({
  // Basic Details
  title: yup.string().required('Professional title is required').min(2, 'Title must be at least 2 characters'),
  availability: yup.string().required('Availability status is required'),
  experienceYears: yup.number()
    .typeError('Years of experience must be a number')
    .integer('Years of experience must be an integer')
    .min(0, 'Years of experience cannot be negative')
    .required('Years of experience is required'),
  hourlyRate: yup.number()
    .typeError('Hourly rate must be a number')
    .min(0, 'Hourly rate cannot be negative')
    .required('Hourly rate is required'),
  bio: yup.string().nullable(),
  city: yup.string().nullable(),
  country: yup.string().nullable(),

  // Services
  selectedServices: yup.array().min(1, 'Please select at least one service'),

  // Commercials & Links
  commercialBasis: yup.string().required('Commercial basis is required'),
  noticePeriod: yup.string().required('Notice period is required'),
  portfolioUrl: optionalUrl(),
  linkedinUrl: optionalUrl(),
  portfolioPdfUrl: yup.string().nullable(),

  // Legal & Tax
  legalNamePan: yup.string().required('Legal name as per PAN is required'),
  personalPan: yup.string().matches(panRegex, 'Invalid PAN card format (e.g. ABCDE1234F)').required('PAN number is required'),
  resumeUrl: optionalUrl(),
});

export const profileAgencySchema = yup.object().shape({
  // Basic Details
  agencyName: yup.string().required('Agency name is required').min(2, 'Agency name must be at least 2 characters'),
  industry: yup.string().required('Industry sector is required'),
  description: yup.string().nullable(),
  employeeCount: yup.number()
    .typeError('Total employees must be a number')
    .integer('Total employees must be an integer')
    .min(0, 'Total employees cannot be negative')
    .nullable(),
  foundedYear: yup.number()
    .typeError('Founded year must be a number')
    .integer('Founded year must be an integer')
    .min(1800, 'Founded year must be a valid year')
    .max(new Date().getFullYear(), 'Founded year cannot be in the future')
    .nullable(),
  city: yup.string().nullable(),
  country: yup.string().nullable(),

  // Services
  selectedServices: yup.array().min(1, 'Please select at least one service'),

  // Commercials & Links
  commercialBasis: yup.string().required('Commercial basis is required'),
  noticePeriod: yup.string().required('Notice period is required'),
  baseRate: yup.number()
    .transform((value, originalValue) => originalValue === '' ? null : value)
    .typeError('Base rate must be a number')
    .min(0, 'Base rate cannot be negative')
    .nullable(),
  website: optionalUrl(),
  linkedinUrl: optionalUrl(),
  portfolioPdfUrl: yup.string().nullable(),

  // Legal & Tax
  companyPan: yup.string().matches(panRegex, 'Invalid PAN card format (e.g. ABCDE1234F)').required('Company PAN is required'),
  gstNumber: optionalString().matches(gstRegex, 'Invalid GSTIN format (e.g. 22AAAAA1111A1Z1)'),
  cin: optionalString().max(21, 'CIN must be at most 21 characters'),
});
