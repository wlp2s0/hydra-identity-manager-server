FROM node:16 AS build
WORKDIR /app
COPY package.json .
RUN npm i
COPY . .
RUN npm run build

FROM node:16 as production
ENV NODE_ENV production
WORKDIR /app
COPY package.json .
RUN npm i --production
COPY --from=build /app/dist .
COPY --from=build /app/.development.env ./.development.env
CMD ["npm", "run", "start:prod"]