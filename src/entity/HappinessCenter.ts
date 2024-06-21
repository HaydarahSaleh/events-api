import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { happinessCenterRouter } from "../routes/happinessCenter";
import { TextData } from "./TextData";
import { User } from "./User";

@Entity()
export class HappinessCenter extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => TextData, (text) => text.id, {
        cascade: true,
        nullable: true,
    })
    @JoinColumn()
    title: TextData;

    @OneToOne(() => TextData, (text) => text.id, {
        cascade: true,
        nullable: true,
    })
    @JoinColumn()
    description: TextData;

    @Column({ nullable: true })
    telePhone: string;

    @Column({ nullable: true })
    branchNum: number;

    @Column({ nullable: true })
    email: string;

    @OneToOne(() => TextData, (text) => text.id, {
        cascade: true,
        nullable: true,
    })
    @JoinColumn()
    location: TextData;

    @OneToOne(() => TextData, (text) => text.id, {
        cascade: true,
        nullable: true,
    })
    @JoinColumn()
    workingHours: TextData;

    @Column({ default: 0 })
    publishMode: number;

    @Column({ default: "" })
    longitude: string;

    @Column({ default: "" })
    latitude: string;

    @Column()
    @CreateDateColumn()
    createdAt: Date;

    @Column()
    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, (user) => user.id, {
        onDelete: "SET NULL",
    })
    createdBy: User;

    @Column({ nullable: true })
    order: number;

    @Column({
        type: "jsonb",
        array: false,
        default: () => "'{}'",
        nullable: true,
    })
    extraData;

    removeAll = async () => {
        const center = await HappinessCenter.findOne({
            where: { id: this.id },
            relations: ["title", "description", "location", "workingHours"],
        });
        await center.remove();

        if (center.title) await center.title.remove();
        if (center.description) await center.description.remove();
        if (center.location) await center.location.remove();
        if (center.workingHours) await center.workingHours.remove();
    };
}
