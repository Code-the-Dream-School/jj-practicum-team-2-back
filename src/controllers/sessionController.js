const Session = require('../models/Session');
const { ensureDefaultClass } = require('./classController');
const mongoose = require('mongoose');

exports.createSession = async (req, res) => {
  try {
    const { title, description, courseName, mentorId, date, zoomLink, duration, type, capacity } =
      req.body;

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

    // Allow creating sessions for current time or future (not strict past validation)
    const sessionDate = new Date(date);
    const now = new Date();
    // Allow sessions that are not more than 5 minutes in the past
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    if (sessionDate < fiveMinutesAgo) {
      return res.status(400).json({
        message: 'Session date cannot be more than 5 minutes in the past',
        field: 'date',
        value: date,
        currentTime: now.toISOString(),
      });
    }

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
      classId: defaultClass._id,
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
      inProgress: sessions.filter((session) => {
        // Session is in progress if status is 'ongoing' OR if it's scheduled and currently happening
        const sessionStart = new Date(session.date);
        const sessionEnd = new Date(sessionStart.getTime() + session.duration * 60 * 1000);
        const isInTimeWindow = currentTime >= sessionStart && currentTime <= sessionEnd;

        return session.status === 'ongoing' || (session.status === 'scheduled' && isInTimeWindow);
      }),

      upcoming: sessions.filter((session) => {
        // Session is upcoming if it's in the future (regardless of status, except completed)
        const sessionStart = new Date(session.date);
        return sessionStart > currentTime && session.status !== 'completed';
      }),

      past: sessions
        .filter((session) => {
          // Session is past if:
          // 1. Status is completed, OR
          // 2. Session end time (start + duration) has passed, OR
          // 3. Status is canceled AND session time has passed
          const sessionStart = new Date(session.date);
          const sessionEnd = new Date(sessionStart.getTime() + session.duration * 60 * 1000);

          return (
            session.status === 'completed' ||
            (session.status === 'scheduled' && sessionEnd < currentTime) ||
            (session.status === 'canceled' && sessionStart < currentTime)
          );
        })
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
        // Session is in progress if status is 'ongoing' OR if it's scheduled and currently happening
        const sessionStart = new Date(session.date);
        const sessionEnd = new Date(sessionStart.getTime() + session.duration * 60 * 1000);
        const isInTimeWindow = currentTime >= sessionStart && currentTime <= sessionEnd;

        return session.status === 'ongoing' || (session.status === 'scheduled' && isInTimeWindow);
      }),

      upcoming: sessions.filter((session) => {
        // Session is upcoming if it's in the future (regardless of status, except completed)
        const sessionStart = new Date(session.date);
        return sessionStart > currentTime && session.status !== 'completed';
      }),

      past: sessions.filter((session) => {
        // Session is past if:
        // 1. Status is completed, OR
        // 2. Session end time (start + duration) has passed, OR
        // 3. Status is canceled AND session time has passed
        const sessionStart = new Date(session.date);
        const sessionEnd = new Date(sessionStart.getTime() + session.duration * 60 * 1000);

        return (
          session.status === 'completed' ||
          (session.status === 'scheduled' && sessionEnd < currentTime) ||
          (session.status === 'canceled' && sessionStart < currentTime)
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
    const { attendeeIds } = req.body;
    const mentorId = req.user.id;

    // Validate session ID
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: 'Invalid session ID' });
    }

    // Validate attendeeIds array
    if (!Array.isArray(attendeeIds)) {
      return res.status(400).json({ message: 'attendeeIds must be an array' });
    }

    // Validate each attendee ID
    const invalidIds = attendeeIds.filter((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        message: 'Invalid attendee IDs',
        invalidIds,
      });
    }

    const session = await Session.findOne({
      _id: sessionId,
      isDeleted: false,
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Security check: Only the mentor who owns the session can mark attendance
    if (!session.mentorId.equals(mentorId)) {
      return res.status(403).json({
        message: 'Forbidden: You can only mark attendance for your own sessions',
      });
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

    // Remove duplicates from attendeeIds
    const uniqueAttendeeIds = [...new Set(attendeeIds.map((id) => id.toString()))];

    session.attendees = uniqueAttendeeIds;
    // Skip validation when saving attendance (we're not changing the date)
    await session.save({ validateBeforeSave: false });

    return res.json({
      message: 'Attendance marked successfully',
      attendeesCount: uniqueAttendeeIds.length,
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get session attendance data (mentor only)
exports.getSessionAttendance = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const mentorId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: 'Invalid session ID' });
    }

    const session = await Session.findOne({
      _id: sessionId,
      isDeleted: false,
    })
      .populate('participants', 'firstName lastName email')
      .populate('attendees', 'firstName lastName email');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Security check: Only the mentor who owns the session can view attendance
    if (!session.mentorId.equals(mentorId)) {
      return res.status(403).json({
        message: 'Forbidden: You can only view attendance for your own sessions',
      });
    }

    // Create attendance data with marked attendance status
    const attendanceData = session.participants.map((participant) => {
      const isPresent =
        session.attendees &&
        session.attendees.some((attendee) => attendee._id.equals(participant._id));

      return {
        id: participant._id,
        name: `${participant.firstName} ${participant.lastName}`,
        email: participant.email,
        isPresent,
      };
    });

    return res.json({
      sessionId: session._id,
      sessionTitle: session.title,
      sessionDate: session.date,
      totalParticipants: session.participants.length,
      totalAttendees: session.attendees ? session.attendees.length : 0,
      attendanceData,
    });
  } catch (error) {
    console.error('Get session attendance error:', error);
    return res.status(500).json({ message: 'Internal server error' });
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
