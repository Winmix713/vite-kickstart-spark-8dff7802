#!/bin/bash

# This script updates several npm packages to their latest versions, 
# bypassing peer dependency conflicts using the --legacy-peer-deps flag.

npm install \
  styled-components@latest \
  @mui/material@latest \
  @mui/styled-engine-sc@latest \
  react-redux@latest \
  react-calendar@latest \
  react-resize-detector@latest \
  --legacy-peer-deps
