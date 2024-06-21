import * as express from "express";
import { Request, Response } from "express";
import * as ACLController from "../controllers/acl";
import { ACLCreateDTO, ACLUpdateDTO } from "../DTO/acl.dto";
// import { Info } from "../entity/Info";
import RequestWithUser from "../interface/requestWithUser.interface";
import { userActionLogger } from "../logger/userLogger";
import {
    //havePermission,
    asyncHandler,
    getUserRoleMiddleware,
    validationMiddleware,
} from "../middleware";

const router = express.Router();

// router.post(
//     "/",
//     [],
//     asyncHandler(async (request: Request, response: Response) => {
//         const { key = "", data = "" } = request.body;
//         const info = new Info();
//         info.key = key;
//         info.data = data;
//         await info.save();
//         response.send({
//             success: true,
//             returnedTypeName: "info",
//         });
//     })
// );
export const InfoRouter = router;
