
# Application and Testing Guide

This document provides instructions on how to set up and run the application and its associated tests.

## 1. Development Environment

The development environment is managed declaratively using the `.idx/dev.nix` file. This ensures a consistent and reproducible setup for all developers.

### Key Components:

*   **Node.js**: The runtime environment for the NestJS application. The version is specified in `dev.nix`.
*   **PostgreSQL**: The database server used for both development and testing.
*   **Environment Variables**:
    *   `DATABASE_URL`: The connection string for the main development database.
    *   `TEST_DATABASE_URL`: The connection string for the separate test database, used for running end-to-end tests.

### Initial Setup:

When the workspace is created for the first time, the `onCreate` lifecycle hook in `dev.nix` automatically performs the following actions:
1.  Installs all necessary `npm` dependencies from `package.json`.
2.  Installs `supertest` for making HTTP requests in tests.
3.  Initializes a new PostgreSQL database cluster.
4.  Creates a dedicated database named `testdb` for testing purposes.

### Starting the Environment:

Every time the workspace starts, the `onStart` hook ensures that the PostgreSQL database server is running.

**Important**: If you make any changes to the `.idx/dev.nix` file, you **must reload the environment** for those changes to take effect.

## 2. Running the Application

The application can be started in development mode using the following command from the root directory:

```bash
npm run start:dev --prefix backend
```

The `dev.nix` file is also configured to automatically start the application and open a preview tab in the IDE. This provides a live view of the running application.

## 3. Running Tests

The project is configured with a comprehensive testing suite, including unit, integration, and end-to-end (E2E) tests.

### Test Database

E2E tests run against a separate, isolated database (`testdb`) to prevent data corruption and ensure that tests are independent and repeatable. The test database is automatically created as part of the environment setup. Test scripts are responsible for seeding necessary data before tests and cleaning up after they complete.

### Test Commands

You can run the tests using the following `npm` scripts. Make sure to navigate to the `backend` directory first:

```bash
cd backend
```

*   **Run all tests (unit, integration, and E2E):**
    ```bash
    npm test
    ```

*   **Run only the E2E tests:**
    This command will start the application, run the full suite of end-to-end tests against the live server and the test database, and then shut down.
    ```bash
    npm run test:e2e
    ```

This setup ensures a robust testing process, allowing you to verify the functionality of individual components and entire user flows in an isolated and controlled environment.
