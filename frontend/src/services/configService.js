import api from './api';

export const getApiKeysStatus = async () => {
  const response = await api.get('/config/api-keys');
  return response.data;
};

export const updateApiKeys = async ({ provider, groqApiKey, huggingfaceApiKey }) => {
  const response = await api.post('/config/api-keys', {
    provider,
    groq_api_key: groqApiKey,
    huggingface_api_key: huggingfaceApiKey,
  });
  return response.data;
};
