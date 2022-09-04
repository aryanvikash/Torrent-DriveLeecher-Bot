const {MongoClient} = require('mongodb');
const {mongoUrl} = require("../config")
const fs = require("fs")
const path = require("path")


async function TokenInsert(id) {
    console.log("Inserting Token In database")
    const client = new MongoClient(mongoUrl, {useUnifiedTopology: true});
    const TokenPath = path.join(__dirname, `../creds/${id.toString()}.json`)
    fs.readFile(TokenPath, async (err, token) => {
        if (!err) {
            try {
                var con = await client.connect();
                let dbinstance = await con.db("gtusers")
                let col = await dbinstance.collection("tokens")
                const result = await col.findOne({_id: id.toString()})
                if (!result) {
                    await col.insertOne({
                        _id: id.toString(),
                        token: token
                    })
                    console.log(`${id} inserted To Database`)
                } else {
                    console.log(`${id} Already In Database`)
                }

                return true
            } catch (e) {
                console.error(e.message);
                return false
            }finally {
                await con.close()
            }
        } else {
            console.log(err.message)
            return false
        }

    })


}

// TokenInsert(920262337)


async function createTokenFile(id) {
    const client = new MongoClient(mongoUrl, {useUnifiedTopology: true});
    const TokenPath = path.join(__dirname, `../creds/${id.toString()}.json`)
    try {

        var con = await client.connect();

        let dbinstance = await con.db("gtusers")

        let col = await dbinstance.collection("tokens")

        const result = await col.findOne({_id: id.toString()})

        const token = result.token

        con.close()


        if (token) {
            fs.writeFile(TokenPath, token, (err) => {
                if (!err) {
                    console.log("Database auth found Creating Token With Database")
                    return true
                } else {
                    return false
                }
            })

        } else {
            console.log("no Result Found");
            return false;
        }

        return true
    } catch (e) {
        if (e.message !== "Cannot read property 'token' of null")
            console.error(e.message);
        else {
            console.log("Not found in Database Generating auth url")
        }
        return false

    }

}

// createTokenFile("920262337")


async function deleteToken(id) {
    const client = new MongoClient(mongoUrl, {useUnifiedTopology: true});
    try {
        var con = await client.connect();

        let dbinstance = await con.db("gtusers")

        let col = await dbinstance.collection("tokens")

        const result = await col.findOne({_id: id.toString()})
        if (result) {

            await col.deleteOne({_id: id.toString()})
            console.log(`Removed ${id} from Database`)
        } else {
            console.log(`there is no Token of ${id} `)
        }
    } catch (e) {
        console.log(e);
    }finally {
        await con.close()
    }

}

// deleteToken("920262337")

module.exports = {deleteToken, createTokenFile, TokenInsert}
