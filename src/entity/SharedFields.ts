import moment = require("moment");
import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { TextData } from "./TextData";
import { User } from "./User";

@Entity()
export abstract class SharedFields extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => TextData, (text) => text.id, {
        nullable: true,
        cascade: true,
    })
    @JoinColumn()
    title: TextData;

    @OneToOne(() => TextData, (text) => text.id, {
        cascade: true,
        nullable: true,
    })
    @JoinColumn()
    description: TextData;

    @Column({ default: 0 })
    publishMode: number;

    @Column({ nullable: true })
    order: number;

    @Column({ default: false })
    isFeatured: boolean;

    @Column({ nullable: true, default: new Date() })
    startDate: Date;

    @Column({ nullable: true, default: moment().add(30, "years") })
    endDate: Date;

    @Column({ nullable: true })
    startTime: Date;

    @Column({ nullable: true })
    endTime: Date;

    @Column({ nullable: true })
    privateDate: Date;

    @Column()
    @CreateDateColumn()
    createdAt: Date;

    @Column()
    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, (user) => user.createdPosts, {
        onDelete: "SET NULL",
    })
    createdBy: User;

    @ManyToOne(() => User, (user) => user.updatedPosts, {
        onDelete: "SET NULL",
    })
    updatedBy: User;
}
