This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, install the packages:

```bash
npm install
# or
yarn install
# or 
pnpm install
# or 
bun install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Backend Setup

This project includes a complete backend implemented with [Prisma](https://www.prisma.io/) and **Neon**, a serverless Postgres database. The backend exposes RESTful API routes under `/api` that power the dashboard pages. Authentication is handled via [JSON Web Tokens (JWTs)](https://jwt.io/) with passwords hashed using bcrypt. Bcrypt incorporates a salt and an adaptive cost factor, making it resistant to rainbow table and brute‐force attacks【171571983526134†L146-L151】.

### Required environment variables

Before running the backend you must create a `.env` file at the root of the `soulrep` directory. An example template is provided in `.env.example`. At minimum you should configure the following variables:

- **DATABASE_URL** – a Postgres connection string pointing at your Neon database. You can obtain this from the Neon dashboard. For example: `postgresql://user:password@ep-silent-firefly-123456.us-east-1.aws.neon.tech/neondb?sslmode=require`. Neon is a serverless Postgres platform that decouples storage and compute so that compute can scale up and down automatically【51572528687794†screenshot】. This separation also enables branching workflows similar to Git, which is useful for development environments.
- **JWT_SECRET** – a long, random secret used to sign and verify JWT tokens. Never commit this secret to version control.

You can copy the example file and fill in the values:

```bash
cp .env.example .env
# then edit .env and set DATABASE_URL and JWT_SECRET
```

### Database migrations

The Prisma schema lives at `prisma/schema.prisma`. After configuring your `DATABASE_URL`, run the following commands from within the `soulrep` directory using pnpm (or your preferred package manager) to create and migrate the database tables:

```bash
pnpm prisma generate        # generate the Prisma client
pnpm prisma migrate deploy  # apply pending migrations in production
pnpm prisma migrate dev --name init  # or use this in development to create migrations
```

### Seeding the database

To populate the database with sample data that matches the frontend’s mock data, run the seed script:

```bash
pnpm prisma db seed
```

The seed script creates an owner account (`owner@soulrep.com` / `owner123`), multiple trainers, members, attendance records, invoices, workout plans with exercises, session logs, reviews, bookings, a nutrition profile and a sample meal plan. See `prisma/seed.ts` for details.

### Running the development server

Once your database is set up and seeded, start the Next.js development server:

```bash
pnpm dev
```

The frontend will communicate with the backend using the API routes under `/api`. When logging in or signing up, the server returns a JWT token. Include this token in the `Authorization` header as `Bearer <token>` for subsequent requests.

### Authentication notes

Passwords are hashed with bcrypt before being stored. Bcrypt’s use of salting and an adjustable cost factor means that hashed passwords remain secure over time as the hashing workload can be increased to match improvements in hardware【171571983526134†L146-L151】. Tokens are signed with a secret and include the user’s id and role; they expire after seven days by default.

### Deployment

When deploying to Vercel or another hosting provider, set the same environment variables (DATABASE_URL and JWT_SECRET) in your deployment settings. Because Neon is serverless, you pay only for the compute you use and it scales automatically, making it a good fit for serverless deployments【51572528687794†screenshot】.
