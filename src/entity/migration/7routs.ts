import { MigrationInterface, QueryRunner } from "typeorm";
import { Rate } from "../Rate";
import { staticPages } from "../../entity/enum/staticPages";
import { Block } from "../Block";

export class Routs1618828091876 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        {
            const rate1 = new Rate();
            rate1.url = "/media/news";
            await rate1.save();

            const block = new Block();
            block.index=1
            block.url = "/media/news";
            await block.save();
        }

        {
            const rate2 = new Rate();
            rate2.url = "/media/photos-gallery";
            await rate2.save();

            const block = new Block();
            block.index=1
            block.url = "/media/photos-gallery";
            await block.save();
        }

        {
            const rate3 = new Rate();
            rate3.url = "/media/videos-gallery";
            await rate3.save();

            const block = new Block();
            block.index=1
            block.url = "/media/videos-gallery";
            await block.save();
        }

        {
            const rate4 = new Rate();
            rate4.url = "/media/events";
            await rate4.save();

            const block = new Block();
            block.index=1
            block.url = "/media/events";
            await block.save();

        }

        {
            const rate5 = new Rate();
            rate5.url = "/media/live-broadcasts";
            await rate5.save();

            const block = new Block();
            block.index=1
            block.url = "/media/live-broadcasts";
            await block.save();
        }

        {
            const rate6 = new Rate();
            rate6.url = "/media/publications";
            await rate6.save();

            const block = new Block();
            block.index=1
            block.url = "/media/publications";
            await block.save();
        }
        {
            const rate7 = new Rate();
            rate7.url = "/open-data/page";
            await rate7.save();

            const block = new Block();
            block.index=1
            block.url = "/open-data/page";
            await block.save();

        }
        {
            const rate11 = new Rate();
            rate11.url = "/media/photos-gallery";
            await rate11.save();

            const block = new Block();
            block.index=1
            block.url = "/media/photos-gallery";
            await block.save();
        }
        {
            const rate12 = new Rate();
            rate12.url = "/open-data/open-data-policy";
            await rate12.save();

            const block = new Block();
            block.index=1
            block.url = "/open-data/open-data-policy";
            await block.save();
        }
        {
            const rate13 = new Rate();
            rate13.url = "/participation/polls";
            await rate13.save();

            const block = new Block();
            block.index=1
            block.url = "/participation/polls";
            await block.save();
        }
        {
            const rate14 = new Rate();
            rate14.url = "/participation/opinion";
            await rate14.save();

            const block = new Block();
            block.index=1
            block.url = "/participation/opinion";
            await block.save();
        }
        {
            const rate15 = new Rate();
            rate15.url = "/participation/faq";
            await rate15.save();

            const block = new Block();
            block.index=1
            block.url = "/participation/faq";
            await block.save();
        }

        {
            const rate16 = new Rate();
            rate16.url = "/participation/survey";
            await rate16.save();

            const block = new Block();
            block.index=1
            block.url = "/participation/survey";
            await block.save();
        }
        {
            const rate17 = new Rate();
            rate17.url = "/aboutus/about-chamber";
            await rate17.save();

            const block = new Block();
            block.index=1
            block.url = "/aboutus/about-chamber";
            await block.save();
        }
        {
            const rate18 = new Rate();
            rate18.url = "/aboutus/directors";
            await rate18.save();

            const block = new Block();
            block.index=1
            block.url = "/aboutus/directors";
            await block.save();
        }
        {
            const rate19 = new Rate();
            rate19.url = "/aboutus/committees";
            await rate19.save();

            const block = new Block();
            block.index=1
            block.url = "/aboutus/committees";
            await block.save();
        }
        {
            const rate21 = new Rate();
            rate21.url = "/aboutus/chamber-polices";
            await rate21.save();
            

            const block = new Block();
            block.index=1
            block.url = "/aboutus/committees";
            await block.save();

            
        }
        {
            const rate22 = new Rate();
            rate22.url = "/aboutus/sponsors";
            await rate22.save();

            const block = new Block();
            block.index=1
            block.url = "/aboutus/sponsors";
            await block.save();
        }
        {
            const rate23 = new Rate();
            rate23.url = "/aboutus/customers-satisfaction";
            await rate23.save();

            const block = new Block();
            block.index=1
            block.url = "/aboutus/customers-satisfaction";
            await block.save();
        }

        {
            const rate24 = new Rate();

            rate24.url = "/aboutus/initiatives";
            await rate24.save();

            const block = new Block();
            block.index=1
            block.url = "/aboutus/initiatives";
            await block.save();
        }
        {
            const rate25 = new Rate();
            rate25.url = "/careers/vacances";
            await rate25.save();

            const block = new Block();
            block.index=1
            block.url = "/careers/vacances";
            await block.save();
        }

        {
            const rate26 = new Rate();
            rate26.url = "/contactus/contactus";
            await rate26.save();

            const block = new Block();
            block.index=1
            block.url = "/contactus/contactus";
            await block.save();
        }
        {
            const rate27 = new Rate();
            rate27.url = "/services/rak-chamber";
            await rate27.save();

            const block = new Block();
            block.index=1
            block.url = "/services/rak-chamber";
            await block.save();
        }
        {
            const rate28 = new Rate();
            rate28.url = "/services/rak-exhibition";
            await rate28.save();

            const block = new Block();
            block.index=1
            block.url = "/services/rak-exhibition";
            await block.save();
        }
        {
            const rate29 = new Rate();
            rate29.url = "/services/rak-sme";
            await rate29.save();

            const block = new Block();
            block.index=1
            block.url = "/services/rak-sme";
            await block.save();
        }

        {
            const rate30 = new Rate();
            rate30.url = "/aboutus/strategic-plan";
            await rate30.save();

            const block = new Block();
            block.index=1
            block.url = "/aboutus/strategic-plan";
            await block.save();
        }
        {
            const rate31 = new Rate();
            rate31.url = "/services/rak-arbitration";
            await rate31.save();

            const block = new Block();
            block.index=1
            block.url = "/services/rak-arbitration";
            await block.save();
        }
        {
            const rate31 = new Rate();
            rate31.url = "/aboutus/awards";
            await rate31.save();

            const block = new Block();
            block.index=1
            block.url = "/aboutus/awards";
            await block.save();
        }
        {
            const rate31 = new Rate();
            rate31.url = "/aboutus/organizational";
            await rate31.save();

            const block = new Block();
            block.index=1
            block.url = "/aboutus/organizational";
            await block.save();
        }
        {
            const rate31 = new Rate();
            rate31.url = "/aboutus/law";
            await rate31.save();

            const block = new Block();
            block.index=1
            block.url = "/aboutus/law";
            await block.save();
        }
        {
            const rate31 = new Rate();
            rate31.url = "/participation/ideas";
            await rate31.save();

            const block = new Block();
            block.index=1
            block.url = "/participation/ideas";
            await block.save();
        }
        {
            const rate31 = new Rate();
            rate31.url = "/participation/thanks";
            await rate31.save();

            const block = new Block();
            block.index=1
            block.url = "/participation/thanks";
            await block.save();
        }
        {
            const rate31 = new Rate();
            rate31.url = "/participation/survey";
            await rate31.save();

            const block = new Block();
            block.index=1
            block.url = "/participation/survey";
            await block.save();
        }
        {
            const rate31 = new Rate();
            rate31.url = "/aboutus/partners";
            await rate31.save();

            const block = new Block();
            block.index=1
            block.url = "/aboutus/partners";
            await block.save();
        }

        const block = new Block();
            block.index=1
            block.url = "/home";
            await block.save();
    }
    public async down(queryRunner: QueryRunner): Promise<void> {}
}
