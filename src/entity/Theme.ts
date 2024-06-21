import { JsonObject } from "swagger-ui-express";
import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    CreateDateColumn,
    OneToMany,
    JoinColumn,
    OneToOne,
    BaseEntity,
} from "typeorm";

@Entity()
export class Theme extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ default: false })
    isActive: boolean;

    @Column()
    @CreateDateColumn()
    createdAt: Date;

    @Column()
    @UpdateDateColumn()
    updatedAt: Date;

    @Column({
        type: "jsonb",
        array: false,
        default: () => "'{}'",
        nullable: true,
    })
    elements;
}
