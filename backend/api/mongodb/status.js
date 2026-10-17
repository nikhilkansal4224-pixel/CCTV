const { connectToDatabase } = require('../_db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  try {
    const { events, isMemory, uri, dbName } = await connectToDatabase();
    let count = 0;
    try {
      count = await events.countDocuments();
    } catch (e) {}

    res.status(200).json({
      connected: !isMemory,
      isMemory,
      uri: uri ? (uri.includes('@') ? uri.replace(/:([^:@]+)@/, ':****@') : uri) : 'N/A',
      database: dbName,
      eventsCount: count,
      isVercel: true
    });
  } catch (err) {
    res.status(200).json({
      connected: false,
      isMemory: true,
      error: err.message,
      eventsCount: 0
    });
  }
};
