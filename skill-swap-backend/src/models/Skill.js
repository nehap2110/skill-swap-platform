// models/Skill.js
const mongoose = require('mongoose');

const { Schema } = mongoose;

const skillSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      trim: true,
      lowercase: true,
      minlength: [2, 'Skill name must be at least 2 characters'],
      maxlength: [80, 'Skill name cannot exceed 80 characters'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isActive: {
  type: Boolean,
  default: true
}
  },
  { timestamps: true }
);

skillSchema.index(
  { name: 1 },
  { unique: true, name: 'unique_skill_name' }
);

skillSchema.index({ createdBy: 1 });

const Skill = mongoose.model('Skill', skillSchema);
module.exports = Skill;