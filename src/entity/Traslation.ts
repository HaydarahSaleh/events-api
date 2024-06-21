import {
    BaseEntity,
    Column,
    Entity,
    JoinTable,
    ManyToMany,
    PrimaryGeneratedColumn,
} from "typeorm";
import ControllerException from "../exceptions/ControllerException";
import { Post } from "./Post";

@Entity()
export class Translation extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: "jsonb",
        array: false,
        default: () => "'{}'",
        nullable: true,
    })
    translations;
}
