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

import { Service } from "../entity/Service";
import {
    ServiceRequestInnerStatus,
    serviceRequestStage,
    ServiceRequestStatus,
} from "./enum/Service";
import { File } from "./File";
import { Log } from "./Log";
import { Notification } from "./Notification";
import { Replay } from "./Replay";
import { Note } from "./ServiceRequestNote";
import { statusChange } from "./statusChange";
import { User } from "./User";
import { Membership } from "./enum/MembershipType";
import { Work } from "./enum/Work";
import { AgeCategory } from "./enum/AgeCategory";
@Entity()
export class ServiceRequest extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    name: string;

    @Column({ default: false })
    seen: boolean;

    @ManyToOne((type) => User, (user) => user.requests, {
        nullable: true,
    })
    @JoinColumn()
    createdBy: User;

    @ManyToOne((type) => Service, (service) => service.requests, {
        onDelete: "CASCADE",
    })
    @JoinColumn()
    service: Service;

    @Column({ nullable: true })
    position: string;

    @Column({ nullable: true })
    phoneNumber: string;

    @Column({ nullable: true })
    preferredMethod: string;

    @Column({ nullable: true })
    phoneNumber2: string;

    @Column({ nullable: true })
    emirate: String;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    subject: string;

    @Column({ nullable: true })
    message: string;

    @Column({
        nullable: true,
        default: null,
    })
    employeeResponse: Boolean;

    @OneToMany((type) => Log, (log) => log.request, {
        nullable: true,
        cascade: true,
    })
    logs: Log[];

    @Column({
        nullable: true,
        default: null,
    })
    mangerResponse: Boolean;

    @Column({
        nullable: false,
        default: false,
    })
    acceptOwnerUpdates: Boolean;

    @Column({
        type: "enum",
        enum: Object.values(ServiceRequestStatus),
        default: ServiceRequestStatus.NEW,
    })
    status: ServiceRequestStatus;

    @OneToMany((type) => File, (file) => file.request)
    files: File[];

    @OneToMany((type) => Note, (note) => note.serviceRequest, {
        cascade: true,
    })
    notes: Note[];

    @Column({
        type: "enum",
        enum: Object.values(serviceRequestStage),
        default: serviceRequestStage.NEW,
    })
    stage: serviceRequestStage;

    @Column({
        type: "enum",
        enum: Object.values(ServiceRequestInnerStatus),
        default: ServiceRequestInnerStatus.NEW,
    })
    innerStatus: ServiceRequestInnerStatus;

    @OneToMany((type) => statusChange, (change) => change.request, {
        cascade: true,
    })
    changes: statusChange[];

    @Column({ nullable: true })
    birthDate: Date;

    @Column({ default: " " })
    qualification: string;

    @Column({ default: " " })
    experience: string;

    @Column({ default: " " })
    employer: string;

    @Column({ default: AgeCategory.LESS_THAN_18, nullable: true })
    ageCategory: AgeCategory;

    @Column({ default: Work.GOVERNMENTAL, nullable: true })
    work: Work;

    @Column({ default: Membership.WORKER, nullable: true })
    type: Membership;

    @Column({ nullable: true })
    memberShipId: string;

    @Column()
    @CreateDateColumn()
    createdAt: Date;

    @OneToMany((type) => Replay, (replay) => replay.request, { nullable: true })
    replays: Replay[];

    deleteAllContent = async () => {
        const reqeust = await ServiceRequest.findOne({
            where: { id: this.id },
            relations: ["files", "logs", "changes", "replays"],
        });

        /*  const notifiactions = await Notification.find({
            relations: ["serviceRequest"],
            where: (qb) => {
                qb.andWhere("Notification__serviceRequest.id = :id", {
                    id: reqeust.id,
                });
            },
        });
        const logs = await Log.find({
            relations: ["request"],
            where: (qb) => {
                qb.andWhere("Log__request.id = :id", {
                    id: reqeust.id,
                });
            },
        }); */

        /*  await Promise.all(
            logs.map(async (log) => {
                return await log.deleteAllContent();
            })
        );

        await Notification.remove(notifiactions); */

        if (reqeust.replays)
            await Promise.all(
                reqeust.replays.map(async (replay) => {
                    return await replay.deleteAllContent();
                })
            );
        if (reqeust.changes)
            await Promise.all(
                reqeust.changes.map(async (replay) => {
                    return await replay.remove();
                })
            );
        await reqeust.remove();

        if (reqeust.files)
            await Promise.all(
                reqeust.files.map(async (file) => {
                    try {
                        return await file.deleteAllContent();
                    } catch (error) {}
                })
            );
    };
}
