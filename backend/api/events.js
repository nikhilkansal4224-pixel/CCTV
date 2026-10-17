const { connectToDatabase } = require('./_db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const { events, isMemory } = await connectToDatabase();

  if (req.method === 'GET') {
    try {
      const results = await events.find({}).sort({ createdAt: -1 }).limit(50).toArray();
      res.status(200).json({ events: results, connected: !isMemory });
    } catch (err) {
      res.status(200).json({ events: [], error: err.message, connected: false });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const eventDoc = {
        type: data.type || 'MOTION_DETECTED',
        camLabel: data.camLabel || 'Camera 01',
        count: Number(data.count || 0),
        confidence: Number(data.confidence || 0),
        motionIntensity: Number(data.motionIntensity || 0),
        timestamp: data.timestamp || new Date().toLocaleTimeString(),
        snapshot: data.snapshot || '',
        createdAt: new Date()
      };

      const result = await events.insertOne(eventDoc);
      eventDoc._id = result.insertedId;

      res.status(201).json({ success: true, event: eventDoc, mongoSaved: !isMemory });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
    return;
  }

  if (req.method === 'DELETE') {
    try {
      await events.deleteMany({});
      res.status(200).json({ success: true, message: 'All CCTV events cleared' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
