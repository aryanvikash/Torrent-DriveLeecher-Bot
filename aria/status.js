const {humanbytes} = require("../utils/utils")
// const path = require("path")
// const {sendmsg, edit, gidEditmsg} = require("../telegram/msgutils")
// const ariaUpload = require("./ariaupload")


function downloadETA(totalLength, completedLength, speed) {
    if (speed === 0)
        return '-';
    const time = (totalLength - completedLength) / speed;
    const seconds = Math.floor(time % 60);
    const minutes = Math.floor((time / 60) % 60);
    const hours = Math.floor(time / 3600);

    if (hours === 0) {
        if (minutes === 0) {
            return `${seconds}s`;
        } else {
            return `${minutes}m ${seconds}s`;
        }
    } else {
        return `${hours}h ${minutes}m ${seconds}s`;
    }
}

const PROGRESS_MAX_SIZE = Math.floor(100 / 8);
const PROGRESS_INCOMPLETE = ['▱', '▱', '▱', '▱', '▱', '▱', '▱'];


function generateProgress(p) {
    p = Math.min(Math.max(p, 0), 100);
    let str = '[';
    const cFull = Math.floor(p / 8);
    const cPart = p % 8 - 1;
    str += '▰'.repeat(cFull);
    if (cPart >= 0) {
        str += PROGRESS_INCOMPLETE[cPart];
    }
    str += ' '.repeat(PROGRESS_MAX_SIZE - cFull);
    str = `${str}] ${p}%`;

    return str;
}


function generate_status_str(res) {
    let smsg; // status msg
    let progress;
    if (res.totalLength === 0) {
        progress = 0;
    } else {
        progress = Math.round(res.completedLength * 100 / res.totalLength);
    }

    try {
        smsg = `Name: <code>${res.bittorrent.info.name}</code>\n`;
        smsg += `Total Size: <code>${humanbytes(res.totalLength)}</code> \n`
        smsg += `Downloaded : <code>${humanbytes(res.completedLength)}</code>\n`
        smsg += `DownloadSpeed: <code>${humanbytes(res.downloadSpeed)}</code>\n`
        smsg += `Progress: <code>${generateProgress(progress)}</code>\n`
        smsg += `ETA: <code>${downloadETA(res.totalLength, res.completedLength, res.downloadSpeed)}</code>\n`
        smsg += `Seeder: <code> ${res.numSeeders}</code>\n`
        smsg += `<code>${res.gid} </code>`
    } catch (e) {
        smsg = `Name: <code>Preparing Your Download</code>\n`;
        smsg += `Total Size: <code>${humanbytes(res.totalLength)}</code> \n`
        smsg += `Downloaded : <code>${humanbytes(res.completedLength)}</code>\n`
        smsg += `DownloadSpeed: <code>${humanbytes(res.downloadSpeed)}</code>\n`
        smsg += `Seeder: <code> ${res.numSeeders}</code>\n`
        smsg += `<code>/cancel ${res.gid} </code>`
    }


    return smsg
}


async function sendStatus(gid, aria2, sentm, bot, pv = null) {

    try {
        let res = await aria2.call("tellStatus", gid, ['status', 'bittorrent', 'totalLength', 'completedLength', 'errorMessage', 'downloadSpeed', 'numSeeders', 'gid', 'infoHash', 'files'])
        await getStatus(res, gid, aria2, pv, sentm, bot)
    } catch (e) {
        console.log(e.message)
    }
}


async function getStatus(res, gid, aria2, pv, sentm, bot) {
    let opts = {
        chat_id: sentm.chat.id,
        message_id: sentm.message_id,
        reply_markup: {
            inline_keyboard: [
                [{text: "cancel", callback_data: `cancel ${gid}`}]
            ]
        },
        parse_mode: "HTML"
    };

    if (res.status === 'active') {
        var smsg = generate_status_str(res);

        if (pv != smsg) {
            try {
                await bot.editMessageText(smsg, opts);
            } catch (e) {
                await sendStatus(gid, aria2, sentm, bot, smsg)
            }
        }

    } else if (res.status === 'waiting') {
        opts = {
            chat_id: sentm.chat.id,
            message_id: sentm.message_id,
            reply_markup: {
                inline_keyboard: [
                    [{text: "cancel", callback_data: `cancel ${gid}`}]
                ]
            },
            parse_mode: "HTML"
        };
        var smsg = `Gid :<code>${res.gid}</code>\n`
        smsg += `Status : <code>Queued</code>\n`

        if (pv != smsg) {
            try {
                await bot.editMessageText(smsg, opts);

            } catch (e) {

                console.warn(e.message)
                // ignoring error of non modified error
            }
        }
    }


    // complete
    else if (res.status === 'complete') {
        await bot.deleteMessage(sentm.chat.id, sentm.message_id)

        return
    }

    // Incase It stopped or Cancelled
    else if (res.status === 'removed') {
        return
    }
    // in  other case maybe it not gonna come but just for backup
    else {
        return
    }
    await timeout(3000)
    await sendStatus(gid, aria2, sentm, bot, smsg)
}


function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = sendStatus
 