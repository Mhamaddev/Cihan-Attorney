import Case from '../models/Case.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAllCases = async (req, res) => {
  try {
    const cases = await Case.findAll();
    res.json(cases);
  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).json({ message: 'Error fetching cases', error: error.message });
  }
};

export const getCaseById = async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.id);
    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }
    res.json(caseData);
  } catch (error) {
    console.error('Error fetching case:', error);
    res.status(500).json({ message: 'Error fetching case', error: error.message });
  }
};

export const createCase = async (req, res) => {
  try {
    const newCase = await Case.create(req.body);
    res.status(201).json(newCase);
  } catch (error) {
    console.error('Error creating case:', error);
    res.status(500).json({ message: 'Error creating case', error: error.message });
  }
};

export const updateCase = async (req, res) => {
  try {
    const updatedCase = await Case.update(req.params.id, req.body);
    if (!updatedCase) {
      return res.status(404).json({ message: 'Case not found' });
    }
    res.json(updatedCase);
  } catch (error) {
    console.error('Error updating case:', error);
    res.status(500).json({ message: 'Error updating case', error: error.message });
  }
};

export const deleteCase = async (req, res) => {
  try {
    await Case.delete(req.params.id);
    res.json({ message: 'Case deleted successfully' });
  } catch (error) {
    console.error('Error deleting case:', error);
    res.status(500).json({ message: 'Error deleting case', error: error.message });
  }
};

export const addCourtDate = async (req, res) => {
  try {
    const courtDate = await Case.addCourtDate(req.params.id, req.body);
    res.status(201).json(courtDate);
  } catch (error) {
    console.error('Error adding court date:', error);
    res.status(500).json({ message: 'Error adding court date', error: error.message });
  }
};

export const addExpense = async (req, res) => {
  try {
    const expense = await Case.addExpense(req.params.id, req.body);
    res.status(201).json(expense);
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ message: 'Error adding expense', error: error.message });
  }
};

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileData = {
      file_name: req.file.originalname,
      file_path: `/uploads/${req.file.filename}`,
      file_type: req.file.mimetype,
      category: req.body.category || 'other'
    };

    const file = await Case.addFile(req.params.id, fileData);
    res.status(201).json(file);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
};

export const deleteCourtDate = async (req, res) => {
  try {
    await Case.deleteCourtDate(req.params.courtDateId);
    res.json({ message: 'Court date deleted successfully' });
  } catch (error) {
    console.error('Error deleting court date:', error);
    res.status(500).json({ message: 'Error deleting court date', error: error.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    await Case.deleteExpense(req.params.expenseId);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ message: 'Error deleting expense', error: error.message });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const file = await Case.deleteFile(req.params.fileId);
    
    // Delete physical file
    if (file && file.file_path) {
      const filePath = path.join(__dirname, '../../', file.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Error deleting file', error: error.message });
  }
};
