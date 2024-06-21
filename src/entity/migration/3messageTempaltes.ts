import { MigrationInterface, QueryRunner } from "typeorm";

export class MessageTemplate1618828091876 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        ///////////////////////////
        //add message template for add request notification
        //1
        await queryRunner.query(
            `insert into message  (title,subject,content) values ('Message for add service request','Request Confirmation','Dear &{name}\n You have received this email to confirm that we we have received you request and we are working on it.\nyour request:\n\n&{message}\n\nResponse types required:\n\n&{responseTypes}\n\nData natures:\n\n&{dataNatures}\n\n\n\nwe will inform you with request status\n\nAll right reserved for RakChamber')`
        );

        ///////////////////////////
        //add message template for change request status
        //2
        await queryRunner.query(
            `insert into message  (title,subject,content) values ('Message for change serviceRequest status','update Request Status','Dear &{name}\n Your request is: &{request}\nWe will notifiy you with all changes')`
        );
        ///////////////////////////
        //add message template for confirmation email code
        //3
        await queryRunner.query(
            `insert into message  (title,subject,content) values ('MESSAGE_CONFIRMATION_CODE','confirmation email code','Dear &{name}
             Your confirmation code is: &{confirmationCode}
             ')`
        );

        ///////////////////////////
        //add message template for reset password code
        //4
        await queryRunner.query(
            `insert into message  (title,subject,content) values ('MESSAGE_RESET_PASSWORD_CODE','reset password code','Dear &{name}\n Your reset password code is: &{resetCode}\n')`
        );

        ///////////////////////////
        //add message template for suscribe notification
        //5
        await queryRunner.query(
            `insert into message  (title,subject,content) values ('MESSAGE_SUBSCRIBTION','send subscribe email','Dear suscriber
            we have added  new &{type}
            you can view it by clicking this link:
            &{link}')`
        );
    }
    public async down(queryRunner: QueryRunner): Promise<void> {}
}
