const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
    shopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    patientName: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        default: '',
    },
    position: {
        type: Number,
    },
    status: {
        type: String,
        enum: ['waiting', 'in-progress', 'completed', 'cancelled'],
        default: 'waiting',
    },
    tokenNumber: {
        type: Number,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});


queueSchema.pre('save', async function () {
    if (!this.isNew) return;

    const Queue = mongoose.model('Queue');

    const waitingCount = await Queue.countDocuments({
        shopId: this.shopId,
        status: 'waiting',
    });
    this.position = waitingCount + 1;

    const last = await Queue.findOne({ shopId: this.shopId })
        .sort({ tokenNumber: -1 })
        .select('tokenNumber');
    this.tokenNumber = last ? (last.tokenNumber || 0) + 1 : 1;
});

const Queue = mongoose.model('Queue', queueSchema);
module.exports = Queue;