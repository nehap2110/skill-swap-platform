// routes/skill.routes.js
const { Router } = require('express');
const {
  createSkill,
  getAllSkills,
  getSkillById,
  updateSkill,
  deleteSkill,
} = require('../controllers/skill.controller');
const { protect } = require('../middleware/auth.middleware');

const router = Router();

router.route('/')
  .post(protect, createSkill)
  .get(getAllSkills);

router.route('/:id')
  .get(getSkillById)
  .patch(protect, updateSkill)
  .delete(protect, deleteSkill);

module.exports = router;