const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import cors package

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors()); // Enable CORS for all routes

// Load environment variables
require('dotenv').config();

// Hardcoded Google OAuth credentials
const oauthCredentials = {
  client_id: '',
  client_secret: '',
  redirect_uris: ['http://localhost:3000/auth/callback'],
};

// Google OAuth2 setup for web application
const { client_id, client_secret, redirect_uris } = oauthCredentials;
const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0] // Assuming the first redirect_uri is the main one
);

// Generate auth URL
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
});

// Redirect to Google OAuth consent screen
app.get('/auth', (req, res) => {
  res.redirect(authUrl);
});

// Callback after authorization
app.get('/auth/callback', async (req, res) => {
  const code = req.query.code;
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    res.redirect('/add-schedule');
  } catch (error) {
    console.error('Error retrieving access token', error);
    res.status(500).send('Error retrieving access token');
  }
});

// Function to map day names to iCalendar day codes
const mapDaysToRrule = (days) => {
  const dayMap = {
    Monday: 'MO',
    Tuesday: 'TU',
    Wednesday: 'WE',
    Thursday: 'TH',
    Friday: 'FR',
    Saturday: 'SA',
    Sunday: 'SU'
  };
  return days.map(day => dayMap[day]);
}

// Add schedule to Google Calendar
app.post('/add-schedule', async (req, res) => {
  try {
    const { feedingDays, feedingTime, portion } = req.body;

    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    // Map feedingDays to iCalendar BYDAY format
    const rruleDays = mapDaysToRrule(feedingDays).join(',');

    // Example: Create a new event
    const event = {
      summary: 'Pet Feeding Schedule',
      description: `Feeding ${portion} per unit`,
      start: {
        dateTime: `2024-06-15T${feedingTime}:00`,
        timeZone: 'Asia/Jakarta', // Correct time zone for WIB
      },
      end: {
        dateTime: `2024-06-15T${feedingTime}:00`,
        timeZone: 'Asia/Jakarta', // Correct time zone for WIB
      },
      recurrence: [
        `RRULE:FREQ=WEEKLY;BYDAY=${rruleDays}`, // Repeat weekly on selected days
      ],
    };

    const response = await calendar.events.insert({
      calendarId: 'primary', // Use 'primary' for user's primary calendar
      resource: event,
    });

    console.log('Event created: %s', response.data.htmlLink);
    res.status(200).json({ message: 'Event added to Google Calendar' });
  } catch (error) {
    console.error('Error adding event to Google Calendar:', error);
    res.status(500).json({ error: 'Failed to add event to Google Calendar' });
  }
});

app.get('/fetch-schedule', async (req, res) => {
  try {
    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    const params = {
      calendarId: 'primary', // Use 'primary' for user's primary calendar
      timeMin: (new Date()).toISOString(), // Start time should be current time
      maxResults: 10, // Maximum number of results to fetch (adjust as needed)
      singleEvents: true,
      orderBy: 'startTime'
    };

    const response = await calendar.events.list(params);
    const events = response.data.items;

    if (events.length) {
      let closestEvent = null;
      let minTimeDifference = Number.MAX_SAFE_INTEGER;

      events.forEach(event => {
        const start = new Date(event.start.dateTime || event.start.date);
        const timeDifference = start - new Date(); // Difference in milliseconds

        if (timeDifference > 0 && timeDifference < minTimeDifference) {
          minTimeDifference = timeDifference;
          closestEvent = event;
        }
      });

      if (closestEvent) {
        res.status(200).json({ schedule: [closestEvent] });
      } else {
        res.status(404).json({ message: 'No upcoming events found.' });
      }
    } else {
      res.status(404).json({ message: 'No events found.' });
    }
  } catch (error) {
    console.error('Error fetching schedule from Google Calendar:', error);
    res.status(500).json({ error: 'Failed to fetch schedule from Google Calendar' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
