
# ---- Build stage ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json ./

# Install deps (no lockfile in this repo, so fallback to npm install)
RUN npm install

COPY . .

RUN npm run build


# ---- Runtime stage ----
FROM nginx:1.27-alpine

# Replace default site config with our SPA-friendly config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Vite outputs to dist/
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
