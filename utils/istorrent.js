const axios = require('axios');


async function isTorrent(url) {
    try {
        var response = await axios.get(url)
        if (response.headers["content-type"] === "application/x-bittorrent") {
            return true
        }
        else {
            return false
        }
    }
    catch (e) {

    }

}

module.exports = isTorrent
