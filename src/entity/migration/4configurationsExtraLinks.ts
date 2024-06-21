import { MigrationInterface, QueryRunner } from "typeorm";

export class configurationsExtraLinks1618828091876
    implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        ///////////////////////////16
        //webSite link

        await queryRunner.query(
            `insert into "configuration"  ("key",value,"titleId") values ('WEBSITE',null,41)`
        );
        ///////////////////////////17
        //phone link

        await queryRunner.query(
            `insert into "configuration"  ("key",value,"titleId") values ('PHONE',null,42)`
        );
        ///////////////////////////18
        //email link

        await queryRunner.query(
            `insert into "configuration"  ("key",value,"titleId") values ('EMAIL',null,43)`
        );
        ///////////////////////////19
        //customer care link

        await queryRunner.query(
            `insert into "configuration"  ("key",value,"titleId") values ('CUSTOMER_CARE',null,44)`
        );
        ///////////////////////////20
        //you tube link

        await queryRunner.query(
            `insert into "configuration"  ("key",value,"titleId") values ('YOU_TUBE',null,45)`
        );

        ///////////////////////////21
        //toll free link

        await queryRunner.query(
            `insert into "configuration"  ("key",value,"titleId") values ('TOOL_FREE',null,46)`
        );
    }
    public async down(queryRunner: QueryRunner): Promise<void> {}
}
