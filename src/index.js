import express from "express";
import {google} from "googleapis"
import dotenv from "dotenv"
import dayjs from "dayjs";
import {v4 as uuid} from 'uuid'
dotenv.config({});
const app = express();

/*
First we have to create calendar instance and have to provide authentication,
For that we have to generate api key - https://console.cloud.google.com/apis/credentials

*/
const calendar = google.calendar({
    version:"v3",
    auth: process.env.API_KEY
})


//Need to declare which feature we are using by providing link.
const scopes = [
    'https://www.googleapis.com/auth/calendar'
]

// Need to create object of OAuth2 by passing CLIENT_ID, CLIENT_SECRETE, REDIRECT_URL,
// To create client project use this link - https://console.cloud.google.com/apis/credentials/oauthclient

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
)

// After then we need to generate authURL and generate token to do operations. After generating token need to set in oauth2client object
app.get("/google",(req,res)=>{
    const url = oauth2Client.generateAuthUrl({
        access_type : "offline",
        scope: scopes
    })

    res.redirect(url);
})


//Make sure that this redirect url you alredy configured while creating oauth2client project
app.get("/google/redirect",async(req,res)=>{
  
    const code=req.query.code;

    const {tokens} = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    res.send({
        msg:"You have successfully logged in"
    })
})

//after that this is last step where you want to give all event description

app.get("/schedule_event", async (req, res) => {
    try {
        const response = await calendar.events.insert({
            calendarId: "primary",
            auth: oauth2Client, // Use the OAuth2 client for authentication
           
            //For google meet use confrenceDataVersion as 1
            conferenceDataVersion: 1,

            requestBody: {
                // All event data
                summary: "This is a test event",
                description: "Some event is very very special",

                //meeting start time
                start: {
                    dateTime: dayjs(new Date()).add(1, 'day').toISOString(),
                    timeZone: "Asia/Kolkata"
                },

                //meeting end time
                end: {
                    dateTime: dayjs(new Date()).add(1, 'day').add(1, "hour"),
                    timeZone: "Asia/Kolkata"
                },

                // required to genereate random requestId
                conferenceData:{
                    createRequest : {
                        requestId : uuid()
                    }
                },

                //Student mail ids
                attendees : [{
                    email: "mayurs@iconnectsolutions.com",
                },
                {
                    email: "tusharbhosale2281@gmail.com",
                }]   
            }
        });

        const meetLink = response.data.hangoutLink; // Get the Google Meet link

        res.send({
            msg: "Meeting Scheduled",
            meetLink : meetLink
        });

    } catch (error) {
        console.error("Error scheduling event:", error);
        res.status(500).send("An error occurred while scheduling the event");
    }
});


const PORT = process.env.PORT || 8000

app.listen(PORT,()=>{
    console.log("Server started on port : ",PORT);
})