import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { File } from "./File";
import { ServiceRequest } from "./ServiceRequest";
import { User } from "./User";
@Entity()
export class Replay extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    from: string;

    @Column()
    to: string;

    @Column({ nullable: false })
    subject: string;

    @Column({ nullable: false })
    message: string;

    @CreateDateColumn()
    createdAt: string;

    @ManyToOne(
        (type) => User,
        (user) => {
            user.id;
        },
        { nullable: false }
    )
    @JoinColumn()
    createdBy: User;

    @OneToMany((type) => File, (file) => file.replay)
    files: File[];

    @ManyToOne((type) => ServiceRequest, (request) => request.replays, {
        nullable: true,
    })
    @JoinColumn()
    request: ServiceRequest;

    async deleteAllContent() {
        await this.remove();
    }
}
