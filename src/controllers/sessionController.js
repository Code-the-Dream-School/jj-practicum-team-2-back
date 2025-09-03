
const Session = require('../models/Session');

// @desc    Create a new session
// @route   POST /api/sessions
// @access  Mentor/Admin
exports.createSession = async (req, res) => {
  try {
    const session = await Session.create(req.body);
    res.status(201).json(session);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all sessions (with optional filters)
// @route   GET /api/sessions
// @access  Admin/Mentor/Student
exports.getAllSessions = async (req, res) => {
  try {
    const { classId, mentorId, status } = req.query;
    const filters = { isDeleted: false };

    if (classId) filters.classId = classId;
    if (mentorId) filters.mentorId = mentorId;
    if (status) filters.status = status;

    const sessions = await Session.find(filters)
      .populate('mentorId', 'name email')
      .populate('classId', 'name');

    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single session by ID
// @route   GET /api/sessions/:id
// @access  Admin/Mentor/Student
exports.getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('mentorId', 'name email')
      .populate('participants', 'name email');

    if (!session || session.isDeleted) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update session
// @route   PUT /api/sessions/:id
// @access  Mentor/Admin
exports.updateSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session || session.isDeleted) {
      return res.status(404).json({ message: 'Session not found' });
    }

    Object.assign(session, req.body);
    await session.save();

    res.status(200).json(session);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete session (soft delete)
// @route   DELETE /api/sessions/:id
// @access  Admin/Mentor
exports.deleteSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session || session.isDeleted) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.isDeleted = true;
    await session.save();

    res.status(200).json({ message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
