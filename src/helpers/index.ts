import { Language } from "../entity/enum/Language";
import * as UserController from "../controllers/user";
import { AssetPermission } from "../interface/Actions";
export const spreadEnum = (e) => {
    const keys = Object.keys(e);
    const values = Object.values(e);
    return { keys, values };
};

export const checkACLandPublishMode = async (
    objects,
    user,
    language,
    assetPermission: AssetPermission
) => {
    const publishMode = getPublishMode(language);

    let userAcls = user
        ? await UserController.getUserACLs(user.id)
        : ["public"]; // to handle if no user(not regestired) in request => acl is guest

    /* objects = await Promise.all(
        objects.map(async (object) => {
            const objectAcl = object.acl ? object.acl.name : "admin";

            if (userAcls.includes(objectAcl)) {
                return object;
            }
        })
    ); */

    objects = objects.filter((object) => object != null);

    if (objects.length) {
        objects = await Promise.all(
            objects.map(async (object) => {
                if (assetPermission.view || userAcls.includes(object.acl.name))
                    return object;
            })
        );
    }
    objects = objects.filter((object) => object != null);

    if (objects.length) {
        objects = objects.map((object) => {
            if (
                assetPermission.view ||
                publishMode.includes(object.publishMode)
            )
                return object;
        });
    }
    objects = objects.filter((object) => object != null);

    if (objects.length > 0) return objects;
};

export const getPublishMode = (language?) => {
    const publishMode =
        language == Language.ALL
            ? [1, 2, 3, 4, 5, 6, 7]
            : language == Language.ARABIC
            ? [1, 2, 3, 7]
            : language == Language.ENGLISH
            ? [2, 4, 5, 7]
            : language == Language.FRENCH
            ? [3, 5, 6, 7]
            : [0];

    return publishMode;
};

export const pairs = (array1, array2) => {
    let result = [];
    array1.map((object1) => {
        array2.map((object2) => {
            result.push({ 1: object1, 2: object2 });
        });
    });

    return result;
};
