import multer from "multer";
const storage = multer.memoryStorage();
const maxFileSize = 10485760; // 10 MB
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new Error("Invalide file type. Only image file are allowed!"));
    }
};
export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: maxFileSize }
});
