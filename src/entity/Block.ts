import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Content } from "./content";
import { BlocksContentType } from "./enum/Block";
import { TextData } from "./TextData";
@Entity()
export class Block extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false, default: 1 })
    index: number;

    @Column({ nullable: true })
    url: string;

    @Column({ type: "enum", enum: BlocksContentType, nullable: true })
    contentType: BlocksContentType;

    @OneToMany(() => Content, (content) => content.block, {
        cascade: true,
    })
    contents: Content[];

    @OneToOne(() => TextData, (text) => text.id, {
        nullable: true,
        cascade: true,
    })
    @JoinColumn()
    title: TextData;

    removeAll = async () => {
        const block = await Block.findOne({
            where: { id: this.id },
            relations: ["contents"],
        });
        //    if (block.contents.length > 0) await Content.remove(block.contents);
        if (block.title) await block.title.remove();

        await block.remove();
    };
}
