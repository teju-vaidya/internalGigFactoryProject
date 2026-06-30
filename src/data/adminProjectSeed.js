export const initialProjects = [
  {
    id: 1,
    title: 'E-commerce Website Redesign',
    client: 'TechStore Inc.',
    category: 'WEB',
    status: 'IN PROGRESS',
    budget: 15000,
    deadline: '2026-06-15',
    progress: 65,
    assignedMembers: [
      { id: 1, name: 'Sarah Johnson', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' }
    ],
    applicantsCount: 1,
    description: 'Redesign the e-commerce customer journey to improve conversion and reduce checkout drop-offs.',
  },
  {
    id: 2,
    title: 'Mobile App Development',
    client: 'FinanceApp Co.',
    category: 'MOBILE',
    status: 'NOT STARTED',
    budget: 25000,
    deadline: '2026-07-20',
    progress: 0,
    assignedMembers: [],
    applicantsCount: 3,
    description: 'Build a native mobile finance dashboard app with secure login and expense tracking.',
  },
  {
    id: 3,
    title: 'Brand Identity Design',
    client: 'Luxe Fashion',
    category: 'DESIGN',
    status: 'IN PROGRESS',
    budget: 8500,
    deadline: '2026-05-30',
    progress: 45,
    assignedMembers: [
      { id: 2, name: 'Marcus Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus' }
    ],
    applicantsCount: 5,
    description: 'Create a premium brand system for a luxury fashion label, including logo, typography, and guidelines.',
  },
  {
    id: 4,
    title: 'UI/UX Redesign',
    client: 'TechCorp Solutions',
    category: 'DESIGN',
    status: 'IN PROGRESS',
    budget: 12000,
    deadline: '2026-06-30',
    progress: 80,
    assignedMembers: [
      { id: 3, name: 'Emma Wilson', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma' }
    ],
    applicantsCount: 2,
    description: 'Redesign the client portal interface for faster task completion and better mobile usability.',
  },
  {
    id: 5,
    title: 'Backend API Development',
    client: 'DataSync Inc.',
    category: 'WEB',
    status: 'IN PROGRESS',
    budget: 18000,
    deadline: '2026-07-10',
    progress: 35,
    assignedMembers: [
      { id: 4, name: 'Alex Rodriguez', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' }
    ],
    applicantsCount: 4,
    description: 'Develop a RESTful backend API for the new synchronization platform with robust auth and logging.',
  },
  {
    id: 6,
    title: 'Graphic Design Package',
    client: 'Creative Studio',
    category: 'GRAPHICS',
    status: 'COMPLETED',
    budget: 5000,
    deadline: '2026-05-15',
    progress: 100,
    assignedMembers: [
      { id: 5, name: 'Sofia Garcia', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia' }
    ],
    applicantsCount: 1,
    description: 'Create a full graphic package for a campaign launch including banners, social assets, and presentations.',
  },
];

export const initialApplications = [
  {
    id: 1001,
    projectId: 1,
    name: 'Asha Patel',
    applicantType: 'gig_expert',
    status: 'pending',
    submittedAt: '2026-05-01T09:25:00.000Z',
  },
  {
    id: 1002,
    projectId: 1,
    name: 'SilverLine Agency',
    applicantType: 'agency',
    status: 'pending',
    submittedAt: '2026-05-03T11:15:00.000Z',
  },
  {
    id: 1003,
    projectId: 3,
    name: 'Pranav Kumar',
    applicantType: 'gig_expert',
    status: 'approved',
    submittedAt: '2026-04-22T16:05:00.000Z',
  },
];

export const initialMilestonesByProject = {
  1: [
    {
      id: 2001,
      title: 'Discovery & Planning',
      description: 'Research, user journey mapping, and wireframe planning.',
      due_date: '2026-05-10',
      amount: 3500,
      status: 'completed',
      payments: [
        { id: 3001, date: '2026-05-12', amount: 3500, note: 'Initial milestone payout' },
      ],
    },
    {
      id: 2002,
      title: 'Visual Design',
      description: 'Design final mockups and interactive prototypes.',
      due_date: '2026-06-01',
      amount: 4500,
      status: 'in_progress',
      payments: [],
    },
  ],
  3: [
    {
      id: 2003,
      title: 'Brand Strategy',
      description: 'Core brand narrative and positioning workshop.',
      due_date: '2026-05-05',
      amount: 2500,
      status: 'completed',
      payments: [
        { id: 3002, date: '2026-05-06', amount: 2500, note: 'Workshop payment' },
      ],
    },
  ],
};
