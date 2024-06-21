import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Unique,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity,
    JoinColumn,
    OneToMany,
    ManyToMany,
    ManyToOne,
} from "typeorm";
import { SubscribeConfig } from "../entity/SubscribeConfig";
import { User } from "./User";

@Entity()
export class Message extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    title: string;

    @Column({ nullable: true })
    subject: string;

    @Column({ nullable: true, type: "text" })
    content: string;

    @Column()
    @CreateDateColumn()
    createdAt: Date;

    @Column()
    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, (user) => user.id, {
        onDelete: "SET NULL",
    })
    createdBy: User;

    @ManyToOne(() => User, (user) => user.id, {
        onDelete: "SET NULL",
    })
    updatedBy: User;

    @OneToMany(
        () => SubscribeConfig,
        (subscribeConfig) => subscribeConfig.MessageTempalte
    )
    @JoinColumn()
    subscribeConfigs: SubscribeConfig[];
}
