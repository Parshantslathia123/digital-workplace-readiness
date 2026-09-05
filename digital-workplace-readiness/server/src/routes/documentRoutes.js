const express = require('express');
const router = express.Router();
const {
  uploadDocument,
  getDocuments,
  downloadDocument,
  deleteDocument
} = require('../controllers/documentController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.get('/', getDocuments);
router.post('/', upload.single('file'), uploadDocument);
router.get('/:id/download', downloadDocument);
router.delete('/:id', deleteDocument);

module.exports = router;
