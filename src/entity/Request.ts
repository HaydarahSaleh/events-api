import {
    Entity,
    Column,
    JoinColumn,
    ManyToOne,
    BaseEntity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    AfterRemove,
} from "typeorm";

import { SharedFields } from "./SharedFields";
import { Post } from "./Post";
import { Language } from "./enum/Language";
import { User } from "./User";
import { File } from "./File";

@Entity()
export class Request extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    email: string;

    @Column()
    descreption: string;
    /* 
    @Column()
    postLanguage: Language; */

    @ManyToOne(() => Post, (post) => post.comments, {
        onDelete: "CASCADE",
        cascade: true,
    })
    /*   @ManyToOne(() => Post, (post) => post.requests, {
        onDelete: "CASCADE",
        cascade: true,
    })
    @JoinColumn()
    post: Post; */
    @Column()
    @CreateDateColumn()
    createdAt: Date;

    @Column()
    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, (user) => user.createdPosts)
    createdBy: User;

    @ManyToOne(() => User, (user) => user.updatedPosts)
    updatedBy: User;

    @OneToOne((type) => File, (uploadedFile) => uploadedFile.id, {
        cascade: true,
        nullable: true,
    })
    @JoinColumn()
    uploadedFile: File;

    async deleteAlContent() {
        const request = await Request.findOne({
            where: { id: this.id },
            relations: ["uploadedFile"],
        });
        await request.remove();
        if (request.uploadedFile) await request.uploadedFile.deleteAllContent();
    }
}
