# Student Homework Management & AI Backend

A modular Node.js backend built with TypeScript, Express, TypeORM, and PostgreSQL.

## Features & Architecture

- **Entities**:
  - **Student**: `id` (UUID), `name`, `syllabus_stage_index`, `script_preference` (`'hebrew_transliteration' | 'arabic_letters'`), `general_notes` (nullable text), `created_at`.
  - **Homework**: `id` (UUID), `student_id` (`ManyToOne` relation with `Student`), `status` (default `'draft'`), `content` (`jsonb` for exercises), `whiteboard_image_url` (nullable), `created_at`.
- **Multer Integration**: `POST /api/homeworks/generate` route accepting a single file upload named `whiteboard` using in-memory storage (`multer.memoryStorage()`).
- **Database**: TypeORM DataSource configured via `dotenv` environment variables.

---

## Directory Structure

```
homework-backend/
├── src/
│   ├── config/
│   │   └── data-source.ts       # TypeORM DataSource setup with dotenv
│   ├── controllers/
│   │   ├── student.controller.ts
│   │   └── homework.controller.ts
│   ├── entities/
│   │   ├── Student.ts           # Student entity
│   │   ├── Homework.ts          # Homework entity
│   │   └── index.ts
│   ├── routes/
│   │   ├── student.routes.ts    # Student CRUD endpoints
│   │   ├── homework.routes.ts   # Homework CRUD + /generate endpoints
│   │   └── index.ts             # Central API router
│   ├── services/
│   │   ├── student.service.ts
│   │   └── homework.service.ts
│   └── index.ts                 # Server bootstrap & TypeORM connection
├── .env                         # Environment variables
├── .env.example                 # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Update `.env` with your PostgreSQL database credentials:
```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=homework_db
```

### 3. Run in Development Mode
```bash
npm run dev
```

### 4. Build and Run in Production
```bash
npm run build
npm start
```

---

## API Endpoints

### Students (`/api/students`)
- `GET /api/students` - List all students (with their homeworks)
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create student (`name`, `syllabus_stage_index`, `script_preference`, `general_notes`)
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Homeworks (`/api/homeworks`)
- `GET /api/homeworks` - List all homeworks (optional query `?student_id=<uuid>`)
- `GET /api/homeworks/:id` - Get homework by ID
- `POST /api/homeworks` - Create homework (`student_id`, `status`, `content`, `whiteboard_image_url`)
- `PUT /api/homeworks/:id` - Update homework
- `DELETE /api/homeworks/:id` - Delete homework
- `POST /api/homeworks/generate` - Scaffolded AI generation endpoint with `multipart/form-data` accepting `whiteboard` image file.
