// @ts-nocheck
import {
    Column,
    Entity,
    JoinColumn,
    ManyToMany,
    ManyToOne,
    OneToOne,
    CreateDateColumn,
    OneToMany,
} from "typeorm";
import { ACL } from "./ACL";
import { File } from "./File";
import { Post } from "./Post";
import { Rate } from "./Rate";
import { SharedFields } from "./SharedFields";
import { TextData } from "./TextData";
import { User } from "./User";
@Entity()
export class Writer extends SharedFields {
    @OneToMany((type) => Post, (post) => post.writer, {
        onDelete: "SET NULL",
        cascade: true,
    })
    @JoinColumn()
    posts: Post[];
    @OneToOne(() => TextData, (text) => text.id, {
        onDelete: "CASCADE",
        cascade: true,
    })
    @JoinColumn()
    summary: TextData;
    @OneToOne(() => File, (file) => file.id, {
        onDelete: "SET NULL",
        cascade: true,
    })
    @JoinColumn()
    image: File;

    @Column({ nullable: true, unique: true })
    alias: string;

    @OneToOne(() => Rate, (page) => page.id, { cascade: true })
    @JoinColumn()
    page: Rate;

    @ManyToOne(
        (type) => ACL,
        (acl) => {
            acl.id;
        }
    )
    @JoinColumn()
    acl: ACL;

    @ManyToOne((type) => User, (user) => user.requests, {
        nullable: true,
    })
    @JoinColumn()
    createdBy: User;

    @Column()
    @CreateDateColumn()
    createdAt: Date;

    @Column({ default: 0 })
    publishMode: number;

    async deleteAllContent() {
        const writer = await Writer.findOne({
            where: { id: this.id },
            relations: ["articles", "image", "page", "summary"],
        });

        await writer.remove();

        if (writer.page) await writer.page.removAll();
        if (writer.title) await writer.title.remove();
        if (writer.description) await writer.description.remove();
        if (writer.summary) await writer.summary.remove();
        if (writer.image) await writer.image.deleteAllContent();
    }
}
