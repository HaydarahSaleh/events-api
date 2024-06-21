import {
    Column,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    
} from "typeorm";
import { ACL } from "./ACL"; // ACl reffer's to Access-control list
import { Application } from "./Application";
import { Block } from "./Block";
import { CareerDepartment } from "./enum/CareerDepartment";
import { Careerlevel } from "./enum/CareerLevel";
import { File } from "./File";
import { Rate } from "./Rate";
import { SharedFields } from "./SharedFields";
import { TextData } from "./TextData";

@Entity()
export class Career extends SharedFields {
    @OneToOne(() => TextData, (text) => text.id, {
        onDelete: "CASCADE",
        cascade: true,
    })
    @JoinColumn()
    summary: TextData;

    @OneToOne(() => TextData, (text) => text.id, {
        onDelete: "CASCADE",
        cascade: true,
    })
    @JoinColumn()
    qualification: TextData;

    @OneToOne(() => TextData, (text) => text.id, {
        onDelete: "CASCADE",
        cascade: true,
    })
    @JoinColumn()
    conditions: TextData;

    @OneToOne(() => TextData, (text) => text.id, {
        onDelete: "CASCADE",
        cascade: true,
    })
    @JoinColumn()
    skills: TextData;

    @Column({
        type: "enum",
        enum: Careerlevel,
        nullable: true,
    })
    level: Careerlevel;

    @Column({
        type: "enum",
        enum: CareerDepartment,
        nullable: true,
    })
    department: CareerDepartment;

    @OneToOne(() => TextData, (text) => text.id, {
        onDelete: "CASCADE",
        cascade: true,
    })
    @JoinColumn()
    tasksAndResponsibilities: TextData;

    @OneToOne(() => TextData, (text) => text.id, { cascade: true })
    @JoinColumn()
    tags: TextData;

    @OneToOne(() => File, (file) => file.id, { cascade: true })
    @JoinColumn()
    pagePicture: File;

    @Column({ nullable: true })
    alias: string;

    @OneToMany((type) => File, (photo) => photo.career)
    files: File[];

    @OneToMany((type) => Application, (app) => app.career, {
        cascade: true,
    })
    applications: Application[];


    @DeleteDateColumn()
    deletedAt?: Date;

    @ManyToOne(
        (type) => ACL,
        (acl) => {
            acl.id;
        },
        { onDelete: "SET NULL" }
    )
    @JoinColumn()
    acl: ACL;

    @OneToOne(() => Rate, (rate) => rate.id, { cascade: true })
    @JoinColumn()
    rate: Rate;

    @OneToOne(() => Block, (block) => block.id, { cascade: true })
    @JoinColumn()
    block: Block;

    async deleteAllContent() {
        //photo isn't delete due to multiple use
        const career = await Career.findOne( {
               where:{id:this.id},
            relations: [
                "applications",
                "description",
                "files",
                "title",
                "summary",
                "tags",
                "rate",
                "acl",
            ],
        });
        if (career.applications)
            await Promise.all(
                career.applications.map(
                    async (application) => await application.deleteAllContent()
                )
            );

        if (career.files)
            await Promise.all(
                career.files.map(async (file) => {
                    return await file.deleteAllContent();
                })
            );
        await career.remove();

        if (career.rate) await career.rate.removAll();
        if (career.tags) await career.tags.remove();
        if (career.description) await career.description.remove();
        if (career.title && !career.rate) await career.title.remove();

        if (career.summary) await career.summary.remove();
    }
}
