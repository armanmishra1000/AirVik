# AirVik User Registration API Postman Collection

This directory contains Postman collections and environments for testing the AirVik user registration and email verification APIs.

## Contents

- `user-registration-email-verification.postman_collection.json`: Comprehensive test suite for user registration and email verification endpoints
- `user-registration-email-verification.postman_environment.json`: Environment variables for the collection

## Features

- **Complete API Coverage**: Tests all endpoints related to user registration and email verification
- **Positive & Negative Test Cases**: Tests both valid and invalid scenarios
- **Environment Variables**: Dynamic variables for test data
- **Pre-request Scripts**: Automatic setup of test data
- **Collection-level Tests**: Tests for rate limiting, email uniqueness, token expiration
- **Complete Registration Flow**: End-to-end test of the registration process

## Using in Postman

1. Import the collection and environment files into Postman
2. Select the "AirVik User Registration API Environment" environment
3. Run the collection manually or using the Collection Runner

## Using with Newman for CI/CD

Newman is a command-line collection runner for Postman. To run these tests in a CI/CD pipeline:

1. Install Newman:
```bash
npm install -g newman
```

2. Run the collection:
```bash
newman run ./user-registration-email-verification.postman_collection.json -e ./user-registration-email-verification.postman_environment.json
```

3. Generate HTML reports (optional):
```bash
npm install -g newman-reporter-htmlextra
newman run ./user-registration-email-verification.postman_collection.json -e ./user-registration-email-verification.postman_environment.json -r htmlextra
```

## CI/CD Integration Examples

### GitHub Actions

```yaml
name: API Tests

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'backend/src/**'
      - 'postman/**'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'backend/src/**'
      - 'postman/**'
  workflow_dispatch:  # Allows manual triggering

jobs:
  newman-tests:
    name: Newman API Tests
    runs-on: ubuntu-latest
    
    services:
      # Add MongoDB service container
      mongodb:
        image: mongo:6.0
        ports:
          - 27017:27017
        options: >
          --health-cmd mongosh --eval "db.adminCommand('ping')"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: 'backend/package-lock.json'
      
      - name: Install backend dependencies
        working-directory: ./backend
        run: npm ci
      
      - name: Start backend server
        working-directory: ./backend
        run: |
          npm run build
          nohup npm start &
          sleep 10  # Give the server time to start
        env:
          NODE_ENV: test
          PORT: 3000
          MONGODB_URI: mongodb://localhost:27017/airvik_test
          JWT_SECRET: test_jwt_secret
          JWT_REFRESH_SECRET: test_refresh_secret
          EMAIL_FROM: test@example.com
          EMAIL_SERVICE: test
          EMAIL_USER: test
          EMAIL_PASSWORD: test
          FRONTEND_URL: http://localhost:3000
      
      - name: Install Newman
        run: npm install -g newman newman-reporter-htmlextra
      
      - name: Run Newman tests
        working-directory: ./AirVik/postman
        run: |
          newman run ./user-registration-email-verification.postman_collection.json \
          -e ./user-registration-email-verification.postman_environment.json \
          --reporters cli,htmlextra \
          --reporter-htmlextra-export ./newman-report.html
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: newman-report
          path: ./AirVik/postman/newman-report.html
          retention-days: 7
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any
    
    stages {
        stage('Install Newman') {
            steps {
                sh 'npm install -g newman newman-reporter-htmlextra'
            }
        }
        stage('Run API Tests') {
            steps {
                sh 'newman run ./AirVik/postman/user-registration-email-verification.postman_collection.json -e ./AirVik/postman/user-registration-email-verification.postman_environment.json -r cli,htmlextra'
            }
        }
    }
    
    post {
        always {
            archiveArtifacts artifacts: 'newman/**/*', allowEmptyArchive: true
        }
    }
}
```

## Customizing for Different Environments

To use these tests against different environments (development, staging, production):

1. Create a copy of the environment file for each environment
2. Update the `base_url` variable in each environment file
3. Run Newman with the appropriate environment file:

```bash
# For development
newman run ./user-registration-email-verification.postman_collection.json -e ./dev-environment.json

# For staging
newman run ./user-registration-email-verification.postman_collection.json -e ./staging-environment.json
```
