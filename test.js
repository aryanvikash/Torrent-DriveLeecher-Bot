// const {gdriveClient}  = require("./drive/classupload");
// const  fs = require("fs")
// const  path = require("path")
// const archiver = require('archiver');
// const archive = archiver('zip',{zlib:{level:9}})
//
// dir_path = "/home/aryanvikash/Projects/nodejs/webtorretbot/test/"
//
// function zipper(dir_path){
//
//     zip_path = path.join(path.dirname(dir_path),`${path.basename(dir_path)}.zip`)
//     return new  Promise((resolve, reject)=>{
//         const stream = fs.createWriteStream(zip_path);
//
//
//         archive.on('error', function(err) {
//             console.error(err.message)
//
//         });
//
//         stream.on("close",()=>{
//             console.log("Zipping complete")
//             resolve(zip_path)
//         })
//
//         stream.on("error",(error) => {
//             console.error(error.message)
//             reject(error)
//         })
//
//         archive.directory(dir_path,path.basename(dir_path))
//         archive.pipe(stream)
//         archive.finalize()
//
//     })
// }
//
// // console.log(zipper(dir_path))
//
//
// // (async ()=>{
// //
// //     let drive = await  new gdriveClient("985378987")
// //     console.log( await  drive.upload_handler(await zipper(dir_path)))
// // })();