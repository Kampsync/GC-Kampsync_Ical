import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Replace this with your actual Xano endpoint
const XANO_UPDATE_TOKEN_URL = 'https://xano.example.com/api:update_ical_token';

// Step 1: Generate a new iCal token and save it to Xano
app.get('/generate-ical/:listingId', async (req, res) => {
  const { listingId } = req.params;
  const token = uuidv4();

  try {
    const response = await fetch(XANO_UPDATE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: listingId,
        kampsync_token: token
      })
    });

    if (!response.ok) {
      throw new Error(`Xano returned status ${response.status}`);
    }

    const icalLink = `https://www.kampsync.com/${token}.ics`;

    return res.json({
      success: true,
      listingId,
      token,
      icalLink
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to save token to Xano',
      details: error.message
    });
  }
});

// Step 2: Serve a placeholder .ics file for any incoming token
app.get('/:token.ics', async (req, res) => {
  const { token } = req.params;

  // Later: verify token with Xano and pull booking data
  res.setHeader('Content-Type', 'text/calendar');
  res.send(`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//KampSync//EN
BEGIN:VEVENT
SUMMARY:Sample KampSync Booking
DTSTART:20250620T140000Z
DTEND:20250620T150000Z
END:VEVENT
END:VCALENDAR`);
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
