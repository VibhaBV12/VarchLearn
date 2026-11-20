export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'VarchLearn REST API',
    version: '1.0.0',
    description:
      'REST API for VarchLearn Student Mobile App and Admin Web Dashboard (Node.js + Express + PostgreSQL + Prisma).',
  },
  servers: [
    {
      url: 'http://localhost:4000/api/v1',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/student/register': { post: { tags: ['Auth'], summary: 'Register a new student' } },
    '/auth/student/login': { post: { tags: ['Auth'], summary: 'Student login (returns JWT)' } },
    '/auth/admin/login': { post: { tags: ['Auth'], summary: 'Admin login (returns JWT)' } },
    '/auth/student/verify-pin': { post: { tags: ['Auth'], summary: 'Verify 4-digit Recovery PIN' } },
    '/auth/student/reset-password': { post: { tags: ['Auth'], summary: 'Reset student password with PIN' } },
    '/auth/me': { get: { tags: ['Auth'], summary: 'Get authenticated user profile' } },
    '/students': {
      get: { tags: ['Students'], summary: 'List all students (Admin)' },
      post: { tags: ['Students'], summary: 'Create student (Admin)' },
    },
    '/classes': {
      get: { tags: ['Classes'], summary: 'List classes' },
      post: { tags: ['Classes'], summary: 'Create class (Admin)' },
    },
    '/textbooks/upload': { post: { tags: ['Textbooks'], summary: 'Upload textbook PDF & extract chapters (Admin)' } },
    '/chapters': { get: { tags: ['Chapters'], summary: 'List extracted chapters & topics' } },
    '/activities': {
      get: { tags: ['Activities'], summary: 'List Activity Bank (Students see Approved only)' },
      post: { tags: ['Activities'], summary: 'Create manual activity (Admin)' },
    },
    '/activities/generate': { post: { tags: ['Activities'], summary: 'Generate VARK-customized activity (Admin)' } },
    '/activities/{id}/approval': { patch: { tags: ['Activities'], summary: 'Approve, reject, or archive activity (Admin)' } },
    '/assessments': {
      get: { tags: ['Assessments'], summary: 'List assessments (Students see Published for their class)' },
      post: { tags: ['Assessments'], summary: 'Create 4-modality assessment (Admin)' },
    },
    '/assessments/{id}/submit': { post: { tags: ['Assessments'], summary: 'Submit assessment & compute VARK scores' } },
    '/assignments/student/{studentId}': { get: { tags: ['Assignments'], summary: 'Get student daily adventure path' } },
    '/assignments/propose/{studentId}': { get: { tags: ['Assignments'], summary: 'Propose daily allocation (max 12 with carry-forward)' } },
    '/assignments/publish/{studentId}': { post: { tags: ['Assignments'], summary: 'Publish daily assignment (Admin)' } },
    '/assignments/nodes/{nodeId}/complete': { post: { tags: ['Assignments'], summary: 'Complete a daily path node & award stars' } },
    '/progress/{studentId}': { get: { tags: ['Progress'], summary: 'Get student assessment & daily completion progress' } },
    '/rewards/{studentId}': { get: { tags: ['Rewards'], summary: 'Get student stars, badges & reward events' } },
    '/analytics/dashboard': { get: { tags: ['Analytics'], summary: 'Get Admin dashboard KPIs & modality averages' } },
    '/settings': {
      get: { tags: ['Settings'], summary: 'Get application settings' },
      put: { tags: ['Settings'], summary: 'Update application settings (Admin)' },
    },
  },
};
