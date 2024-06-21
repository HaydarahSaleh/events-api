import {
    Entity,
    Column,
    ManyToOne,
    JoinColumn,
    OneToOne,
    BaseEntity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToMany,
    JoinTable,
} from "typeorm";
import { User } from "./User";
import { ServiceRequest } from "../entity/ServiceRequest";
import { TextData } from "./TextData";
import { UserGroup } from "./UserGroup";
@Entity()
export class Notification extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne((type) => TextData, (message) => message.id, {
        nullable: true,
        cascade: true,
    })
    @JoinColumn()
    message: TextData;

    @ManyToMany((type) => UserGroup, (group) => group.notifications, {
        nullable: false,
        onDelete: "SET NULL",
    })
    groups: UserGroup[];

    @Column({ default: false })
    seen: boolean;

    @Column({ default: false })
    forUser: boolean;
    @Column({ default: false })
    seenByUser: boolean;

    @ManyToOne((type) => User, (user) => user.id, { nullable: true })
    @JoinColumn()
    seenBy: User;

    @CreateDateColumn()
    craetedAt: Date;

    @ManyToOne((type) => ServiceRequest, (request) => request.id, {
        nullable: true,
    })
    @JoinColumn()
    serviceRequest: ServiceRequest;

    @Column({ nullable: true })
    origin: string;

    deleteAll = async () => {
        const id = this.id;
        const notification = await Notification.findOne({
            where:{id:this.id},
            relations: ["message"],
        });

        await notification.remove();
        if (notification.message) await notification.message.remove();
        return id;
    };
}
