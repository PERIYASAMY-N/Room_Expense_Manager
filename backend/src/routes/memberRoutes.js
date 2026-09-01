const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', memberController.getAllMembers);
router.post('/', requireAdmin, memberController.createMember);
router.get('/:id', memberController.getMemberById);
router.put('/:id', requireAdmin, memberController.updateMember);
router.delete('/:id', requireAdmin, memberController.deleteMember);

module.exports = router;
