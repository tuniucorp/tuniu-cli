FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

RUN npm install -g .

FROM node:20-alpine AS runtime

ENV TZ=Asia/Shanghai

WORKDIR /home/tuniu

RUN addgroup -g 1000 tuniu && \
    adduser -u 1000 -G tuniu -s /bin/sh -D tuniu

COPY --from=builder /usr/local /usr/local

RUN mkdir -p /home/tuniu/.tuniu-mcp && chown -R tuniu:tuniu /home/tuniu

USER tuniu

# 默认以 tuniu CLI 作为入口
ENTRYPOINT ["tuniu"]
CMD ["help"]