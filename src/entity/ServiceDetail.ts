import {
    Entity,
    Column,
    JoinColumn,
    ManyToOne,
    OneToMany,
    BaseEntity,
    PrimaryColumn,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
} from "typeorm";

import { User } from "./User";

import { SharedFields } from "./SharedFields";
import { Language } from "./enum/Language";
import { TextData } from "./TextData";
import { Service } from "./Service";
import { ConfigurationType } from "../entity/enum/Configuration";

@Entity()
export class ServiceDetail extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @CreateDateColumn()
    createdAt: Date;

    @Column()
    @UpdateDateColumn()
    updatedAt: Date;

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

    @ManyToOne((type) => Service, (service) => service.details, {
        onDelete: "CASCADE",
        nullable: true,
    })
    service: Service;

    @ManyToOne(() => User, {
        onDelete: "SET NULL",
    })
    @JoinColumn()
    createdBy: User;

    @ManyToOne(() => User, {
        onDelete: "SET NULL",
    })
    @JoinColumn()
    updatedBy: User;

    async deleteAllContent() {
        await this.remove();
        if (this.title) await this.title.remove();
        if (this.description) await this.description.remove();
    }
}
