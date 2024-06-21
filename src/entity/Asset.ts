import {
    Entity,
    Column,
    BaseEntity,
    PrimaryGeneratedColumn,
    ManyToMany,
    JoinTable,
    ManyToOne,
} from "typeorm";
import { Permission } from "./Permission";
import { UserGroup } from "./UserGroup";

@Entity()
export class Asset extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column({ nullable: true })
    label: string;

    @Column({ nullable: true })
    order: number;

    @ManyToOne((type) => Permission, (permission) => permission.asset)
    @JoinTable()
    permissions: Permission[];

    @Column({ default: false })
    main: Boolean;
}
