# set base image
FROM node:14.1.0

# add app source code to the image
WORKDIR /app

# copy files from source to destination path in the image's filesystem (./ is the current working directory)
COPY package*.json ./

# results of this command will be committed to the image (SHELL FORM of the command)
RUN npm install

# copy source code (copy local files to current working directory)
COPY . .

# setting the environment variable
ENV PORT=8080

# exposing the port to listen on at runtime
EXPOSE 8080

# command that tells the container how to run the actual application (starts a process to serve the express app)
# array of strings --> EXEC FORM of the command (doesn't start up a shell session)
CMD [ "npm", "start" ]

# command to build the docker image (-t flag sets an image tag name, ':' adds a version number, '.' adds the path to the docker file - current working directory):
# docker build -t jakob/scraper:1.0 .