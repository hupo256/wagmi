// types/env.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BUNDLER_URL?: string;
      PAYMASTER_URL?: string;
    }
  }

  var process: NodeJS.Process;
}

export {};
