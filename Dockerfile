# Dockerfile
FROM node:20-alpine AS base

# Create app directory
WORKDIR /app

# Copy the package.json files to the container
COPY package.json ./

# Install app dependencies using npm
RUN npm install -g npm@latest && \
    npm install -g nodemon@latest && \
    npm install

# Copy the rest of the application code to the container
COPY . ./

# Make the run script executable
RUN chmod +x run.sh

# Run the shell script
CMD ["./run.sh"]