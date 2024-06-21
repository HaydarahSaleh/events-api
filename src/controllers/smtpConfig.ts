import ControllerException from "../exceptions/ControllerException";
import { User } from "../entity/User";
import { SMTPConfig } from "../entity/SmtpConfig";
import { userActionLogger } from "../logger/userLogger";

const convertSMTPToOutput = (smtpConfig: SMTPConfig) => {
    const {
        id,
        email,
        name,
        host,
        port,
        encryption,
        username,
        password,
        secure,
        createdBy,
    } = smtpConfig;
    return {
        id: id || null,
        createdBy,
        email: email || null,
        name: name || null,
        host: host || null,
        port: port || null,
        secure,
        encryption: encryption || null,
        username: username,
        password: password,
    };
};

export const getSMTPConfigById = async (id: number) => {
    const smtpConfig = await SMTPConfig.findOne({ where: { id } });

    if (!smtpConfig) throw new ControllerException("SMTP_CONNFIG_NOT_FOUND");

    return convertSMTPToOutput(smtpConfig);
};

export const getSMTPConfigList = async () => {
    const smtpConfig = await SMTPConfig.find({ relations: ["createdBy"] });

    return smtpConfig.map((config) => convertSMTPToOutput(config));
};

export const addSMTPConfig = async (
    email,
    name,
    host,
    port,
    encryption,
    secure,
    userName,
    password,
    user: User
) => {
    let smtpConfig = new SMTPConfig();
    smtpConfig.email = email;
    smtpConfig.name = name;
    smtpConfig.host = host;
    smtpConfig.port = port;
    smtpConfig.encryption = encryption;
    smtpConfig.secure = secure;
    smtpConfig.username = userName;
    smtpConfig.password = password;

    smtpConfig.createdBy = user;
    smtpConfig.updatedBy = user;

    await smtpConfig.save();

    return convertSMTPToOutput(smtpConfig);
};

export const updateSMTPConfig = async (
    configId: number,
    patch: {
        email;
        name;
        host;
        port;
        encryption;
        secure;
        username;
        password;
    },

    user: User
) => {
    const smtpconfig = await SMTPConfig.findOne({ where: { id: configId } });
    if (!smtpconfig) throw new ControllerException("SMTP_CONNFIG_NOT_FOUND");

    for (const [key, value] of Object.entries(patch)) {
        smtpconfig[key] = value;
    }

    if ("secure" in patch) smtpconfig.secure = patch.secure;
    await smtpconfig.save();

    return convertSMTPToOutput(smtpconfig);
};

export const deleteSMTPConfig = async (configId: number, user) => {
    const smtpconfig = await SMTPConfig.findOne({ where: { id: configId } });

    if (!smtpconfig) throw new ControllerException("SMTP_CONNFIG_NOT_FOUND");

    await smtpconfig.remove();
    userActionLogger.info(
        `${user.userName ? user.userName : "user"} with id: ${
            user.id
        } deleted smtp config with id ${smtpconfig.id}`,
        {
            entityId: smtpconfig.id,
            source: "Employee",
            operation: "delete",
            title: {
                ar: smtpconfig["name"],
                en: smtpconfig["name"],
                fr: smtpconfig["name"],
            },
            userId: user.id,
            arMessage: `${
                user.userName ? user.userName : "مستخدم"
            } صاحب المعرف: ${user.id} حذف smtp config بالمعرف  ${
                smtpconfig.id
            }`,
        }
    );
};
