import { MigrationInterface, QueryRunner } from "typeorm";
import { logger } from "../../logger/newLogger";

export class publicationsCategory1618828091879 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        ///////////////////////////
        //add "other service category"
        //id=8
        await queryRunner.query(
            `insert into category  ("titleId","publishMode","type","aclId","alias","subType") values (47,3,'post',2,'AlGhorfaMagazine','publications')`
        );
        ///////////////////////////
        //add "busniess service category"
        //id=9
        await queryRunner.query(
            `insert into category  ("titleId","publishMode","type","aclId","alias","subType") values (48,3,'post',2,'InvestmentGuideforTheEmirateOfRAK','publications')`
        );
        ///////////////////////////
        //add "individual service category"
        //id=10
        await queryRunner.query(
            `insert into category  ("titleId","publishMode","type","aclId","alias","subType") values (49,3,'post',2,'Reports','publications')`
        );
        ///////////////////////////
        //add "supplier  service category"
        //id=11
        await queryRunner.query(
            `insert into category  ("titleId","publishMode","type","aclId","alias","subType") values (50,3,'post',2,'StatisticalIndicator','publications')`
        );
        ///////////////////////////
        //add "supplier  service category"
        //id=12
        await queryRunner.query(
            `insert into category  ("titleId","publishMode","type","aclId","isFeatured","alias","subType") values (51,3,'post',2,false,'EconomicVision','publications')`
        );
        ///////////////////////////
        //add "supplier  service category"
        //id=13
        await queryRunner.query(
            `insert into category  ("titleId","publishMode","type","aclId","isFeatured","alias","subType") values (52,3,'post',2,false,'StatisticalBulletins','publications')`
        );

        ///////////////////////////
        //add "supplier  service category"
        //id=14
        await queryRunner.query(
            `insert into category  ("titleId","publishMode","type","aclId","isFeatured","alias","subType") values (53,3,'post',2,false,'AnnualReport','publications')`
        );
        ///////////////////////////
        //add "supplier  service category"
        //id=15
        await queryRunner.query(
            `insert into category  ("titleId","publishMode","type","aclId","isFeatured","alias","subType") values (54,3,'post',2,false,'BusinessDevelopment','publications')`
        );

        ///////////////////////////
        //add "supplier  service category"
        //id=16
        await queryRunner.query(
            `insert into category  ("titleId","publishMode","type","aclId","isFeatured","alias","subType") values (55,3,'post',2,false,'CompetitivenessStudies','publications')`
        );
        ///////////////////////////
        //add "supplier  service category"
        //id=17
        await queryRunner.query(
            `insert into category  ("titleId","publishMode","type","aclId","isFeatured","alias","subType") values (56,3,'post',2,false,'EducationalBulletins','publications')`
        );

        ///////////////////////////
        //add "supplier  service category"
        //id=18
        await queryRunner.query(
            `insert into category  ("titleId","publishMode","type","aclId","isFeatured","alias","subType") values (57,3,'post',2,false,'EconomicStudies','publications')`
        );
        ///////////////////////////
        //add "supplier  service category"
        //id=19
        await queryRunner.query(
            `insert into category  ("titleId","publishMode","type","aclId","isFeatured","alias","subType") values (58,3,'post',2,false,'CommercialCooperationpublicationss','publications')`
        );
        ///////////////////////////////

        logger.info(`migration category of publications`);

        ///////////////////////////
        //stratigicpaln
        //id=20
        await queryRunner.query(
            `insert into category  ("titleId","publishMode","type","aclId","isFeatured","alias","subType") values (59,3,'post',2,false,'stratigicPlan','generalPages')`
        );
        ///////////////////////////
        //awards
        //id=21
        await queryRunner.query(
            `insert into category  ("titleId","publishMode","type","aclId","isFeatured","alias","subType") values (60,3,'post',2,false,'awards','generalPages')`
        );

        logger.info(`migration category of generalPages`);
    }
    public async down(queryRunner: QueryRunner): Promise<void> {}
}
