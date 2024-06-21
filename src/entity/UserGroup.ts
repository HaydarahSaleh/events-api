import {
    Entity,
    Tree,
    TreeParent,
    TreeChildren,
    Column,
    BaseEntity,
    PrimaryGeneratedColumn,
    JoinTable,
    ManyToMany,
    Unique,
    OneToMany,
    ManyToOne,
} from "typeorm";

import { ACL } from "./ACL"; // ACl reffer's to Access-control list
import { ServiceRole } from "./enum/serviceRole";
import { Notification } from "./Notification";
import { Permission } from "./Permission";
import { User } from "./User";
@Entity()
export class UserGroup extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column({ nullable: true })
    order: number;

    @ManyToMany((type) => User, (user) => user.groups, { cascade: true })
    @JoinTable()
    users: User[];

    @Column({ type: "enum", enum: ServiceRole, nullable: true })
    serviceRole: ServiceRole;

    @ManyToMany((type) => Notification, (notifiaction) => notifiaction.groups, {
        cascade: true,
        onDelete: "SET NULL",
    })
    @JoinTable()
    notifications: Notification[];

    @ManyToMany((type) => ACL, (acl) => acl.userGroups, { cascade: true })
    acls: ACL[];

    @OneToMany((type) => Permission, (permission) => permission.userGroup, {
        onDelete: "CASCADE",
    })
    permissions: Permission[];

    @TreeParent()
    parent: UserGroup;

    @TreeChildren()
    childrens: UserGroup[];

    @Column({ nullable: true })
    depth: number;

    @ManyToOne(() => User, (user) => user.id, {
        onDelete: "SET NULL",
    })
    createdBy: User;

    @ManyToOne(() => User, (user) => user.id, {
        onDelete: "SET NULL",
    })
    updatedBy: User;

    async removeAll() {
        const permissions = await Permission.find({
            where: { userGroup: { id: this.id } },
        });

        await Permission.remove(permissions);
        await this.remove();
    }
}
