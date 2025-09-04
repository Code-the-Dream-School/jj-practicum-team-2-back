const Session = require('../models/Session');

// Create a new session
exports.createSession = async (req, res) => {
  try {
    const session = await Session.create(req.body);
    return res.status(201).json(session);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Get all sessions
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

    return res.status(200).json(sessions);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get single session by ID
exports.getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('mentorId', 'name email')
      .populate('participants', 'name email');

    if (!session || session.isDeleted) {
      return res.status(404).json({ message: 'Session not found' });
    }

    return res.status(200).json(session);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Update session
exports.updateSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session || session.isDeleted) {
      return res.status(404).json({ message: 'Session not found' });
    }

    Object.assign(session, req.body);
    await session.save();

    return res.status(200).json(session);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Delete session (soft delete)
exports.deleteSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session || session.isDeleted) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.isDeleted = true;
    await session.save();

    return res.status(200).json({ message: 'Session deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
