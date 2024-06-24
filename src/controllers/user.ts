import * as jwt from "jsonwebtoken";
import config from "../../config";
import { User } from "../entity/User";

//import { reset } from "../controllers/block";
import * as moment from "moment-timezone";
import { FindOptionsWhere, In, Like } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { sendEmail } from "../controllers/email";
import { Configuration } from "../entity/Configuration";
import { Language } from "../entity/enum/Language";
import { Message } from "../entity/MessageTemplate";
import { SMTPConfig } from "../entity/SmtpConfig";
import { UserGroup } from "../entity/UserGroup";
import ControllerException from "../exceptions/ControllerException";
import { logger } from "../logger/newLogger";
import { userActionLogger } from "../logger/userLogger";
import * as TreeController from "./tree";
import { getTime } from "../helpers/getTime";
import { log } from "console";

const UserRelations = ["name", "groups", "groups.acls"];

export const generateRereashToken = (jwtId: String): string => {
    const dataStoredInToken = { jwtId };
    return jwt.sign(dataStoredInToken, config.jwt.secret, {
        expiresIn: config.jwt.refreashToeknExpiresIn,
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
    });
};

const getUserAndToken = async (inputUser: User, language: Language) => {
    const user = await User.findOne({
        where: { id: inputUser.id },
        relations: ["groups"],
    });

    (user.otp = null), (user.otpTries = 0);

    const jwtId = uuidv4();
    const token = generateToken(user, jwtId);
    user.jwtId = jwtId;

    await user.save();
    const refreshToken = generateRereashToken(user.jwtId);

    userActionLogger.info(
        `${user.userName ? user.userName : "user"} with id: ${
            user.id
        } logged in`,
        {
            entityId: user.id,
            source: "Employee",
            operation: "login",
            title: {
                ar: user["userName"],
                en: user["userName"],
                fr: user["userName"],
            },
            userId: user.id,
            arMessage: `${
                user.userName ? user.userName : "مستخدم"
            } قام بتسجيل الدخول`,
        }
    );
    return {
        token,
        user: convertUserToOutput(user, language),
        refreshToken,
    };
};

const getPasswordExpiryDays = async () => {
    const passwordExpiryConfig = await Configuration.findOne({
        where: { key: "PASSWORD_EXPIRY_DAYS" },
    });
    return parseInt(passwordExpiryConfig?.value || "90"); // Default to 90 days if not configured
};

// Function to check if the password is expired
const isPasswordExpired = (lastPasswordChange: Date, expiryDays: number) => {
    const currentDate = new Date();
    const passwordExpiryDate = new Date(lastPasswordChange);
    passwordExpiryDate.setDate(passwordExpiryDate.getDate() + expiryDays);
    return currentDate > passwordExpiryDate;
};

export const generateToken = (user: User, jwtId): string => {
    const dataStoredInToken = { id: user.id, jwtId };
    return jwt.sign(dataStoredInToken, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
    });
};

export const verify = async (
    email: string,
    password: string,
    language,
    type: string
) => {
    let user = await User.findByEmailAndPassword(email, password, type);

    if (!user) throw new ControllerException("WRONG_CREDENTIALS");
    if (!user.isActive) throw new ControllerException("USER_NOT_ACTIVE");

    // Check for password expiration
    const passwordExpiryDays = await getPasswordExpiryDays();
    if (isPasswordExpired(user.lastPasswordChange, passwordExpiryDays)) {
        throw new ControllerException("PASSWORD_EXPIRED");
    }

    const enableGlobalOtp = await Configuration.findOne({
        where: { key: "ENABLE_GLOBAL_OTP" },
    });

    if (enableGlobalOtp?.value === "true" || user.enableOtp) {
        await reciveCode(user.email, language);
        return {
            user: null,
            token: null,
            needOtp: true,
            reason: user.enableOtp ? "IndividualOtp" : "GlobalOtp",
        };
    } else {
        // const optCode = { otp: 100000 + Math.floor(Math.random() * 900000) };

        const optCode = { otp: 123456 }; //static code for testing only
        user.otp = jwt.sign(optCode, config.jwt.secret, {
            expiresIn: config.jwt.otpCodeExpiresIn,
            issuer: config.jwt.issuer,
            audience: config.jwt.audience,
        });
        console.log({ otp: user.otp });

        await user.save();
        const {
            token,
            user: userToReturn,
            refreshToken,
        } = await getUserAndToken(user, language);
        return {
            token,
            user: userToReturn,
            needOtp: false,
            refreshToken: null,
            reason: null,
        };
    }
};

export const reciveCode = async (email: string, language) => {
    try {
        let user = await User.createQueryBuilder("user")
            .select(["user.id", "user.otp"])
            .where("user.email = :email")
            .setParameters({ email })
            .getOne();

        if (!user) throw new ControllerException("USER_NOT_FOUND");
        user = await User.findOne({
            where: { id: user.id },
            relations: UserRelations,
        });
        if (!user.isActive) throw new ControllerException("USER_NOT_ACTIVE");

        // const optCode = { otp: 100000 + Math.floor(Math.random() * 900000) };
        const optCode = { otp: 123456 }; //static code for testing only

        user.otp = jwt.sign(optCode, config.jwt.secret, {
            expiresIn: config.jwt.otpCodeExpiresIn,
            issuer: config.jwt.issuer,
            audience: config.jwt.audience,
        });
        await user.save();

        await sendOTPCode(user.id, optCode.otp);
    } catch (error) {
        console.log({ error });

        throw new ControllerException(error.message);
    }
};

export const sendOTPCode = async (id, otp) => {
    const user = await User.findOne({
        where: { id },
        select: { id: true, userName: true, email: true },
        relations: { name: true, groups: { acls: true } },
    });
    if (!user) throw new ControllerException("USER_NOT_FOUND");

    let configuration = await Configuration.findOne({
        where: { key: "SMTP_REGISTERATION" },
    });

    const smtp = await SMTPConfig.findOne({
        where: {
            id:
                configuration && configuration.value != "null"
                    ? Number(configuration.value)
                    : null,
        },
    });

    configuration = await Configuration.findOne({
        where: { key: "MESSAGE_OTP_CODE" },
    });

    /* const template = await Message.findOne({
        where: { id: Number(configuration?.value) },
    });
    // if (!template) throw new ControllerException("MESSAGE_NOT_FOUND");
   const message = inject({
        template: template.content,
        name: user.userName,
        otp,
    }); */

    try {
        const email = {
            host: smtp.host,
            port: smtp.port,
            secure: smtp.secure,
            encryption: smtp.encryption,

            password: smtp.password,
            username: smtp.username,
            from: '"' + smtp.name + '"' + "<" + smtp.email + ">",
            to: user.email,
            subject: "OTP code",
            text: `<h1>${otp}</h1>`,
        };

        await sendEmail(email);
    } catch (error) {
        logger.info(
            "error in sendEmailConfirmationEmail: smtp configuration, send email process"
        );
    }
};

export const parseToken = async (token): Promise<User> => {
    let dataStoredInToken = null;
    try {
        dataStoredInToken = jwt.verify(token, config.jwt.secret, {
            issuer: config.jwt.issuer,
            audience: config.jwt.audience,
        });
    } catch (err) {
        return null;
    }

    if (!dataStoredInToken) return null;
    if (typeof dataStoredInToken.id !== "number") return null;

    return (
        User.findOne({
            where: { id: dataStoredInToken.id },
            relations: UserRelations,
        }) || null
    );
};

export const generateConfirmationCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const convertUserToOutput = (user: User, language = Language.ALL) => {
    if (!user) return null;
    const {
        id,
        name,
        userName,
        email,
        groups,
        isActive,
        emailConfirmed,
        phoneNumber,
        notificationByEmail,
        notificationBySms,
        prefferedLanguage,
        prefferedMean,
    } = user;
    let result = {
        id,
        name: user.name
            ? language == Language.ALL
                ? user.name
                : user.name[language]
                ? user.name[language].split(",")
                : null
            : null,
        userName,
        email,
        groups,
        isActive,
        emailConfirmed,
        language,
        phoneNumber,
        notificationByEmail,
        notificationBySms,
        prefferedLanguage,
        prefferedMean,
    };

    return result;
};

export const getAllUsers = async (language, limit: number, offset: number) => {
    const users = await User.find({
        relations: UserRelations,
        order: { id: "ASC" },
        skip: offset,
        take: limit,
    });
    if (!users) return null;

    return users.map((user) => convertUserToOutput(user, language));
};

export const getUserById = async (id: number, language) => {
    const user = await User.findOne({
        where: { id },
        relations: UserRelations,
    });
    await getUserACLs(id); //just for console :test purpose
    return convertUserToOutput(user);
};

export const getUserByEmail = async (email: string, language) => {
    const user = await User.findOne({ where: { email } });
    return convertUserToOutput(user);
};

export const addUser = async (patch) => {
    const existingUser = await User.findOne({
        relations: UserRelations,
        where: { email: patch.email },
    });
    if (existingUser) throw new ControllerException("USER_EXISTS");

    let user = new User();

    user = await buildUser(user, patch);

    return convertUserToOutput(user);
};

const buildUser = async (user: User, patch, userFromLogin?) => {
    if (patch.prefferedLanguage)
        user.prefferedLanguage = patch.prefferedLanguage;
    if (patch.prefferedMean) user.prefferedMean = patch.prefferedMean;

    if ("notificationByEmail" in patch)
        user.notificationByEmail = patch.notificationByEmail;
    if ("notificationBySms" in patch)
        user.notificationBySms = patch.notificationBySms;
    if (patch.email) user.email = patch.email;
    if (patch.type) user.type = patch.type;
    if (patch.userName) user.userName = patch.userName;
    if (patch.name) user.userName = patch.name;
    if ("emailConfirmed" in patch) user.emailConfirmed = patch.emailConfirmed;
    if (patch.phoneNumber) user.phoneNumber = patch.phoneNumber;

    if (patch.password) {
        if (user.id) {
            if (userFromLogin.id == user.id && !patch.oldPassword)
                throw new ControllerException("ACCESS_DENIED");
            //update
            if (userFromLogin.id == user.id) {
                const userWithPAssword = await User.findOne({
                    where: { id: user.id },
                    select: ["password"],
                });

                const passwordsMatch = await userWithPAssword.validatePassword(
                    patch.oldPassword
                );
                if (!passwordsMatch)
                    throw new ControllerException("ACCESS_DENIED");
            }
        }

        user.password = patch.password;
    }
    if ("isActive" in patch) user.isActive = patch.isActive;

    patch.language
        ? (user.language = patch.language)
        : (user.language = Language.ARABIC);

    if (!user.emailConfirmationCode)
        user.emailConfirmationCode = generateConfirmationCode();

    if (!user.emailConfirmationCodeDate)
        user.emailConfirmationCodeDate = new Date();

    if (patch.userGroups && patch.userGroups.length) {
        const uniqueGroups = Array.from(new Set(patch.userGroups));
        user.groups = await Promise.all(
            uniqueGroups.map(async (userGroupId: number) => {
                const userGroup = await UserGroup.findOne({
                    where: { id: userGroupId },
                });

                if (userGroup) {
                    return userGroup;
                }
            })
        );
    }
    const publicGroup = await UserGroup.findOne({ where: { name: "public" } });
    const existinGroup = (publicGroup) => publicGroup.name === "public";
    if (!user.groups) user.groups = [];

    if (!user.groups.some(existinGroup)) user.groups.push(publicGroup);
    await user.save();

    return user;
};

export const updateUser = async (id: number, patch, userFromLogin) => {
    let user = await User.findOne({ where: { id }, relations: UserRelations });
    if (!user) throw new ControllerException("USER_NOT_FOUND");

    user = await buildUser(user, patch, userFromLogin);
    return convertUserToOutput(user);
};

export const confirmEmail = async (
    email: string,
    emailConfirmationCode: string,
    language
) => {
    const user = await User.findOne({
        select: [
            "id",
            "name",
            "userName",
            "phoneNumber",
            "emailConfirmationCode",
            "emailConfirmationCodeDate",
        ],
        where: { email },
    });
    if (!user) throw new ControllerException("USER_NOT_FOUND");

    if (!user.emailConfirmationCode) {
        throw new ControllerException("INVALID_ACTION");
    }

    if (user.emailConfirmationCode !== emailConfirmationCode) {
        throw new ControllerException("ACCESS_DENIED");
    }

    const emailConfirmationCodeDate = moment(user.emailConfirmationCodeDate);
    const timedelta = moment().diff(emailConfirmationCodeDate, "seconds");

    if (timedelta > config.emailConfirmationCodeLifetime) {
        throw new ControllerException("CODE_EXPIRED");
    }

    user.emailConfirmed = true;
    user.emailConfirmationCode = null;
    user.emailConfirmationCodeDate = null;

    await user.save();
    userActionLogger.info(
        `${user.userName ? user.userName : "user"} with id: ${
            user.id
        } confirmed his email `
    );
    return convertUserToOutput(user, language);
};

export const toggleActivate = async (id: number) => {
    const user = await User.findOne({ where: { id }, relations: ["groups"] });
    if (!user) throw new ControllerException("USER_NOT_FOUND");

    user.isActive = !user.isActive;
    user.groups.push(await UserGroup.findOne({ where: { name: "public" } }));
    await user.save();

    userActionLogger.info(
        `${user.userName ? user.userName : "user"} with id: ${
            user.id
        } toggle activation for user with id :${id}`,
        {
            entityId: user.id,
            source: "Employee",
            operation: "add",
            title: { ar: user["name"], en: user["name"], fr: user["name"] },
            userId: user.id,
            arMessage: `${
                user.userName ? user.userName : "مستخدم"
            } صاحب المعرف: ${user.id} عدل user بالمعرف  ${user.id}`,
        }
    );

    return { id: user.id, isActive: user.isActive };
};
export const getGroupsByUserId = async (id: number): Promise<simpleGroups> => {
    const user = await User.findOne({ where: { id }, relations: ["groups"] });
    if (!user) throw new ControllerException("USER_NOT_FOUND");

    return user.groups.length > 0
        ? {
              groups: user.groups.map((group) => {
                  return { id: group.id, name: group.name };
              }),
          }
        : { groups: [] };
};

export const login = async (email: string, otp: string, language, type) => {
    let user = await User.findByEmailAndOtp(email, otp);

    if (!user) throw new ControllerException("WRONG_CREDENTIALS");
    if (!user.isActive) throw new ControllerException("USER_NOT_ACTIVE");
    if (!user.emailConfirmed) throw new ControllerException("NOT_CONFIRMED");

    user = await User.findOne({
        where: { id: user.id },
        relations: ["groups"],
    });

    (user.otp = null), (user.otpTries = 0);

    const jwtId = uuidv4();
    const token = generateToken(user, jwtId);
    user.jwtId = jwtId;

    await user.save();

    userActionLogger.info(
        `${user.userName ? user.userName : "user"} with id: ${
            user.id
        } logged in`,
        {
            entityId: user.id,
            source: "Employee",
            operation: "login",
            title: {
                ar: user["userName"],
                en: user["userName"],
                fr: user["userName"],
            },
            userId: user.id,
            arMessage: `${
                user.userName ? user.userName : "مستخدم"
            } قام بتسجيل الدخول`,
        }
    );
    return {
        token,
        user: convertUserToOutput(user, language),
    };
};

export const updatePassword = async (
    id: number,
    oldPassword: string,
    newPassword: string
) => {
    const user = await User.findOne({
        select: ["id", "password"],
        where: { id },
    });
    if (!user) throw new ControllerException("USER_NOT_FOUND");

    const passwordsMatch = await user.validatePassword(oldPassword);
    if (!passwordsMatch) throw new ControllerException("ACCESS_DENIED");

    user.password = newPassword;
    user.groups.push(await UserGroup.findOne({ where: { name: "public" } }));
    await user.save();
    userActionLogger.info(
        `${user.userName ? user.userName : "user"} with id: ${
            user.id
        } updated his password `
    );
    return { id: user.id };
};

export const forgetPassword = async (email: string) => {
    const user = await User.findOne({
        select: ["id", "isActive", "emailConfirmed"],
        where: { email },
    });
    if (!user) throw new ControllerException("USER_NOT_FOUND");

    if (!user.isActive) {
        throw new ControllerException("USER_NOT_ACTIVE");
    }
    if (!user.emailConfirmed) {
        throw new ControllerException("NOT_CONFIRMED");
    }

    user.passwordResetingCode = generateConfirmationCode();
    user.passwordResetingCodeDate = new Date();
    await user.save();

    //in sendResetPasswordCode:
    //we search in configuration table for record with 'key'="SMTP_REGISTERATION"
    //then we get its 'value' which refer to smtp id in smtp table and get the smtpConfig
    //if not found get the first smtp in table

    await sendResetPasswordCode(user.id);

    return { email };
};

export const resetPassword = async (
    email: string,
    passwordResetingCode: string,
    newPassword: string
) => {
    let user = await User.findOne({
        select: ["id", "passwordResetingCode", "passwordResetingCodeDate"],
        where: { email },
    });
    if (!user) throw new ControllerException("USER_NOT_FOUND");

    if (!user.passwordResetingCode) {
        throw new ControllerException("INVALID_ACTION");
    }
    if (user.passwordResetingCode !== passwordResetingCode) {
        throw new ControllerException("ACCESS_DENIED");
    }

    const passwordResetingCodeDate = moment(user.passwordResetingCodeDate);
    const timedelta = moment().diff(passwordResetingCodeDate, "seconds");

    if (timedelta > config.passwordResetingCodeLifetime) {
        throw new ControllerException("CODE_EXPIRED");
    }

    user.passwordResetingCode = null;
    user.passwordResetingCodeDate = null;
    user.password = newPassword;
    await user.save();
    userActionLogger.info(
        `${user.userName ? user.userName : "user"} with id: ${
            user.id
        } reset his password `
    );
    return { id: user.id };
};

export const getUserACLs = async (userId) => {
    const user = await User.findOne({
        where: { id: userId },
        relations: UserRelations,
    });
    if (!user) throw new ControllerException("USER_NOT_FOUND");

    const result = await Promise.all(
        user.groups.map(async (group) => {
            //get group parents
            return [
                group.id,
                ...(await TreeController.getParents(group.id, "user_group")),
            ];
        })
    );

    let newResult = [];
    result.map((item) => newResult.push(...item));
    //@ts-ignore
    const uniqueGroups = Array.from(new Set(newResult));

    const groups = await UserGroup.find({
        where: { id: In(uniqueGroups) },
        relations: ["acls"],
    });

    const aclResult = groups.map((group) => group.acls.map((acl) => acl.name));
    let newAclResult = [];

    aclResult.map((item) => newAclResult.push(...item));
    //@ts-ignore
    const uniqueACLs = Array.from(new Set(newAclResult));

    return uniqueACLs;
};
export const getUserGroupsIds = async (userId) => {
    const user = await User.findOne({
        where: { id: userId },
        relations: UserRelations,
    });
    if (!user) throw new ControllerException("USER_NOT_FOUND");

    const result = await Promise.all(
        user.groups.map(async (group) => {
            return [
                group.id,
                ...(await TreeController.getParents(group.id, "user_group")),
            ];
        })
    );
    let newResult = [];
    result.map((item) => newResult.push(...item));

    return newResult;
};

export const getUserACLsIds = async (userId) => {
    const user = await User.findOne({
        where: { id: userId },
        relations: UserRelations,
    });
    if (!user) throw new ControllerException("USER_NOT_FOUND");

    const result = await Promise.all(
        user.groups.map(async (group) => {
            //get group parents
            return [
                group.id,
                ...(await TreeController.getParents(group.id, "user_group")),
            ];
        })
    );

    let newResult = [];
    result.map((item) => newResult.push(...item));
    //@ts-ignore
    const uniqueGroups = Array.from(new Set(newResult));

    const groups = await UserGroup.find({
        where: { id: In(uniqueGroups) },
        relations: ["acls"],
    });

    const aclResult = groups.map((group) => group.acls.map((acl) => acl.id));
    let newAclResult = [];
    aclResult.map((item) => newAclResult.push(...item));
    //@ts-ignore
    const uniqueACLs = Array.from(new Set(newAclResult));

    return uniqueACLs;
};

export const checkExistingGroup = async (name: string) => {
    let group = await UserGroup.findOne({
        where: { name },
    });
    if (!group) {
        group = new UserGroup();
        group.name = name;

        await group.save();
        return group.id;
    }
    return group.id;
};

export const sendEmailConfirmationEmail = async (id, language) => {
    const user = await User.findOne({
        where: { id },
        select: ["emailConfirmationCode", "email", "userName"],
        relations: UserRelations,
    });
    if (!user) throw new ControllerException("USER_NOT_FOUND");
    let configuration = await Configuration.findOne({
        where: { key: "SMTP_REGISTERATION" },
    });

    const smtp = await SMTPConfig.findOne({
        where: { id: configuration ? Number(configuration.value) : null },
    });

    configuration = await Configuration.findOne({
        where: { key: "MESSAGE_CONFIRMATION_CODE" },
    });
    const template = await Message.findOne({
        where: { id: configuration ? Number(configuration.value) : null },
    });
    if (!template) throw new ControllerException("MESSAGE_NOT_FOUND");

    const message = inject({
        template: template.content,
        name: user.userName,
        confirmationCode: user.emailConfirmationCode,
    });

    /*    = {
        from: "admin",
        to: `${user.email}`,
        subject: "email confirmation",
        text: `Dear ${
            user.name[user.language] ? user.name[user.language] : "user"
        }\nYour confirmation code is: ${user.emailConfirmationCode}`,
        ...smtp,
    };
 */
    try {
        const email = {
            host: smtp.host,
            port: smtp.port,
            secure: smtp.secure,
            encryption: smtp.encryption,
            password: smtp.password,
            username: smtp.username,

            from: '"' + smtp.name + '"' + "<" + smtp.email + ">",
            to: user.email,
            subject: "email confirmation",
            text: message,
        };
        await sendEmail(email);
    } catch (error) {
        logger.info(
            `error in sendEmailConfirmationEmail: smtp configuration, send email process`
        );
    }
};

export const sendResetPasswordCode = async (id) => {
    const user = await User.findOne({
        where: { id },
        select: ["passwordResetingCode", "email", "name"],
        relations: UserRelations,
    });
    if (!user) throw new ControllerException("USER_NOT_FOUND");

    let configuration = await Configuration.findOne({
        where: { key: "SMTP_REGISTERATION" },
    });

    const smtp = await SMTPConfig.findOne({
        where: { id: configuration ? Number(configuration.value) : null },
    });

    configuration = await Configuration.findOne({
        where: { key: "MESSAGE_RESET_PASSWORD_CODE" },
    });
    const template = await Message.findOne({
        where: { id: Number(configuration.value) },
    });
    if (!template) throw new ControllerException("MESSAGE_NOT_FOUND");

    const message = inject({
        template: template.content,
        name: user.name,
        resetCode: user.passwordResetingCode,
    });

    try {
        const email = {
            host: smtp.host,
            port: smtp.port,
            secure: smtp.secure,
            encryption: smtp.encryption,
            password: smtp.password,
            username: smtp.username,

            from: '"' + smtp.name + '"' + "<" + smtp.email + ">",
            to: user.email,
            subject: "reset password code",
            text: message,
        };
        await sendEmail(email);
    } catch (error) {
        logger.info(
            `error in sendEmailConfirmationEmail: smtp configuration, send email process `
        );
    }
};

const inject = (patch: {
    name;
    template?;
    confirmationCode?;
    resetCode?;
    otp?;
}) => {
    let result = patch.template;
    if (patch.name) result = result.replace(/{_name_}+/g, patch.name);
    if (patch.confirmationCode)
        result = result.replace(
            /{_confirmationCode_}+/g,
            patch.confirmationCode
        );

    if (/{_siteUrl_}+/g.test(result))
        result = result.replace(/{_siteUrl_}+/g, config.siteUrl);

    if (patch.resetCode)
        result = result.replace(/{_resetCode_}+/g, patch.resetCode);

    return result;
};

export const userAdminFilter = async ({
    searchWord,
    limit,
    offset,
    userType,
    language,
}) => {
    const queryClause: FindOptionsWhere<User> = {};
    const subQuery: Array<FindOptionsWhere<User>> = [];
    if (userType && userType != "null") queryClause.type = userType;

    if (searchWord && searchWord != "null") {
        subQuery.push({
            userName: Like(`%${searchWord}%`),
        });
        subQuery.push({
            email: Like(`%${searchWord}%`),
        });
    }

    const finalQuery = subQuery.length
        ? subQuery.map((condition) => {
              return { ...queryClause, ...condition };
          })
        : queryClause;
    console.log({ finalQuery });

    const [users, count] = await User.findAndCount({
        where: finalQuery,
        order: { id: "DESC" },
        take: limit,
        skip: offset,
    });

    return users.length > 0
        ? {
              users: users.map((user) => compactConvert(user)),
              count,
          }
        : { users: [], count: 0 };
};

const compactConvert = (user: User) => {
    if (!user) return null;

    const { id, userName, email, isActive } = user;

    let result = {
        id,
        userName: userName,
        email,
        isActive,
    };

    return result;
};

interface simpleGroups {
    groups: Array<{ id: number; name: string }>;
}

export const sendNewconfirmationCode = async (
    email: string,
    password: string,
    type: string
) => {
    let user = await User.findByEmailAndPassword(email, password, type);
    if (!user) throw new ControllerException("WRONG_CREDENTIALS");
    if (!user.isActive) throw new ControllerException("USER_NOT_ACTIVE");
    if (user.emailConfirmed)
        throw new ControllerException("THIS_EMAIL_ALREADY_CONFIRMED");

    await sendEmailConfirmationEmail(user.id, Language.ALL);
    return user.id;
};
