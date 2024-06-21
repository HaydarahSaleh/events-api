import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity,
    OneToMany,
    JoinColumn,
} from "typeorm";
import { Length } from "class-validator";
import { SubscribersDetails } from "./SubscribersDetails";

@Entity()
export class Subscriber extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    email: String;

    @Column({ default: false })
    isBlocked: boolean;

    @OneToMany(() => SubscribersDetails, (subject) => subject.subscriber, {
        cascade: true,
    })
    @JoinColumn()
    subjects: SubscribersDetails[];

    @Column()
    @CreateDateColumn()
    createdAt: Date;

    @Column()
    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ default: false })
    emailConfirmed: boolean;

    @Column({ nullable: true, select: false })
    @Length(6)
    emailConfirmationCode: string;

    @Column({ nullable: true, select: false })
    emailConfirmationCodeDate: Date;
}
