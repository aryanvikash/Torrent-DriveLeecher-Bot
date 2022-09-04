const {sendmsg, edit} = require("../telegram/msgutils");
const {
    humantime,
    humanbytes,
    DownloadList

} = require("../utils/utils");

const path = require("path");

const {zipIt} = require("../utils/zipper");
const {gdriveClient} = require("../drive/classupload");

async function ariaUpload(res, msg, bot, is_zip = false) {
    // DownloadList.pop(msg.from.id)
    const user_id = msg.from.id.toString()
    const name = res.bittorrent.info.name;
    const Totalsize = humanbytes(res.totalLength);
    const file_path = path.join(__dirname, `../downloads/${user_id}/${name}`);

    console.log("uploading Started...", file_path)
    let sentm = await sendmsg(
        status_str(name,Totalsize,"Download complete"),
        msg,
        bot
    );
    try {
        var drive = await new gdriveClient(user_id)
    } catch (e) {
        console.error(e.message)
        return
    }
    // If isDirectory

    if (is_zip) {
        await edit(status_str(name,Totalsize,"Zipping"), sentm, bot);
        try {
            let zipFilePath = await zipIt(file_path)
            await edit(status_str(name,Totalsize,"Uploading"), sentm, bot);
            let downloadUrl = await drive.upload_handler(zipFilePath)
            let successMsg = `Name : <code>${name}</code>\nSize : ${Totalsize}\nDownload : <a href="${downloadUrl}">${name}🗄  </a>`
            // await edit(successMsg, sentm, bot);
            await send_download_msg(name, Totalsize, downloadUrl, bot, sentm)
        } catch (error) {
            console.log("zip error : ", error.message)
            await edit(`zip Upload Error :<code> ${error.message} </code> \n#error`, sentm, bot);
        }
    }
    else {
        // withoutzip
        try {
            edit(status_str(name,Totalsize,"uploading"), sentm, bot);

            const downloadUrl = await drive.upload_handler(file_path)
            const successMsg = `Name : <code>${name}</code>\nSize : ${Totalsize}\nDownload : <a href="${downloadUrl}">${name}🗂 </a>`
            // await edit(successMsg, sentm, bot);
            await send_download_msg(name, Totalsize, downloadUrl, bot, sentm)
        }
        catch (error) {
            console.log("upload error : ", error.message)
            await edit(`Upload Error :<code> ${error.message} </code> \n#error`, sentm, bot);
        }
    }
}



function status_str(name,size,status){
    let smsg = `Name: <code>${name}</code>\n`;
    smsg += `Total Size: <code>${size}</code> \n`;
    smsg += `Status: <code> ${status} </code>\n` ;
    return smsg
}

async function send_download_msg(name,size,downloadUrl,bot,sentm){
    const opts = {
        chat_id: sentm.chat.id,
        message_id: sentm.message_id,
        reply_markup: {
            inline_keyboard: [
                [{text: "Download", url: downloadUrl}]
            ]
        },
        parse_mode: "HTML"
    }
    let smsg = `Name: ${name} \nsize: ${size}\n`


    await bot.editMessageText(smsg, opts);
}

module.exports = ariaUpload
