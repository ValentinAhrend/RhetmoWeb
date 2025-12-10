// API Configuration for Supabase Edge Functions

export const API_CONFIG = {
  baseUrl: 'https://kjvsjaujwhgzhhvtgbkm.supabase.co/functions/v1',
  apiKey: 'sb_publishable_Kjmmp39y03ZxJhaqRZHqSg_5Fv-6Rbh',
};

export const API_HEADERS = {
  'Authorization': `Bearer ${API_CONFIG.apiKey}`,
  'apikey': API_CONFIG.apiKey,
  'Content-Type': 'application/json',
};
