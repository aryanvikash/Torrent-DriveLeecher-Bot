
const {dlDetails } = require("../utils/utils")


async function sendmsg(text, msg, bot) {
  // const chatId = msg.chat.id;
  const res = await bot.sendMessage(msg.chat.id, text, { parse_mode: "HTML" });
  return res;
}

async function edit(text, sentm, bot, opts = null) {
  if (!opts) {
    await bot.editMessageText(text, {
      chat_id: sentm.chat.id,
      message_id: sentm.message_id,
      parse_mode: "HTML",
    });
  }
  else {
    await bot.editMessageText(text, opts);
  }
}




async function gidSendmsg(text, gid, bot) {
  console.log(dlDetails[gid])
  const chatId = dlDetails[gid].chatId
  return await bot.sendMessage(chatId, text, {parse_mode: "HTML"});
}


async function gidEditmsg(text, gid, bot) {

  try {
    await bot.editMessageText(text, {
      chat_id: dlDetails[gid].chatId,
      message_id: dlDetails[gid].msgId,
      parse_mode: "HTML",
    });
  }
  catch (e) {
    console.log(e.message)}
}

// exports 

module.exports = { sendmsg, edit, gidSendmsg, gidEditmsg };
