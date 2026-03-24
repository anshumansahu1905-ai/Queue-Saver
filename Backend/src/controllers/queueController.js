const Queue = require('../models/Queue');
const User = require('../models/User');

async function addToQueue(req, res) {
    try {
        const { shopId, patientName, phone } = req.body;

        if (!shopId || !patientName) {
            return res.status(400).json({ message: 'shopId and patientName are required.' });
        }

        const shop = await User.findById(shopId);
        if (!shop) {
            return res.status(404).json({ message: 'Shop/Doctor not found.' });
        }

        const entry = new Queue({ shopId, patientName, phone });
        await entry.save();

        const io = req.app.get('io');
        if (io) {
            const fullQueue = await Queue.find({ shopId, status: 'waiting' }).sort({ createdAt: 1 });
            io.to(`shop_${shopId}`).emit('queue_updated', { queue: fullQueue });
        }

        res.status(201).json({
            message: 'Added to queue successfully',
            entry: {
                _id: entry._id,
                tokenNumber: entry.tokenNumber,
                position: entry.position,
                patientName: entry.patientName,
                status: entry.status,
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message || 'Server error' });
    }
}

async function getQueue(req, res) {
    try {
        const { shopId } = req.params;
        const queue = await Queue.find({ shopId, status: 'waiting' }).sort({ createdAt: 1 });

        const queueWithPositions = queue.map((entry, index) => ({
            _id: entry._id,
            tokenNumber: entry.tokenNumber,
            patientName: entry.patientName,
            phone: entry.phone,
            status: entry.status,
            position: index + 1,
            createdAt: entry.createdAt,
        }));

        res.status(200).json({ queue: queueWithPositions, total: queueWithPositions.length });
    } catch (err) {
        res.status(500).json({ message: err.message || 'Server error' });
    }
}

async function getPosition(req, res) {
    try {
        const { entryId } = req.params;
        const entry = await Queue.findById(entryId);

        if (!entry) {
            return res.status(404).json({ message: 'Queue entry not found.' });
        }

        if (entry.status !== 'waiting') {
            return res.status(200).json({ message: `Your status is: ${entry.status}`, status: entry.status, position: null });
        }

        const ahead = await Queue.countDocuments({
            shopId: entry.shopId,
            status: 'waiting',
            createdAt: { $lt: entry.createdAt },
        });

        res.status(200).json({
            tokenNumber: entry.tokenNumber,
            patientName: entry.patientName,
            position: ahead + 1,
            status: entry.status,
        });
    } catch (err) {
        res.status(500).json({ message: err.message || 'Server error' });
    }
}

async function updateStatus(req, res) {
    try {
        const { entryId } = req.params;
        const { status } = req.body;

        const validStatuses = ['waiting', 'in-progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value.' });
        }

        const entry = await Queue.findByIdAndUpdate(entryId, { status }, { new: true });

        if (!entry) {
            return res.status(404).json({ message: 'Queue entry not found.' });
        }

        const io = req.app.get('io');
        if (io) {
            const fullQueue = await Queue.find({ shopId: entry.shopId, status: 'waiting' }).sort({ createdAt: 1 });
            io.to(`shop_${entry.shopId}`).emit('queue_updated', { queue: fullQueue });

            io.to(`entry_${entryId}`).emit('status_updated', {
                status: entry.status,
                message: `Your status has been updated to: ${entry.status}`,
            });
        }

        res.status(200).json({ message: 'Status updated', entry });
    } catch (err) {
        res.status(500).json({ message: err.message || 'Server error' });
    }
}

async function deleteQueue(req, res) {
    try {
        const { entryId } = req.params;
        const entry = await Queue.findByIdAndDelete(entryId);

        if (!entry) {
            return res.status(404).json({ message: 'Queue entry not found.' });
        }

        const io = req.app.get('io');
        if (io) {
            const fullQueue = await Queue.find({ shopId: entry.shopId, status: 'waiting' }).sort({ createdAt: 1 });
            io.to(`shop_${entry.shopId}`).emit('queue_updated', { queue: fullQueue });
        }

        res.status(200).json({ message: 'Patient removed from queue.' });
    } catch (err) {
        res.status(500).json({ message: err.message || 'Server error' });
    }
}

async function getQRData(req, res) {
    try {
        const { shopId } = req.params;

        const shop = await User.findById(shopId);
        if (!shop) {
            return res.status(404).json({ message: 'Shop/Doctor not found.' });
        }

        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const qrUrl = `${baseUrl}/join/${shopId}`;

        res.status(200).json({
            shopId,
            shopName: shop.name,
            qrUrl,
            message: 'Scan this QR to join the queue',
        });
    } catch (err) {
        res.status(500).json({ message: err.message || 'Server error' });
    }
}

async function getShops(req, res) {
    try {
        const shops = await User.find({ role: 'admin' }).select('_id name email');
        res.status(200).json({ shops });
    } catch (err) {
        res.status(500).json({ message: err.message || 'Server error' });
    }
}

module.exports = { addToQueue, getQueue, getPosition, updateStatus, deleteQueue, getQRData, getShops };
