import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { File } from "./File";
import { Post } from "./Post";
import { TextData } from "./TextData";
@Entity()
export class Winner extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne((type) => TextData, (name) => name.id, {
        cascade: true,
        onDelete: "CASCADE",
    })
    @JoinColumn()
    name: TextData;

    @OneToOne((type) => TextData, (description) => description.id, {
        cascade: true,
        onDelete: "CASCADE",
    })
    @JoinColumn()
    description: TextData;

    @Column()
    @CreateDateColumn()
    createdAt: Date;

    @OneToOne((type) => TextData, (position) => position.id, {
        cascade: true,
        onDelete: "CASCADE",
    })
    @JoinColumn()
    position: TextData;

    @Column()
    year: Date;

    @ManyToOne(() => Post, (post) => post.winners, { onDelete: "CASCADE" })
    @JoinColumn()
    initiative: Post;

    @OneToOne(() => File, (file) => file.id, {
        onDelete: "SET NULL",
        cascade: true,
    })
    @JoinColumn()
    image: File;
}
