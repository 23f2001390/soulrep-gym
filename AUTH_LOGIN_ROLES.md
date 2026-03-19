# SoulRep Login Roles

This document describes the existing login types in SoulRep.

## Roles

- `OWNER`
- `TRAINER`
- `MEMBER`

## How login works

- The app uses NextAuth for authentication.
- Login is handled with email and password through the credentials provider at the `/login` page.
- The legacy `/api/auth/login` route is disabled and returns an error.

## Existing account types

- Owner login: email and password for the main admin/management account.
- Trainer login: email and password for staff accounts that manage assigned members.
- Member login: email and password for gym members who view plans, bookings, attendance, and nutrition data.

## Important notes

- Member accounts can be created through `/api/auth/signup`.
- Trainer and owner accounts are not created by the public signup flow.
- The seed data includes example owner, trainer, and member accounts.
- The session stores both the user id and role so dashboard access can be restricted by role.

## Default dashboard paths

- Owner: `/dashboard/owner`
- Trainer: `/dashboard/trainer`
- Member: `/dashboard/member`
