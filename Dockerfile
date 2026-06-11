# frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# パッケージ管理ファイルをコピー
COPY package.json package-lock.json* ./

# 依存関係のインストール
RUN npm install

# ソースコードのコピー
COPY . .

# Next.jsの開発サーバーが使用するポート（3000）を開放
EXPOSE 3000

# 開発モードで起動
CMD ["npm", "run", "dev"]