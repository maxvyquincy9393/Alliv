#!/bin/bash
# Start the backend server with proper Python path

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Set default environment variables for development
export NODE_ENV=${NODE_ENV:-development}
export MONGO_URI=${MONGO_URI:-mongodb://127.0.0.1:27017/alliv_dev}
export JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET:-dev_jwt_access_secret_XXXXXXXXXXXXXXXXXXXXXXXX}
export JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET:-dev_jwt_refresh_secret_XXXXXXXXXXXXXXXXXXXXXXX}
export REFRESH_TOKEN_FINGERPRINT_PEPPER=${REFRESH_TOKEN_FINGERPRINT_PEPPER:-dev_refresh_pepper_XXXXXXXXXXXXXXXXXXXXXXXX}
export SENTRY_DSN=${SENTRY_DSN:-}

# Run the server
python run_server.py




