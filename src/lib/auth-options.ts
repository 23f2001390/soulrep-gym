import { PrismaAdapter } from '@next-auth/prisma-adapter'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'

/**
 * NextAuth configuration for the SoulRep application. This configuration enables
 * authentication via email/password (Credentials provider) and Google OAuth.
 * The Prisma adapter persists user, account and verification token data using
 * the Prisma schema. Sessions are configured to use JWT strategy, so session
 * details are stored in signed cookies rather than the database. The
 * `jwt` and `session` callbacks add user id and role information to the
 * token and session objects, making them available on both client and
 * server. See the NextAuth documentation for additional configuration
 * options: https://authjs.dev/getting-started/nextjs
 */
export const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers
  providers: [
    // Credentials provider for email/password login
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Guard against missing credentials
        if (!credentials?.email || !credentials.password) {
          return null
        }
        // Look up the user by email
        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user) {
          // No user found with this email
          return null
        }
        // If the user does not have a password (e.g. created via Google), prevent credentials login
        if (!user.password) {
          return null
        }
        // Validate the password using bcrypt
        const isValid = await compare(credentials.password, user.password)
        if (!isValid) {
          return null
        }
        // Return the user object. Only id, email and role will be persisted in the token.
        return {
          id: user.id,
          email: user.email!,
          role: user.role,
        }
      },
    }),
    // Google OAuth provider. Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  // Use the Prisma adapter to persist users, accounts and verification tokens
  adapter: PrismaAdapter(prisma),
  // Use JWT strategy for session management. This stores session data in the token instead of the database
  session: {
    strategy: 'jwt',
  },
  // Set a custom sign‑in page. The NextAuth sign‑in page will be used if this is not specified.
  pages: {
    signIn: '/login',
  },
  // Provide a secret to encrypt JWT tokens. This should be a long, random string set in the environment
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      // Google OAuth users need a matching Member row so the member dashboard
      // APIs can resolve profile data on first login.
      if (account?.provider === 'google' && user?.email) {
        const dbUser =
          ((user as any).id && (await prisma.user.findUnique({ where: { id: (user as any).id } }))) ||
          (await prisma.user.findUnique({ where: { email: user.email } }))

        if (dbUser?.id) {
          const existingMember = await prisma.member.findUnique({ where: { id: dbUser.id } })
          if (!existingMember) {
            await prisma.member.create({
              data: {
                id: dbUser.id,
                joinDate: new Date(),
                plan: 'MONTHLY',
                planExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                planStatus: 'ACTIVE',
                attendanceCount: 0,
                sessionsRemaining: 30,
                age: 18,
                gender: 'OTHER',
              },
            })
          }
        }
      }
      return true
    },
    // Add the user's id and role into the JWT. These values persist across requests
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id ?? token.sub
        token.role = (user as any).role ?? token.role
      }
      if (!token.role && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        })
        token.role = dbUser?.role
      }
      return token
    },
    // Make the id and role available on the session
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role
      }
      return session
    },
  },
}
