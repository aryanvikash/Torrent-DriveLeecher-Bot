const {sendmsg, edit, gidEditmsg} = require("../telegram/msgutils")
const {deleteFile, deleteFolder, DownloadList} = require("../utils/utils")
const fs = require('fs-extra')
const path = require("path")

async function cancelgid(aria2, gid, msg, bot, opts = null) {

    DownloadList[msg.from.id] = false

    try {
        var res = await aria2.call("tellStatus", gid, ['status', 'bittorrent'])
        var name = res.bittorrent.info.name
        await aria2.call("remove", gid);
        await bot.deleteMessage(opts.chat_id, opts.message_id)
        await bot.sendMessage(opts.chat_id, `<code>${name}</code> Cancelled !!`, {parse_mode: "HTML"});
        console.log(`Cancellled: ${name} gid: ${gid}`,)


    } catch (e) {
        console.log(e.message)
        await sendmsg("Make Sure Your Download Is Active", msg, bot)
    }

    try {
        await deletePath(path.join(__dirname, `../downloads/${msg.from.id.toString()}/${name}`))
    } catch (e) {
        console.log(e.message)
    }


}


async function deletePath(downloadPath) {
    let stats = fs.statSync(downloadPath);
    if (stats.isDirectory()) {
        deleteFolder(downloadPath)
    } else {
        deleteFile(downloadPath)
    }
}


module.exports = {cancelgid}
 