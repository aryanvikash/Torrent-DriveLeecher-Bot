const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
const { sendmsg } = require("../telegram/msgutils");
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

const cred = path.join("dsds", "../credentials.json");

oAuth2Client = null;

async function getAuthurl(msg, bot) {


  fs.readFile(cred, async(err, content) => {
    if (err) {
      console.log("Make Sure You Have Your clint secret file in path:", err);
      return;
    }
    const credentials = JSON.parse(content);

    const { client_secret, client_id, redirect_uris } = credentials.installed;
    var oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );
    //Generate Auth Url
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });
    // send It to bot For Auth It
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Visit Me", url: authUrl }]
        ]
      }
    };
    await bot.sendMessage(msg.chat.id, 'Generate Auth Token and Send It Here', opts);
    // sendmsg(authUrl, msg, bot);
    // console.log(authUrl);
  });
} //getauthUrl

// getAuthurl();

module.exports = { getAuthurl };
