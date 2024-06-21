import { Column, Entity, ManyToOne } from "typeorm";
import { SharedFields } from "./SharedFields";
import { Survey } from "./Survey";
import { User } from "./User";

@Entity()
export class SurveyAnswer extends SharedFields {
    @Column({
        type: "jsonb",
        name: "answers",
        array: false,
        default: () => "'{}'",
        nullable: false,
    })
    answer;

    @Column({ nullable: true })
    ip: String;

    @ManyToOne((type) => User, (user) => user.id, { nullable: true })
    user: User;

    @ManyToOne((type) => Survey, (survey) => survey.answers, {
        onDelete: "CASCADE",
    })
    data: Survey;

    async deleteAllData() {
        const answer = await SurveyAnswer.findOne({
            where: { id: this.id },
            relations: ["title", "description"],
        });

        await answer.remove();
    }
}
