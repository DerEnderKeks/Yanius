FROM node:7
MAINTAINER DerEnderKeks <admin@derenderkeks.me>

ENV NODE_ENV production

# Create working directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install dependencies
COPY package.json /usr/src/app/
RUN [ "npm", "install" ]

# Bundle app source
COPY . /usr/src/app

#EXPOSE 3000
CMD [ "npm", "run", "exec" ]
