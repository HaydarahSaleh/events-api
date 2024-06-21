import { CodeCounter } from "../entity/CodeCounter";

export const count = async (code) => {
   
    
    let record = await CodeCounter.findOne({ where: { code } });
    if (!record) {
        record = new CodeCounter();
        record.code=code
        record.counter = 0;
    }
    record.counter = record.counter + 1;
    await record.save();
    return record;
};
export const mostUsed = async () => {
    let records = await CodeCounter.find({
        take: 5,
        order: { counter: "DESC" },
    });

    return records;
};
