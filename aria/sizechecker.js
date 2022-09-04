 const { humanbytes } = require("../utils/utils")

 // const maxSize = 20737418240;
 const maxSize = 10000000000

 async function crossedSizeLimit(gid, aria2) {

  const r = await aria2.call("tellStatus", gid);

  console.log(r.totalLength)

  if (r.totalLength > maxSize) {
   console.log("size exceed:", humanbytes(r.totalLength))
   return r.totalLength
  }
  else {
   console.log("Under Size", humanbytes(r.totalLength))
   return false
  }

 }



 module.exports = crossedSizeLimit
 
