const fs = require("fs");
const { sendmsg, edit } = require("../telegram/msgutils");
const path = require("path");
const { google } = require("googleapis");

const SCOPES = [
  "https://www.googleapis.com/auth/drive.file"
];

var cred = path.join(__dirname, "../credentials.json");
var oAuth2Client = null;

function CreateToken(code, msg, bot) {
  fs.readFile(cred, (err, content) => {
    if (err) {
      console.log("Make Sure You Have Your client secret file in path:", err);
      return;
    }
    const credentials = JSON.parse(content);

    const { client_secret, client_id, redirect_uris } = credentials.installed;
    oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    // Create token
    token(code, msg, bot);
  });
} //getauthUrl

function token(code, msg, bot) {
  const userId = msg.from.id.toString();
  const TOKEN_PATH = path.join(__dirname, `../creds/${userId}.json`);
  oAuth2Client.getToken(code, (err, token) => {
    if (err) {
      sendmsg("Check Your Auth Token And Try Again !!", msg, bot);
      console.error("Not A valid Access Token");
      return;
    }
    oAuth2Client.setCredentials(token);
    // Store the token to disk for later program executions
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
      console.log("writing Token File..");

      if (err) {
        sendmsg("Token Write Error report @aryanvikash", msg, bot);
        return console.error(err);
      }
      console.log("Token stored to", TOKEN_PATH);
      sendmsg("Successful Authorized 🎉", msg, bot);
    });

    // callback(oAuth2Client);
  });
}

module.exports = { CreateToken };
