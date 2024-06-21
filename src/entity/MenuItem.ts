import {
    Entity,
    Column,
    ManyToOne,
    Tree,
    TreeParent,
    TreeChildren,
    JoinColumn,
    OneToOne,
} from "typeorm";
import { SharedFields } from "./SharedFields";
import { MenuItemType } from "./enum/Type";
import { ACL } from "./ACL"; // ACl reffer's to Access-control list
import { File } from "./File";
import { Block } from "./Block";
@Entity()
export class MenuItem extends SharedFields {
    @Column({
        nullable: true,
        type: "enum",
        enum: Object.values(MenuItemType),
    })
    linkType: MenuItemType;

    @Column({ nullable: true })
    link: string;

    @TreeParent()
    parent: MenuItem;

    @TreeChildren()
    childrens: MenuItem[];

    @Column({
        type: "jsonb",
        array: false,
        default: () => "'{}'",
        nullable: true,
    })
    menuObject;

    @ManyToOne(
        (type) => ACL,
        (acl) => {
            acl.id;
        },
        { onDelete: "SET NULL" }
    )
    @JoinColumn()
    acl: ACL;

    @Column({ nullable: true })
    depth: number;

    @Column({ default: 0 })
    newTap: number;

    @OneToOne(() => File, (file) => file.id, { cascade: true })
    @JoinColumn()
    pagePicture: File;

    @Column({ default: "" })
    adminType: string;
}
