# set base image
FROM node:14.1.0

# add app source code to the image
WORKDIR /app

# copy files from source to destination path in the image's filesystem (./ is the current working directory)
COPY package*.json ./

# results of this command will be committed to the image (SHELL FORM of the command)
# installs all necessary npm packages
RUN npm install

# installs all necessary libraries to make the bundled version of chromium that puppeteer install
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# copy source code (copy local files to current working directory)
COPY . .

# setting the environment variable
ENV PORT=8080
ENV DB_HOST='postgres'
ENV DB_NAME='postgres_db'
ENV DB_USER='myuser'
ENV DB_PORT=5432

# exposing the port to listen on at runtime
EXPOSE 8080

# command that tells the container how to run the actual application (starts a process to serve the express app)
# array of strings --> EXEC FORM of the command (doesn't start up a shell session)
CMD [ "npm", "start" ]



#
#=================
# DOCKER COMMANDS
#=================
#
# build image --> docker build <project_path> -t <tag_name:version> (-t flag --> add tag name)
#
# example --> docker build . -t jakob/scraper:1.0
#
#
# make container --> docker run -p <host_port:container_port> <image_id> (-p flag --> host port to container port mapping)
#
# example --> docker run -p 8080:8080
#
#