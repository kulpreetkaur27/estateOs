require("dotenv").config();
const axios = require("axios");
const qs = require("querystring");

const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;

// Function to generate Zoom OAuth token
const getZoomAccessToken = async () => {
  const tokenUrl = "https://zoom.us/oauth/token";
  const authHeader =
    "Basic " +
    Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString("base64");

  try {
    const response = await axios.post(
      tokenUrl,
      qs.stringify({
        grant_type: "account_credentials",
        account_id: ZOOM_ACCOUNT_ID,
      }),
      {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error("Error getting Zoom access token:", error.response.data);
    throw new Error("Failed to get Zoom access token");
  }
};

// Function to create a Zoom meeting
const createZoomMeeting = async () => {
  const accessToken = await getZoomAccessToken();
  const meetingData = {
    topic: "Real Estate Client Meeting",
    type: 2,
    start_time: new Date().toISOString(),
    duration: 60,
    timezone: "America/Toronto",
    agenda: "Discussion on property details",
    settings: {
      host_video: true,
      participant_video: true,
      join_before_host: false,
      mute_upon_entry: true,
      approval_type: 0,
      waiting_room: true,
    },
  };

  try {
    const response = await axios.post("https://api.zoom.us/v2/users/me/meetings", meetingData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Zoom Meeting Created:", response.data);
    return response.data.join_url; // Return the Zoom meeting link
  } catch (error) {
    console.error("Error creating Zoom meeting:", error.response.data);
    throw new Error("Failed to create Zoom meeting");
  }
};

module.exports = { createZoomMeeting };
