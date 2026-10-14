import multer from "multer"

const storage = multer.memoryStorage();

const maxFileSize = 10485760; // 10 MB

export const upload = multer({
    storage,
    limits: { fileSize: maxFileSize }
})