import { AppDataSource } from "..";
export const calculateDepths = async (type) => {
    return await AppDataSource.query(`WITH RECURSIVE descendants AS (
        SELECT id,c2."parentId" , 0 AS depth
        FROM ${type} c2   
        where c2."parentId" isnull 
        union ALL
        SELECT c3.id , c3."parentId" , d.depth+ 1
        FROM ${type} c3 
        INNER JOIN descendants d
        on d.id= c3."parentId" 
    )
    select d.id ,d.depth
    FROM descendants d
    INNER join ${type} c4
    ON d.id = c4 ."id"
    order by d .id desc 
         `);
};
