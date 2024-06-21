import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    AfterLoad,
    BeforeInsert,
    BeforeUpdate,
    ManyToOne,
} from "typeorm";
import { ContentType } from "../entity/enum/Type";
import { SharedFields } from "./SharedFields";
import { Template } from "./Template";

@Entity()
export class Page extends SharedFields {
    @Column({ nullable: true })
    templateId: number;

    @Column({ nullable: true })
    alias: string;

    @Column({ nullable: true })
    contentId: number;

    @Column({ nullable: true })
    contentType: ContentType;

    @Column({ default: 0 })
    viewCount: number;

    @AfterLoad()
    updateCounters() {
        this.viewCount += 1;
    }
}
