// @ts-nocheck
import {
    Column,
    Entity,
    JoinColumn,
    ManyToMany,
    ManyToOne,
    OneToOne,
    CreateDateColumn,
} from "typeorm";
import { ACL } from "./ACL";
import { TrusteeType } from "./enum/Type";
import { File } from "./File";
import { Rate } from "./Rate";
import { SharedFields } from "./SharedFields";
import { TextData } from "./TextData";
import { User } from "./User";
@Entity()
export class Trustees extends SharedFields {
    @OneToOne(() => File, (file) => file.id, {
        onDelete: "SET NULL",
        cascade: true,
    })
    @JoinColumn()
    image: File;

    @Column({ nullable: true, unique: true })
    alias: string;

    @Column({ nullable: true, unique: true })
    url: string;

    @OneToOne(() => TextData, (text) => text.id, { cascade: true })
    @JoinColumn()
    position: TextData;

    @OneToOne(() => TextData, (text) => text.id, { cascade: true })
    @JoinColumn()
    speach: TextData;

    @Column({ nullable: true })
    location: string;

    @Column({ nullable: true })
    telephone: string;

    @Column({ nullable: true })
    mobile: string;

    @Column({ nullable: true })
    email: string;

    @OneToOne(() => Rate, (page) => page.id, { cascade: true })
    @JoinColumn()
    page: Rate;

    @Column({
        type: "enum",
        enum: Object.values(TrusteeType),
    })
    type: TrusteeType;

    @ManyToOne(
        (type) => ACL,
        (acl) => {
            acl.id;
        }
    )
    @JoinColumn()
    acl: ACL;

    @ManyToOne((type) => User, (user) => user.requests, {
        nullable: true,
    })
    @JoinColumn()
    createdBy: User;

    @Column()
    @CreateDateColumn()
    createdAt: Date;

    async deleteAllContent() {
        const trustee = await Trustees.findOne({
            where: { id: this.id },
            relations: ["image", "page", "speach", "title", "position"],
        });

        await trustee.remove();

        if (trustee.page) await trustee.page.removAll();
        if (trustee.title) await trustee.title.remove();
        if (trustee.position) await trustee.position.remove();
        if (trustee.speach) await trustee.speach.remove();
        if (trustee.image) await trustee.image.deleteAllContent();
    }
}
