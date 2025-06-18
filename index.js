const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;

app.post('/generate-ical-link', async (req, res) => {
  try {
    const { listing_id } = req.body;
    if (!listing_id) return res.status(400).json({ error: 'Missing listing_id' });

    // Generate a secure token
    const token = crypto.randomBytes(8).toString('hex'); // Example: a1b2c3d4e5f6g7h8

    // Construct the public iCal link
    const icalLink = `https://www.kampsync.com/${token}.ics`;

    // Send to Xano
    await axios.post('https://xfxa-cldj-sxth.n7e.xano.io/api:yHTBBmYY/save_kampsync_ical', {
      listing_id,
      ical_token: token
    });

    return res.json({ success: true, token, ical_link: icalLink });
  } catch (err) {
    console.error('Error generating link:', err);
    return res.status(500).json({ error: 'Internal error', details: err.message });
  }
});

app.listen(PORT, () => console.log(`iCal generator running on port ${PORT}`));
