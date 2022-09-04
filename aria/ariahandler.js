
const { edit, gidSendmsg, gidEditmsg} = require("../telegram/msgutils")
const {humanbytes, DownloadList, renameGid, dlDetails, getmsgcontext} = require("../utils/utils")
const sendStatus = require("./status")
const ariaUpload = require("./ariaupload")
const crossedSizeLimit = require("./sizechecker")


function ariaListners(aria2, bot) {


    // on download start
    aria2.on("onDownloadStart", async ([gid]) => {
        let listGid = gid
        // Download Start Will invoke when main File started
        // following = metadata file gid
        // followedBy = old gid
        var r = await aria2.call("tellStatus", listGid.gid)


        if (r.following) {
            console.log(`${r.bittorrent.info.name}Downloading Started`, gid)
            // replace new gid
            await renameGid(listGid.gid, r.following)
            // var metagid = r.following
            var newgid = listGid.gid

            var sentm = await gidSendmsg(`Downloading Started ...!!\n<code>/cancel ${newgid}</code>`, newgid, bot)
            const sizeExceed = await crossedSizeLimit(newgid, aria2);
            if (sizeExceed) {

                await edit(`<code>max size Limit is 20GB But found ${humanbytes(sizeExceed)} \n #stopped</code> 😢`,
                    sentm, bot)
                try {
                    await aria2.call("remove", newgid);

                } catch (e) {
                    console.error(e.message)
                }
            } else {

                await sendStatus(newgid, aria2, sentm, bot)
            }
        } else {

            console.log("MetaData Downloading Started", gid)

        }
    })

    // Ondownload Stop or cancel
    aria2.on("onDownloadStop", async ([gid]) => {
        let gids = gid
        console.log("stoppped", gid)
        DownloadList[dlDetails[gids.gid].userId] = false
        await gidSendmsg(`Gid ${gids.gid} Download Stopped !!`, gids.gid, bot)
        try {
            await aria2.call("remove", gids.gid)
        } catch (e) {
            console.error(e.message)
        }

    })


    // download complete
    aria2.on("onDownloadComplete", async ([gid]) => {
        let gids = gid
        console.log("Final Complete", gid)
        // try {
        //  var res = await aria2.call("tellStatus", dlDetails[gids.gid].oldgid, ['bittorrent', 'totalLength'])

        //  console.log(dlDetails[gids.gid].chatId, dlDetails[gids.gid].msgId)

        //  await bot.deleteMessage(dlDetails[gids.gid].chatId, dlDetails[gids.gid].msgId)


        // }
        // catch (e) {
        //  console.log(e.message)
        //}


    })


    // download error
    aria2.on("onDownloadError", async ([gid]) => {
        let gids = gid
        DownloadList[dlDetails[gids.gid].userId] = false
        delete dlDetails[gids.gid]


        let res = await aria2.call("tellStatus", gids.gid, ["errorMessage"])
        await gidSendmsg(res.errorMessage, gids.gid, bot)
        console.log("on DownloadError", gid)

    })


    // download complete but still seeding
    aria2.on("onBtDownloadComplete", async ([gid]) => {
        const gids = gid;
        console.log("Complete But Still seeding", gid)
        DownloadList[dlDetails[gids.gid].userId] = false
        // aria2.call("remove", gids.gid)
        try {
            var res = await aria2.call("tellStatus", gids.gid, ['bittorrent', 'totalLength'])
            if (res.following) {
                console.log(dlDetails[gids.gid])
                // await bot.deleteMessage(opts.chat_id, opts.message_id)
            }

        } catch (e) {
            console.error(e.message)
            return
        }
        let msg = getmsgcontext(gids.gid)
        // Remove from aria cli


        let is_zip = dlDetails[gids.gid].zip
        await ariaUpload(res, msg, bot, is_zip)

        try {
            await aria2.call("remove", gids.gid)
        } catch (e) {
            console.error(e.message)
        }

    })
}


module.exports = {ariaListners}
 