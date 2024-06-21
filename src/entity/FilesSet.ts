import {
    Entity,
    OneToOne,
    JoinColumn,
    PrimaryGeneratedColumn,
    BaseEntity,
    OneToMany,
    Column,
    ManyToOne,
} from "typeorm";
import { File } from "./File";
import { FilesSetConfiguration } from "./FilesSetConfiguration";
import { Post } from "./Post";
import { SharedFields } from "./SharedFields";

@Entity()
export class FilesSet extends SharedFields {
    @ManyToOne((type) => FilesSetConfiguration, (config) => config.id, {
        nullable: true,
    })
    configuration: FilesSetConfiguration;

    @OneToMany((type) => File, (file) => file.set, { onDelete: "CASCADE" })
    files: File[];

    @Column({ default: false })
    complete: boolean;
}
