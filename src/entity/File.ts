import {
    BeforeRemove,
    Column,
    Entity,
    JoinColumn,
    ManyToMany,
    ManyToOne,
    OneToOne,
    JoinTable,
} from "typeorm";
import { Category } from "./Category";
import { FilesSet } from "./FilesSet";
import { Post } from "./Post";
import { SharedFields } from "./SharedFields";
import { TextData } from "./TextData";
import { ACL } from "./ACL"; // ACl reffer's to Access-control list
import { Career } from "./Career";
import { ServiceRequest } from "./ServiceRequest";
import { Survey } from "./Survey";
import { Replay } from "./Replay";
import { Rate } from "./Rate";
import { removeFileFromHardDisk } from "../controllers/file";
@Entity()
export class File extends SharedFields {
    @Column({ nullable: true })
    uuid: string;

    @Column({ nullable: true })
    smallUuid: string;

    @Column({ nullable: true })
    midUuid: string;

    @Column({ nullable: true })
    largeUuid: string;

    @Column({ nullable: true })
    link: string;

    @OneToOne(() => TextData, (text) => text.id, { cascade: true })
    @JoinColumn()
    alt: TextData;

    @Column({ nullable: true })
    size: number;

    @Column({ nullable: false, default: false })
    forUploader: Boolean;

    @Column({ nullable: true })
    mimetype: string;

    @Column({ nullable: true })
    source: string;

    @Column({ default: 0 })
    downloaded: number;

    @Column({ default: 0 })
    viewed: number;

    @Column("decimal", { default: 0 })
    rate: number;

    @Column({ default: 0 })
    rateCounts: number;

    @Column({ nullable: true })
    extension: string;

    @ManyToOne((type) => FilesSet, (set) => set.files, { onDelete: "CASCADE" })
    set: FilesSet;

    @ManyToOne((type) => Post, (post) => post.files, { onDelete: "CASCADE" })
    post: Post;

    @ManyToMany((type) => Rate, (rate) => rate.files, { onDelete: "CASCADE" })
    pages: Rate[];

    @ManyToOne((type) => Replay, (replay) => replay.files, {
        onDelete: "CASCADE",
    })
    replay: Replay;

    @ManyToOne((type) => Survey, (survey) => survey.files, {
        onDelete: "CASCADE",
    })
    survey: Survey;

    @ManyToOne((type) => Career, (career) => career.files, {
        onDelete: "CASCADE",
    })
    career: Career;

    @ManyToOne(() => Category, (category) => category.files, {
        onDelete: "CASCADE",
    })
    category: Category;

    @ManyToOne(() => Category, (category) => category.cardImages, {
        onDelete: "CASCADE",
    })
    categoryCard: Category;

    @ManyToOne((type) => Post, (post) => post.cardImages, {
        onDelete: "CASCADE",
    })
    postImage: Post;

    @ManyToOne(
        (type) => ACL,
        (acl) => {
            acl.id;
        },

        { onDelete: "SET NULL" }
    )
    @JoinColumn()
    acl: ACL;

    @ManyToOne((type) => ServiceRequest, (request) => request.files, {
        onDelete: "SET NULL",
    })
    @JoinColumn()
    request: ServiceRequest;

    deleteAllContent = async () => {
        if (this.id != 1 && this.id != 2 && this.id != 3) {
            await this.remove();
            if (this.title) await this.title.remove();
            if (this.description) await this.description.remove();
            if (this.alt) await this.alt.remove();
            try {
                removeFileFromHardDisk(this.uuid);
                if (this.smallUuid) removeFileFromHardDisk(this.smallUuid);
                if (this.midUuid) removeFileFromHardDisk(this.midUuid);
                if (this.largeUuid) removeFileFromHardDisk(this.largeUuid);
            } catch (error) {}
        }
    };
}
