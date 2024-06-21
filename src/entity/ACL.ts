import {
    Entity,
    Column,
    BaseEntity,
    PrimaryGeneratedColumn,
    ManyToMany,
    JoinTable,
    ManyToOne,
} from "typeorm";
import { User } from "./User";
import { UserGroup } from "./UserGroup";

@Entity()
export class ACL extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @ManyToMany((type) => UserGroup, (userGroup) => userGroup.acls)
    @JoinTable()
    userGroups: UserGroup[];

    @ManyToOne(() => User, (user) => user.id, {
        onDelete: "SET NULL",
    })
    createdBy: User;

    @ManyToOne(() => User, (user) => user.id, {
        onDelete: "SET NULL",
    })
    updatedBy: User;
}
