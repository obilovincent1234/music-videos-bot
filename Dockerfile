FROM node:lts-slim

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chromium that Puppeteer installs, work.
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* /etc/apt/sources.list.d/google.list

# Install global dependencies
RUN npm install -g pm2 nodemon

# App setup
WORKDIR /home/src/raspar

COPY ./ ./

# Install app dependencies
RUN npm install xvfb

RUN npm install

# Setup cache directory
RUN mkdir -p temp \
    && chmod -R 777 temp/

EXPOSE 3000

USER node

CMD [ "pm2-runtime", "npm", "--", "start" ]
