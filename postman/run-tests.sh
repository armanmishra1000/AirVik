#!/bin/bash

# Run Newman tests with HTML reporter
echo "Running Newman tests with HTML reporter..."
newman run ./user-registration-email-verification.postman_collection.json \
  -e ./user-registration-email-verification.postman_environment.json \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export ./newman/report.html

# Check if the tests ran successfully
if [ $? -eq 0 ]; then
  echo "Newman tests completed successfully!"
  echo "HTML report generated at ./newman/report.html"
else
  echo "Newman tests failed. Check the output above for details."
  echo "Note: If you see connection errors, make sure your backend server is running."
  echo "HTML report generated at ./newman/report.html"
fi
