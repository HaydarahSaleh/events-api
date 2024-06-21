import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    OneToMany,
    OneToOne,
    JoinColumn,
} from "typeorm";
import { Page } from "./Page";
import { Position } from "./Position";
import { TextData } from "./TextData";

@Entity()
export class Template extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => TextData, (text) => text.id, { cascade: true })
    @JoinColumn()
    title: TextData;

    @OneToMany((type) => Position, (position) => position.template, {
        cascade: true,
    })
    positions: Position[];

    @Column({ default: 0 })
    publishMode: number;
}
