// controllers/skill.controller.js
const mongoose = require('mongoose');
const Skill = require('../models/Skill');
const { AppError } = require('../middleware/errorHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const createSkill = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return sendError(res, { statusCode: 400, message: 'Skill name is required.' });
    }

    const normalised = name.trim().toLowerCase();

    const exists = await Skill.findOne({ name: normalised });
    if (exists) {
      return sendError(res, {
        statusCode: 409,
        message: `Skill '${normalised}' already exists.`,
        data: { existingId: exists._id },
      });
    }

    const skill = await Skill.create({
      name: normalised,
      createdBy: req.user?._id ?? null,
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Skill created successfully.',
      data: { skill },
    });
  } catch (err) {
    if (err.code === 11000) {
      return sendError(res, {
        statusCode: 409,
        message: 'A skill with that name already exists.',
      });
    }
    next(err);
  }
};

const getAllSkills = async (req, res, next) => {
  try {
    const { search } = req.query;

    const filter = search
      ? { name: { $regex: search.trim(), $options: 'i' } }
      : {};

    const skills = await Skill.find(filter)
      .sort({ name: 1 })
      .populate('createdBy', 'name email');

    return sendSuccess(res, {
      message: 'Skills retrieved successfully.',
      data: { skills, total: skills.length },
    });
  } catch (err) {
    next(err);
  }
};

const getSkillById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, { statusCode: 400, message: 'Invalid skill ID.' });
    }

    const skill = await Skill.findById(id).populate('createdBy', 'name email');
    if (!skill) return next(new AppError('Skill not found.', 404));

    return sendSuccess(res, {
      message: 'Skill retrieved successfully.',
      data: { skill },
    });
  } catch (err) {
    next(err);
  }
};

const updateSkill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!isValidObjectId(id)) {
      return sendError(res, { statusCode: 400, message: 'Invalid skill ID.' });
    }

    if (!name || !name.trim()) {
      return sendError(res, { statusCode: 400, message: 'Skill name is required.' });
    }

    const normalised = name.trim().toLowerCase();

    const duplicate = await Skill.findOne({ name: normalised, _id: { $ne: id } });
    if (duplicate) {
      return sendError(res, {
        statusCode: 409,
        message: `Skill '${normalised}' already exists.`,
        data: { existingId: duplicate._id },
      });
    }

    const skill = await Skill.findByIdAndUpdate(
      id,
      { name: normalised },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!skill) return next(new AppError('Skill not found.', 404));

    return sendSuccess(res, {
      message: 'Skill updated successfully.',
      data: { skill },
    });
  } catch (err) {
    if (err.code === 11000) {
      return sendError(res, {
        statusCode: 409,
        message: 'A skill with that name already exists.',
      });
    }
    next(err);
  }
};

const deleteSkill = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, { statusCode: 400, message: 'Invalid skill ID.' });
    }

    const skill = await Skill.findByIdAndDelete(id);
    if (!skill) return next(new AppError('Skill not found.', 404));

    return sendSuccess(res, { message: 'Skill deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createSkill, getAllSkills, getSkillById, updateSkill, deleteSkill };