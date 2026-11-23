import { isObjectIdOrHexString } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function isObjectIdArray(input: unknown): input is string[] {
  return Array.isArray(input) && input.every((value) => typeof value === 'string' && isObjectIdOrHexString(value));
}

function serviceError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) {
    throw serviceError('Activity input must be an object', 400);
  }

  const { userId, teamId, type, minutes } = input;
  if (
    typeof userId !== 'string' ||
    !isObjectIdOrHexString(userId) ||
    typeof teamId !== 'string' ||
    !isObjectIdOrHexString(teamId) ||
    typeof type !== 'string' ||
    !type.trim() ||
    typeof minutes !== 'number' ||
    !Number.isFinite(minutes) ||
    minutes <= 0
  ) {
    throw serviceError('Activity input is invalid', 400);
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) {
    throw serviceError('Activity user or team was not found', 404);
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) {
    throw serviceError('Team input must be an object', 400);
  }

  const { name, mascot } = input;
  const members = input.members === undefined ? [] : input.members;
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof mascot !== 'string' ||
    !mascot.trim() ||
    !isObjectIdArray(members)
  ) {
    throw serviceError('Team input is invalid', 400);
  }

  const memberIds = [...new Set(members)];
  const memberCount = await User.countDocuments({ _id: { $in: memberIds } });
  if (memberCount !== memberIds.length) {
    throw serviceError('One or more team members were not found', 404);
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ teamName: string; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $lookup: { from: Team.collection.name, localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return totals.map(({ teamName, totalPoints }, index) => ({ teamName, totalPoints, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw serviceError('User was not found', 404);
  }

  const [activity, workouts] = await Promise.all([
    Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean(),
    Workout.find({ focus: user.fitnessGoal }).sort({ title: 1 }).lean(),
  ]);
  const reason = activity
    ? `Suggested for your ${user.fitnessGoal} goal and recent ${activity.type} activity.`
    : `Suggested for your ${user.fitnessGoal} goal.`;

  return workouts.map((workout) => ({ ...workout, reason }));
}

export { User };
