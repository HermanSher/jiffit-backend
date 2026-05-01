const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Jiffit Backend API",
    version: "1.0.0",
    description: "API documentation for user and role management.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development server",
    },
  ],
  tags: [
    { name: "Health", description: "Health and utility endpoints" },
    { name: "Roles", description: "Role management endpoints" },
    { name: "User Types", description: "User type master endpoints" },
    { name: "Users", description: "User management endpoints" },
  ],
  components: {
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          result: { type: "integer", example: -1 },
          message: { type: "string", example: "User not found." },
          data: { nullable: true, example: null },
        },
      },
      HealthResponse: {
        type: "object",
        properties: {
          result: { type: "integer", example: 1 },
          message: { type: "string", example: "Service is healthy." },
          status: { type: "string", example: "ok" },
          timestamp: { type: "string", format: "date-time" },
          uptimeSeconds: { type: "integer", example: 320 },
        },
      },
      Role: {
        type: "object",
        properties: {
          iMasterId: { type: "integer", example: 1 },
          sCode: { type: "string", example: "ROLE_ADMIN" },
          sName: { type: "string", example: "Admin" },
          precedence: { type: "integer", example: 2 },
          isActive: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      RoleCreateRequest: {
        type: "object",
        required: ["sCode", "sName", "precedence"],
        properties: {
          sCode: { type: "string", example: "ROLE_MANAGER" },
          sName: { type: "string", example: "Manager" },
          precedence: { type: "integer", example: 2 },
          isActive: { type: "boolean", example: true },
        },
      },
      RoleUpdateRequest: {
        type: "object",
        properties: {
          sCode: { type: "string", example: "ROLE_TEAM_LEAD" },
          sName: { type: "string", example: "Team Lead" },
          precedence: { type: "integer", example: 4 },
          isActive: { type: "boolean", example: true },
        },
      },
      RoleBulkDeleteRequest: {
        type: "object",
        required: ["rolesId"],
        properties: {
          rolesId: {
            type: "array",
            items: { type: "integer" },
            example: [1, 2, 3],
          },
        },
      },
      UserType: {
        type: "object",
        properties: {
          iMasterId: { type: "integer", example: 1 },
          sCode: { type: "string", example: "UT_EMPLOYEE" },
          sName: { type: "string", example: "Employee" },
          isActive: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      UserTypeCreateRequest: {
        type: "object",
        required: ["sCode", "sName"],
        properties: {
          sCode: { type: "string", example: "UT_CUSTOMER" },
          sName: { type: "string", example: "Customer" },
          isActive: { type: "boolean", example: true },
        },
      },
      UserTypeUpdateRequest: {
        type: "object",
        properties: {
          sCode: { type: "string", example: "UT_HERO" },
          sName: { type: "string", example: "Hero" },
          isActive: { type: "boolean", example: true },
        },
      },
      UserTypeBulkDeleteRequest: {
        type: "object",
        required: ["userTypesId"],
        properties: {
          userTypesId: {
            type: "array",
            items: { type: "integer" },
            example: [1, 2, 3],
          },
        },
      },
      UserRole: {
        type: "object",
        nullable: true,
        properties: {
          iMasterId: { type: "integer", example: 2 },
          sCode: { type: "string", example: "ROLE_MANAGER" },
          sName: { type: "string", example: "Manager" },
          isActive: { type: "boolean", example: true },
        },
      },
      UserUserType: {
        type: "object",
        nullable: true,
        properties: {
          iMasterId: { type: "integer", example: 1 },
          sCode: { type: "string", example: "UT_EMPLOYEE" },
          sName: { type: "string", example: "Employee" },
          isActive: { type: "boolean", example: true },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 10 },
          username: { type: "string", example: "john_doe" },
          firstName: { type: "string", nullable: true, example: "John" },
          middleName: { type: "string", nullable: true, example: "A" },
          lastName: { type: "string", nullable: true, example: "Doe" },
          address: { type: "string", nullable: true, example: "Bangalore" },
          mobileNo: { type: "string", nullable: true, example: "9999999999" },
          alternateNumber: { type: "string", nullable: true, example: "8888888888" },
          email: { type: "string", nullable: true, example: "john@demo.com" },
          iRoleMasterId: { type: "integer", nullable: true, example: 2 },
          iUserTypeMasterId: { type: "integer", nullable: true, example: 1 },
          employmentStatus: {
            type: "string",
            enum: ["ACTIVE", "LEFT"],
            example: "ACTIVE",
          },
          joinedAt: { type: "string", format: "date-time" },
          leftAt: { type: "string", format: "date-time", nullable: true },
          isActive: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          role: { $ref: "#/components/schemas/UserRole" },
          userType: { $ref: "#/components/schemas/UserUserType" },
        },
      },
      UserCreateRequest: {
        type: "object",
        required: ["username", "password", "iRoleMasterId", "iUserTypeMasterId", "createdByUserId"],
        properties: {
          username: { type: "string", example: "jane_doe" },
          firstName: { type: "string", example: "Jane" },
          middleName: { type: "string", example: "M" },
          lastName: { type: "string", example: "Doe" },
          address: { type: "string", example: "Pune" },
          mobileNo: { type: "string", example: "7777777777" },
          alternateNumber: { type: "string", example: "6666666666" },
          email: { type: "string", example: "jane@demo.com" },
          password: { type: "string", example: "StrongPassword@123" },
          iRoleMasterId: { type: "integer", example: 2 },
          iUserTypeMasterId: { type: "integer", example: 1 },
          createdByUserId: { type: "integer", example: 1 },
          isActive: { type: "boolean", example: true },
        },
      },
      UserCreateResponseData: {
        type: "object",
        properties: {
          id: { type: "integer", example: 3 },
          username: { type: "string", example: "jane_doe" },
          role: {
            type: "object",
            nullable: true,
            properties: {
              iMasterId: { type: "integer", example: 13 },
              sCode: { type: "string", example: "ROLE_MANAGER" },
              sName: { type: "string", example: "Manager" },
            },
          },
          userType: {
            type: "object",
            nullable: true,
            properties: {
              iMasterId: { type: "integer", example: 1 },
              sName: { type: "string", example: "Employee" },
            },
          },
        },
      },
      UserLeaveRequest: {
        type: "object",
        properties: {
          leftAt: {
            type: "string",
            format: "date-time",
            example: "2026-04-25T12:00:00.000Z",
          },
        },
      },
      UserBulkDeleteRequest: {
        type: "object",
        required: ["usersId"],
        properties: {
          usersId: {
            type: "array",
            items: { type: "integer" },
            example: [1, 2, 3],
          },
        },
      },
      BulkDeleteResult: {
        type: "object",
        properties: {
          requestedCount: { type: "integer", example: 3 },
          deletedCount: { type: "integer", example: 3 },
        },
      },
    },
  },
  paths: {
    "/": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          "200": {
            description: "API is running",
            content: {
              "text/plain": {
                schema: { type: "string", example: "API running..." },
              },
            },
          },
        },
      },
    },
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Detailed health check",
        responses: {
          "200": {
            description: "Service health status",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
        },
      },
    },
    "/api/roles": {
      post: {
        tags: ["Roles"],
        summary: "Create role",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RoleCreateRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Role created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Role created successfully." },
                    data: { $ref: "#/components/schemas/Role" },
                  },
                },
              },
            },
          },
          "409": {
            description: "Duplicate role",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      get: {
        tags: ["Roles"],
        summary: "Get roles",
        parameters: [
          {
            in: "query",
            name: "sCode",
            schema: { type: "string" },
            description: "Partial role code filter",
          },
          {
            in: "query",
            name: "sName",
            schema: { type: "string" },
            description: "Partial role name filter",
          },
          {
            in: "query",
            name: "name",
            schema: { type: "string" },
            description: "Legacy alias of sName",
          },
          {
            in: "query",
            name: "isActive",
            schema: { type: "boolean" },
            description: "Role active flag",
          },
          {
            in: "query",
            name: "precedence",
            schema: { type: "integer" },
            description: "Exact precedence filter",
          },
        ],
        responses: {
          "200": {
            description: "Roles list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Roles fetched successfully." },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Role" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/roles/{iMasterId}": {
      get: {
        tags: ["Roles"],
        summary: "Get role by ID",
        parameters: [
          {
            in: "path",
            name: "iMasterId",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "200": {
            description: "Role details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Role fetched successfully." },
                    data: { $ref: "#/components/schemas/Role" },
                  },
                },
              },
            },
          },
          "404": {
            description: "Role not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      patch: {
        tags: ["Roles"],
        summary: "Update role by iMasterId",
        parameters: [
          {
            in: "path",
            name: "iMasterId",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RoleUpdateRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Role updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Role updated successfully." },
                    data: { $ref: "#/components/schemas/Role" },
                  },
                },
              },
            },
          },
          "404": {
            description: "Role not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Roles"],
        summary: "Delete role by iMasterId",
        parameters: [
          {
            in: "path",
            name: "iMasterId",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "200": {
            description: "Role deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Role deleted successfully." },
                    data: { $ref: "#/components/schemas/Role" },
                  },
                },
              },
            },
          },
          "404": {
            description: "Role not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/roles/bulk": {
      delete: {
        tags: ["Roles"],
        summary: "Delete roles by iMasterId list",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RoleBulkDeleteRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Roles deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Roles deleted successfully." },
                    data: {
                      type: "object",
                      properties: {
                        requestedCount: { type: "integer", example: 3 },
                        deletedCount: { type: "integer", example: 3 },
                        deletedRoleIds: {
                          type: "array",
                          items: { type: "integer" },
                          example: [1, 2, 3],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid payload or roles in use",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "One or more roles not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/roles/by-scode/{sCode}": {
      patch: {
        tags: ["Roles"],
        summary: "Update role by sCode",
        parameters: [
          {
            in: "path",
            name: "sCode",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RoleUpdateRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Role updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Role updated successfully." },
                    data: { $ref: "#/components/schemas/Role" },
                  },
                },
              },
            },
          },
          "404": {
            description: "Role not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Roles"],
        summary: "Delete role by sCode",
        parameters: [
          {
            in: "path",
            name: "sCode",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Role deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Role deleted successfully." },
                    data: { $ref: "#/components/schemas/Role" },
                  },
                },
              },
            },
          },
          "404": {
            description: "Role not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/roles/by-sname/{sName}": {
      get: {
        tags: ["Roles"],
        summary: "Get role by sName",
        parameters: [
          {
            in: "path",
            name: "sName",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Role details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Role fetched successfully." },
                    data: { $ref: "#/components/schemas/Role" },
                  },
                },
              },
            },
          },
          "404": {
            description: "Role not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/roles/{iMasterId}/users": {
      get: {
        tags: ["Roles"],
        summary: "Get users by role ID",
        parameters: [
          {
            in: "path",
            name: "iMasterId",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "200": {
            description: "Users list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Users fetched successfully for role." },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/roles/sname/{sName}/users": {
      get: {
        tags: ["Roles"],
        summary: "Get users by role sName",
        parameters: [
          {
            in: "path",
            name: "sName",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Users list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Users fetched successfully for role." },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/user-types": {
      post: {
        tags: ["User Types"],
        summary: "Create user type",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserTypeCreateRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "User type created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "User type created successfully." },
                    data: { $ref: "#/components/schemas/UserType" },
                  },
                },
              },
            },
          },
        },
      },
      get: {
        tags: ["User Types"],
        summary: "Get user types",
        parameters: [
          {
            in: "query",
            name: "sCode",
            schema: { type: "string" },
          },
          {
            in: "query",
            name: "sName",
            schema: { type: "string" },
          },
          {
            in: "query",
            name: "name",
            schema: { type: "string" },
            description: "Legacy alias of sName",
          },
          {
            in: "query",
            name: "isActive",
            schema: { type: "boolean" },
          },
        ],
        responses: {
          "200": {
            description: "User types list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "User types fetched successfully." },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/UserType" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/user-types/{iMasterId}": {
      get: {
        tags: ["User Types"],
        summary: "Get user type by iMasterId",
        parameters: [
          {
            in: "path",
            name: "iMasterId",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "200": {
            description: "User type details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "User type fetched successfully." },
                    data: { $ref: "#/components/schemas/UserType" },
                  },
                },
              },
            },
          },
        },
      },
      patch: {
        tags: ["User Types"],
        summary: "Update user type by iMasterId",
        parameters: [
          {
            in: "path",
            name: "iMasterId",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserTypeUpdateRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "User type updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "User type updated successfully." },
                    data: { $ref: "#/components/schemas/UserType" },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ["User Types"],
        summary: "Delete user type by iMasterId",
        parameters: [
          {
            in: "path",
            name: "iMasterId",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "200": {
            description: "User type deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "User type deleted successfully." },
                    data: { $ref: "#/components/schemas/UserType" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/user-types/by-scode/{sCode}": {
      patch: {
        tags: ["User Types"],
        summary: "Update user type by sCode",
        parameters: [
          {
            in: "path",
            name: "sCode",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserTypeUpdateRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "User type updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "User type updated successfully." },
                    data: { $ref: "#/components/schemas/UserType" },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ["User Types"],
        summary: "Delete user type by sCode",
        parameters: [
          {
            in: "path",
            name: "sCode",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "User type deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "User type deleted successfully." },
                    data: { $ref: "#/components/schemas/UserType" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/user-types/by-sname/{sName}": {
      get: {
        tags: ["User Types"],
        summary: "Get user type by sName",
        parameters: [
          {
            in: "path",
            name: "sName",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "User type details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "User type fetched successfully." },
                    data: { $ref: "#/components/schemas/UserType" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/user-types/bulk": {
      delete: {
        tags: ["User Types"],
        summary: "Delete user types by iMasterId list",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserTypeBulkDeleteRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "User types deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "User types deleted successfully." },
                    data: {
                      type: "object",
                      properties: {
                        requestedCount: { type: "integer", example: 3 },
                        deletedCount: { type: "integer", example: 3 },
                        deletedUserTypeIds: {
                          type: "array",
                          items: { type: "integer" },
                          example: [1, 2, 3],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/user-types/{iMasterId}/users": {
      get: {
        tags: ["User Types"],
        summary: "Get users by user type iMasterId",
        parameters: [
          {
            in: "path",
            name: "iMasterId",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "200": {
            description: "Users list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Users fetched successfully for user type." },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/user-types/sname/{sName}/users": {
      get: {
        tags: ["User Types"],
        summary: "Get users by user type sName",
        parameters: [
          {
            in: "path",
            name: "sName",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Users list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Users fetched successfully for user type." },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/users": {
      post: {
        tags: ["Users"],
        summary: "Create user",
        description:
          "Creates office-level user credentials. Allowed only when createdByUserId belongs to an active SU user.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserCreateRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "User created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "User created successfully." },
                    data: { $ref: "#/components/schemas/UserCreateResponseData" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "403": {
            description: "Creator is not active SU user",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Creator, role, or user type not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      get: {
        tags: ["Users"],
        summary: "Get users with filters",
        parameters: [
          { in: "query", name: "id", schema: { type: "integer" } },
          { in: "query", name: "username", schema: { type: "string" } },
          { in: "query", name: "firstName", schema: { type: "string" } },
          { in: "query", name: "middleName", schema: { type: "string" } },
          { in: "query", name: "lastName", schema: { type: "string" } },
          { in: "query", name: "address", schema: { type: "string" } },
          { in: "query", name: "mobileNo", schema: { type: "string" } },
          { in: "query", name: "alternateNumber", schema: { type: "string" } },
          { in: "query", name: "email", schema: { type: "string" } },
          { in: "query", name: "iRoleMasterId", schema: { type: "integer" } },
          { in: "query", name: "iUserTypeMasterId", schema: { type: "integer" } },
          { in: "query", name: "sRoleName", schema: { type: "string" } },
          { in: "query", name: "sUserTypeName", schema: { type: "string" } },
          { in: "query", name: "isActive", schema: { type: "boolean" } },
          {
            in: "query",
            name: "employmentStatus",
            schema: { type: "string", enum: ["ACTIVE", "LEFT"] },
          },
        ],
        responses: {
          "200": {
            description: "Users list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Users fetched successfully." },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get user by ID",
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "200": {
            description: "User details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "User fetched successfully." },
                    data: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          "404": {
            description: "User not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Users"],
        summary: "Delete user by ID",
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "200": {
            description: "User deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "User deleted successfully." },
                    data: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/users/bulk": {
      delete: {
        tags: ["Users"],
        summary: "Delete users by ID list",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserBulkDeleteRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Users deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Users deleted successfully." },
                    data: {
                      type: "object",
                      properties: {
                        requestedCount: { type: "integer", example: 3 },
                        deletedCount: { type: "integer", example: 3 },
                        deletedUserIds: {
                          type: "array",
                          items: { type: "integer" },
                          example: [10, 11, 12],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "One or more users not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/users/by-username/{username}": {
      get: {
        tags: ["Users"],
        summary: "Get user by username",
        parameters: [
          {
            in: "path",
            name: "username",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "User details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "User fetched successfully." },
                    data: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Users"],
        summary: "Delete user by username",
        parameters: [
          {
            in: "path",
            name: "username",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "User deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "User deleted successfully." },
                    data: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/users/by-role/{iMasterId}": {
      get: {
        tags: ["Users"],
        summary: "Get users by role ID",
        parameters: [
          {
            in: "path",
            name: "iMasterId",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "200": {
            description: "Users list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Users fetched successfully for role." },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/users/by-role-sname/{sName}": {
      get: {
        tags: ["Users"],
        summary: "Get users by role sName",
        parameters: [
          {
            in: "path",
            name: "sName",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Users list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Users fetched successfully for role." },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/users/by-user-type/{iMasterId}": {
      get: {
        tags: ["Users"],
        summary: "Get users by user type iMasterId",
        parameters: [
          {
            in: "path",
            name: "iMasterId",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "200": {
            description: "Users list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Users fetched successfully for user type." },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/users/by-user-type-sname/{sName}": {
      get: {
        tags: ["Users"],
        summary: "Get users by user type sName",
        parameters: [
          {
            in: "path",
            name: "sName",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Users list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Users fetched successfully for user type." },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/users/{id}/leave": {
      patch: {
        tags: ["Users"],
        summary: "Mark user as left by ID",
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserLeaveRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "User marked as left",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "User marked as left successfully." },
                    data: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/users/by-username/{username}/leave": {
      patch: {
        tags: ["Users"],
        summary: "Mark user as left by username",
        parameters: [
          {
            in: "path",
            name: "username",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserLeaveRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "User marked as left",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "User marked as left successfully." },
                    data: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/users/{id}/rejoin": {
      patch: {
        tags: ["Users"],
        summary: "Rejoin user by ID",
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "200": {
            description: "User rejoined",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "User rejoined successfully." },
                    data: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/users/by-username/{username}/rejoin": {
      patch: {
        tags: ["Users"],
        summary: "Rejoin user by username",
        parameters: [
          {
            in: "path",
            name: "username",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "User rejoined",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "User rejoined successfully." },
                    data: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

const architectureTags = [
  "User Addresses",
  "Profiles",
  "Services",
  "Subscriptions",
  "Coupons",
  "Hero Service Mapping",
  "Bookings",
  "Payments",
  "Service Locations",
];

for (const tag of architectureTags) {
  (swaggerSpec as any).tags.push({ name: tag, description: `${tag} endpoints` });
}

const crudPath = (tag: string, summaryName: string) => ({
  get: {
    tags: [tag],
    summary: `List ${summaryName}`,
    parameters: [
      { in: "query", name: "sCode", schema: { type: "string" } },
      { in: "query", name: "sName", schema: { type: "string" } },
      { in: "query", name: "isActive", schema: { type: "boolean" } },
    ],
    responses: {
      "200": {
        description: `${summaryName} list`,
        content: { "application/json": { schema: { type: "object" } } },
      },
    },
  },
  post: {
    tags: [tag],
    summary: `Create ${summaryName}`,
    requestBody: {
      required: true,
      content: { "application/json": { schema: { type: "object" } } },
    },
    responses: {
      "201": {
        description: `${summaryName} created`,
        content: { "application/json": { schema: { type: "object" } } },
      },
    },
  },
});

const crudByIdPath = (tag: string, summaryName: string) => ({
  get: {
    tags: [tag],
    summary: `Get ${summaryName} by ID`,
    parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
    responses: {
      "200": {
        description: `${summaryName} detail`,
        content: { "application/json": { schema: { type: "object" } } },
      },
    },
  },
  patch: {
    tags: [tag],
    summary: `Update ${summaryName} by ID`,
    parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
    requestBody: {
      required: true,
      content: { "application/json": { schema: { type: "object" } } },
    },
    responses: {
      "200": {
        description: `${summaryName} updated`,
        content: { "application/json": { schema: { type: "object" } } },
      },
    },
  },
  delete: {
    tags: [tag],
    summary: `Delete ${summaryName} by ID`,
    parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
    responses: {
      "200": {
        description: `${summaryName} deleted`,
        content: { "application/json": { schema: { type: "object" } } },
      },
    },
  },
});

const architecturePaths: Array<[string, string, string]> = [
  ["/api/user-addresses", "User Addresses", "user addresses"],
  ["/api/hero-profiles", "Profiles", "hero profiles"],
  ["/api/customer-profiles", "Profiles", "customer profiles"],
  ["/api/employee-profiles", "Profiles", "employee profiles"],
  ["/api/service-categories", "Services", "service categories"],
  ["/api/service-types", "Services", "service types"],
  ["/api/services", "Services", "services"],
  ["/api/service-slots", "Services", "service slots"],
  ["/api/service-images", "Services", "service images"],
  ["/api/subscription-types", "Subscriptions", "subscription types"],
  ["/api/subscriptions", "Subscriptions", "subscriptions"],
  ["/api/coupons", "Coupons", "coupons"],
  ["/api/coupon-service-mappings", "Coupons", "coupon service mappings"],
  ["/api/hero-service-mappings", "Hero Service Mapping", "hero service mappings"],
  ["/api/hero-service-areas", "Hero Service Mapping", "hero service areas"],
  ["/api/booking-assignments", "Bookings", "booking assignments"],
  ["/api/booking-images", "Bookings", "booking images"],
  ["/api/booking-ratings", "Bookings", "booking ratings"],
  ["/api/payments", "Payments", "payments"],
  ["/api/payment-webhooks", "Payments", "payment webhooks"],
];

for (const [path, tag, label] of architecturePaths) {
  (swaggerSpec as any).paths[path] = crudPath(tag, label);
  (swaggerSpec as any).paths[`${path}/{id}`] = crudByIdPath(tag, label);
}

(swaggerSpec as any).paths["/api/service-locations"] = {
  get: {
    tags: ["Service Locations"],
    summary: "Get active company service locations",
    responses: {
      "200": {
        description: "Service locations list",
        content: { "application/json": { schema: { type: "object" } } },
      },
    },
  },
};

(swaggerSpec as any).paths["/api/service-locations/{sCode}"] = {
  get: {
    tags: ["Service Locations"],
    summary: "Get company service location by sCode",
    parameters: [{ in: "path", name: "sCode", required: true, schema: { type: "string" } }],
    responses: {
      "200": {
        description: "Service location detail",
        content: { "application/json": { schema: { type: "object" } } },
      },
    },
  },
};

(swaggerSpec as any).paths["/api/bookings"] = {
  get: {
    tags: ["Bookings"],
    summary: "Get bookings with filters",
    parameters: [
      { in: "query", name: "iCustomerUserMasterId", schema: { type: "integer" } },
      { in: "query", name: "iServiceMasterId", schema: { type: "integer" } },
      { in: "query", name: "bookingStatus", schema: { type: "string" } },
      { in: "query", name: "paymentStatus", schema: { type: "string" } },
    ],
    responses: { "200": { description: "Bookings list" } },
  },
  post: {
    tags: ["Bookings"],
    summary: "Create booking as confirmed or save partial booking on hold",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["iCustomerUserMasterId"],
            properties: {
              iCustomerUserMasterId: { type: "integer", example: 4 },
              iServiceMasterId: { type: "integer", nullable: true, example: 1 },
              requestedServiceName: { type: "string", nullable: true, example: "Water Tank Cleaning" },
              quantity: { type: "integer", example: 2 },
              bookingStatus: {
                type: "string",
                enum: ["HOLD", "CONFIRMED"],
                example: "CONFIRMED",
              },
              iAddressMasterId: { type: "integer", nullable: true },
              serviceAddressSnapshot: {
                type: "object",
                nullable: true,
                properties: {
                  cityCode: { type: "string", example: "PATNA" },
                  city: { type: "string", example: "Patna" },
                  state: { type: "string", example: "Bihar" },
                  latitude: { type: "number", example: 25.5941 },
                  longitude: { type: "number", example: 85.1376 },
                  addressLine1: { type: "string", example: "Boring Road" },
                  landmark: { type: "string", example: "Near cafe" },
                  pincode: { type: "string", example: "800001" },
                },
              },
              iSlotMasterId: { type: "integer", nullable: true },
              scheduledStartAt: { type: "string", format: "date-time" },
              scheduledEndAt: { type: "string", format: "date-time" },
              couponCode: { type: "string", nullable: true, example: "JIFFIT10" },
              holdReason: { type: "string", nullable: true, example: "Service master pending." },
              remarks: { type: "string", nullable: true },
            },
          },
        },
      },
    },
    responses: { "201": { description: "Booking created" } },
  },
};

(swaggerSpec as any).paths["/api/bookings/{id}"] = crudByIdPath("Bookings", "booking");

(swaggerSpec as any).paths["/api/bookings/{id}/status"] = {
  patch: {
    tags: ["Bookings"],
    summary: "Move booking to confirmed, hold, or cancelled without deleting data",
    parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["bookingStatus"],
            properties: {
              bookingStatus: {
                type: "string",
                enum: ["CONFIRMED", "HOLD", "CANCELLED"],
                example: "HOLD",
              },
              holdReason: { type: "string", nullable: true },
              cancelReason: { type: "string", nullable: true },
              remarks: { type: "string", nullable: true },
            },
          },
        },
      },
    },
    responses: { "200": { description: "Booking status updated" } },
  },
};

export default swaggerSpec;
