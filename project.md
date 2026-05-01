# Jiffit Backend - Project Documentation

Last updated: April 26, 2026

## 1. Project Summary

This project is a TypeScript + Express + Prisma backend for managing:

- Users (`mUsers`)
- Role master (`mRoles`)
- User type master (`mUserTypes`)

The API follows a controller -> service -> Prisma pattern and exposes Swagger docs for testing and handover.

Current functional areas:

- Role master CRUD + bulk delete + user lookup by role
- User type master CRUD + bulk delete + user lookup by user type
- User CRUD (create/get/delete) + lifecycle (`leave` / `rejoin`) + bulk delete
- Validation and standardized error handling
- Safety guard: system prevents deletion/deactivation of the last active SU user (based on `role.sCode = "SU"`)
- User credential creation guard: only active `SU` can create new office-level users

## 2. Tech Stack and Why

## Runtime

- Node.js (recommended: 18+)
- Express 5 (`express`): HTTP server and routing
- TypeScript (`typescript`): static typing and safer refactors

## Database and ORM

- MySQL/MariaDB
- Prisma ORM (`prisma`, `@prisma/client`)
- Prisma MariaDB adapter (`@prisma/adapter-mariadb`): direct MariaDB adapter integration used in `src/lib/prisma.ts`
- `mysql2`: database driver used by Prisma adapter

## Validation

- Custom parser/validator layer in `src/utils/request-parsers.ts`
- Zod (`zod`) is integrated inside the body validation utility for consistent request-body validation
- Geo validators are prepared for future location features:
  - `parseGeoPoint`
  - `parseOptionalGeoPoint`

## API Documentation

- `swagger-ui-express`: serves docs at `/api-docs`
- JSON spec at `/api-docs.json`

## Utility packages

- `cors`: cross-origin requests
- `dotenv`: loads environment variables
- `ts-node-dev`: dev server with restart on file changes

## 3. Project Structure

Key folders:

- `src/index.ts`: app bootstrap, middleware, route mounting, docs, health route
- `src/lib/prisma.ts`: Prisma client singleton setup with MariaDB adapter
- `src/routes/*`: route definitions by module
- `src/controllers/*`: request parsing + response handling
- `src/services/*`: database/business logic
- `src/utils/*`: custom errors, validators, response/error helpers
- `src/docs/swagger.ts`: OpenAPI spec object
- `prisma/schema.prisma`: schema models
- `prisma/migrations/*`: migration history

Build output:

- `dist/*` generated from TypeScript (`npm run build`)

## 4. Configuration and Environment

## Required environment variable

- `DATABASE_URL` (required)

Used by:

- `prisma.config.ts` (migrations/datasource config)
- `src/lib/prisma.ts` (runtime Prisma client)

Recommended `.env` template:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DB_NAME"
NODE_ENV="development"
```

Notes:

- Server port is currently hardcoded to `3000` in `src/index.ts`.
- `.gitignore` excludes `.env` and `node_modules`.

## 5. TypeScript and Build Setup

`tsconfig.json` highlights:

- `rootDir: ./src`
- `outDir: ./dist`
- `strict: true`
- `sourceMap: true`
- `module: nodenext`
- `moduleResolution: nodenext`

Scripts:

- `npm run dev`: runs `ts-node-dev` with auto-restart
- `npm run build`: compiles TypeScript
- `npm start`: runs compiled output from `dist`

## 6. Data Model (Current)

From `prisma/schema.prisma`:

## `mRoles`

- `iMasterId` (PK, auto increment)
- `sCode` (unique)
- `sName` (unique)
- `isActive`
- `createdAt`, `updatedAt`

## `mUserTypes`

- `iMasterId` (PK, auto increment)
- `sCode` (unique)
- `sName` (unique)
- `isActive`
- `createdAt`, `updatedAt`

## `mUsers`

- `id` (PK, auto increment)
- `username` (required, unique)
- `password` (required)
- `firstName`, `middleName`, `lastName` (optional)
- `address`, `mobileNo`, `alternateNumber` (optional)
- `email` (optional, unique when present)
- `iRoleMasterId` (optional FK -> `mRoles.iMasterId`)
- `iUserTypeMasterId` (optional FK -> `mUserTypes.iMasterId`)
- `employmentStatus` (`ACTIVE` / `LEFT`, default `ACTIVE`)
- `joinedAt`, `leftAt`
- `isActive`
- `createdAt`, `updatedAt`

## 7. Migration History

Current migrations:

1. `20260425123623_create_users_roles`
2. `20260425184608_add_user_profile_fields_and_username`
3. `20260425191356_make_user_role_and_email_optional`
4. `20260425194843_add_user_join_leave_lifecycle`
5. `20260425203304_rename_role_master_columns`
6. `20260425225500_add_user_type_master`

## 8. API Conventions

## Standard success response

```json
{
  "result": 1,
  "message": "Success message",
  "data": {}
}
```

## Standard error response

```json
{
  "result": -1,
  "message": "Error message",
  "data": null
}
```

## Empty list behavior

List endpoints return HTTP `200` with `data: []` and a clear message such as:

- `"No users found."`
- `"No roles found."`
- `"No user types found."`

## 9. Error Handling

Centralized in `src/utils/error-handler.ts`.

Maps known Prisma errors:

- `P2002` -> `409` duplicate value
- `P2003` -> `400` invalid relation reference
- `P2025` -> `404` record not found
- `P2021` / `P2022` -> `500` schema mismatch message ("run migrations and restart")

Unknown errors -> `500 Internal server error.`

## 10. Validation Strategy

Request validation is done before service logic, mainly in controllers using helper functions from `request-parsers.ts`.

Core validation features:

- Required/optional string/int/boolean/date parsing
- Required int array parser for bulk delete payloads
- Strict request-body allowlist:
  - rejects unknown fields
  - checks required fields for create
  - checks "at least one field" for update
- Zod-backed body validation engine under `validateRequestBodyFields`

Geo-ready validators (currently not used by endpoints yet):

- `parseGeoPoint`
- `parseOptionalGeoPoint`

Accepted ranges:

- latitude: `-90` to `90`
- longitude: `-180` to `180`

## 11. Business Rules Implemented

## Role/UserType delete protection

Bulk delete for roles/user types is blocked if they are still assigned to users.

## SU safety guard

In `user.service.ts`, destructive actions are blocked when they would remove the last active SU user.

SU definition is strict:

- only `role.sCode = "SU"` (case-insensitive via uppercase comparison)

Guard applies to:

- `markUserLeftById`
- `markUserLeftByUsername`
- `deleteUserById`
- `deleteUserByUsername`
- `deleteUsersByIds` (bulk)

Error message:

- `"Operation denied: at least one active SU user must remain."`

## SU-only user credential creation

For `POST /api/users`, creator must be an active SU user.

Enforced via required field:

- `createdByUserId`

Rules:

- `createdByUserId` must point to an existing active user
- creator must have role `sCode = "SU"`
- creator employment status must be `ACTIVE`

Current implementation note:

- Because auth/JWT is not implemented yet, API expects `createdByUserId` in request body.
- After login/auth is added, this should come from authenticated token context instead of request body.

Create-user required fields now:

- `username`
- `password`
- `iRoleMasterId`
- `iUserTypeMasterId`
- `createdByUserId`

## 12. API Endpoint Map

Base URL (local): `http://localhost:3000`

## System and docs

- `GET /`
- `GET /health`
- `GET /api-docs`
- `GET /api-docs.json`

## Roles (`/api/roles`)

- `POST /`
- `GET /`
- `GET /by-sname/:sName`
- `GET /:iMasterId`
- `PATCH /:iMasterId`
- `DELETE /:iMasterId`
- `PATCH /by-scode/:sCode`
- `DELETE /by-scode/:sCode`
- `DELETE /bulk`
- `GET /:iMasterId/users`
- `GET /sname/:sName/users`

## User Types (`/api/user-types`)

- `POST /`
- `GET /`
- `GET /by-sname/:sName`
- `GET /:iMasterId`
- `PATCH /:iMasterId`
- `DELETE /:iMasterId`
- `PATCH /by-scode/:sCode`
- `DELETE /by-scode/:sCode`
- `DELETE /bulk`
- `GET /:iMasterId/users`
- `GET /sname/:sName/users`

## Users (`/api/users`)

- `POST /`
- `GET /`
- `GET /:id`
- `GET /by-username/:username`
- `GET /by-role/:iMasterId`
- `GET /by-role-sname/:sName`
- `GET /by-user-type/:iMasterId`
- `GET /by-user-type-sname/:sName`
- `PATCH /:id/leave`
- `PATCH /by-username/:username/leave`
- `PATCH /:id/rejoin`
- `PATCH /by-username/:username/rejoin`
- `DELETE /:id`
- `DELETE /by-username/:username`
- `DELETE /bulk`

## 13. Request Payload Patterns

## Create user (office-level credential creation)

```json
{
  "username": "office_user_01",
  "password": "TempPass@123",
  "iRoleMasterId": 2,
  "iUserTypeMasterId": 1,
  "createdByUserId": 1,
  "isActive": true
}
```

Notes:

- `createdByUserId` must be an active SU user.
- `iRoleMasterId` and `iUserTypeMasterId` are mandatory for user creation.

## Bulk delete payloads

Roles:

```json
{ "rolesId": [1, 2, 3] }
```

Users:

```json
{ "usersId": [1, 2, 3] }
```

User types:

```json
{ "userTypesId": [1, 2, 3] }
```

Alias fields also supported in some places (for backward compatibility):

- `roleId` alongside `iRoleMasterId`
- `userTypeId` alongside `iUserTypeMasterId`
- query aliases like `name`, `roleName`, `userTypeName`

## 14. Development Workflow

## First time setup

1. Install dependencies:

```bash
npm install
```

2. Configure `.env` with `DATABASE_URL`.

3. Apply migrations:

```bash
npx prisma migrate deploy
```

4. Generate Prisma client:

```bash
npx prisma generate
```

5. Start dev server:

```bash
npm run dev
```

## During schema changes

1. Edit `prisma/schema.prisma`
2. Create migration:

```bash
npx prisma migrate dev --name your_change_name
```

3. Regenerate client if needed:

```bash
npx prisma generate
```

## Production-style start

```bash
npm run build
npm start
```

## 15. Current Security and Functional Gaps

These are important to note for client delivery:

- Passwords are currently stored as plain text (must move to hashing, e.g. bcrypt/argon2)
- No authentication (login/JWT/session) implemented yet
- No authorization middleware yet (role-based access checks at route level)
- No rate limiting/throttling
- No audit trail table for critical actions
- No tests yet (unit/integration/e2e)

## 16. Suggested Next Milestones

1. Authentication module (`login`, password hashing, token issuance)
2. Authorization middleware (`SU`, `ADMIN`, etc.)
3. Audit log for role/user critical changes
4. Soft delete strategy where needed
5. Add automated tests and CI checks
6. Add pagination for list endpoints
7. Add geo/location fields and wire existing geo validators

## 17. Handover Notes

For client handover and dashboard access model:

- Keep system invite-only (no public signup)
- Seed at least one `SU` user before deployment
- Use admin-driven user creation
- Maintain SU safety rule so at least one active `SU` always remains
