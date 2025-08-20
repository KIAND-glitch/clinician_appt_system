import swaggerJSDoc from 'swagger-jsdoc';

// swagger-jsdoc has no bundled TypeScript types in this project; keep options untyped
const options: any = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Clinic Appointments API',
      version: '1.0.0',
      description: 'API for managing clinician appointments',
    },
    servers: [{ url: 'http://localhost:3000' }],
    components: {
      schemas: {
        Appointment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            clinicianId: { type: 'string' },
            patientId: { type: 'string' },
            start: { type: 'string', format: 'date-time' },
            end: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
          },
          required: ['id','clinicianId','patientId','start','end','createdAt'],
        },
        AppointmentCreate: {
          type: 'object',
          properties: {
            clinicianId: { type: 'string' },
            patientId: { type: 'string' },
            start: { type: 'string', format: 'date-time' },
            end: { type: 'string', format: 'date-time' },
          },
          required: ['clinicianId','patientId','start','end'],
        },
      },
    },
  },
  // Scan source files for JSDoc/OpenAPI comments (routes/controllers)
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const spec = swaggerJSDoc(options);
export default spec;
