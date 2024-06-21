import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    OneToMany,
    OneToOne,
    JoinColumn,
    UpdateDateColumn,
    ManyToOne,
    ManyToMany,
    JoinTable,
} from "typeorm";
import { Feedback } from "./Feedback";
import { File } from "./File";
import { Post } from "./Post";
import { TextData } from "./TextData";
import { User } from "./User";

@Entity()
export class Rate extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("decimal", { default: 0 })
    rate: number;

    @Column({ default: 0, nullable: true })
    votersCount: number;

    @Column()
    url: string;

    @OneToMany((type) => Feedback, (feedback) => feedback.rate, {})
    feedbacks: Feedback[];

    @Column({ default: true })
    askForRating: boolean;

    @Column({ default: 0, nullable: true })
    isUseFullVoters: number;

    @Column({ default: 0, nullable: true })
    yesVoters: number;

    @Column({ default: true })
    askIfIsUseful: boolean;

    @Column({ default: true })
    havePicture: boolean;

    @OneToOne(() => File, (file) => file.id, {
        onDelete: "SET NULL",
        cascade: true,
    })
    @JoinColumn()
    pagePicture: File;

    @ManyToMany((type) => File, (file) => file.pages)
    @JoinTable()
    files: File[];

    @Column()
    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToMany(() => User, (user) => user.updatedPosts, {
        onDelete: "SET NULL",
    })
    @JoinTable()
    updatedBy: User;

    @OneToOne(() => TextData, (text) => text.id, {
        nullable: true,
        cascade: true,
        onDelete: "SET NULL",
    })
    @JoinColumn()
    title: TextData;

    async removAll() {
        const rate = await Rate.findOne({
            where: { id: this.id },
            relations: [
                "title",
                "updatedBy",
                "files",
                "pagePicture",
                "feedbacks",
            ],
        });
        if (rate.feedbacks)
            await Promise.all(
                rate.feedbacks.map(async (feedBack) => {
                    return await feedBack.remove();
                })
            );
        await rate.remove();
    }
}
