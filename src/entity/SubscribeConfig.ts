import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    BaseEntity,
} from "typeorm";
import { Message } from "./MessageTemplate";
import { SMTPConfig } from "./SmtpConfig";

@Entity()
export class SubscribeConfig extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => SMTPConfig, (smtpConfig) => smtpConfig.subscribeConfigs)
    smtpConfig: SMTPConfig;

    @ManyToOne(() => Message, (message) => message.subscribeConfigs)
    MessageTempalte: Message;

    @Column()
    @CreateDateColumn()
    createdAt: Date;

    @Column()
    @UpdateDateColumn()
    updatedAt: Date;
}
