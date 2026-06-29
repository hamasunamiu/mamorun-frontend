import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // next.config.js と .env ファイルを読み込むために、Next.jsアプリのパスを指定
  dir: "./",
});

const config: Config = {
  // 各テスト実行前にjest.setup.tsを読み込む
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jsdom",
  moduleNameMapper: {
    // tsconfig.jsonの "@/*" パスエイリアスをJestにも認識させる
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

// next/jestが返す関数で、Next.js用の非同期設定（SWCトランスフォームなど）を追加する
export default createJestConfig(config);
