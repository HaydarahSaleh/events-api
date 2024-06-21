import { MigrationInterface, QueryRunner } from "typeorm";
import { logger } from "../../logger/newLogger";

export class TextData1618828091876 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        //1
        await queryRunner.query(
            `insert into text_data  (ar ,en) values (' أعدادت رسالة خاصة بأشعارات طلب خدمة ','configuration for add service request message')`
        );
        //2
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('رسالة خاصة بتغيير حالة الطلب','configuration for change service request status message')`
        );
        //3
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('تواصل معنا ','contact us')`
        );
        //4
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('المدة الزمنية ','duration')`
        );
        //5
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('إعدادات رسالة تأكيد الإيميل لمستخدم جديد','configuration for email confirmation for new user')`
        );
        //6
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('إعدادات رسالة رمز نسيان كلمة السر','configuration for forget password code')`
        );
        //7
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('غير ذلك','other')`
        );
        //8
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('خدمات الأعمال','business Services')`
        );
        //9
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('خدمات الأفراد','individual services')`
        );
        //10
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('خدمات المزودين','Supplier services')`
        );
        //11
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('استشارة قانونية','legal consultancy')`
        );
        //12
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('خمسة أيام عمل','five working days')`
        );

        //13
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('استشارة تجارية','commercial consultancy')`
        );
        //14
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('خمسة أيام عمل','five working days')`
        );
        //15
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('دعم تقني','technical support')`
        );
        //16
        await queryRunner.query(
            `insert into text_data  (ar ,en) values (' يوم عمل واحد','single working day')`
        );

        //17
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('خدمة مزود جديد','new supplier service')`
        );

        //18
        await queryRunner.query(
            `insert into text_data  (ar ,en) values (' يوم عمل واحد','single working day')`
        );

        //19
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('خدمة حجز','Booking service')`
        );
        //20
        await queryRunner.query(
            `insert into text_data  (ar ,en) values (' يوم عمل واحد','single working day')`
        );
        //21
        await queryRunner.query(
            `insert into text_data  (ar ,en) values (' أخبار غرفة تجارة رأس الخيمة','RAK Chamber News')`
        );
        //22
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('أخبار اقتصادية','Economic News')`
        );
        //23
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('إعدادات رسالة المتابعة','configuration for subscribtion')`
        );

        //24
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('إعدادات ايميل المتابعة','smtp for subscribtion')`
        );

        //25
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('إعدادات ايميل التسجيل','smtp for subscribtion')`
        );

        //26
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('إعدادات ايميل الخدمات','smtp for subscribtion')`
        );

        //27
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('ربط صفحة قيسبوك','faceBook page')`
        );

        //28
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('ربط صفحة تويتير','twitter page')`
        );

        //29
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('ربط صفحة انستاغرام','instagram page')`
        );

        //30
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('اعدادت الخريطة','map configuration')`
        );

        //31
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('اللغة','language')`
        );
        //32
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('احداثيات الخريطة','map cordination')`
        );
        //33
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('أخر تحديث للصفحة الرئيسية','last update for home page')`
        );
        //34
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('غير مصنف','unCategorized')`
        );
        //35
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('أفكار','ideas')`
        );
        //36
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('وصف الافكار','ideas descreption')`
        );
        //37
        await queryRunner.query(
            `insert into text_data  (ar ,en) values (' يوم عمل واحد','single working day')`
        );

        //38
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('شكر','thanks and Appreciation ')`
        );
        //39
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('وصف شكر','thanks descreption')`
        );
        //40
        await queryRunner.query(
            `insert into text_data  (ar ,en) values (' يوم عمل واحد','single working day')`
        );
        //41
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('الموقع','website')`
        );
        //42
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('الهاتف','phone')`
        );
        //43
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('الايميل','email')`
        );
        //44
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('خدمة الزبائن','customer care')`
        );
        //45
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('يوتيوب','you tube')`
        );
        //46
        await queryRunner.query(
            `insert into text_data  (ar ,en) values ('أداة مجانية','toll free')`
        );
 ///////////////////////////////////
   //47
   await queryRunner.query(
    `insert into text_data  (ar ,en) values ('مجلة الغرفة','Al Ghorfa Magazine')`
);
  //48
  await queryRunner.query(
    `insert into text_data  (ar ,en) values ('دليل الاستثمار لإمارة رأس الخيمة','Investment Guide for The Emirate Of RAK')`
);
  //49
  await queryRunner.query(
    `insert into text_data  (ar ,en) values ('التقارير','Reports')`
);
  //50
  await queryRunner.query(
    `insert into text_data  (ar ,en) values ('مؤشر إحصائي','Statistical indicator')`
);
  //51
  await queryRunner.query(
    `insert into text_data  (ar ,en) values ('الرؤية الاقتصادية','Economic Vision')`
);
  //52
  await queryRunner.query(
    `insert into text_data  (ar ,en) values ('النشرات الإحصائية','Statistical bulletins')`
); 
  

  //53
  await queryRunner.query(
    `insert into text_data  (ar ,en) values ('تقرير سنوي','Annual Report')`
); 
  //54
  await queryRunner.query(
    `insert into text_data  (ar ,en) values ('تطوير الاعمال','Business Development')`
); 
  //55
  await queryRunner.query(
    `insert into text_data  (ar ,en) values ('دراسات التنافسية','Competitiveness Studies')`
); 
  //56
  await queryRunner.query(
    `insert into text_data  (ar ,en) values ('النشرات التربوية','Educational bulletins')`
); 
  //57
  await queryRunner.query(
    `insert into text_data  (ar ,en) values ('الدراسات الاقتصادية','Economic Studies')`
); 
  //58
  await queryRunner.query(
    `insert into text_data  (ar ,en) values ('منشورات التعاون التجاري','Commercial Cooperation Publications')`
); 
//59
await queryRunner.query(
    `insert into text_data  (ar ,en) values ('الخطة الاستراتيجية','stratigicPlan')`
); 
  //60
  await queryRunner.query(
    `insert into text_data  (ar ,en) values ('جوائز','awards')`
); 
  logger.info(`migration textDate`)
    }
    public async down(queryRunner: QueryRunner): Promise<void> {}
}
