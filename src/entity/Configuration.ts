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
    UpdateDateColumn,
} from "typeorm";
import { ConfigurationType } from "./enum/Configuration";
import { TextData } from "./TextData";
import { User } from "./User";

@Entity()
export class Configuration extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => TextData, (text) => text.id, { cascade: true })
    @JoinColumn()
    title: TextData;

    @OneToOne(() => TextData, (text) => text.id, { cascade: true })
    @JoinColumn()
    @IsOptional()
    description: TextData;

    @Column({ unique: true })
    key: string;

    @Column({ nullable: true })
    value: string;

    @Column({ nullable: true, default: ConfigurationType.TEXT })
    type: ConfigurationType;

    @Column("simple-array", { nullable: true })
    choices: string[];

    @Column()
    @CreateDateColumn()
    createdAt: Date;

    @Column()
    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, (user) => user.createdConfigurations)
    createdBy: User;

    @ManyToOne(() => User, (user) => user.updatedConfigurations)
    updatedBy: User;

    async deleteAllData() {
        if (this.title) await this.title.remove();
        if (this.description) await this.description.remove();
    }
}
