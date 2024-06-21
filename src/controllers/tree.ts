import {  getRepository } from "typeorm";
const { performance } = require("perf_hooks");
import { AppDataSource } from "..";

export const getMenuAllChildrens = async (id, table, order?) => {
    const childrens = await AppDataSource.query(
        `WITH RECURSIVE descendants AS (
            SELECT id,c2."parentId" ,c2."order",c2."depth"
            FROM ${table} c2   
            where c2."parentId" =${id}
            union ALL
            SELECT c3.id , c3."parentId" ,c3."order",c3."depth"
            FROM ${table} c3 
            INNER JOIN descendants d
            on c3."parentId" = d."id"
        )      
        select d.id,d."parentId" ,d."order",d."depth"
        FROM descendants d
        INNER join ${table} c4
        ON d.id = c4 ."id"
        
        union all
        SELECT id,c2."parentId" ,"order","depth"
       FROM ${table} c2
       where c2."id" =${id}
    ${order ? order : ` order by "order" ASC`}
       `
    );

    return childrens;
};

export const getParents = async (node = null, table) => {
    const myAncestors = await AppDataSource.query(
        `
        WITH RECURSIVE tree AS (
        SELECT id, ARRAY[]::integer[] AS ancestors
        FROM ${table} WHERE "parentId" IS NULL

        UNION ALL

        SELECT ${table}.id, tree.ancestors || ${table}."parentId"
        FROM ${table}, tree
        WHERE ${table}."parentId" = tree.id
        ) 
        SELECT ancestors FROM tree WHERE id = $1;`,
        [node]
    );
    const ancestorsIds =
        myAncestors.length &&
        myAncestors[0].ancestors &&
        myAncestors[0].ancestors.length
            ? [...myAncestors[0].ancestors]
            : [];

    return ancestorsIds;
};

export const getaAllUserGroupsForUser = async (user) => {
    let groups;
    await Promise.all(
        user.groups.map(async (group) => {
            groups.push(await getParents(group.id, "User_group"));
        })
    );
    return groups;
};

export const getAllChildrens = async (id, table, order?) => {
    const childrens = await AppDataSource.query(
        `WITH RECURSIVE descendants AS (
            SELECT id,c2."parentId" ,c2."order",c2."depth"
            FROM ${table} c2   
            where c2."parentId" =${id}
            union ALL
            SELECT c3.id , c3."parentId" ,c3."order",c3."depth"
            FROM ${table} c3 
            INNER JOIN descendants d
            on c3."parentId" = d."id"
        )      
        select d.id,d."parentId" ,d."order",d."depth"
        FROM descendants d
        INNER join ${table} c4
        ON d.id = c4 ."id"
        
        union all
        SELECT id,c2."parentId" ,"order","depth"
       FROM ${table} c2
       where c2."id" =${id}
    ${order ? order : ` order by "order" ASC`}
       `
    );

    return childrens;
};

/*
 Insertions::
    1.insertSingLeafNode
    2.insertSingleRootNode (all existing root nodes will then point to this)
    3.InsertIntermidiateNode partway through the tree, with the “replaced” node becoming a child of this (and this one keeps it’s children)(between 11 and 12)
    4.insertSingleChildNode         
        
*/
// const insertSingLeafNode = async (parentId) => {
//     const query = `INSERT INTO category (parentId) VALUES (${parentId})`;
// };
// const insertSingleRootNode = async (parentId) => {
//     const query = `WITH parent AS (
//                 INSERT INTO category(${parentId})
//                 VALUES (NULL)
//                 RETURNING id
//             )
//             UPDATE category
//                 SET parentId = parent.id
//                 FROM parent
//                 WHERE parentId IS NULL;`;
// };
// const InsertIntermidiateNode = async (inserted, existance) => {
//     const query = `WITH createdCategory AS (
//             INSERT INTO category(parentId)
//             VALUES (${inserted})
//             RETURNING id
//         )
//         UPDATE category
//             SET parent_id = createdCategory.id
//             FROM createdCategory
//             WHERE category.id = ${existance};`;
// };
// const insertSingleChildNode = async (category) => {
//     const query = `WITH created_category AS (
//         INSERT INTO category(parentId)
//         VALUES (${category})
//         RETURNING id
//     )
//     UPDATE category
//         SET parent_id = created_category.id
//         FROM created_category
//         WHERE category.parentId = ${category};`;
// };

/* Removals::

 1.removeSingleLeafNode
            DELETE FROM nodes WHERE node_id = 9
 2.removeSingleRootNode (all children of this are promoted to root nodes)
        UPDATE nodes SET parent_id = NULL WHERE parent_id = 1;
        DELETE FROM nodes WHERE node_id = 1;
        or:
        WITH deleted AS (
            DELETE FROM nodes
            WHERE node_id = 1
        )
        UPDATE nodes SET parent_id = NULL WHERE parent_id = 1;

 3.removeIntermidiateNode: all children of this node then have their grand-parent as their parent.
        UPDATE nodes
        SET parent_id = (SELECT parent_id FROM nodes WHERE node_id = 2)
        WHERE parent_id = 2;

        DELETE from nodes WHERE node_id = 2;

 4.removeSubtree (a single non-root node and it’s descendants)
        WITH deleted AS (
            DELETE FROM nodes
            WHERE node_id = 2
            RETURNING node_id, parent_id
        )
        UPDATE nodes
            SET parent_id = deleted.parent_id
            FROM deleted
            WHERE nodes.parent_id = deleted.node_id;

5.removeArbitraryDepth

        WITH RECURSIVE tree AS (...)
            DELETE FROM nodes
            WHERE node_id IN (
            SELECT node_id FROM tree WHERE 2 = ANY(tree.ancestors)
            ) OR node_id = 2;

*/

/* Moves::

 moveSubtree: from one parent to another
    UPDATE nodes SET parent_id = 4 WHERE node_id = 3;

 
*/

/* Fetches::

 1.fetchAllDescendants: of a given node
        WITH RECURSIVE tree AS (
        SELECT node_id, ARRAY[10]::integer[] AS ancestors FROM nodes WHERE parent_id = 10

        UNION ALL

        SELECT nodes.node_id, tree.ancestors || nodes.parent_id
        FROM nodes, tree
        WHERE nodes.parent_id = tree.node_id
        )
        SELECT node_id FROM tree;

 2.fetchAllDescendantsCount: of a given node
        SELECT COUNT(node_id) from tree


            
 3.fetchDescendantDepthLimit:
        WITH RECURSIVE tree AS (
        SELECT node_id, ARRAY[10]::integer[] AS ancestors FROM nodes WHERE parent_id = 10

        UNION ALL

        SELECT nodes.node_id, tree.ancestors || nodes.parent_id
        FROM nodes, tree
        WHERE nodes.parent_id = tree.node_id
        AND cardinality(tree.ancestors) < 2
        )
        SELECT node_id FROM tree



  
 4.fetchAncestors:
        WITH RECURSIVE tree AS (
        SELECT node_id, ARRAY[]::integer[] AS ancestors
        FROM nodes WHERE parent_id IS NULL

        UNION ALL

        SELECT nodes.node_id, tree.ancestors || nodes.parent_id
        FROM nodes, tree
        WHERE nodes.parent_id = tree.node_id
        ) SELECT unnest(ancestors) FROM tree WHERE node_id = 15;

  5.fetchAncestorsCount:
         SELECT cardinality(ancestors) FROM tree WHERE node_id = 15

 6.fetchAncestorsDepthLimit:
        WITH RECURSIVE tree AS (
        SELECT node_id, ARRAY[]::integer[] AS ancestors
        FROM nodes WHERE parent_id IS NULL

        UNION ALL

        SELECT nodes.node_id, nodes.parent_id || tree.ancestors
        FROM nodes, tree
        WHERE nodes.parent_id = tree.node_id
        ) SELECT unnest(ancestors) FROM tree WHERE node_id = 15 LIMIT 2;
 
 7.fetchAllLeafs:
    SELECT node_id FROM nodes
    WHERE node_id NOT IN (
    SELECT parent_id FROM nodes WHERE parent_id IS NOT NULL
    );

 8.fetchAllRoots:
    SELECT node_id FROM nodes
    WHERE parent_id IS NULL;

 */

/* For anything that requires us to fetch or delete a whole subtree, we needed to revert to recursive CTEs, and for some of the other operations */
