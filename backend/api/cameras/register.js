const { connectToDatabase } = require('../_db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { cameras, isMemory } = await connectToDatabase();
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const camDoc = {
      camId: data.camId,
      camName: data.camName || 'Remote Camera',
      type: data.type || 'mobile',
      battery: data.battery || null,
      facingMode: data.facingMode || 'environment',
      userAgent: req.headers['user-agent'] || '',
      lastSeen: new Date()
    };

    await cameras.updateOne(
      { camId: camDoc.camId },
      { $set: camDoc },
      { upsert: true }
    );

    res.status(200).json({ success: true, registered: true, mongoSaved: !isMemory });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
