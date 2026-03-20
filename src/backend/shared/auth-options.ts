import { PrismaAdapter } from '@next-auth/prisma-adapter'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from './prisma'
import { compare } from 'bcryptjs'

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim() ?? ''
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() ?? ''

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null
        const email = credentials.email.toLowerCase()
        console.log(`[AUTH] Login attempt for: ${email}`)
        const user = await prisma.user.findUnique({ where: { email } })
        
        if (!user) {
          console.log(`[AUTH] User not found: ${email}`)
          return null
        }
        
        if (!user.password) {
          console.log(`[AUTH] User has no password (likely social login): ${email}`)
          return null
        }

        const isValid = await compare(credentials.password, user.password)
        if (!isValid) {
          console.log(`[AUTH] Invalid password for: ${email}`)
          return null
        }
        
        console.log(`[AUTH] Login successful for: ${email} (Role: ${user.role})`)
        return { id: user.id, email: user.email!, role: user.role }
      },
    }),
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn() {
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id ?? token.sub
        token.role = (user as any).role ?? token.role
      }
      if (!token.role && token.sub) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.sub as string }, select: { role: true } })
        token.role = dbUser?.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role
      }
      return session
    },
  },
  events: {
    async createUser({ user }) {
      // Automatically create a Member record when a new user signs up (e.g. via Google)
      await prisma.member.create({
        data: {
          id: user.id,
          joinDate: new Date(),
          plan: 'MONTHLY',
          planExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          planStatus: 'ACTIVE',
          attendanceCount: 0,
          sessionsRemaining: 30,
          age: 18,
          gender: 'OTHER',
          Invoice: {
            create: {
              plan: 'MONTHLY',
              amount: 1800,
              date: new Date(),
              status: 'PAID'
            }
          }
        },
      })
    }
  }
}
