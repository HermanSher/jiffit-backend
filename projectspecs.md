# Jiffit Backend Current Project Specs

This file captures the current backend state before the next endpoint changes.

## Project Path

`C:\Users\herma\Downloads\JIFFIT\Jiffit Project\jiffit-backend`

## 1. Prisma Schema

File: `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
}

enum EmploymentStatus {
  ACTIVE
  LEFT
}

model mRoles {
  iMasterId Int      @id @default(autoincrement())
  sCode     String   @unique
  sName     String   @unique
  precedence Int     @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users     mUsers[]
}

model mUserTypes {
  iMasterId Int      @id @default(autoincrement())
  sCode     String   @unique
  sName     String   @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users     mUsers[]
}

model mUsers {
  id                Int      @id @default(autoincrement())
  username          String   @unique
  firstName         String?
  middleName        String?
  lastName          String?
  address           String?
  mobileNo          String?
  alternateNumber   String?
  email             String?  @unique
  password          String
  iRoleMasterId     Int?
  iUserTypeMasterId Int?
  employmentStatus EmploymentStatus @default(ACTIVE)
  joinedAt          DateTime @default(now())
  leftAt            DateTime?
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  role      mRoles?      @relation(fields: [iRoleMasterId], references: [iMasterId])
  userType  mUserTypes?  @relation(fields: [iUserTypeMasterId], references: [iMasterId])
}
```

## 2. Package JSON

File: `package.json`

```json
{
  "name": "jiffit-backend",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs",
  "dependencies": {
    "@prisma/adapter-mariadb": "^7.8.0",
    "@prisma/client": "^7.8.0",
    "cors": "^2.8.6",
    "dotenv": "^17.4.2",
    "express": "^5.2.1",
    "mysql2": "^3.22.2",
    "swagger-ui-express": "^5.0.1",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.6",
    "@types/node": "^25.6.0",
    "@types/swagger-ui-express": "^4.1.8",
    "prisma": "^7.8.0",
    "ts-node-dev": "^2.0.0",
    "typescript": "^6.0.3"
  }
}
```

## 3. Source Folder Structure

```text
src/
  index.ts
  controllers/
    auth.controller.ts
    role.controller.ts
    user-type.controller.ts
    user.controller.ts
  docs/
    swagger.ts
  lib/
    prisma.ts
  routes/
    auth.routes.ts
    role.routes.ts
    user-type.routes.ts
    user.routes.ts
  services/
    auth.service.ts
    role.service.ts
    user-type.service.ts
    user.service.ts
  utils/
    api-error.ts
    error-handler.ts
    request-parsers.ts
```

## 4. Existing Route, Controller, Service Files

Auth:
- Route: `src/routes/auth.routes.ts`
- Controller: `src/controllers/auth.controller.ts`
- Service: `src/services/auth.service.ts`

Roles:
- Route: `src/routes/role.routes.ts`
- Controller: `src/controllers/role.controller.ts`
- Service: `src/services/role.service.ts`

User Types:
- Route: `src/routes/user-type.routes.ts`
- Controller: `src/controllers/user-type.controller.ts`
- Service: `src/services/user-type.service.ts`

Users:
- Route: `src/routes/user.routes.ts`
- Controller: `src/controllers/user.controller.ts`
- Service: `src/services/user.service.ts`

Shared:
- Prisma client: `src/lib/prisma.ts`
- Swagger spec: `src/docs/swagger.ts`
- API error helper: `src/utils/api-error.ts`
- Error response helper: `src/utils/error-handler.ts`
- Request parser helpers: `src/utils/request-parsers.ts`

## 5. Current Env Example Without Password

Current real `.env` points to local MySQL database `jiffit_backend`.

Use this redacted example:

```env
DATABASE_URL="mysql://root:<password>@localhost:3306/jiffit_backend"
```

## 6. APIs Already Wired / Working

Base:
- `GET /`
- `GET /health`
- `GET /api-docs`
- `GET /api-docs.json`

Auth:
- `POST /api/auth/login`

Roles:
- `POST /api/roles`
- `GET /api/roles`
- `GET /api/roles/by-sname/:sName`
- `DELETE /api/roles/bulk`
- `PATCH /api/roles/by-scode/:sCode`
- `DELETE /api/roles/by-scode/:sCode`
- `GET /api/roles/:iMasterId/users`
- `GET /api/roles/sname/:sName/users`
- `PATCH /api/roles/:iMasterId`
- `DELETE /api/roles/:iMasterId`
- `GET /api/roles/:iMasterId`

User Types:
- `POST /api/user-types`
- `GET /api/user-types`
- `GET /api/user-types/by-sname/:sName`
- `DELETE /api/user-types/bulk`
- `PATCH /api/user-types/by-scode/:sCode`
- `DELETE /api/user-types/by-scode/:sCode`
- `GET /api/user-types/:iMasterId/users`
- `GET /api/user-types/sname/:sName/users`
- `PATCH /api/user-types/:iMasterId`
- `DELETE /api/user-types/:iMasterId`
- `GET /api/user-types/:iMasterId`

Users:
- `POST /api/users`
- `GET /api/users`
- `GET /api/users/by-username/:username`
- `GET /api/users/by-role/:iMasterId`
- `GET /api/users/by-role-sname/:sName`
- `GET /api/users/by-user-type/:iMasterId`
- `GET /api/users/by-user-type-sname/:sName`
- `PATCH /api/users/:id/leave`
- `PATCH /api/users/by-username/:username/leave`
- `PATCH /api/users/:id/rejoin`
- `PATCH /api/users/by-username/:username/rejoin`
- `DELETE /api/users/bulk`
- `DELETE /api/users/by-username/:username`
- `DELETE /api/users/:id`
- `GET /api/users/:id`

## Important Current Business Rules

Roles:
- `mRoles.precedence` is unique.
- `SU` must always have precedence `1`.
- Precedence `1` is reserved for `SU`.

Users:
- Only an active SU user can create new user credentials.
- Deleting users or marking users as left must leave at least one active SU user.
- Users support lifecycle status through `employmentStatus`: `ACTIVE` or `LEFT`.

## Notes

- Server currently listens on port `3000`.
- API response convention is `{ result, message, data }`.
- Login currently validates against stored password directly.
- JWT/session middleware is not implemented yet; login returns a generated token-like session string.
