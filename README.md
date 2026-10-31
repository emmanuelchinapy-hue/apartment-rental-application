# apartment-rental-application

A complete apartment rental application platform with:

- React + TypeScript frontend
- Tailwind CSS styling
- Node.js + Express backend
- PostgreSQL + Prisma database
- Secure admin dashboard
- Rental application submission and payment preference workflow

## Quick start

1. Install dependencies:
   npm install
   npm --prefix backend install
   npm --prefix frontend install

2. Set up PostgreSQL and create the database:
   createdb apartment_rental_app

3. Configure backend environment:
   cp backend/.env.example backend/.env
   update the DATABASE_URL and JWT_SECRET values

4. Run Prisma migration:
   cd backend
   npx prisma migrate dev --name init

5. Seed admin user:
   node src/seedAdmin.js

6. Start backend:
   npm run dev

7. Start frontend:
   cd frontend
   npm run dev

8. Open the app at http://localhost:5173

Admin login:
- Email: admin@rental.local
- Password: ChangeMe123!

Note: Update the admin credentials and JWT secret before production use.
