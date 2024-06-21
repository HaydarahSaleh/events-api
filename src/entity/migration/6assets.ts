import { MigrationInterface, QueryRunner } from "typeorm";

export class Assets1618828091876 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `INSERT INTO public.asset ("name",main) VALUES
            ('DashBoard',true),
            ('Content',true),
            ('AdSpace',false),
            ('GeneralPages',false),
            ('Initiatives',false),
            ('InvestmentOpportunity',false),
            ('MediaCenter',true),
            ('Events',false),
            ('PhotosGallery',false),
            ('VideosGallery',false);`
        );

        await queryRunner.query(
            `INSERT INTO public.asset ("name",main) VALUES
            ('LiveBroadCast',false),
            ('Categories',true),
            ('SliderCategories',false),
            ('Structre',true),
            ('BloackLayout',false),
            ('Menus',false),
            ('Sliders',false),
            ('Taxonomay',false),
            ('EParticipations',true),
            ('Polls',false);`
        );

        await queryRunner.query(
            `INSERT INTO public.asset ("name",main) VALUES
            ('Opinions',false),
            ('Comments',false),
            ('ContactUs',false),
            ('Careers',false),
            ('Applications',false),
            ('FAQ',false),
            ('OpenDate',true),
            ('UsersMangement',true),
            ('Users',false),
            ('AccessControlLevels',false);`
        );

        await queryRunner.query(
            `INSERT INTO public.asset ("name",main) VALUES
            ('UserGroup',false),
            ('Permissions',false),
            ('Roles',false),
            ('Appearance',false),
            ('Configuration',true),
            ('General',false),
            ('Email',false),
            ('Files',false),
            ('NotificationCenter',true),
            ('MessageTemplate',false);`
        );

        await queryRunner.query(
            `INSERT INTO public.asset ("name",main) VALUES
            ('Survey',true),
            ('Service',true),
            ('LegalConsultation',false),
            ('CommercialConsultation',false),
            ('TechnicalSupport',false),
            ('BookingService',false),
            ('VenuesList',false),
            ('news',false),
            ('publications',false),
            ('PagesRating',false);`
        );

        await queryRunner.query(
            `INSERT INTO public.asset ("name",main) VALUES
            ('UsersReview',false);`
        );
    }
    public async down(queryRunner: QueryRunner): Promise<void> {}
}
