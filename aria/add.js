const path = require("path")

const { sendmsg, edit } = require("../telegram/msgutils")

const { humanbytes, DownloadList, dlDetails, addUser, removeUser } = require("../utils/utils")

const sendStatus = require("./status")





async function ariaAdd(aria2, magnet, msg, bot, is_zip = false) {

    let userId = msg.from.id.toString()

    try {
        const gid = await aria2.call("addUri", [magnet], { dir: path.join(__dirname, `../downloads/${msg.from.id.toString()}`) });

        // DownloadList.push(msg.from.id)
        addUser(msg, gid, is_zip)
        DownloadList[msg.from.id] = true
        let sentm = await sendmsg(`<code>Preparing MetaData ...!!\n</code>`, msg, bot)
        await sendStatus(gid, aria2, sentm, bot)


    }
    catch (e) {
        await sendmsg(e.message, msg, bot)
        DownloadList[msg.from.id] = false  
        console.error(e.message);
                         
        return
    }
    // consoles.log(await aria2.listMethods());


    // await sendStatus(gid, aria2, sentm, bot)


}


module.exports = ariaAdd
