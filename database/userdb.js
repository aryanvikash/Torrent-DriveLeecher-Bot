"use strict";

const { MongoClient } = require('mongodb');
const { mongoUrl } = require("../config")


class MongoDB{

    constructor(user_id) {
        this.client  = new MongoClient(mongoUrl, { useUnifiedTopology: true });
        this.con = null
        this.user_id = user_id.toString()
        this.db_instance = null
        this.col = null

         return new Promise(async ( resolve, reject)=>{
                try {
                    this.con = await this.client.connect();
                    this.db_instance = await this.con.db("gtusers");
                    this.col = await this.db_instance.collection("userinfo");
                    resolve(this)
                }catch (e) {
                    reject(e)
                }
         })
    }


     async setTeamdrive(tdid) {

        try {
            let result = await this.col.findOne({_id: this.user_id})
            let isInseted = false

            if (result) {

                let myquery = {_id: this.user_id.toString}
                let updateData = {$set: {TD: tdid.toString()}}


                await this.col.updateOne(myquery, updateData)
                console.log("database Updated")
                isInseted = true
            } else {

                await this.col.insertOne({
                    _id: this.user_id,
                    teamdriveid: tdid.toString()
                })
                console.log("Teamdrive Id Inserted")
                isInseted = true

            }

            return isInseted
        } catch (e) {
            console.log(e);
            return false
         } // Not closing it here bcz i need it in get td id
         //finally {
        //     await this.con.close()
        // }
    }



    async  getTeamdrive() {

        try {
            const result = await this.col.findOne({_id: this.user_id});
            let teamdriveid = null

            if (result) {

                teamdriveid = result.teamdriveid
            }
            return teamdriveid
        }
        catch (e) {
            console.log(e.message);

        }finally {
            await this.con.close()
        }
    } // constructor



    async  removeTeamdrive() {

        try {

            const result = await this.col.findOne({_id: this.user_id});
            let deleted = false

            if (result) {
                 await  this.col.deleteOne({ _id: this.user_id })
                deleted = true
            }
            else {
                console.log("There Is No Teamdrive Attached")
            }


            return deleted
        }
        catch (e) {
            console.log(e.message);
            return false
        }finally {
            await this.con.close()
        }
    }


} // class


// (async ()=>{
//    try {
//        let mongo  = await new MongoDB(985378987)
//        let td  = await mongo.getTeamdrive()
//        console.log(td)
//    }catch (e) {
//        console.error(e.message)
//    }
// })();

module.exports = { MongoDB}
