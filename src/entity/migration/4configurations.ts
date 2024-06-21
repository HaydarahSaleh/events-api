import { MigrationInterface, QueryRunner } from "typeorm";

export class Configuration1618828091876 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        ///////////////////////////1
        //add message tempalte configuration for add request notification

        await queryRunner.query(
            `insert into "configuration"  (key,value,"titleId") values ('MESSAGE_ADD_SERVICE_REQUEST',1,1)`
        );

        ///////////////////////////2
        //add message tempalte configuration for change request status

        await queryRunner.query(
            `insert into "configuration"  ("key",value,"titleId") values ('MESSAGE_CHANGE_SERVICE_REQUEST_STATUS',2,2)`
        );
        ///////////////////////////3
        //add message tempalte configuration for confirmation email code

        await queryRunner.query(
            `insert into "configuration"  ("key",value,"titleId") values ('MESSAGE_CONFIRMATION_CODE',3,5)`
        );

        ///////////////////////////4
        //add message tempalte configuration for confirmation email code

        await queryRunner.query(
            `insert into "configuration"  ("key",value,"titleId") values ('MESSAGE_RESET_PASSWORD_CODE',4,6)`
        );
        ///////////////////////////5
        //add message tempalte configuration for confirmation email code

        await queryRunner.query(
            `insert into "configuration"  ("key",value,"titleId") values ('MESSAGE_SUBSCRIBTION',5,23)`
        );

        ///////////////////////////6
        //add message tempalte configuration for confirmation email code

        await queryRunner.query(
            `insert into "configuration"  ("key",value,"titleId") values ('SMTP_SUBSCRIBTION',null,24)`
        );

        ///////////////////////////7
        //add message tempalte configuration for confirmation email code

        await queryRunner.query(
            `insert into "configuration"  ("key",value,"titleId") values ('SMTP_REGISTERATION',null,25)`
        );

        ///////////////////////////8
        //add message tempalte configuration for confirmation email code

        await queryRunner.query(
            `insert into "configuration"  ("key",value,"titleId") values ('SMTP_SERVICE',null,26)`
        );
        ///////////////////////////9
        //faceBook link

        await queryRunner.query(
            `insert into "configuration"  ("key",value,"titleId") values ('FACE_BOOK',null,27)`
        );
        //////////////////////////10
        //twitter link

        await queryRunner.query(
            `insert into "configuration"  ("key",value,"titleId") values ('TWITTER',null,28)`
        );
        ///////////////////////////11
        //instagram link

        await queryRunner.query(
            `insert into "configuration"  ("key",value,"titleId") values ('INSTAGRAM',null,29)`
        );
        ///////////////////////////12
        //map key

        await queryRunner.query(
            `insert into "configuration"  ("key",value,"titleId") values ('MAP_KEY',null,30)`
        );
        ///////////////////////////13
        //map cords

        await queryRunner.query(
            `insert into "configuration"  ("key",value,"titleId") values ('MAP_CORDINATIONS',null,32)`
        );

        ///////////////////////////14
        //language

        await queryRunner.query(
            `insert into "configuration"  ("key",value,"titleId") values ('language','arabic',31)`
        );

        ///////////////////////////15
        //homePageLastUpdate

        await queryRunner.query(
            `insert into "configuration"  ("key",value,"titleId") values ('HOME_PAGE_LAST_UPDATE','',33)`
        );
    }
    public async down(queryRunner: QueryRunner): Promise<void> {}
}
