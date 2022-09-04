"use strict"
process.env["NTBA_FIX_319"] = 1;

const TelegramBot = require("node-telegram-bot-api");
const {sendmsg, edit} = require("./telegram/msgutils");
const Command = require("./telegram/command");
const fs = require("fs");
const path = require("path");
const {
    DownloadFolderChecker,
    isAuth,
    DownloadList,
} = require("./utils/utils");
const {tgToken} = require("./config");
const {getAuthurl} = require("./drive/AuthUrl");
const {CreateToken} = require("./drive/token");
const diskinfo = require("./utils/disk");
const {deleteToken, TokenInsert} = require("./database/dbtoken");
const {MongoDB} = require("./database/userdb");
const Aria2 = require("aria2");
const {ariaListners} = require("./aria/ariahandler");
const ariaAdd = require("./aria/add");
const isTorrent = require("./utils/istorrent");

const {cancelgid} = require("./aria/ariacancel");
const PORT = 6800;
const ariaOptions = {
    host: "localhost",
    port: 6800,
    secure: false,
    secret: "",
    path: "/jsonrpc",
};

const aria2 = new Aria2(ariaOptions);

aria2
    .open()
    .then(() => {
        console.log("Websocket Opened Port", PORT);
    })
    .catch(() => {
        console.log("WebSocket is closed exiting ..");
        process.exit(1);
    });

const startTime = Date.now();

//////////////////////////// Do not Touch This part ////////////////////////////////////////////////////////
const command = new Command();
// DownloadFolderChecker();
const token = tgToken;
const bot = new TelegramBot(token, {polling: true});
bot.on("polling_error", (msg) => console.error(msg.message));
//////////////////////////////////////////////////////////////////////////////////////

ariaListners(aria2, bot);


// Start
bot.onText(command.start, async (msg) => {
    if (!(await userinChannel(msg))) {
        await sendJoinChannel(msg);
        return;
    }

    const opts = {
        reply_markup: {
            inline_keyboard: [
                [{text: "Join Channel", url: "https://t.me/aryan_bots"}],
            ],
        },parse_mode: "HTML",
    };

    let Startmsg = `Hey ${msg.from.first_name} 
Bot Uptime : <code> ${getuptime()} </code>
Note: <code>Check Uptime If You Think Your Download Is Not in List Or Disappear
It mostly happen Due To Server overload And restart Hope You Can understand 😁</code>

check /help Command For more information
`;
    // await sendmsg("Just A Useless Command\nJoin @aryan_bots For Useless Updates😒 ", msg, bot);
    await bot.sendMessage(msg.chat.id, Startmsg, opts);
    console.log(DownloadList);
    
});

// callaback Function

bot.on("callback_query", async callbackQuery => {
    const data = callbackQuery.data;
    const msg = callbackQuery.message;
    const opts = {
        chat_id: msg.chat.id,
        message_id: msg.message_id,
        parse_mode: "HTML",
    };

    if (data.startsWith("cancel")) {
        let gid = data.split(" ")[1];
        // bot.editMessageText(d, opts);
        await cancelgid(aria2, gid, msg, bot, opts);
    }
});



 // torrent file Handler
bot.on("document", async (msg) => {
    if (!(await userinChannel(msg))) {
        await sendJoinChannel(msg);
        return;
    }

    if (!(await isAuth(msg))) {
        await sendmsg("You should  Login first using /login ", msg, bot);
        return;
    }

    if (msg.document.mime_type === "application/x-bittorrent") {
        if(DownloadList[msg.from.id] === true){
            await sendmsg("One Download At a Time Please Don't abuse it", msg, bot);
            return
        }
        
        let uri = await bot.getFileLink(msg.document.file_id);

        console.log(uri);
        ariaAdd(aria2, uri, msg, bot);
        
    }
});

// Only zip For  zip Torrent File
bot.onText(command.doczip, async (msg) => {
    // await sendmsg("Zip Temporary disabled", msg, bot);
    // return ;
    if (!(await userinChannel(msg))) {
        await sendJoinChannel(msg);
        return;
    }

    if (!(await isAuth(msg))) {
        await sendmsg("You should  Login first using /login ", msg, bot);
        return;
    }

    if (
        msg.reply_to_message &&
        msg.reply_to_message.document &&
        msg.reply_to_message.document.mime_type === "application/x-bittorrent"
    ) {
        if(DownloadList[msg.from.id] === true){
            await sendmsg("One Download At a Time Please Don't abuse it", msg, bot);
            return
        }
        

        let uri = await bot.getFileLink(msg.reply_to_message.document.file_id);

        console.log(uri);
       
        ariaAdd(aria2, uri, msg, bot, true);
       
        
    }
});





// upload Command
bot.onText(command.magnet, async (msg, match) => {
    if (!(await userinChannel(msg))) {
        await sendJoinChannel(msg);
        return;
    }

    let uri = match[0];
    if(DownloadList[msg.from.id] === true){
        await sendmsg("One Download At a Time Please Don't abuse it", msg, bot);
        return
    }

    if (uri.startsWith("http")) {
        if (!(await isTorrent(uri))) {
            await sendmsg("Supports only Torrents 😔 ", msg, bot);
            return;
        }
    }
    if (await isAuth(msg)) {
        // addTorrent(uri, msg, bot);
        
        ariaAdd(aria2, uri, msg, bot, false);
        
        
        
    } else {
        await sendmsg("You should  Login first using /login ", msg, bot);
    }
});



// login
bot.onText(command.login, async (msg) => {
    if (!(await userinChannel(msg))) {
        await sendJoinChannel(msg);
        return;
    }

    if (await isAuth(msg)) {
        await sendmsg("You Are Already Authorized !!", msg, bot);
    } else {
        await getAuthurl(msg, bot);
    }
});

// Token Handler
bot.onText(command.token, async (msg, match) => {
    if (!(await userinChannel(msg))) {
        await sendJoinChannel(msg);
        return;
    }
    const code = match[0];
    if (await isAuth(msg, true)) {
        await sendmsg("Your Are Alredy logged in !!", msg, bot);
    } else {
        CreateToken(code, msg, bot);
        setTimeout(() => {
            TokenInsert(msg.from.id);
        }, 2000);
    }
});

//logout
bot.onText(command.logout, async (msg) => {
    if (!(await userinChannel(msg))) {
        await sendJoinChannel(msg);
        return;
    }

    // If Error That mean There is no file
    const userId = msg.from.id.toString();
    const credsPath = path.join(__dirname, `./creds/${userId}.json`);
    if (await isAuth(msg, true)) {
        fs.unlink(credsPath, (err) => {
            if (!err) {
                sendmsg("Logout Successfully !!", msg, bot);
                console.log("logout success", userId);
            } else {
                console.error("deleting creds file", err);
            }
        });
        await deleteToken(userId);
    } else {
        await sendmsg("You Are not Logged In Use /login !!", msg, bot);
    }
});

// Zip

bot.onText(command.zip, async (msg, match) => {
    // await sendmsg("Zip Temporary disabled", msg, bot);
    // return;
    if (!(await userinChannel(msg))) {
        await sendJoinChannel(msg);
        return;
    }
    const uri = match[1];

    if(DownloadList[msg.from.id] === true){
        await sendmsg("One Download At a Time Please Don't abuse it", msg, bot);
        return
    }

    if (uri.startsWith("http")) {
        if (!(await isTorrent(uri))) {
            await sendmsg("Supports only Torrents 😔 ", msg, bot);
            return;
        }
    }

    if (await isAuth(msg)) {
        ariaAdd(aria2, uri, msg, bot, true);
        
    } else {
        await sendmsg("You should  Login first using /login ", msg, bot);
    }
});

// cancel

bot.onText(command.cancel, async (msg, match) => {
    await sendmsg("This command is deprecated", msg, bot);
    return
    if (!(await userinChannel(msg))) {
        await sendJoinChannel(msg);
        return;
    }
    await cancelgid(aria2, match[1], msg, bot);
    // cancel(gid, msg, bot)
});

// help
bot.onText(command.help, async (msg) => {
    if (!(await userinChannel(msg))) {
        await sendJoinChannel(msg);
        return;
    }

    let helptext =
        "⭐️ I can Download Torrent In Your Google Drive Account ⭐️ \n\n";

    helptext += "/start - Start Command \n\n";
    helptext += "/login - Login To Your Account \n\n";
    helptext += "/logout - Logout Your Account \n\n";
    helptext +=
        "Upload (no need any command): <code>Just Send Your Magnet ,Torrent Direct Url  or Torrent File: </code>\n\n";
    helptext +=
        "/zip - Upload compressed Version in your Drive ,same as Up command \n\n";
    helptext +=
        "/addtd - Add Your Teamdrive Id eg:<code>/addtd Xyz**** </code> \n\n";
    helptext += "/rmtd - Will Remove Teamdrive from database\n\n";
    helptext += "/disk - Server Disk Info and Uptime\n\n";
    helptext += "Limit : <code>Max Size limit 20GB</code>\n";
    await sendmsg(helptext, msg, bot);
});

// Disk Info

bot.onText(command.server, async (msg) => {
    if (!(await userinChannel(msg))) {
        await sendJoinChannel(msg);
        return;
    }


    await diskinfo(getuptime(), msg, bot);
});

// set Teamdrive Info

bot.onText(command.setTD, async (msg, match) => {
    if (!(await userinChannel(msg))) {
        await sendJoinChannel(msg);
        return;
    }

    let tdId = match[1].trim();
    const  mongo  = await  new MongoDB(msg.from.id)
    try {
        const res = await  mongo.setTeamdrive(tdId)
        if (res) {
            await sendmsg(
                `Teamdrive added  ${await mongo.getTeamdrive()} `,
                msg,
                bot
            );
        } else {
            await sendmsg(" Failed To Add Teamdrive", msg, bot);
        }
    }catch (e) {
        console.error(e.message)
    }

});

// set Teamdrive Info

bot.onText(command.removeTD, async (msg) => {
    if (!(await userinChannel(msg))) {
        await sendJoinChannel(msg);
        return;
    }
        const  mongo  = await  new MongoDB(msg.from.id)
        await mongo.removeTeamdrive()
        await sendmsg(`Teamdrive Removed from Database`, msg, bot);

});

const userinChannel = async (msg) => {
    try {
        let user = await bot.getChatMember("@aryan_bots", msg.from.id);

        if (user.status === "member" || user.status === "administrator") {
            console.log(user.status, msg.from.id);
            return true;
        } else {
            console.log(user.status, msg.from.id);
            return false;
        }
    } catch (e) {
        console.log("not a member of channel: ", e.message);
        return false;
    }
};

const sendJoinChannel = async (msg) => {
    const opts = {
        reply_markup: {
            inline_keyboard: [
                [{text: "Join Channel", url: "https://t.me/aryan_bots"}],
            ],
        },
    };

    // await sendmsg("Just A Useless Command\nJoin @aryan_bots For Useless Updates😒 ", msg, bot);
    await bot.sendMessage(msg.chat.id, "Join Channel To access Bot", opts);
};


function getuptime() {
    const currentTime = Date.now() - startTime;
    const timestamp = Math.floor(currentTime / 1000);

    const hours = Math.floor(timestamp / 60 / 60);

    const minutes = Math.floor(timestamp / 60) - hours * 60;

    const seconds = timestamp % 60;
    return hours + ":" + minutes + ":" + seconds

}