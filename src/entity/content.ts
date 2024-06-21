import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";

import { Block } from "./Block";
@Entity()
export class Content extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(
        (type) => Block,
        (block) => {
            block.contents;
        },
        { onDelete: "CASCADE" }
    )
    @JoinColumn()
    block: Block;

    @Column()
    contentId: Number;
}
