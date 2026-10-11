import api from './api';

export const startSession = async ({ questionId, studentName = 'Student User', studentGrade }) => {
  const response = await api.post('/sessions/start', {
    question_id: questionId,
    student_name: studentName,
    student_grade: studentGrade
  });
  return response.data;
};

export const submitStepChoice = async ({ sessionId, stepSequenceNo, selectedOptionIndex }) => {
  const response = await api.post('/sessions/submit-step', {
    session_id: sessionId,
    step_sequence_no: stepSequenceNo,
    selected_option_index: selectedOptionIndex
  });
  return response.data;
};

export const switchAlternateQuestion = async ({ sessionId, altQuestionIndex = 0 }) => {
  const response = await api.post('/sessions/switch-alternate', {
    session_id: sessionId,
    alt_question_index: altQuestionIndex
  });
  return response.data;
};

export const getSessionDetails = async (sessionId) => {
  const response = await api.get(`/sessions/${sessionId}`);
  return response.data;
};
