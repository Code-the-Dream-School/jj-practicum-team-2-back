const Session = require('../models/Session');
const { ensureDefaultClass } = require('./classController');
const mongoose = require('mongoose');

exports.createSession = async (req, res) => {
  try {
    const {
      title,
      description,
      courseName,
      mentorId,
      date,
      zoomLink,
      duration,
      type,
      capacity,
    } = req.body;

    const requiredFields = { title, mentorId, date, zoomLink, duration, type };
    const missingFields = Object.entries(requiredFields)
      .filter(([_key, value]) => !value)
      .map(([_key]) => _key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Missing required fields',
        missingFields,
        providedFields: Object.keys(req.body),
        requiredFields: Object.keys(requiredFields),
      });
    }

    if (!mongoose.Types.ObjectId.isValid(mentorId)) {
      return res.status(400).json({
        message: 'Invalid mentor ID',
        field: 'mentorId',
        value: mentorId,
        expected: 'Valid MongoDB ObjectId',
      });
    }

    if (new Date(date) <= new Date()) {
      return res.status(400).json({
        message: 'Session date must be in the future',
        field: 'date',
        value: date,
        currentTime: new Date().toISOString(),
      });
    }

    // Автоматически получаем дефолтный класс
    const defaultClass = await ensureDefaultClass();
    if (!defaultClass) {
      return res.status(500).json({
        message: 'Failed to get default class',
        errorType: 'DefaultClassError',
      });
    }

    const session = await Session.create({
      title,
      description,
      classId: defaultClass._id, // Автоматически используем дефолтный класс
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
        kind: e.kind,
      }));
      return res.status(400).json({
        message: 'Validation failed',
        errors,
        errorType: 'MongooseValidation',
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Duplicate entry',
        field: Object.keys(error.keyPattern)[0],
        errorType: 'DuplicateKey',
      });
    }

    if (error.name === 'MongoNetworkError') {
      return res.status(503).json({
        message: 'Database connection error',
        errorType: 'DatabaseConnection',
      });
    }

    return res.status(500).json({
      message: error.message,
      errorType: 'InternalServerError',
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
      return res.status(400).json({
        message: 'Invalid session ID',
        field: 'id',
        value: req.params.id,
        expected: 'Valid MongoDB ObjectId',
      });
    }

    const session = await Session.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .populate('mentorId', 'name email')
      .populate('participants', 'name email');

    if (!session) {
      return res.status(404).json({
        message: 'Session not found',
        sessionId: req.params.id,
      });
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

    // Get user with weekly goal
    const User = require('../models/User');
    const user = await User.findById(userId).select('weeklyGoal');

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
      past: sessions
        .filter(
          (session) =>
            session.status === 'completed' ||
            (session.date < currentTime &&
              session.status !== 'ongoing' &&
              session.status !== 'scheduled')
        )
        .map((session) => ({
          ...session.toObject(),
          attended: session.attendees ? session.attendees.includes(userId) : false,
        })),
    };

    const myRegistrations = sessions
      .filter((session) => session.participants.some((p) => p.equals(userId)))
      .map((session) => session._id);

    // Calculate real attendance statistics
    const attendedThisWeek = thisWeek.past.filter(
      (session) => session.attendees && session.attendees.some((a) => a.equals(userId))
    ).length;

    const upcomingThisWeek = thisWeek.upcoming.filter((session) =>
      session.participants.some((p) => p.equals(userId))
    ).length;

    const stats = {
      attendedThisWeek,
      upcomingThisWeek,
      plannedThisWeek: attendedThisWeek + upcomingThisWeek,
      weeklyGoal: user?.weeklyGoal || 3,
      weeklyGoalMet: attendedThisWeek >= (user?.weeklyGoal || 3),
    };

    return res.json({
      thisWeek,
      myRegistrations,
      stats,
      user: {
        weeklyGoal: user?.weeklyGoal || 3,
      },
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
      inProgress: sessions.filter((session) => {
        // Session is in progress if status is 'ongoing' OR if it's scheduled and should have started
        const sessionStart = new Date(session.date);
        const sessionEnd = new Date(sessionStart.getTime() + session.duration * 60 * 1000);
        const isInTimeWindow = currentTime >= sessionStart && currentTime <= sessionEnd;

        return session.status === 'ongoing' || (session.status === 'scheduled' && isInTimeWindow);
      }),

      upcoming: sessions.filter((session) => {
        // Session is upcoming if scheduled and in the future
        return session.status === 'scheduled' && new Date(session.date) > currentTime;
      }),

      pastSessions: sessions.filter((session) => {
        // Session is past if completed, canceled, OR if the time has passed
        const sessionStart = new Date(session.date);
        const sessionEnd = new Date(sessionStart.getTime() + session.duration * 60 * 1000);

        return (
          session.status === 'completed' ||
          session.status === 'canceled' ||
          sessionEnd < currentTime
        );
      }),
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

// Mark attendance for a session (mentor only)
exports.markAttendance = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const { attendeeIds } = req.body; // Array of user IDs who attended

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: 'Invalid session ID' });
    }

    const session = await Session.findOne({
      _id: sessionId,
      isDeleted: false,
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Verify all attendee IDs are valid participants
    const invalidAttendees = attendeeIds.filter(
      (id) => !session.participants.some((p) => p.equals(id))
    );

    if (invalidAttendees.length > 0) {
      return res.status(400).json({
        message: 'Some attendees are not registered for this session',
        invalidAttendees,
      });
    }

    session.attendees = attendeeIds;
    await session.save();

    return res.json({ message: 'Attendance marked successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Update user's weekly goal
exports.updateWeeklyGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { weeklyGoal } = req.body;

    if (!weeklyGoal || weeklyGoal < 1 || weeklyGoal > 10) {
      return res.status(400).json({
        message: 'Weekly goal must be between 1 and 10',
      });
    }

    const User = require('../models/User');
    await User.findByIdAndUpdate(userId, { weeklyGoal });

    return res.json({ message: 'Weekly goal updated successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Cancel session (change status to canceled)
exports.cancelSession = async (req, res) => {
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

    // Can only cancel scheduled sessions
    if (session.status !== 'scheduled') {
      return res.status(400).json({
        message: `Cannot cancel session with status: ${session.status}. Only scheduled sessions can be canceled.`,
      });
    }

    // Change status to canceled instead of deleting
    session.status = 'canceled';
    await session.save();

    // TODO: Here you could add logic to notify participants via email

    return res.status(200).json({
      message: 'Session canceled successfully',
      session,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
