import express from 'express';
import {
  getAllCases,
  getCaseById,
  createCase,
  updateCase,
  deleteCase,
  addCourtDate,
  addExpense,
  uploadFile,
  deleteCourtDate,
  deleteExpense,
  deleteFile
} from '../controllers/caseController.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Case routes
router.get('/', getAllCases);
router.get('/:id', getCaseById);
router.post('/', createCase);
router.put('/:id', updateCase);
router.delete('/:id', deleteCase);

// Court date routes
router.post('/:id/court-dates', addCourtDate);
router.delete('/:id/court-dates/:courtDateId', deleteCourtDate);

// Expense routes
router.post('/:id/expenses', addExpense);
router.delete('/:id/expenses/:expenseId', deleteExpense);

// File routes
router.post('/:id/files', upload.single('file'), uploadFile);
router.delete('/:id/files/:fileId', deleteFile);

export default router;
