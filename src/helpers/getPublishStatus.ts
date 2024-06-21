export const getPublishStatus = (object) => {
    if (
        new Date(object.startDate).getTime() <= new Date().getTime() &&
        new Date(object.endDate).getTime() >= new Date().getTime() &&
        [1, 2, 3, 4, 5, 6, 7].includes(object.publishMode)
    )
        return "Published";
    else return "Not Published";
};
