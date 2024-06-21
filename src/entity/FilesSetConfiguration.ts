import {
    Entity,
    Column,
    OneToOne,
    JoinColumn,
    PrimaryGeneratedColumn,
    BaseEntity,
    OneToMany,
    Index,
} from "typeorm";
import { PostType } from "./enum/Type";
import { FilesSet } from "./FilesSet";
import { SharedFields } from "./SharedFields";

@Entity()
export class FilesSetConfiguration extends SharedFields {
    @Column("simple-array", { nullable: true })
    availableExtensions: string[];

    @Column({ default: 1 })
    minFiles: number;

    @Column({ default: 1 })
    maxFiles: number;

    @Column({ nullable: true })
    @Index()
    designedForPostType: PostType;

    @OneToMany((type) => FilesSet, (set) => set.configuration)
    filesSets: FilesSet[];
}
