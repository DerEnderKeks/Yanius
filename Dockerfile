FROM node:7
MAINTAINER DerEnderKeks <admin@derenderkeks.me>

ENV NODE_ENV production

# Create working directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install dependencies
COPY package.json /usr/src/app/
RUN [ "npm", "run", "install:dev" ]

# Bundle app source
COPY . /usr/src/app

# Compile TypeScript
RUN [ "npm", "run", "build:build" ]

# Remove devDependencies
RUN [ "npm", "run", "install:prod" ]

#EXPOSE 3000
CMD [ "npm", "run", "exec" ]
