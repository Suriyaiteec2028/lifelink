const DonationHistory = require('../models/DonationHistory');

/**
 * @desc Get user's donation history
 * @route GET /api/donations/history
 */
const getDonationHistory = async (req, res) => {
  try {
    const history = await DonationHistory.find({ donorId: req.user._id })
      .populate('requesterId', 'fullName phone')
      .populate('requestId', 'requestAddress requiredDate requiredBloodGroup')
      .sort({ recordedDate: -1 });

    return res.status(200).json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving donation history.' });
  }
};

/**
 * @desc Get single donation record details
 * @route GET /api/donations/:id
 */
const getDonationById = async (req, res) => {
  try {
    const record = await DonationHistory.findById(req.params.id)
      .populate('requesterId', 'fullName phone email')
      .populate('requestId');

    if (!record) {
      return res.status(404).json({ success: false, message: 'Donation record not found.' });
    }

    if (record.donorId.toString() !== req.user._id.toString() && record.requesterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this record.' });
    }

    return res.status(200).json({
      success: true,
      record
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving donation record.' });
  }
};

module.exports = {
  getDonationHistory,
  getDonationById
};
