import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    JoinColumn,
    OneToOne,
    BaseEntity,
    ManyToOne,
    BeforeRemove,
    AfterRemove,
} from "typeorm";

import { File } from "./File";
import { Career } from "./Career";
import { fileRouter } from "../routes/file";

@Entity()
export class Application extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    gender: string;

    @Column()
    nationality: string;

    @Column()
    religon: string;

    @Column()
    dateOfBirth: Date;

    @Column()
    placeOfBirth: string;

    @Column()
    phone: string;

    @Column({ nullable: true })
    homeNumber: string;

    @Column()
    email: string;

    @Column({ nullable: true })
    residentCountry: string;

    @Column({ nullable: true })
    residentCity: string;

    @Column({ nullable: true })
    experienceYears: number;

    @Column({ nullable: true })
    qualification: string;

    @Column({ nullable: true })
    skybeId: string;

    @Column()
    currentLocation: string;

    @ManyToOne(() => Career, (career) => career.applications, {})
    @JoinColumn()
    career: Career;

    @OneToOne((type) => File, (cv) => cv.id, {
        cascade: true,
        nullable: true,
    })
    @JoinColumn()
    cv: File;

    @OneToOne((type) => File, (photo) => photo.id, {
        cascade: true,
        nullable: true,
    })
    @JoinColumn()
    photo: File;

    async deleteAllContent() {
        //files is deleted because it is logicaly unique
        const application = await Application.findOne({
            where:{id:this.id},
            relations: ["cv", "photo"],
        });
        await application.remove();
        if (application.photo) await application.photo.deleteAllContent();
        if (application.cv) await application.cv.deleteAllContent();
    }
}
