export enum Actions {
    ADD = "add",
    VIEW = "view",
    VIEW_DELETED = "viewDeleted",
    VIEW_VERSIONS = "viewVersions",
    "EDIT_ANY" = "editAny",
    "EDIT_OWN" = "editOwn",
    "DELETE_OWN" = "deleteOwn",
    "DELETE_ANY" = "deleteAny",
    "APPROVE" = "approve",
    "PUBLISH" = "publish",
    "PUBLISH_AFTER_APPROVE" = "publishAfterApprove",
    "ACCESS_ADMINISTRATION_INTERFACE" = "accessAdministrationInterface",
}

export interface AssetPermission {
    add: boolean;
    view: boolean;
    viewVersions: boolean;
    viewDeleted: boolean;
    editAny: boolean;
    editOwn: boolean;
    deleteOwn: boolean;
    deleteAny: boolean;
    approve: boolean;
    publish: boolean;
    publishAfterApprove: boolean;
    accessAdministrationInterface: boolean;
}
