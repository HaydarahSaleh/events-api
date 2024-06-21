import * as express from "express";
import { Request, Response } from "express";
import * as BookingController from "../controllers/booking";
import { asyncHandler, authenticationMiddleware } from "../middleware";

const router = express.Router();
router.get(
    "/",
    asyncHandler(async (request: Request, response: Response) => {
        const {
            query: { id, startDate, endDate },
        } = request;
        const reservations = await BookingController.getReservations(
            id,
            startDate,
            endDate,
            false
        );

        response.send({
            success: true,
            reservations,
            returnedTypeName: "reservations",
        });
    })
);
router.get(
    "/admin",
    authenticationMiddleware,
    asyncHandler(async (request: Request, response: Response) => {
        const {
            query: { id, startDate, endDate },
        } = request;
        const reservations = await BookingController.getReservations(
            id,
            startDate,
            endDate,
            true
        );

        response.send({
            success: true,
            reservations,
            returnedTypeName: "reservations",
        });
    })
);

router.get(
    "/counted",
    asyncHandler(async (request: Request, response: Response) => {
        const {
            params: { id },
            query: { startDate, endDate },
        } = request;
        const reservations = await BookingController.getCountedReservations(
            startDate,
            endDate,
            id
        );

        response.send({
            success: true,
            reservations,
            returnedTypeName: "reservations",
        });
    })
);

export const ReservationRouter = router;
