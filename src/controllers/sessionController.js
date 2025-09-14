const Session = require('../models/Session');
const { ensureDefaultClass } = require('./classController');
const mongoose = require('mongoose');

exports.createSession = async (req, res) => {
  try {
    const {
      title,
      description,
      classId,
      courseName,
      mentorId,
      date,
      zoomLink,
      duration,
      type,
      capacity,
    } = req.body;

    const requiredFields = { title, classId, mentorId, date, zoomLink, duration, type };
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Missing required fields',
        missingFields,
        providedFields: Object.keys(req.body),
        requiredFields: Object.keys(requiredFields)
      });
    }

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ 
        message: 'Invalid class ID',
        field: 'classId',
        value: classId,
        expected: 'Valid MongoDB ObjectId'
      });
    }
    if (!mongoose.Types.ObjectId.isValid(mentorId)) {
      return res.status(400).json({ 
        message: 'Invalid mentor ID',
        field: 'mentorId', 
        value: mentorId,
        expected: 'Valid MongoDB ObjectId'
      });
    }

    if (new Date(date) <= new Date()) {
      return res.status(400).json({ 
        message: 'Session date must be in the future',
        field: 'date',
        value: date,
        currentTime: new Date().toISOString()
      });
    }

    const session = await Session.create({
      title,
      description,
      classId,
      courseName,
      mentorId,
      date,
      zoomLink,
      duration,
      type,
      capacity: capacity || 20,
      status: 'scheduled',
      participants: [],
      isDeleted: false,
    });

    return res.status(201).json(session);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => ({
        field: e.path,
        message: e.message,
        value: e.value,
        kind: e.kind
      }));
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors,
        errorType: 'MongooseValidation'
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Duplicate entry',
        field: Object.keys(error.keyPattern)[0],
        errorType: 'DuplicateKey'
      });
    }

    if (error.name === 'MongoNetworkError') {
      return res.status(503).json({
        message: 'Database connection error',
        errorType: 'DatabaseConnection'
      });
    }

    return res.status(500).json({ 
      message: error.message,
      errorType: 'InternalServerError'
    });
  }
};

exports.getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ isDeleted: false })
      .populate('mentorId', 'name email')
      .populate('participants', 'name email')
      .sort({ date: 1 });

    return res.status(200).json(sessions);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getSessionById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const session = await Session.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .populate('mentorId', 'name email')
      .populate('participants', 'name email');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    return res.status(200).json(session);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateSession = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const session = await Session.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const { title, description, courseName, date, zoomLink, duration, type, capacity, status } =
      req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (courseName !== undefined) updateData.courseName = courseName;
    if (date !== undefined) updateData.date = date;
    if (zoomLink !== undefined) updateData.zoomLink = zoomLink;
    if (duration !== undefined) updateData.duration = duration;
    if (type !== undefined) updateData.type = type;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (status !== undefined) updateData.status = status;

    Object.assign(session, updateData);
    await session.save();

    return res.status(200).json(session);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const session = await Session.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.isDeleted = true;
    await session.save();

    return res.status(200).json({ message: 'Session deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getStudentDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const defaultClass = await ensureDefaultClass();

    if (!defaultClass) {
      return res.status(404).json({ message: 'No class found' });
    }

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() - now.getDay() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const sessions = await Session.find({
      classId: defaultClass._id,
      isDeleted: false,
      date: {
        $gte: startOfWeek,
        $lte: endOfWeek,
      },
    })
      .populate('mentorId', 'firstName lastName')
      .populate('classId', 'name')
      .sort({ date: 1 });

    const currentTime = new Date();
    const thisWeek = {
      inProgress: sessions.filter((session) => session.status === 'ongoing'),
      upcoming: sessions.filter(
        (session) => session.status === 'scheduled' && session.date > currentTime
      ),
      past: sessions.filter(
        (session) =>
          session.status === 'completed' ||
          (session.date < currentTime &&
            session.status !== 'ongoing' &&
            session.status !== 'scheduled')
      ),
    };

    const myRegistrations = sessions
      .filter((session) => session.participants.some((p) => p.equals(userId)))
      .map((session) => session._id);

    const stats = {
      attendedThisWeek: thisWeek.past.filter((session) =>
        session.participants.some((p) => p.equals(userId))
      ).length,
      upcomingThisWeek: thisWeek.upcoming.length,
    };

    return res.json({
      thisWeek,
      myRegistrations,
      stats,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getMentorDashboard = async (req, res) => {
  try {
    const mentorId = req.user.id;

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() - now.getDay() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const sessions = await Session.find({
      mentorId: mentorId,
      isDeleted: false,
      date: {
        $gte: startOfWeek,
        $lte: endOfWeek,
      },
    })
      .populate('participants', 'firstName lastName')
      .populate('classId', 'name')
      .sort({ date: 1 });

    const currentTime = new Date();
    const thisWeek = {
      inProgress: sessions.filter((session) => session.status === 'ongoing'),
      upcoming: sessions.filter(
        (session) => session.status === 'scheduled' && session.date > currentTime
      ),
      pastSessions: sessions.filter(
        (session) => session.status === 'completed' || session.date < currentTime
      ),
    };

    const stats = {
      totalSessions: sessions.length,
      totalParticipants: sessions.reduce((sum, session) => sum + session.participants.length, 0),
      upcomingSessions: thisWeek.upcoming.length,
    };

    return res.json({
      thisWeek,
      stats,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.registerForSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const session = await Session.findOne({
      _id: sessionId,
      isDeleted: false,
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.date <= new Date()) {
      return res.status(400).json({ message: 'Cannot register for past sessions' });
    }

    if (session.participants.some((p) => p.equals(userId))) {
      return res.status(400).json({ message: 'Already registered for this session' });
    }

    if (session.participants.length >= session.capacity) {
      return res.status(400).json({ message: 'Session is full' });
    }

    session.participants.push(userId);
    await session.save();

    return res.json({ message: 'Successfully registered for session' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.unregisterFromSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const session = await Session.findOne({
      _id: sessionId,
      isDeleted: false,
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (!session.participants.some((p) => p.equals(userId))) {
      return res.status(400).json({ message: 'Not registered for this session' });
    }

    session.participants = session.participants.filter(
      (participantId) => !participantId.equals(userId)
    );
    await session.save();

    return res.json({ message: 'Successfully unregistered from session' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
