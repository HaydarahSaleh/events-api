import { MigrationInterface, QueryRunner } from "typeorm";
import { logger } from "../../logger/newLogger";

export class Category1618828091879 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        ///////////////////////////
        //add "other service category"
        //id=1
        await queryRunner.query(
            `insert into category  ("titleId","publishMode","type","aclId") values (7,3,'service',2)`
        );
        ///////////////////////////
        //add "busniess service category"
        //id=2
        await queryRunner.query(
            `insert into category  ("titleId","publishMode","type","aclId") values (8,3,'service',2)`
        );
        ///////////////////////////
        //add "individual service category"
        //id=3
        await queryRunner.query(
            `insert into category  ("titleId","publishMode","type","aclId") values (9,3,'service',2)`
        );
        ///////////////////////////
        //add "supplier  service category"
        //id=4
        await queryRunner.query(
            `insert into category  ("titleId","publishMode","type","aclId") values (10,3,'service',2)`
        );
        ///////////////////////////
        //add "supplier  service category"
        //id=5
        await queryRunner.query(
            `insert into category  ("titleId","publishMode","type","aclId","isFeatured") values (21,3,'post',2,true)`
        );
        ///////////////////////////
        //add "supplier  service category"
        //id=6
        await queryRunner.query(
            `insert into category  ("titleId","publishMode","type","aclId","isFeatured") values (22,3,'post',2,true)`
        );
        ///////////////////////////
        //add "unCategorized video gallery category"
        //id=7
        await queryRunner.query(
            `insert into category  ("titleId","alias","publishMode","type","aclId") values (34,'unCategorized',3,'video',2)`
        );
        logger.info(`migration category first`)
      
    }
    public async down(queryRunner: QueryRunner): Promise<void> {}
}
