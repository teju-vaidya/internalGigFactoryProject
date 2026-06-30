import * as yup from 'yup';

// PAN Regex (Standard Indian Permanent Account Number)
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

// GSTIN Regex (Standard Indian Goods and Services Tax Identification Number)
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// Mobile Regex (Simple 10-digit number validation)
const mobileRegex = /^[0-9]{10}$/;

// Helper for optional string fields (turns empty strings into null, making them pass nullable validation)
const optionalString = () => yup.string().transform((value, originalValue) => originalValue === '' ? null : value).nullable();
const optionalUrl = (msg) => optionalString().url(msg || 'Must be a valid URL starting with http:// or https://');

export const gigExpertSchema = yup.object().shape({
  // Step 1: Basic Details
  fullName: yup.string().required('Full name is required').min(2, 'Name must be at least 2 characters'),
  designation: yup.string().required('Designation/Role is required'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  mobile: yup.string().matches(mobileRegex, 'Mobile number must be exactly 10 digits').required('Mobile number is required'),
  location: yup.string().required('Current location is required'),
  linkedinUrl: optionalUrl(),

  // Step 2: Legal Identity
  legalNamePan: yup.string().required('Legal name as per PAN is required'),
  personalPan: yup.string().matches(panRegex, 'Invalid PAN card format (e.g. ABCDE1234F)').required('PAN number is required'),

  // Step 3: Services
  selectedServices: yup.array().min(1, 'Please select at least one service'),

  // Step 4: Portfolio & Commercials
  portfolioUrl: optionalUrl(),
  portfolioPdfUrl: yup.string().nullable(),
  commercialBasis: yup.string().required('Commercial basis is required'),
  baseRate: yup.number().typeError('Base rate must be a number').positive('Base rate must be positive').required('Base rate is required'),
  noticePeriod: yup.string().required('Notice period is required'),
  availability: yup.string().required('Availability is required'),

  // Step 5: Declaration
  declarationAccepted: yup.boolean().oneOf([true], 'You must accept the declaration'),
  signatureName: yup.string().required('Type your name to sign the application'),
});

export const agencySchema = yup.object().shape({
  // Step 1: Basic Details
  authPersonName: yup.string().required('Authorized person name is required').min(2, 'Name must be at least 2 characters'),
  designation: yup.string().required('Designation/Role is required'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  mobile: yup.string().matches(mobileRegex, 'Mobile number must be exactly 10 digits').required('Mobile number is required'),
  headquarters: yup.string().required('Company headquarters is required'),
  website: optionalUrl(),
  linkedinUrl: optionalUrl(),

  // Step 2: Legal Identity
  registeredName: yup.string().required('Registered company name is required'),
  gstNumber: optionalString().matches(gstRegex, 'Invalid GSTIN format (e.g. 22AAAAA1111A1Z1)'),
  cin: optionalString(),
  companyPan: yup.string().matches(panRegex, 'Invalid PAN card format (e.g. ABCDE1234F)').required('Company PAN is required'),

  // Step 3: Services
  selectedServices: yup.array().min(1, 'Please select at least one service'),

  // Step 4: Portfolio & Commercials
  portfolioUrl: optionalUrl(),
  portfolioPdfUrl: yup.string().nullable(),
  commercialBasis: yup.string().required('Commercial basis is required'),
  baseRate: yup.number().typeError('Base rate must be a number').positive('Base rate must be positive').required('Base rate is required'),
  noticePeriod: yup.string().required('Notice period is required'),
  teamSize: yup.number().typeError('Team size must be a number').positive('Team size must be positive').required('Team size is required'),

  // Step 5: Declaration
  declarationAccepted: yup.boolean().oneOf([true], 'You must accept the declaration'),
  signatureName: yup.string().required('Type your name to sign the application'),
});
