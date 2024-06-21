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
import { ChannelType } from "./enum/ChannelType";
import { File } from "./File";
import { TextData } from "./TextData";
import { User } from "./User";

@Entity()
export class Channel extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => TextData, (text) => text.id, {
        nullable: true,
        cascade: true,
    })
    @JoinColumn()
    title: TextData;

    @Column()
    @CreateDateColumn()
    createdAt: Date;

    @OneToOne(() => File, (file) => file.id, {
        onDelete: "SET NULL",
        cascade: true,
    })
    @JoinColumn()
    file: File;

    @ManyToOne(() => User, (user) => user.id, {
        onDelete: "SET NULL",
    })
    createdBy: User;

    @Column({ default: 0 })
    publishMode: number;

    @Column({ nullable: true })
    order: number;

    @Column({ nullable: false })
    value: string;

    @Column({ nullable: false, default: ChannelType.LINK })
    type: ChannelType;

    deleteAllContent = async () => {
        const channel = await Channel.findOne({
            where: { id: this.id },
            relations: ["title", "file"],
        });
        await channel.remove();
        if (channel.title) await channel.title.remove();
        if (channel.file) await channel.file.deleteAllContent();
    };
}
