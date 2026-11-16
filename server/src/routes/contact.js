import { Router } from "express";
import { submitContact } from "../controllers/contactController.js";
import { submitApplication } from "../controllers/careerApplicationsController.js";
import { uploadResume, verifyResumeSignature, resumeUploadErrors } from "../middleware/uploadResume.js";
import { uploadContactAttachment, verifyContactAttachmentSignature } from "../middleware/uploadContactAttachment.js";

const router = Router();

// JSON body, or multipart/form-data with one optional "attachment" file
router.post("/contact", uploadContactAttachment, verifyContactAttachmentSignature, submitContact);
router.post("/career-applications", uploadResume, resumeUploadErrors, verifyResumeSignature, submitApplication);

export default router;
