import { Router } from "express";
import PaymentController from "../../controllers/payment/index";
const router = Router();
router.post("/get-session", PaymentController.getSession);
router.get("/checkout", PaymentController.checkout);
export default router;
