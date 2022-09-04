const path = require("path")
const fs = require("fs-extra")
const archiver = require('archiver');
const {cleanup} = require("./utils");


//TODO check filesize before zipping it causing server crash
const zipIt = dir_path => {

  const archive = archiver('zip',{zlib:{level:9}})
  zip_path = path.join(path.dirname(dir_path),`${path.basename(dir_path)}.zip`)
  return new  Promise((resolve, reject)=>{
    const stream = fs.createWriteStream(zip_path);


    archive.on('error', function(err) {
      console.error(err.message)

    });

    stream.on("close",()=>{
      console.log("Zipping complete")
      cleanup(dir_path)
      resolve(zip_path)
    })

    stream.on("error",(error) => {
      console.error(error.message)
      reject(error)
    })

    archive.directory(dir_path,path.basename(dir_path))
    archive.pipe(stream)
    archive.finalize()

  })
};




module.exports = { zipIt };
