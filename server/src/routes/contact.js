import { Router } from "express";
import { submitContact } from "../controllers/contactController.js";
import { submitApplication } from "../controllers/careerApplicationsController.js";
import { uploadResume, verifyResumeSignature, resumeUploadErrors } from "../middleware/uploadResume.js";

const router = Router();

router.post("/contact", submitContact);
router.post("/career-applications", uploadResume, resumeUploadErrors, verifyResumeSignature, submitApplication);

export default router;
