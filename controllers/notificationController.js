const Notification = require('../models/Notification');

exports.getNotification = async (req, res) => {
    try {
        const notifications = await Notification.getForUser(req.user.id);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
