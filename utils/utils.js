const fs = require('fs-extra')
const mkdirp = require('mkdirp');
const rimraf = require("rimraf");

const {downloadFolder} = require("../config");
const path = require("path");

const downloadPath = path.join(__dirname, `${downloadFolder}`);
const {createTokenFile} = require("../database/dbtoken")

let DownloadList = {}
var dlDetails = []


async function getUserDownloadPath(msg) {
    let userid = msg.from.id.toString();
    let dp = path.join(__dirname, `../${downloadFolder}/${userid}`);

    return new Promise((res, rej) => {
        mkdirp(dp).then(made => {
            console.log(`Dir Created ${made}`)
            res(dp)
            return
        })
    })
}


function humanbytes(num) {
    var exponent,
        unit,
        neg = num < 0,
        units = ["B", "kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    if (neg) num = -num;
    if (num < 1) return (neg ? "-" : "") + num + " B";
    exponent = Math.min(
        Math.floor(Math.log(num) / Math.log(1000)),
        units.length - 1
    );
    num = Number((num / Math.pow(1000, exponent)).toFixed(2));
    unit = units[exponent];
    return (neg ? "-" : "") + num + " " + unit;
}


function humantime(ms) {
    let seconds = ms / 1000;
    let result = "";
    const days = Math.floor((seconds % 31536000) / 86400);
    if (days > 0) result += `${days}d `;
    const hours = Math.floor(((seconds % 31536000) % 86400) / 3600);
    if (hours > 0) result += `${hours}h `;
    const minutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
    if (minutes > 0) result += `${minutes}m `;
    seconds = ((((seconds % 31536000) % 86400) % 3600) % 60).toFixed(0);
    if (seconds > 0) result += `${seconds}s`;
    if (result === "") result += "0s";
    return result;
}


const DownloadFolderChecker = (dpath) => {
    if (!fs.existsSync(dpath)) {
        try {
            fs.mkdirSync(dpath);
            console.log("path Created ", dpath);
        } catch (err) {
            console.log("Path not avalible");
        }
    } else {
        console.log(`${dpath} is already There`)
    }
};


async function isAuth(msg, isLogut = false) {
    const userId = msg.from.id.toString();
    if (!isLogut) {

    }
    const credsPath = path.join(__dirname, `../creds/${userId}.json`);

    return new Promise(async (res, rej) => {
        fs.lstat(credsPath, async (err) => {
            // If Error That mean There is no file
            if (err) {

                console.log(`${userId} local auth file not found checking Database`);


                return res(await createTokenFile(userId));
            } else {
                console.log(`${userId} is auth`);
                res(true);
                return true;
            }
        });
    });
}


function cleanup(file_path) {


    rimraf(file_path, () => console.log(`${file_path} removed from disk`));


}


function addUser(msg, gid, is_zip = false) {

    let msgId = msg.message_id
    let userId = msg.from.id
    let chatId = msg.chat.id
    let userName = msg.from.username

    let data = {

        [gid]: {"msgId": msgId, "username": userName, "userId": userId, "chatId": chatId, "oldgid": gid, "zip": is_zip}
    }
    Object.assign(dlDetails, data)


}


function removeUser(gid) {
    delete dlDetails.gid
    console.log("removed", gid)
}

async function renameGid(newgid, oldgid) {

    try {
        dlDetails[newgid] = dlDetails[oldgid]
        delete dlDetails[oldgid]
        console.log(`Gid Replace Old ${oldgid} New ${newgid}`)
    } catch (e) {
        console.log("Gid Replace error :", e.message)
    }
}


function getmsgcontext(gid) {


    return ({
        "message_id": dlDetails[gid]["message_id"],
        "from": {
            "id": dlDetails[gid]["userId"],
            "username": dlDetails[gid]["username"]
        },
        "chat": {
            "id": dlDetails[gid]["chatId"],
            "username": dlDetails[gid]["username"],
            type: 'private'
        },
        text: '/test sdhs',
        entities: [{offset: 0, length: 5, type: 'bot_command'}]
    })

}


module.exports = {
    humanbytes,
    humantime,
    DownloadFolderChecker,
    downloadPath,
    cleanup,
    isAuth,
    getUserDownloadPath,
    DownloadList,
    dlDetails,
    addUser,
    removeUser,
    renameGid,
    getmsgcontext
};
