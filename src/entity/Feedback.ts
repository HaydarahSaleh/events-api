import { IsOptional } from "class-validator";
import {
    Entity,
    Column,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    ManyToOne,
} from "typeorm";
import { Language } from "./enum/Language";
import { Rating } from "./enum/Rating";
import { FeedBackType } from "./enum/FeedBackType";
import { Rate } from "./Rate";
import { User } from "./User";

@Entity()
export class Feedback extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: "enum",
        enum: Object.values(FeedBackType),
    })
    type: FeedBackType;
    @ManyToOne((type) => Rate, (rate) => rate.feedbacks, {
        cascade: true,
        nullable: true,
    })
    @JoinColumn()
    rate: Rate;

    @Column({ nullable: false })
    ip: String;

    @Column({ nullable: true, type: "enum", enum: Object.values(Rating) })
    rating: Rating;

    @Column({ nullable: true })
    isUseful: boolean;

    @Column({ nullable: true })
    reason: string;

    @CreateDateColumn()
    createdAt: Date;
}
