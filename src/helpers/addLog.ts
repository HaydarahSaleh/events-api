import { User } from "../entity/User";
import { ServiceRequest } from "../entity/ServiceRequest";
import { Log } from "./../entity/Log";
import { TextData } from "../entity/TextData";

export const createLog = async (enMessgae, arMessage, userId, requestId) => {
    const createdBy = await User.findOne(userId);

    let log = new Log();
    const message = new TextData();
    message.en = enMessgae;
    message.ar = arMessage;
    log.message = message;
    log.createdBy = createdBy;

    return log;
};
