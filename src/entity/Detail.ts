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

import { TextData } from "./TextData";
import { Service } from "./Service";
import { Post } from "./Post";
import { File } from "./File";

@Entity()
export class Detail extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: 0 })
    publishMode: number;

    @Column({ default: 0 })
    cost: number;

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

    @ManyToOne((type) => Post, (post) => post.details, {
        onDelete: "CASCADE",
        nullable: true,
    })
    @JoinColumn()
    roomDetail: Post;

    @ManyToOne((type) => Post, (post) => post.facilites, {
        onDelete: "CASCADE",
        nullable: true,
    })
    @JoinColumn()
    roomFacility: Post;

    @Column({ nullable: true })
    date: Date;

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

    @OneToOne(() => File, (file) => file.id, {
        nullable: true,
        onDelete: "SET NULL",
        cascade: true,
    })
    @JoinColumn()
    photo: File;

    async deleteAllContent() {
        await this.remove();
        if (this.title) await this.title.remove();
        if (this.description) await this.description.remove();
    }
}
