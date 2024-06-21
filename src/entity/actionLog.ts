import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { LogSource } from "./enum/LogSource";
import { Operation } from "./enum/Operation";
import { TextData } from "./TextData";
import { User } from "./User";

@Entity()
export class ActionLog extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => TextData, (text) => text.id, {
        onDelete: "CASCADE",
        cascade: true,
    })
    @JoinColumn()
    message: TextData;

    @OneToOne(() => TextData, (text) => text.id, {
        onDelete: "CASCADE",
        cascade: true,
        nullable: true,
    })
    @JoinColumn()
    title: TextData;

    @Column({
        type: "enum",
        enum: Operation,
        default: Operation.ADD,
    })
    operation;

    @Column({
        type: "enum",
        enum: LogSource,
        default: LogSource.EMPLOYEE,
    })
    source;

    @Column({ nullable: true })
    entityId: number;

    @ManyToOne(() => User, (user) => user.id, {
        onDelete: "SET NULL",
    })
    user: User;

    @Column()
    @CreateDateColumn()
    createdAt: Date;
}
