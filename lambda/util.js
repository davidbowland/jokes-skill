const AWS = require('aws-sdk')

const s3SigV4Client = new AWS.S3({
  signatureVersion: 'v4',
})

module.exports.getS3PreSignedUrl = function getS3PreSignedUrl(s3ObjectKey) {
  const bucketName = process.env.S3_PERSISTENCE_BUCKET
  const s3PreSignedUrl = s3SigV4Client.getSignedUrl('getObject', {
    Bucket: bucketName,
    Expires: 60 * 1, // the Expires is capped for 1 minute
    Key: s3ObjectKey,
  })
  console.log(`Util.s3PreSignedUrl: ${s3ObjectKey} URL ${s3PreSignedUrl}`)
  return s3PreSignedUrl
}
