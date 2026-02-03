export {
  createExam,
  listExams,
  getExamDetails,
  updateExam,
  checkQuestionIdsExist,
  deduplicateQuestionIds,
} from './exam.service';

export {
  startExamAttempt,
  submitAnswer,
  completeExamAttempt,
  getAttemptDetails,
  getAnswerCount,
} from './exam-attempt.service';

