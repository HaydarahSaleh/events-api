export enum serviceRequestSubject {
    ECONOMY = "economy",
    STUDY = "study",
    WORK = "work",
}

export enum ServiceRequestStatus {
    NEW = "new",
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    CLOSED = "closed",
}

export enum serviceRequestStage {
    NEW = "new",
    COORDINATOR = "employee",
    MANGER = "manger",
    ISSUED = "issued",
}

export enum ServiceRequestInnerStatus {
    NEW = "new",
    SEND_TO_MANGER = "sendToManger",
    REJECTED_FROM_EMPLOYEE = "rejectedFromEmployee",
    FULLY_APPROVED = "fullyApproved",
    FULLY_REJECTED = "fullyRejected",
    PAID = "paid",
}

export enum ServiceRequestType {
    CONTACT_US = "contactUs",
    LEGAL = "legal",
    ECONOMIC = "economic",
    TECHNICAL_SUPPORT = "technicalSupport",
}

export enum DataNature {
    STATISTICAL_REPORT = "statisticalReport",
    GENERAL_INFORMATION = "generalInformation",
    PRINT_MATIRIAL = "printMatirial",
}
export enum RwsponseType {
    EMAIL = "email",
    PHONE = "phone",
}
