# FROM node:18-alpine
# WORKDIR /app
# COPY package*.json ./
# RUN npm install
# COPY . .
# RUN npm run build
# # EXPOSE 3000
# CMD ["node", "dist/index.js"]


# Build Stage
FROM node:18-alpine AS scuttle-builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Final Image
FROM node:18-alpine
WORKDIR /app

COPY --from=scuttle-builder /app/dist /usr/local/bin/scuttle/
COPY --from=scuttle-builder /app/node_modules /usr/local/bin/scuttle/node_modules
COPY --from=scuttle-builder /app/package.json /usr/local/bin/scuttle/package.json

RUN chmod +x /usr/local/bin/scuttle/index.js

CMD ["node", "/usr/local/bin/scuttle/index.js"]
