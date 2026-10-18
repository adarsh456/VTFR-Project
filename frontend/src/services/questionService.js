import api from './api';

export const getSyllabus = async () => {
  const response = await api.get('/questions/syllabus');
  return response.data;
};

export const generateQuestion = async ({ grade, subject, chapter, topic, excludeQuestions = [] }) => {
  const response = await api.post(
    '/questions/generate',
    {
      grade,
      subject,
      chapter,
      topic,
      exclude_questions: excludeQuestions,
      num_alternate_questions: 3
    },
    {
      timeout: 180000 // 180 sec (3 min) timeout for LLM synthesis + remedial resource resolving
    }
  );
  return response.data;
};

export const listQuestions = async (params = {}) => {
  const response = await api.get('/questions', { params });
  return response.data;
};

export const getQuestionById = async (questionId) => {
  const response = await api.get(`/questions/${questionId}`);
  return response.data;
};

export const getSampleQuestions = async () => {
  const response = await api.get('/questions/samples');
  return response.data;
};

export const getSampleQuestionByFilename = async (filename) => {
  const response = await api.get(`/questions/samples/${encodeURIComponent(filename)}`);
  return response.data;
};

export const generateDiagram = async (diagramType = 'function') => {
  const response = await api.post(`/questions/generate-diagram?diagram_type=${diagramType}`);
  return response.data;
};

export const deleteQuestion = async (questionId) => {
  const response = await api.delete(`/questions/${encodeURIComponent(questionId)}`);
  return response.data;
};

