FROM node:22-alpine AS build

WORKDIR /app/apps/backend

COPY apps/backend/package*.json ./
RUN npm ci

COPY apps/backend ./
RUN npm run prisma:generate && npm run build

FROM node:22-alpine AS production

WORKDIR /app/apps/backend
ENV NODE_ENV=production

COPY apps/backend/package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/apps/backend/dist ./dist
COPY --from=build /app/apps/backend/prisma ./prisma
COPY --from=build /app/apps/backend/node_modules/.prisma ./node_modules/.prisma

EXPOSE 4000
CMD ["node", "dist/index.js"]
