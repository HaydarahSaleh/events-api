import {
    Entity,
    Column,
    OneToMany,
    OneToOne,
    JoinColumn,
    ManyToOne,
    AfterRemove,
    ManyToMany,
    JoinTable,
} from "typeorm";
import { Category } from "./Category";
import { SharedFields } from "./SharedFields";
import { PostType } from "./enum/Type";
import { Feedback } from "./Feedback";
import { TextData } from "./TextData";
import { Comment } from "./Comment";
import { Link } from "./Link";
import { File } from "./File";
import { ACL } from "./ACL";
import { Permission } from "./Permission";
import { Request } from "./Request";
import { Rate } from "./Rate";
import { Detail } from "./Detail";
import { Block } from "./Block";
import { Writer } from "./Writer";
import moment = require("moment");
import { Winner } from "./Winner";
@Entity()
export class Post extends SharedFields {
    @OneToOne(() => TextData, (text) => text.id, { cascade: true })
    @JoinColumn()
    fullText: TextData;

    @OneToOne(() => TextData, (text) => text.id, { cascade: true })
    @JoinColumn()
    link: TextData;
    @OneToOne(() => TextData, (text) => text.id, { cascade: true })
    @JoinColumn()
    linkType: TextData;
    @OneToOne(() => TextData, (text) => text.id, { cascade: true })
    @JoinColumn()
    locationName: TextData;

    @OneToOne(() => TextData, (text) => text.id, { cascade: true })
    @JoinColumn()
    caption: TextData;

    @OneToMany(() => Comment, (comment) => comment.post)
    comments: Comment[];

    @OneToOne(() => TextData, (text) => text.id, { cascade: true })
    @JoinColumn()
    consultation: TextData;
    @OneToOne(() => TextData, (text) => text.id, { cascade: true })
    @JoinColumn()
    objective: TextData;
    @OneToOne(() => TextData, (text) => text.id, { cascade: true })
    @JoinColumn()
    decision: TextData;

    @OneToOne(() => File, (file) => file.id, {
        cascade: true,
        onDelete: "SET NULL",
    })
    @JoinColumn()
    pagePicture: File;

    @OneToOne(() => TextData, (text) => text.id, { cascade: true })
    @JoinColumn()
    tags: TextData;

    @ManyToOne(() => Category, (category) => category.posts, {
        onDelete: "CASCADE",
    })
    category: Category;

    @Column({ nullable: true })
    activeFrom: Date;

    @Column({ nullable: true })
    activeTo: Date;

    @Column({ nullable: true })
    sector: String;

    @Column({
        type: "enum",
        enum: Object.values(PostType),
    })
    type: PostType;

    @Column({ nullable: true, unique: true })
    alias: string;

    @Column({ nullable: true })
    liveBroadCastLink: string;

    // @OneToOne((type) => FilesSet, { onDelete: "CASCADE" })
    // @JoinColumn()
    // filesSet: FilesSet;

    @ManyToOne(
        (type) => ACL,
        (acl) => {
            acl.id;
        },
        { onDelete: "SET NULL" }
    )
    @JoinColumn()
    acl: ACL;

    @OneToMany((type) => Link, (link) => link.post)
    links: Link[];

    /*   @OneToMany((type) => Permission, (permission) => permission.post)
    permissions: Permission[]; */

    @OneToMany((type) => File, (file) => file.post)
    files: File[];

    @OneToMany((type) => File, (file) => file.postImage)
    cardImages: File[];

    @OneToOne(() => Rate, (rate) => rate.id, { cascade: true })
    @JoinColumn()
    rate: Rate;

    @Column({ default: false })
    allowComment: boolean;

    @Column({ default: 0 })
    viewCount: number;

    @Column({
        type: "jsonb",
        array: false,
        default: () => "'{}'",
        nullable: true,
    })
    extraData;

    @OneToMany((type) => Detail, (detail) => detail.roomDetail, {
        nullable: true,
    })
    details: Detail[];

    @OneToMany((type) => Detail, (detail) => detail.roomFacility, {
        nullable: true,
    })
    facilites: Detail[];

    @OneToOne(() => Block, (block) => block.id, { cascade: true })
    @JoinColumn()
    block: Block;

    @Column({ nullable: true })
    newsLink: string;

    @Column({ nullable: true })
    photoGalleryLink: string;

    @Column({ nullable: true })
    videoGalleryLink: string;

    @Column({ nullable: true })
    surveyLink: string;

    @ManyToOne((type) => Writer, (writer) => writer.posts, {
        //check
        onDelete: "CASCADE",
    })
    writer: Writer;

    @OneToMany((winner) => Winner, (winner) => winner.initiative, {})
    winners: Winner[];

    async deleteAllContent() {
        const record = await Post.findOne({
            where: { id: this.id },
            relations: [
                "links",
                "rate",
                "block",
                "fullText",
                "tags",
                "description",
                "title",
                "objective",
                "decision",
                "caption",
                "consultation",

                "pagePicture",
                "files",

                "facilites",
                "details",
            ],
        });

        if (record.links)
            await Promise.all(
                record.links.map(async (link) => {
                    return await link.deleteAllContent();
                })
            );
        if (record.files)
            await Promise.all(
                record.files.map(async (file) => {
                    return await file.deleteAllContent();
                })
            );

        /*   if (this.requests)
            await Promise.all(
                this.requests.map(async (request) => {
                    return await request.deleteAlContent();
                })
            ); */

        await record.remove();

        if (record.pagePicture) await record.pagePicture.deleteAllContent();
        if (record.block) await record.block.removeAll();
        if (record.rate) await record.rate.removAll();
        if (record.title) await record.title.remove();
        if (record.description) await record.description.remove();
        if (record.tags) await record.tags.remove();
        if (record.fullText) await record.fullText.remove();

        if (record.objective) await record.objective.remove();
        if (record.decision) await record.decision.remove();
        if (record.caption) await record.caption.remove();
        if (record.consultation) await record.consultation.remove();
    }
}
