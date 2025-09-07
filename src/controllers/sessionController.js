const Session = require('../models/Session');
const { ensureDefaultClass } = require('./classController');

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

// Get sessions for student dashboard
exports.getStudentDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Ensure default class exists
    const defaultClass = await ensureDefaultClass();

    if (!defaultClass) {
      return res.status(404).json({ message: 'No class found' });
    }

    // Get current week dates - fix date mutation issue
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() - now.getDay() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Find sessions in default class for this week
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

    // Categorize sessions - fix past sessions logic
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

    // Get user's registered sessions
    const myRegistrations = sessions
      .filter((session) => session.participants.includes(userId))
      .map((session) => session._id);

    // Calculate stats
    const stats = {
      attendedThisWeek: thisWeek.past.filter((session) => session.participants.includes(userId))
        .length,
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

// Get sessions for mentor dashboard
exports.getMentorDashboard = async (req, res) => {
  try {
    const mentorId = req.user.id;

    // Get mentor's sessions for current week - fix date mutation issue
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

    // Categorize sessions
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

    // Calculate stats
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

// Register for a session
exports.registerForSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.id;

    const session = await Session.findById(sessionId);

    if (!session || session.isDeleted) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if already registered
    if (session.participants.includes(userId)) {
      return res.status(400).json({ message: 'Already registered for this session' });
    }

    // Check capacity
    if (session.participants.length >= session.capacity) {
      return res.status(400).json({ message: 'Session is full' });
    }

    // Check if session is in the future
    if (session.date <= new Date()) {
      return res.status(400).json({ message: 'Cannot register for past sessions' });
    }

    // Add user to participants
    session.participants.push(userId);
    await session.save();

    return res.json({ message: 'Successfully registered for session' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Unregister from a session
exports.unregisterFromSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.id;

    const session = await Session.findById(sessionId);

    if (!session || session.isDeleted) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if registered
    if (!session.participants.includes(userId)) {
      return res.status(400).json({ message: 'Not registered for this session' });
    }

    // Remove user from participants
    session.participants = session.participants.filter(
      (participantId) => participantId.toString() !== userId
    );
    await session.save();

    return res.json({ message: 'Successfully unregistered from session' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
