const s3 = require("../utils/s3.jsx");
const rekognition = require("../utils/rekognition.jsx");
const multer = require("multer");
const pluralize = require("pluralize");
const sharp = require("sharp");

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

const convertToBaselineJpeg = async (bucket, key, buffer) => {
  const tempKey = key.replace(/(\.\w+)$/, ".rek.jpg");
  const jpegBuffer = await sharp(buffer)
    .jpeg({ progressive: false })
    .toBuffer();

  await s3.putObject({
    Bucket: bucket,
    Key: tempKey,
    Body: jpegBuffer,
    ContentType: "image/jpeg",
  }).promise();

  return tempKey;
};

const getLabelsFromS3 = async (key, bucket, originalBuffer) => {
  try {
    const tempKey = await convertToBaselineJpeg(bucket, key, originalBuffer);

    const params = {
      Image: { S3Object: { Bucket: bucket, Name: tempKey } },
      MaxLabels: 10,
    };
    const data = await rekognition.detectLabels(params).promise();
    const labels = data.Labels.map((label) => label.Name.toLowerCase());
    const normalizedLabels = labels.map((label) => pluralize.singular(label));
    logInfo(
      "Rekognition",
      `Detected labels for ${key}: [${normalizedLabels.join(", ")}]`
    );

    await s3.deleteObject({ Bucket: bucket, Key: tempKey }).promise();

    return normalizedLabels;
  } catch (error) {
    logError("Rekognition", error, key);
    return [];
  }
};

const applyTagsToS3 = async (key, bucket, tags) => {
  if (!tags || tags.length === 0) {
    logInfo("S3 Tagging", `No tags to apply for ${key}. Skipping.`);
    return;
  }
  try {
    const tagSet = tags.map((tag) => ({ Key: tag, Value: tag }));
    await s3
      .putObjectTagging({
        Bucket: bucket,
        Key: key,
        Tagging: { TagSet: tagSet },
      })
      .promise();
    logInfo("S3 Tagging", `Successfully applied tags to ${key}`);
  } catch (error) {
    logError("S3 Tagging", error, key);
  }
};

const upload = multer({ storage: multer.memoryStorage() }).array("images");

exports.uploadImage = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      logError("Multer", err);
      return res.status(400).json({ message: err.message });
    }

    if (!req.files || req.files.length === 0) {
      logError("Upload", new Error("No file was present in the request."));
      return res.status(400).json({ message: "No files uploaded" });
    }

    const userId = req.user.id;
    const bucket = process.env.S3_BUCKET;

    logInfo("Upload", `Starting bulk upload process for user: ${userId}`);

    try {
      const uploadResults = [];

      for (const file of req.files) {
        const originalName = file.originalname;
        const key = `${userId}/${originalName}`;

        try {
          try {
            await s3.headObject({ Bucket: bucket, Key: key }).promise();
            logInfo("Upload", `Skipped '${key}', already exists.`);
            uploadResults.push({ name: originalName, message: "Already exists" });
            continue;
          } catch (headErr) {
            if (headErr.code !== "NotFound") throw headErr;
          }

          const uploadParams = {
            Bucket: bucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
          };
          const data = await s3.upload(uploadParams).promise();
          logInfo("Upload", `Uploaded '${key}' to S3.`);

          const tags = await getLabelsFromS3(key, bucket, file.buffer);
          await applyTagsToS3(key, bucket, tags);

          uploadResults.push({
            name: originalName,
            url: data.Location,
            tags: tags,
          });

        } catch (error) {
          logError("Upload", error, key);
          uploadResults.push({
            name: originalName,
            error: error.message || "Unknown error",
          });
        }
      }

      res.status(200).json(uploadResults);

    } catch (error) {
      logError("Upload", error);
      res.status(500).json({ message: `Upload process failed: ${error.message}` });
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