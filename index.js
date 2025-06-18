import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 8080;

// Replace with your actual Xano bookings endpoint
const XANO_BOOKINGS_URL = 'https://your-xano-instance.com/api:get_bookings_by_listing_id'; // expects ?listing_id=123

// Serve iCal feed for a given listing ID
app.get('/:listingId.ics', async (req, res) => {
  const { listingId } = req.params;

  try {
    // Fetch booking data from Xano
    const response = await fetch(`${XANO_BOOKINGS_URL}?listing_id=${listingId}`);
    if (!response.ok) throw new Error(`Xano returned status ${response.status}`);

    const bookings = await response.json();

    // Format iCal events
    const events = bookings.map(booking => {
      const start = new Date(booking.start).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const end = new Date(booking.end).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const summary = booking.summary || 'KampSync Booking';
      const uid = booking.uid || `${listingId}-${start}`;

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

  } catch (error) {
    res.status(500).json({ error: 'Failed to generate .ics', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ KampSync iCal service running on port ${PORT}`);
});
