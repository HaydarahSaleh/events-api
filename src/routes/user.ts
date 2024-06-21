import * as express from "express";
import { Request, Response } from "express";
import * as FeedbackController from "../controllers/feedback";
import { getNotifiactionByGroups } from "../controllers/notification";
import { getPermissions, setPermission } from "../controllers/permission";
import * as UserController from "../controllers/user";
import {
    RakMemberCreateDTO,
    UserConfirmEmailDTO,
    UserCreateDTO,
    UserForgetPasswordDTO,
    UserLoginDTO,
    UserResetPasswordDTO,
    UserUpdateDTO,
} from "../DTO/user.dto";
import { Language } from "../entity/enum/Language";
import ControllerException from "../exceptions/ControllerException";
import {
    filteredUserGroupArrayForUser,
    userServiceRole,
} from "../helpers/statusForUser";
import RequestWithUser from "../interface/requestWithUser.interface";
import { userActionLogger } from "../logger/userLogger";
import { userLogger } from "../logger/winston";
import {
    asyncHandler,
    authenticationMiddleware,
    getUserRoleMiddleware,
    isAdminMiddleware,
    validationMiddleware,
} from "../middleware";
import { ServiceRequest } from "../entity/ServiceRequest";
import { User } from "../entity/User";

const router = express.Router();

router.get(
    "/",
    [isAdminMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            query: { limit = "1000", offset = "0" },
            headers: { language = Language.ALL },
        } = request;
        // userLogger.info(`Admin with email: ${user.email}, ask for a set of users: (limit=${limit},offset=${offset})`)
        const users = await UserController.getAllUsers(
            language,
            +limit,
            +offset
        );

        response.send({
            success: true,
            users,
            limit: +limit || 10,
            offset: +offset,
            returnedTypeName: "users",
        });
    })
);

router.get(
    "/:id([0-9]+)",
    [isAdminMiddleware],
    asyncHandler(async (request: Request, response: Response) => {
        const { id } = request.params;
        const language = request.headers.language;

        const user = await UserController.getUserById(+id, language);
        if (!user) throw new ControllerException("USER_NOT_FOUND");

        response.send({ success: true, ...user, returnedTypeName: "users" });
    })
);

router.get(
    "/:id([0-9]+)/acls",
    [isAdminMiddleware],
    asyncHandler(async (request: Request, response: Response) => {
        const {
            params: { id },
        } = request;

        const acls = await UserController.getUserACLs(+id);

        response.send({ success: true, acls, returnedTypeName: "acls" });
    })
);
router.post(
    "/login",
    //[validationMiddleware(UserLoginDTO)],
    asyncHandler(async (request: Request, response: Response) => {
        const { email, otp } = request.body;
        const language = request.headers.language;
        const { token, user } = await UserController.login(
            email,
            otp,
            language,
            "employee"
        );

        const userPermissions = await getPermissions(user);
        const groupIds = await filteredUserGroupArrayForUser(user);

        const notifiactions = await getNotifiactionByGroups({
            groupIds,
            language,
            seen: false,
            limit: 10,
            offset: 10,
        });
        response.send({
            success: true,

            token,
            user,
            userPermissions,
            notifiactions,
            returnedTypeName: "users",
        });
    })
);

router.post(
    "/verifiy",
    // [validationMiddleware(VerfiyDTO)],
    asyncHandler(async (request: Request, response: Response) => {
        const { email, password } = request.body;
        const language = request.headers.language;
        const { user, token, needOtp, reason, refreshToken } =
            await UserController.verify(email, password, language, "employee");
        let userPermissions = null;

        if (user) {
            userPermissions = await getPermissions(user);
        }
        response.send({
            success: true,
            user,
            token,
            refreshToken,
            needOtp,
            reason,
            userPermissions,
            returnedTypeName: "users",
        });
    })
);
router.post(
    "/",
    [validationMiddleware(UserCreateDTO), isAdminMiddleware],

    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            body: patch,
            user: creater,
        } = request;
        const user = await UserController.addUser(patch);

        userActionLogger.info(
            `${creater.userName ? creater.userName : "user"} with id: ${
                creater.id
            } added new user with id ${user.id} `,
            {
                entityId: creater.id,
                source: "Employee",
                operation: "add",
                title: { ar: user["name"], en: user["name"], fr: user["name"] },
                userId: user.id,
                arMessage: `${
                    user.userName ? user.userName : "مستخدم"
                } صاحب المعرف: ${user.id} أضاف survey بالمعرف  ${user.id}`,
            }
        );

        await UserController.updateUser(
            user.id,
            {
                emailConfirmed: true,
                emailConfirmationCode: null,
                emailConfirmationCodeDate: null,
            },
            null
        );

        response.send({ success: true, ...user, returnedTypeName: "users" });
    })
);

router.get(
    "/me",
    [authenticationMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const language = request.headers.language;
        const user = await UserController.getUserById(
            request.user.id,
            language
        );
        response.send({ success: true, ...user, returnedTypeName: "users" });
    })
);
router.post(
    "/member/signup",
    [validationMiddleware(RakMemberCreateDTO)],
    asyncHandler(async (request: Request, response: Response) => {
        const {
            headers: { language = Language.ALL },
            body: patch,
        } = request;
        patch.userGroups.push(
            await UserController.checkExistingGroup("RAKMEMBER")
        );

        const user = await UserController.addUser(patch);
        response.send({ success: true, ...user, returnedTypeName: "users" });
    })
);

router.post(
    "/email/confirm",
    [validationMiddleware(UserConfirmEmailDTO)],
    asyncHandler(async (request: Request, response: Response) => {
        const { email, emailConfirmationCode } = request.body;
        const result = await UserController.confirmEmail(
            email,
            emailConfirmationCode,
            Language
        );
        response.send({ success: true, ...result, returnedTypeName: "users" });
    })
);

router.get(
    "/:id([0-9]+)/activation/toggle",
    [authenticationMiddleware, isAdminMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { id } = request.params;
        const { user } = request;
        const result = await UserController.toggleActivate(+id);

        response.send({ success: true, ...result });
    })
);
router.get(
    "/:id([0-9]+)/groups",
    [authenticationMiddleware, isAdminMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { id } = request.params;

        const result = await UserController.getGroupsByUserId(+id);

        response.send({ success: true, ...result });
    })
);

router.post(
    "/code/resend/:type",
    [validationMiddleware(UserLoginDTO)],
    asyncHandler(async (request: Request, response: Response) => {
        const { email, password } = request.body;
        const { type } = request.params;

        if (!["supplier", "employee"].includes(type))
            throw new ControllerException("NOT_ALLOWED");

        const user = await UserController.sendNewconfirmationCode(
            email,
            password,
            type
        );

        response.send({
            success: true,
            user,
            returnedTypeName: "users",
        });
    })
);

router.post(
    "/password/update",
    [authenticationMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { id } = request.user;
        const { oldPassword, newPassword } = request.body;

        const result = await UserController.updatePassword(
            id,
            oldPassword,
            newPassword
        );

        response.send({ success: true, ...result });
    })
);

router.post(
    "/password/forget",
    [validationMiddleware(UserForgetPasswordDTO)],
    asyncHandler(async (request: Request, response: Response) => {
        const { email } = request.body;
        const result = await UserController.forgetPassword(email);

        response.send({ success: true, ...result });
    })
);

router.post(
    "/password/reset",
    [validationMiddleware(UserResetPasswordDTO)],
    asyncHandler(async (request: Request, response: Response) => {
        const { email, passwordResetingCode, password } = request.body;

        const result = await UserController.resetPassword(
            email,
            passwordResetingCode,
            password
        );

        response.send({ success: true, ...result });
    })
);

router.post(
    "/:id([0-9]+)/update",
    [getUserRoleMiddleware, validationMiddleware(UserUpdateDTO)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            body: patch,
            params: { id },
            user: userFromLogin,
        } = request;

        const user = await UserController.updateUser(+id, patch, userFromLogin);

        response.send({ success: true, ...user, returnedTypeName: "users" });
    })
);

router.post(
    "/:id([0-9]+)/delete",
    // [isAdminMiddleware],
    asyncHandler(async (request: Request, response: Response) => {
        const {
            params: { id },
            query: { limit = "1000", offset = "0" },
            headers: { language = Language.ALL },
        } = request;

        const user = await User.findOne({ where: { id: Number(id) } });
        await user.deleteAllContent();
        response.send({
            success: true,
        });
    })
);

export const userRouter = router;
