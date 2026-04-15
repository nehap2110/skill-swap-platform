const { Router } = require('express');
const { sendContact } = require('../controllers/contact.controller');

const router = Router();

router.post('/', sendContact);

module.exports = router;