FROM node:18.16-alpine AS build
WORKDIR /app

RUN npm install -g npm@9
COPY package*.json .
COPY extensions ./extensions
COPY public ./public
# COPY media ./media
COPY config* ./config
COPY packages ./packages

RUN npm install
RUN npm run build

FROM node:18.16-alpine AS production
ENV NODE_ENV=production

WORKDIR /app

COPY public ./public
# COPY themes ./themes
COPY config* ./config
COPY extensions ./extensions
COPY packages ./packages
COPY package.json .
COPY translations ./translations
COPY --from=build /app/.evershop .evershop
COPY --from=build /app/node_modules node_modules

CMD ["npm", "run", "start"]
