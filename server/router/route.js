import { Router } from "express";
const router = Router();

// Import controllers
import * as controller from '../controllers/appController.js';
import { registerMail } from "../controllers/mailer.js";
import Auth, {localVariables } from "../middleware/auth.js";
// POST Methods
router.route("/register").post(controller.register); // Register user
router.route('/registerMail').post(registerMail); // Uncomment and define the controller if needed
router.route('/authenticate').post((req, res) => res.end()); // Authenticate user
router.route('/login').post(controller.verifyUser,controller.login);

// GET Methods
router.route('/user/:username').get(controller.getUser);
router.route('/generateOTP').get(localVariables,controller.generateOTP);
router.route('/verifyOTP').get(controller.verifyOTP);
router.route('/createResetSession').get(controller.createResetSession);

// PUT Methods
router.route('/updateuser').put( Auth, controller.updateUser);
router.route('/resetuser').put(controller.resetPassword);

export default router;
