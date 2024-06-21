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
} from "typeorm";

import { SharedFields } from "./SharedFields";
import { Post } from "./Post";
import { Language } from "./enum/Language";
import { User } from "./User";

@Entity()
export class Comment extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    email: string;

    @Column()
    name: string;

    @Column({ default: 0 })
    isPublished: boolean;

    @Column()
    data: string;

    @Column()
    postLanguage: Language;

    @Column()
    @CreateDateColumn()
    createdAt: Date;

    @Column()
    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, (user) => user.createdComments)
    createdBy: User;

    @ManyToOne(() => User, (user) => user.updatedComments)
    updatedBy: User;

    @ManyToOne(() => Post, (post) => post.comments, {
        onDelete: "CASCADE",
        cascade: true,
    })
    @JoinColumn()
    post: Post;
}
