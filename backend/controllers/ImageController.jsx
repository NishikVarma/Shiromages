const s3 = require("../utils/s3.jsx");
const rekognition = require("../utils/rekognition.jsx"); // Import rekognition
const multer = require("multer");
const pluralize = require("pluralize");

const logInfo = (context, message) => {
  console.log(`✅ [${context}] ${message}`);
};

const logError = (context, error, key = "") => {
  const keyInfo = key ? `(Key: ${key})` : "";
  console.error(
    `❌ [${context}] ${keyInfo}: ${error.code || "Error"} - ${
      error.message || "An unknown error occurred"
    }`
  );
};

const getLabelsFromS3 = async (key, bucket) => {
  // try {
  //     const params = {
  //         Image: { S3Object: { Bucket: bucket, Name: key } },
  //         MaxLabels: 10,
  //     };
  //     const data = await rekognition.detectLabels(params).promise();
  //     const labels = data.Labels.map((label) => label.Name.toLowerCase());
  //     const normalizedLabels = labels.map((label) => pluralize.singular(label));
  //     logInfo("Rekognition", `Detected labels for ${key}: [${normalizedLabels.join(', ')}]`);
  //     return normalizedLabels;
  // } catch (error) {
  //     logError("Rekognition", error, key);
  //     return [];
  // }
  return []; // Keep this line to disable Rekognition for now
};

const applyTagsToS3 = async (key, bucket, tags) => {
  // if (!tags || tags.length === 0) {
  //     logInfo("S3 Tagging", `No tags to apply for ${key}. Skipping.`);
  //     return;
  // }
  // try {
  //     const tagSet = tags.map((tag) => ({ Key: tag, Value: tag }));
  //     await s3.putObjectTagging({ Bucket: bucket, Key: key, Tagging: { TagSet: tagSet } }).promise();
  //     logInfo("S3 Tagging", `Successfully applied tags to ${key}`);
  // } catch (error) {
  //     logError("S3 Tagging", error, key);
  // }
  return; // Keep this line to disable Rekognition for now
};

const upload = multer({ storage: multer.memoryStorage() }).single("image");

exports.uploadImage = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      logError("Multer", err);
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      logError("Upload", new Error("No file was present in the request."));
      return res.status(400).json({ message: "No file uploaded" });
    }

    const originalName = req.file.originalname;
    const userId = req.user.id;
    const key = `${userId}/${originalName}`;

    const bucket = process.env.S3_BUCKET;
    logInfo("Upload", `Starting upload process for key: '${key}'`);

    try {
      try {
        await s3.headObject({ Bucket: bucket, Key: key }).promise();
        logInfo("Upload", `Upload aborted for '${key}', file already exists.`);
        return res.status(400).json({ message: "Image already uploaded" });
      } catch (headErr) {
        if (headErr.code !== "NotFound") throw headErr;
      }

      const uploadParams = {
        Bucket: bucket,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };
      const data = await s3.upload(uploadParams).promise();
      logInfo("Upload", `Successfully uploaded '${key}' to S3.`);

      // const tags = await getLabelsFromS3(key, bucket);
      // await applyTagsToS3(key, bucket, tags);

      res.status(200).json({ url: data.Location, name: originalName });
    } catch (error) {
      logError("Upload", error, key);
      res
        .status(500)
        .json({
          message: `S3 or operation failure. Code: ${error.code || "Unknown"}`,
        });
    }
  });
};

exports.searchImages = async (req, res) => {
    const searchTerm = req.query.q?.toLowerCase() || "";
    const searchKeywords = searchTerm.split(' ').filter(k => k);

    const userId = req.user.id;
    const bucket = process.env.S3_BUCKET;
    logInfo("Search", `Initiated for user ${userId} with keywords: [${searchKeywords.join(', ')}]`);

    try {
        const listData = await s3.listObjectsV2({
            Bucket: bucket,
            Prefix: `${userId}/`
        }).promise();

        if (!listData.Contents) return res.json([]);

        const imagePromises = listData.Contents.map(async (obj) => {
            if (obj.Size === 0 || obj.Key.endsWith('/')) return null;

            const fullKey = obj.Key;
            const originalName = fullKey.substring(fullKey.indexOf('/') + 1);
            let tags = [];

            try {
                const taggingData = await s3.getObjectTagging({ Bucket: bucket, Key: fullKey }).promise();
                tags = taggingData.TagSet.map(t => t.Key.toLowerCase());
            } catch (tagErr) {
                if (tagErr.code !== 'NoSuchTagSet') logError("Search", tagErr, fullKey);
            }

            const filenameMatch = !searchTerm || originalName.toLowerCase().includes(searchTerm);            
            const tagsMatch = searchKeywords.length > 0 && searchKeywords.some(keyword => tags.includes(pluralize.singular(keyword)));            
            
            if (filenameMatch || tagsMatch) {
                const url = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${fullKey}`;
                return { name: originalName, url: url, tags: tags.join(', ') };
            }
            return null;
        });

        const filteredImages = (await Promise.all(imagePromises)).filter(img => img !== null);
        logInfo("Search", `Found ${filteredImages.length} image(s) for user ${userId}`);
        res.json(filteredImages);

    } catch (error) {
        logError("Search", error);
        res.status(500).json({ message: `S3 Search failed: ${error.message}` });
    }
};

exports.deleteImage = async (req, res) => {
  const originalName = req.params.key;
  const userId = req.user.id;
  const key = `${userId}/${originalName}`;

  logInfo("Delete", `Initiated for key: '${key}' by user ${userId}`);

  if (!originalName) {
    return res.status(400).json({ message: "Missing image key for deletion" });
  }

  try {
    await s3
      .deleteObject({ Bucket: process.env.S3_BUCKET, Key: key })
      .promise();
    logInfo("Delete", `Successfully deleted '${key}'`);
    res.status(200).json({ message: `Successfully deleted ${originalName}` });
  } catch (error) {
    logError("Delete", error, key);
    res.status(500).json({ message: `S3 deletion failed: ${error.message}` });
  }
};
