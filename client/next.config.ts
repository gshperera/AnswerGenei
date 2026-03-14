import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone', 
   // Log env vars during build
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },// This enables standalone output for Docker
};

// THIS WILL SHOW DURING RENDER BUILD
console.log('🔧 NEXT_PUBLIC_API_URL during build:', process.env.NEXT_PUBLIC_API_URL);
console.log('🔧 All env vars:', Object.keys(process.env).filter(key => key.includes('NEXT')));

export default nextConfig;
