# Community Aid Resource Map

A web application for mapping and managing community mutual aid resources, allowing community members to submit locations of food banks, clothing centers, and other aid resources. Submissions are verified by coordinators before being displayed on an interactive public map.

## Features

- Interactive map showing verified aid resources
- Public submission form for new resource locations
- Coordinator dashboard for reviewing and verifying submissions
- Address geocoding for accurate map placement
- Filtering resources by type and location
- Mobile-responsive design

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8 or higher)
- npm or yarn

## Getting Started

1. Clone the repository
2. Copy the example environment file and configure your settings:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Update the `.env` file with your MySQL credentials and other configuration.

3. Initialize the project (installs dependencies and sets up database):
   ```bash
   npm run initialize-project
   ```

4. Start the development servers:
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3002

## Default Coordinator Account

After initialization, you can log in with these credentials:
- Username: coordinator
- Password: password123

**Important:** Change these credentials in production!

## Project Structure

```
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts (auth, etc.)
│   │   ├── services/       # API client services
│   │   └── styles/         # Global styles
│
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── middlewares/    # Express middlewares
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utilities and helpers
│
└── package.json            # Root package.json for running both services
```

## Available Scripts

In the project root:
- `npm run install-all` - Install dependencies for all packages
- `npm run dev` - Start both frontend and backend in development mode
- `npm run init-db` - Initialize/reset the database
- `npm run initialize-project` - Complete project setup (install + init-db)

## API Endpoints

### Public Endpoints
- `GET /api/submissions` - Get all verified submissions
- `POST /api/submissions` - Submit a new resource location

### Protected Endpoints (Requires Coordinator Authentication)
- `GET /api/submissions/pending` - Get pending submissions
- `PATCH /api/submissions/:id` - Update submission status

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.# mutual-aid-system
