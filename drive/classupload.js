"use strict"
const fs = require("fs-extra");

const {google} = require("googleapis");
const path = require("path");
const {cleanup} = require("../utils/utils");
const client_file = path.join(__dirname, "../credentials.json");
const { MongoDB} = require("../database/userdb")

class gdriveClient {

    constructor(uid) {
        this.user_id = uid.toString()
        this.TOKEN_PATH = path.join(__dirname, "../creds", `${uid}.json`);
        this.oAuth2Client = null
        this.token = null
        this.parent_id = null
        this.bot_folder = "TorrentDriveBot"
        this.FOLDER_MIME_TYPE = "application/vnd.google-apps.folder"
        this.drive = null
        this.teamdriveId = null

        return new Promise(async (resolve, reject) => {
            try {
                let mongo  = await new MongoDB(this.user_id)
                this.teamdriveId =  await  mongo.getTeamdrive()

                await this.authorize()
                await this.set_botfolder()

            } catch (e) {
                reject(e)
                console.error(e.message)

            }
            resolve(this)

        })

    }


// set Auth and refresh
    authorize = () => {
        return new Promise(async (resolve, reject) => {

            try {
                let client_content = await fs.promises.readFile(client_file, 'utf-8')
                this.credentials = JSON.parse(client_content);
                const {
                    client_secret,
                    client_id,
                    redirect_uris,
                } = this.credentials.installed;

                this.oAuth2Client = new google.auth.OAuth2(
                    client_id,
                    client_secret,
                    redirect_uris[0]
                );
                this.token = await fs.promises.readFile(this.TOKEN_PATH, 'utf-8')
                this.oAuth2Client.setCredentials(JSON.parse(this.token));
                this.drive = google.drive({version: "v3", auth: this.oAuth2Client});

                console.log("client Auth successfully ")
                resolve(this)

            } catch (e) {
                reject(e)
            }
        });
    }


    set_botfolder = () => new Promise((resolve, reject) => {
        if(this.teamdriveId){
            this.parent_id = this.teamdriveId
            console.log("TeamdriveId is avalible Uploading To teamdrive",this.teamdriveId)
            resolve(this.teamdriveId)
            return
        }
        this.drive.files.list({
                q: "trashed = false",
                pageSize: 100,
                fields: "nextPageToken, files(id, name)",
            },
            async (err, res) => {
                if (err) {
                    reject(err)
                }

                for (let file of res.data.files) {
                    if (file.name === this.bot_folder) {
                        console.log(` ${file.name} found !!`);
                        this.parent_id = file.id
                        resolve(file.id)
                        return
                    }
                }
                const fol = await this.create_dir(this.bot_folder);
                console.log(`Folder Created ${fol.data.id}  for ${this.bot_folder}`);
                this.parent_id = fol.data.id
                resolve()
            }
        );

    })

    // Create Directory
    create_dir = (name, parentId) => new Promise((resolve, reject) => {
        const fileMetadata = {
            name,
            mimeType: this.FOLDER_MIME_TYPE,
            parents: parentId ? [parentId] : null
        }; // prettier-ignore

        this.drive.files.create({
                resource: fileMetadata,
                fields: "id",
                supportsAllDrives: true,
            },
            (err, file) => (err ? reject(err) : resolve(file)) //file.data.id and name
        );
    })


    upload_handler = file_path => new Promise(async (resolve, reject) => {




            try {
                if (fs.lstatSync(file_path).isDirectory()) {
                    let folderId = await this.upload_folder(file_path,this.parent_id)
                    console.log(folderId)
                    resolve(`https://drive.google.com/drive/folders/${folderId}`);
                } else {
                    let file = await this.upload_file(file_path, this.parent_id)
                    const file_id = file.data.id;
                    resolve(`https://drive.google.com/uc?export=download&id=${file_id}`);
                }
            } catch (e) {
                console.error(e.message)
                reject(e)

            } finally {
                console.log("cleaning from Disk")
                cleanup(file_path)
            }





    });


    upload_file = (file_path, parentId) => new Promise((resolve, reject) => {
        const name = path.basename(file_path);

        let media = {body: fs.createReadStream(file_path)};
        this.drive.files.create({
                resource: {
                    name,
                    parents: parentId ? [parentId] : null
                },
                media: media,
                fields: "id",
                supportsAllDrives: true,
            },
            (err, file) => (err ? reject(err) : resolve(file))
        ); // prettier-ignore
    });


    // Upload folder

    upload_folder = (dir_path, parentId) => new Promise(async (resolve, reject) => {
        const intr = dir_path.split("/");
        const name = intr[intr.length - 1];
        if (!fs.existsSync(dir_path)) {
            console.log(`Path ${dir_path} does not exists`);
            reject(`Path ${dir_path} does not exists`)
        }


        //  make a folder in gdrive
        try {
            const folder = await this.create_dir(name, parentId);
            const folderId = folder.data.id;


            const contents = fs.readdirSync(dir_path, { withFileTypes: true });

            for (let item of contents) {

                if (item.isDirectory()) {
                    await this.upload_folder(`${dir_path}/${item.name}`, folderId);
                }
                else if (item.isFile()) {

                    await this.upload_file(`${dir_path}/${item.name}`, folderId);
                }

            }

            resolve( folderId)
        }catch (e) {
            console.error("Create Folder error",e.message)
            reject(e)
        }




    });


}// class



module.exports = {gdriveClient}