import { BeforeUpdate } from "typeorm";
import {
    AfterInsert,
    AfterLoad,
    AfterUpdate,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    TreeChildren,
    TreeParent,
} from "typeorm";
import { ACL } from "./ACL";
import { Configuration } from "./Configuration";
import { ContentType, SubType } from "./enum/Type";
import { File } from "./File";
import { Permission } from "./Permission";
import { Post } from "./Post";
import { Link } from "./Link";
import { Service } from "./Service";
import { SharedFields } from "./SharedFields";
import { TextData } from "./TextData";
import { Rate } from "./Rate";
import { Block } from "./Block";
@Entity()
export class Category extends SharedFields {
    @OneToMany((type) => Post, (post) => post.category, { cascade: true })
    posts: Post[];

    @OneToMany((type) => Link, (link) => link.category, { cascade: true })
    links: Link[];

    @OneToMany(() => File, (file) => file.category, { onDelete: "SET NULL" })
    files: File[];

    @OneToMany(() => File, (file) => file.categoryCard, {
        onDelete: "SET NULL",
    })
    cardImages: File[];

    @OneToMany((type) => Service, (service) => service.serviceCategory, {
        cascade: true,
    })
    services: Service[];

    // @OneToOne((type) => FilesSet, { onDelete: "CASCADE" })
    // @JoinColumn()
    // filesSet: FilesSet;
    @ManyToOne(() => ACL, (acl) => acl.id, { onDelete: "SET NULL" })
    @JoinColumn()
    acl: ACL;

    @OneToOne(() => File, (file) => file.id, { cascade: true })
    @JoinColumn()
    pagePicture: File;

    @OneToOne(() => Rate, (rate) => rate.id, { cascade: true })
    @JoinColumn()
    rate: Rate;

    @OneToOne(() => TextData, (text) => text.id, { onDelete: "SET NULL" })
    @JoinColumn()
    tags: TextData;

    // @OneToMany((type) => Permission, (permission) => permission.category, {
    //     cascade: true,
    // })
    // permissions: Permission[];

    @Column({ nullable: true })
    alias: string;

    @Column({
        type: "enum",
        enum: ContentType,
        nullable: true,
        default: ContentType.POST,
    })
    type: ContentType;

    @Column({
        type: "enum",
        enum: SubType,
        nullable: true,
    })
    subType: SubType;

    @TreeParent()
    parent: Category;

    @TreeChildren()
    childrens: Category[];

    @Column("simple-array", { nullable: true })
    extensions: string[];

    @Column({ nullable: true })
    @JoinColumn()
    maxSize: number;

    @Column({ nullable: true })
    depth: number;

    @OneToOne(() => Block, (block) => block.id, { cascade: true })
    @JoinColumn()
    block: Block;
}

// -- FUNCTION: public.text_data_tsvector_trigger()

// -- DROP FUNCTION public.text_data_tsvector_trigger();

// CREATE FUNCTION public.text_data_tsvector_trigger()
//     RETURNS trigger
//     LANGUAGE 'plpgsql'
//     COST 100
//     VOLATILE NOT LEAKPROOF
// AS $BODY$
// begin

//   new.document_with_weights :=
// --   setweight(to_tsvector('english', coalesce(new.ar, '')), 'A')
//    setweight(to_tsvector('english', coalesce(new.en, '')), 'B');
//   return new;
// end
// $BODY$;

// ALTER FUNCTION public.text_data_tsvector_trigger()
//     OWNER TO postgres;
