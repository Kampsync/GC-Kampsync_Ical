import express from 'express';
import fetch from 'node-fetch';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 8080;
app.use(express.json());

// Xano API config (replace with your actual base URL + auth)
const XANO_BASE_URL = 'https://xano.yourdomain.com/api:listings';
const XANO_API_KEY = 'YOUR_XANO_API_KEY'; // use bearer token if needed

// Generate token and save to Xano
app.post('/generate', async (req, res) => {
  const { listing_id } = req.body;
  if (!listing_id) return res.status(400).json({ error: 'Missing listing_id' });

  // Generate secure token
  const token = crypto.randomBytes(12).toString('hex');

  // Save to Xano
  try {
    const xanoResponse = await fetch(`${XANO_BASE_URL}/${listing_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${XANO_API_KEY}`
      },
      body: JSON.stringify({ kampsync_ical_link: `https://www.kampsync.com/${token}.ics` })
    });

    if (!xanoResponse.ok) throw new Error(`Xano error: ${xanoResponse.status}`);

    // Optionally log success
    console.log(`✔ Token ${token} saved for listing ${listing_id}`);

    res.json({
      token,
      ical_link: `https://www.kampsync.com/${token}.ics`
    });

  } catch (err) {
    res.status(500).json({ error: 'Failed to save token to Xano', details: err.message });
  }
});

// Serve .ics calendar by token
app.get('/:token.ics', async (req, res) => {
  const token = req.params.token;

  // Look up listing in Xano by matching token
  try {
    const listingsRes = await fetch(`${XANO_BASE_URL}?kampsync_ical_link=eq.https://www.kampsync.com/${token}.ics`, {
      headers: { Authorization: `Bearer ${XANO_API_KEY}` }
    });

    const listings = await listingsRes.json();
    if (!listings.length) return res.status(404).send('Listing not found');

    const listing = listings[0];
    const listing_id = listing.id;

    // Fetch bookings by listing ID
    const bookingsRes = await fetch(`https://xano.yourdomain.com/api:booking_events?listing_id=${listing_id}`);
    const bookings = await bookingsRes.json();

    // Build ICS calendar
    const events = bookings.map(booking => {
      const start = new Date(booking.start).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const end = new Date(booking.end).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const summary = booking.summary || 'KampSync Booking';
      const uid = booking.uid || `${listing_id}-${start}`;

      return `BEGIN:VEVENT
SUMMARY:${summary}
UID:${uid}
DTSTART:${start}
DTEND:${end}
END:VEVENT`;
    }).join('\n');

    const ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//KampSync//EN
${events}
END:VCALENDAR`;

    res.setHeader('Content-Type', 'text/calendar');
    res.send(ical);

  } catch (err) {
    res.status(500).json({ error: 'Failed to generate .ics', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ KampSync .ics service running on port ${PORT}`);
});
