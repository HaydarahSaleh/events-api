import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { NoteType } from "./enum/NoteType";
import { ServiceRequest } from "./ServiceRequest";
import { User } from "./User";

@Entity()
export class Note extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    note: string;

    @Column()
    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User, (user) => user.createdComments)
    createdBy: User;

    @Column({ type: "enum", enum: Object.values(NoteType) })
    type: NoteType;

    @ManyToOne((type) => ServiceRequest, (request) => request.notes, {
        onDelete: "CASCADE",
    })
    @JoinColumn()
    serviceRequest: ServiceRequest;

    deleteAll = async () => {
        const id = this.id;
        const note = await Note.findOne({ where: { id: this.id } });

        await note.remove();
        return id;
    };
}
