import { Brackets, FindOptionsOrder, FindOptionsWhere, Raw } from "typeorm";
import { Application } from "../entity/Application";
import { Career } from "../entity/Career";
import { File } from "../entity/File";
import ControllerException from "../exceptions/ControllerException";
import { userActionLogger } from "../logger/userLogger";

const applicationRelations = ["photo", "cv", "career", "career.title"];
interface Patch {
    id: number;
}
const convertToOutput = (application: Application) => {
    return {
        id: application.id,

        firstName: application.firstName,
        lastName: application.lastName,
        gender: application.gender,
        nationality: application.nationality,
        religon: application.religon,
        dateOfBirth: application.dateOfBirth,
        placeOfBirth: application.placeOfBirth,
        phone: application.phone,
        homeNumber: application.homeNumber || null,
        experienceYears: application.experienceYears || null,
        email: application.email,
        skybeId: application.skybeId || null,
        currentLocation: application.currentLocation,
        qualification: application.qualification,
        residentCity: application.residentCity,
        residentCountry: application.residentCountry,
        files: [application.cv, application.photo ? application.photo : null],
        carrerId: application.career.id,
        carrerTitle: application.career.title ? application.career.title : null,
    };
};
const compactConvertToOutput = (application: Application) => {
    //religon وskybeIdوgenderوhomeNumberوdateOfBirthوcurrentLocationوcarrerTitleوphone
    return {
        id: application.id,
        religon: application.religon,
        skybeId: application.skybeId,
        gender: application.gender,
        homeNumber: application.homeNumber,
        dateOfBirth: application.dateOfBirth,
        currentLocation: application.currentLocation,
        careerTitle: application.career.title,
        phone: application.phone,

        firstName: application.firstName,
        lastName: application.lastName,
        nationality: application.nationality,
        experienceYears: application.experienceYears,
        residentCountry: application.residentCountry,
        residentCity: application.residentCity,
        qualification: application.qualification,
    };
};

export const getById = async (id: number) => {
    const application = await Application.findOne({
        where: {
            id: id,
        },
        relations: applicationRelations,
    });

    if (!application) throw new ControllerException("APPLICATION_NOT_FOUND");

    return convertToOutput(application);
};

export const getList = async ({ language, limit, offset }) => {
    const applications = await Application.find({
        relations: applicationRelations,
        order: { id: "DESC" },
        skip: offset,
        take: limit,
    });

    return applications.map((application) => convertToOutput(application));
};

export const add = async (patch) => {
    let application = new Application();

    application = await buildApplication(application, patch);
    await application.save();
    application = await Application.findOne({
        where: {
            id: application.id,
        },
        relations: applicationRelations,
    });
    return convertToOutput(application);
};

export const remove = async (applicationId: number) => {
    const application = await Application.findOne({
        where: {
            id: applicationId,
        },
        relations: applicationRelations,
    });

    if (!application) throw new ControllerException("OBJECT_NOT_FOUND");

    await application.deleteAllContent();
};
export const multiRemove = async (applicationIds: number, user) => {
    const [applications, count] = await Application.findAndCount({
        where: {
            id: applicationIds,
        },
        relations: applicationRelations,
    });
    const deletedIds = [];
    await Promise.all(
        applications.map(async (application) => {
            userActionLogger.info(
                `${user.userName ? user.userName : "user"} with id: ${
                    user.id
                } deleted application with id ${application.id}`,
                {
                    entityId: application.id,
                    source: "Employee",
                    operation: "delete",
                    title: { ar: "فورم", en: "application", fr: "application" },
                    userId: user.id,
                    arMessage: `${
                        user.userName ? user.userName : "مستخدم"
                    } صاحب المعرف: ${user.id} حذف application بالمعرف  ${
                        application.id
                    }`,
                }
            );
            deletedIds.push(application.id);
            await application.deleteAllContent();
        })
    );
    return deletedIds;
};

const buildApplication = async (application: Application, patch) => {
    for (const [key, value] of Object.entries(patch)) {
        application[key] = value;
    }

    if ("cvId" in patch) {
        const queryClause: FindOptionsWhere<Application> = {};
        queryClause.cv = {
            id: patch.cvId,
        };
        const usedCv = await Application.findOne({
            where: queryClause,
        });
        if (usedCv) throw new ControllerException("THIS_FILE_IS_USED");
        const cv = await File.findOne({ where: { id: patch.cvId } });
        if (!cv) throw new ControllerException("FILE_NOT_FOUND");
        application.cv = cv;
    }

    if ("photoId" in patch && patch.photoId) {
        const queryClause: FindOptionsWhere<Application> = {};
        queryClause.photo = {
            id: patch.photoId,
        };
        const usedPhoto = await Application.findOne({
            where: queryClause,
            // where: (qb) => {
            //     qb.andWhere("Application.photo.id=:photoId", {
            //         photoId: patch.photoId,
            //     });
            // },
        });
        if (usedPhoto) throw new ControllerException("THIS_FILE_IS_USED");
        const photo = await File.findOne(patch.photoId);
        if (!photo) throw new ControllerException("FILE_NOT_FOUND");
        application.photo = photo;
    }

    if ("careerId" in patch) {
        const queryClause: FindOptionsWhere<Application> = {};
        const career = await Career.findOne(patch.careerId);
        if (!career) throw new ControllerException("CAREER_NOT_FOUND");
        queryClause.email = patch.email;
        queryClause.career = true;
        const existingApplication = await Application.findOne({
            where: queryClause,
        });
        if (existingApplication)
            throw new ControllerException("YOU_HAVE_APPLIED_TO_THIS_CAREER");
        if (new Date() < career.startTime || new Date() > career.endTime)
            throw new ControllerException("MISSING_DATE");
        application.career = career;
    }

    return application;
};

export const applicationAdminFilter = async ({
    searchWord,
    firstName,
    lastName,
    nationality,
    qualification,
    experienceYears,
    residentCity,
    residentCountry,
    limit,
    offset,
}) => {
    const queryClause: FindOptionsWhere<Application> = {};
    const orderClause: FindOptionsOrder<Application> = {};
    if (searchWord && searchWord != "null") {
        queryClause.firstName = Raw((firstName) => {
            return `LOWER (${firstName},'DD-MM-YYYY') like LOWER ${
                "'%" + searchWord + "%'"
            }`;
        });
        queryClause.lastName = Raw((lastName) => {
            return `LOWER (${lastName},'DD-MM-YYYY') like LOWER ${
                "'%" + searchWord + "%'"
            }`;
        });
        queryClause.nationality = Raw((nationality) => {
            return `LOWER (${nationality},'DD-MM-YYYY') like LOWER ${
                "'%" + searchWord + "%'"
            }`;
        });
        queryClause.qualification = Raw((qualification) => {
            return `LOWER (${qualification},'DD-MM-YYYY') like LOWER ${
                "'%" + searchWord + "%'"
            }`;
        });
        queryClause.residentCity = Raw((residentCity) => {
            return `LOWER (${residentCity},'DD-MM-YYYY') like LOWER ${
                "'%" + searchWord + "%'"
            }`;
        });
        queryClause.residentCountry = Raw((residentCountry) => {
            return `LOWER (${residentCountry},'DD-MM-YYYY') like LOWER ${
                "'%" + searchWord + "%'"
            }`;
        });
    }
    if (firstName && firstName != "null") {
        queryClause.firstName = Raw((firstName) => {
            return `LOWER (${firstName},'DD-MM-YYYY') like LOWER ${
                "'%" + firstName + "%'"
            }`;
        });
    }
    if (lastName && lastName != "null") {
        queryClause.lastName = Raw((lastName) => {
            return `LOWER (${lastName},'DD-MM-YYYY') like LOWER ${
                "'%" + lastName + "%'"
            }`;
        });
    }
    if (nationality && nationality != "null") {
        queryClause.firstName = Raw((nationality) => {
            return `LOWER (${nationality},'DD-MM-YYYY') like LOWER ${
                "'%" + nationality + "%'"
            }`;
        });
    }
    if (qualification && qualification != "null") {
        queryClause.qualification = Raw((qualification) => {
            return `LOWER (${qualification},'DD-MM-YYYY') like LOWER ${
                "'%" + qualification + "%'"
            }`;
        });
    }
    if (residentCity && residentCity != "null") {
        queryClause.residentCity = Raw((residentCity) => {
            return `LOWER (${residentCity},'DD-MM-YYYY') like LOWER ${
                "'%" + residentCity + "%'"
            }`;
        });
    }
    if (residentCountry && residentCountry != "null") {
        queryClause.residentCountry = Raw((residentCountry) => {
            return `LOWER (${residentCountry},'DD-MM-YYYY') like LOWER ${
                "'%" + residentCountry + "%'"
            }`;
        });
    }
    if (experienceYears && experienceYears != "null") {
        queryClause.experienceYears = Raw((experienceYears) => {
            return `LOWER (${experienceYears},'DD-MM-YYYY') like LOWER ${
                "'%" + experienceYears + "%'"
            }`;
        });
    }
    orderClause.id = "DESC";

    const [applications, count] = await Application.findAndCount({
        relations: ["career", "career.title"],
        where: queryClause,
        take: limit,
        skip: offset,
        order: orderClause,
    });

    return applications.length > 0
        ? {
              applications: applications.map((application) =>
                  compactConvertToOutput(application)
              ),
              count,
          }
        : { applications: [], count: 0 };
};
