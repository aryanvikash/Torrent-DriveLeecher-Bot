
const { sendmsg } = require("../telegram/msgutils")
const { exec } = require('child_process');

const diskinfo = async (uptime, m, b) => {
    let path = "/"
    try {



        exec(`df --output="size,used,avail" -h "${path}" | tail -n1`,
            (err, res) => {
                if (!err) {

                    const disk = res.trim().split(/\s+/);
                    let msg = `Total: <code>${disk[0]}B</code>\n`
                    msg += `Used:  <code> ${disk[1]}B </code>\n`
                    msg += `Available: <code>${disk[2]}</code>\n\n`
                    msg += `Bot UpTime : <code>${uptime}</code>\n`

                    sendmsg(msg, m, b)
                }

            }
        );


    }
    catch (e) {
        console.log(e);
        return e.message;
    }
};

module.exports = diskinfo;
