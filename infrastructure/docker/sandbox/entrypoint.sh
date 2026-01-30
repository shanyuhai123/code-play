#!/bin/sh
set -e

# Entrypoint script for sandbox containers
echo "Sandbox container started"

# Execute the command passed to the container
exec "$@"
