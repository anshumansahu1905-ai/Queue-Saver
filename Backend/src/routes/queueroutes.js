const express = require('express');
const router = express.Router();
const {
    addToQueue,
    getQueue,
    getPosition,
    updateStatus,
    deleteQueue,
    getQRData,
    getShops,
} = require('../controllers/queueController');
const authMiddleware = require('../middleware/authmiddleware');


router.post('/join', addToQueue);

router.get('/position/:entryId', getPosition);

router.get('/shops', getShops);

router.get('/:shopId', authMiddleware, getQueue);

router.patch('/status/:entryId', authMiddleware, updateStatus);

router.delete('/:entryId', authMiddleware, deleteQueue);

router.get('/qr/:shopId', authMiddleware, getQRData);

module.exports = router;
