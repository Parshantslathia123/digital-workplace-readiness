const fs = require('fs');
const path = require('path');
const Document = require('../models/Document');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { emitToUser } = require('../socket');

const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { title, description } = req.body;

    const doc = await Document.create({
      title: title || req.file.originalname,
      description: description || '',
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.filename,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: req.user._id
    });

    const populated = await doc.populate('uploadedBy', 'name email');

    // Notify all employees if admin uploads, or notify admins if employee uploads
    const targetRole = req.user.role === 'admin' ? 'employee' : 'admin';
    const targets = await User.find({ role: targetRole }).select('_id');
    for (const t of targets) {
      const notification = await Notification.create({
        user: t._id,
        type: 'document',
        title: 'New Document',
        message: `${req.user.name} uploaded a new document: "${populated.title}"`,
        link: '/documents'
      });
      emitToUser(t._id, 'notification:new', notification);
    }

    res.status(201).json({ success: true, message: 'Document uploaded successfully', document: populated });
  } catch (err) {
    next(err);
  }
};

const getDocuments = async (req, res, next) => {
  try {
    const { search, fileType } = req.query;
    const query = {};
    if (search) query.title = { $regex: search, $options: 'i' };
    if (fileType) query.fileType = { $regex: fileType, $options: 'i' };

    const documents = await Document.find(query).populate('uploadedBy', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, count: documents.length, documents });
  } catch (err) {
    next(err);
  }
};

const downloadDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    const fullPath = path.join(__dirname, '..', '..', 'uploads', doc.filePath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, message: 'File no longer exists on server' });
    }

    res.download(fullPath, doc.originalName);
  } catch (err) {
    next(err);
  }
};

const deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    if (req.user.role !== 'admin' && String(doc.uploadedBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const fullPath = path.join(__dirname, '..', '..', 'uploads', doc.filePath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);

    await doc.deleteOne();
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadDocument, getDocuments, downloadDocument, deleteDocument };
