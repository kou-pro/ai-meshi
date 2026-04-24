declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_RAILS_URL: string;
      NEXT_PUBLIC_APP_URL: string;
      NEXT_PUBLIC_API_BASE_URL: string;
      NEXT_PUBLIC_FRONT_BASE_URL: string;
    }
  }
}

export {};
