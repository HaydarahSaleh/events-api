import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    BaseEntity,
    OneToMany,
    JoinColumn,
} from "typeorm";
import { User } from "./User";
import { SubscribeConfig } from "./SubscribeConfig";

@Entity()
export class SMTPConfig extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    email: string;

    @Column()
    name: string;

    @Column()
    host: string;

    @Column()
    port: number;

    @Column()
    encryption: string;

    @Column({ nullable: true })
    secure: string;

    @Column({ nullable: true })
    username: string;

    @Column({ nullable: true })
    password: string;

    @Column()
    @CreateDateColumn()
    createdAt: Date;

    @Column()
    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, (user) => user.createdSMTPConfigs)
    createdBy: User;

    @ManyToOne(() => User, (user) => user.updatedSMTPConfigs)
    updatedBy: User;

    @OneToMany(
        () => SubscribeConfig,
        (subscribeConfig) => subscribeConfig.smtpConfig
    )
    @JoinColumn()
    subscribeConfigs: SubscribeConfig[];
}
