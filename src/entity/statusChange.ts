import {
    Entity,
    CreateDateColumn,
    PrimaryGeneratedColumn,
    BaseEntity,
    Column,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { ServiceRequestStatus } from "./enum/Service";
import { User } from "./User";
import { ServiceRequest } from "../entity/ServiceRequest";

@Entity()
export class statusChange extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "enum", enum: Object.values(ServiceRequestStatus) })
    from: ServiceRequestStatus;

    @Column({ type: "enum", enum: Object.values(ServiceRequestStatus) })
    to: ServiceRequestStatus;

    @Column()
    @CreateDateColumn()
    at: Date;

    @ManyToOne((type) => User, (user) => user.id, { onDelete: "SET NULL" })
    by: User;

    @ManyToOne(
        (type) => ServiceRequest,
        (serviceRequest) => {
            serviceRequest.changes;
        },
        { onDelete: "SET NULL" }
    )
    request: ServiceRequest;

    deleteAll = async () => {
        const id = this.id;
        const change = await statusChange.findOne({ where: { id } });
        await change.remove();
        return id;
    };
}
