import dotenv from 'dotenv';

dotenv.config();

interface AppConfig {
  port: number;
  nodeEnv: string;
  isProduction: boolean;
  geminiApiKey: string;
}

function getOptionalEnv(key: string, defaultValue: string): string {
  const value = process.env[key];
  return value && value.trim() !== '' ? value.trim() : defaultValue;
}

const nodeEnv = getOptionalEnv('NODE_ENV', 'development');

export const config: AppConfig = {
  port: parseInt(getOptionalEnv('PORT', '3000'), 10),
  nodeEnv,
  isProduction: nodeEnv === 'production',
  geminiApiKey: getOptionalEnv('GEMINI_API_KEY', ''),
};
