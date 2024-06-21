import { MigrationInterface, QueryRunner } from "typeorm";

export class Service1618828091876 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        //1
        //contact us
        await queryRunner.query(
            `insert into service ("titleId","publishMode","durationId","forInquiries",charges,alias,"aclId") values (3,3,4,'RAK chamber',0,'contactUs',2)`
        );

        //2
        //legal
        await queryRunner.query(
            `insert into service ("titleId","publishMode","durationId","forInquiries",charges,alias,"aclId") values (11,3,12,'RAK chamber',0,'leagalConsultancyService',2)`
        );
        //3
        //commercial
        await queryRunner.query(
            `insert into service ("titleId","publishMode","durationId","forInquiries",charges,alias,"aclId") values (13,3,14,'RAK chamber',0,'commercialConsultancyService',2)`
        );
        //4
        //technical support
        await queryRunner.query(
            `insert into service ("titleId","publishMode","durationId","forInquiries",charges,alias,"aclId") values (15,3,16,'RAK chamber',0,'technicalSupportService',2)`
        );

        //5
        //new supplier
        await queryRunner.query(
            `insert into service ("titleId","publishMode","durationId","forInquiries",charges,alias,"aclId") values (17,3,18,'RAK chamber',0,'newSupplier',2)`
        );

        //6
        //booking
        await queryRunner.query(
            `insert into service ("titleId","publishMode","durationId","forInquiries",charges,alias,"aclId") values (19,3,20,'RAK chamber',0,'booking',2)`
        );
        //7
        //ideas
        await queryRunner.query(
            `insert into service ("titleId","descriptionId","publishMode","durationId","forInquiries",charges,alias,"aclId") values (35,36,3,37,'RAK chamber',0,'ideas',2)`
        );
        //8
        await queryRunner.query(
            `insert into service ("titleId","descriptionId","publishMode","durationId","forInquiries",charges,alias,"aclId") values (38,39,3,40,'RAK chamber',0,'thanksAndAppreation',2)`
        );
    }
    public async down(queryRunner: QueryRunner): Promise<void> {}
}
