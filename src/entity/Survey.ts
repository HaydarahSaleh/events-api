import {
    Column,
    Entity,
    JoinColumn,
    OneToMany,
    OneToOne,
    ManyToOne,
    BeforeRemove,
    AfterRemove,
} from "typeorm";
import { SharedFields } from "./SharedFields";
import { SurveyAnswer } from "./SurveyAnswer";
import { ACL } from "./ACL"; // ACl reffer's to Access-control list
import { TextData } from "./TextData";
import { SurveyType } from "./enum/SurveyType";
import { File } from "./File";
import { Rate } from "./Rate";

@Entity()
export class Survey extends SharedFields {
    @Column({
        type: "jsonb",
        array: false,
        default: () => "'{}'",
        nullable: true,
    })
    questions;

    @Column({
        type: "enum",
        enum: Object.values(SurveyType),
        default: SurveyType.SURVEY,
    })
    type: SurveyType;

    @OneToMany((type) => SurveyAnswer, (survey) => survey.data, {
        cascade: true,
    })
    answers: SurveyAnswer[];

    @OneToOne(() => File, (file) => file.id, { cascade: true })
    @JoinColumn()
    pagePicture: File;

    @Column({ default: false })
    accessAsPrivate: Boolean;

    @OneToOne(() => TextData, (text) => text.id, { cascade: true })
    @JoinColumn()
    tags: TextData;

    @Column({ nullable: true })
    alias: string;

    @Column({ default: 0 })
    copiedVersion: number;

    @ManyToOne(
        (type) => ACL,
        (acl) => {
            acl.id;
        },
        { onDelete: "SET NULL" }
    )
    @JoinColumn()
    acl: ACL;

    @OneToOne(() => Rate, (rate) => rate.id, {
        cascade: true,
        onDelete: "SET NULL",
    })
    @JoinColumn()
    rate: Rate;

    @OneToMany((type) => File, (file) => file.survey)
    files: File[];

    async deleteAllData() {
        const survey = await Survey.findOne({
            where: { id: this.id },
            relations: ["answers", "title", "description", "tags", "rate"],
        });

        if (survey.answers)
            await Promise.all(
                survey.answers.map(async (answer) => {
                    return await answer.deleteAllData();
                })
            );

        await this.remove();
        if (survey.rate) await survey.rate.removAll();
        if (survey.title) await survey.title.remove();
        if (survey.description) await survey.description.remove();
        if (survey.tags) await survey.tags.remove();
    }
}
