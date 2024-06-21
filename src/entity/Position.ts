import {
    BaseEntity,
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { ContentType } from "./enum/Type";
import { Template } from "./Template";
@Entity()
export class Position extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne((type) => Template, (t) => t.positions)
    template: Template;

    @Column({ default: 0 })
    publishMode: number;

    @Column()
    blockId: number;

    @Column({ nullable: true, default: null })
    contentId: number;

    @Column({ nullable: true, default: null })
    contentType: ContentType;

    @Column({ nullable: true, default: 0 })
    contentOrder: number;

    @Column({ type: "simple-array", nullable: true })
    viewers: number[];
}
