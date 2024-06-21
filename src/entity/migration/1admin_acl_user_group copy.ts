import { MigrationInterface, QueryRunner } from "typeorm";
import { logger } from "../../logger/newLogger";

export class users1618828091876 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `insert  into "user" (email,"password") values ('admin@gmail.com','$2a$10$qMUkoRm7vMOpiNiPfsdYc.6bQiA8InqtoxJZOZi7W2poAMyvoqJD6')`
        );

        await queryRunner.query(
            `insert  into user_group (name) values ('admin')`
        );

        await queryRunner.query(
            `insert  into user_group (name) values ('public')`
        );

        await queryRunner.query(`insert  into acl (name) values ('admin')`);
        await queryRunner.query(`insert  into acl (name) values ('public')`);

        await queryRunner.query(
            `insert  into acl_user_groups_user_group ("userGroupId","aclId") values (1,1)`
        );
        await queryRunner.query(
            `insert  into acl_user_groups_user_group ("userGroupId","aclId") values (1,2)`
        );
        await queryRunner.query(
            `insert  into acl_user_groups_user_group ("userGroupId","aclId") values (2,2)`
        );

        await queryRunner.query(
            `insert  into user_groups_user_group ("userGroupId" ,"userId") values (2,1)`
        );
        logger.info(`migration users`)
    }
    public async down(queryRunner: QueryRunner): Promise<void> {}
}
