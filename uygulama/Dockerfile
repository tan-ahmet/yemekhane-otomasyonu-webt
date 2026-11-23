FROM node:22-alpine AS derleme
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine
RUN apk add --no-cache tzdata
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=derleme /app/dist ./dist
USER node
EXPOSE 8000
CMD ["node", "dist/main.js"]
