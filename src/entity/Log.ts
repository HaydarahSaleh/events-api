import {
    Entity,
    Column,
    ManyToOne,
    JoinColumn,
    OneToOne,
    BaseEntity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
} from "typeorm";
import { User } from "./User";
import { ServiceRequest } from "../entity/ServiceRequest";
import { TextData } from "./TextData";
@Entity()
export class Log extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne((type) => User, (user) => user.id, { nullable: false })
    createdBy: User;

    @OneToOne((type) => TextData, (message) => message.id, {
        nullable: true,
        cascade: true,
    })
    @JoinColumn()
    message: TextData;

    @ManyToOne((type) => ServiceRequest, (request) => request.id, {
        nullable: false,
    })
    request: ServiceRequest;

    async deleteAllContent() {
        const log = await Log.findOne({ where: { id: this.id } });
        if (log.message) await log.message.remove();

        await log.remove();
    }
}
